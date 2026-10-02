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

router.get("/me", authenticate, (req: Request, res: Response) => {
  return res.json({ user: req.authenticatedUser });
});

export default router;
