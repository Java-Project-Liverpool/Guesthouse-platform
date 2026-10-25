import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/jwt";
import { authenticate } from "../middleware/authMiddleware";
import User from "../models/User";

const router = Router();

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

router.post("/register", async (req: Request, res: Response) => {
  const body: unknown = req.body;

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "Request body must be a JSON object." });
  }

  const { name, email, password } = body as Record<string, unknown>;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      message: "Name, email, and password are required as strings."
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await User.exists({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // Do not accept role or authentication-provider fields from public registration.
    const customer = new User({
      name,
      email: normalizedEmail,
      password,
      role: "customer",
      authProvider: "local"
    });

    await customer.save();

    return res.status(201).json({
      message: "Registration successful.",
      user: customer.toJSON()
    });
  } catch (error) {
    // The unique email index also closes the race between the pre-check and insert.
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.fromEntries(
        Object.entries(error.errors).map(([field, issue]) => [field, issue.message])
      );
      return res.status(400).json({ message: "Invalid registration data.", errors });
    }

    console.error("Customer registration failed.", error);
    return res.status(500).json({ message: "Could not create account." });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const body: unknown = req.body;

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "Request body must be a JSON object." });
  }

  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Email and password are required as strings." });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    const passwordMatches = user ? await user.comparePassword(password) : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { role: user.role },
      getJwtSecret(),
      { algorithm: "HS256", subject: user.id, expiresIn: "1h" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("User login failed.", error);
    return res.status(500).json({ message: "Could not authenticate account." });
  }
});

// GET /api/auth/me — Return the full profile of the authenticated account
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.authenticatedUser!.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Could not load the current user.", error);
    return res.status(500).json({ message: "Could not load the current user." });
  }
});

// PUT /api/auth/profile — Update current authenticated user profile
router.put("/profile", authenticate, async (req: Request, res: Response) => {
  const { name, email } = (req.body ?? {}) as { name?: unknown; email?: unknown };

  const updates: Record<string, string> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters long." });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ message: "Name cannot exceed 100 characters." });
    }
    updates.name = name.trim();
  }

  if (email !== undefined) {
    if (typeof email !== "string" || email.trim().length === 0) {
      return res.status(400).json({ message: "Email must be a non-empty string." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length > 254) {
      return res.status(400).json({ message: "Email cannot exceed 254 characters." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    updates.email = normalizedEmail;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "Provide a name or email to update." });
  }

  try {
    const currentUser = await User.findById(req.authenticatedUser!.id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // The email is the login identifier, so it must stay unique across accounts.
    if (updates.email && updates.email !== currentUser.email) {
      const emailTaken = await User.exists({
        email: updates.email,
        _id: { $ne: currentUser._id }
      });
      if (emailTaken) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }
    }

    const user = await User.findByIdAndUpdate(currentUser._id, { $set: updates }, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    // The unique email index closes the race between the check above and the update.
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    console.error("Profile update failed.", error);
    return res.status(500).json({ message: "Could not update profile." });
  }
});

// PUT /api/auth/password — Change password for authenticated user
router.put("/password", authenticate, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = (req.body ?? {}) as {
    currentPassword?: unknown;
    newPassword?: unknown;
  };

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return res.status(400).json({
      message: "currentPassword and newPassword are required as strings."
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "New password must be at least 8 characters long."
    });
  }

  try {
    const user = await User.findById(req.authenticatedUser!.id).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const matches = await user.comparePassword(currentPassword);
    if (!matches) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Password update failed.", error);
    return res.status(500).json({ message: "Could not update password." });
  }
});

export default router;
