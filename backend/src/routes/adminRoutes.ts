import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";
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

router.post("/users", authenticate, requireAdmin, async (req: Request, res: Response) => {
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

    const admin = new User({
      name,
      email: normalizedEmail,
      password,
      role: "admin",
      authProvider: "local"
    });

    await admin.save();

    return res.status(201).json({
      message: "Admin account created.",
      user: admin.toJSON()
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.fromEntries(
        Object.entries(error.errors).map(([field, issue]) => [field, issue.message])
      );
      return res.status(400).json({ message: "Invalid admin account data.", errors });
    }

    console.error("Admin account creation failed.", error instanceof Error ? error.name : "UnknownError");
    return res.status(500).json({ message: "Could not create admin account." });
  }
});

export default router;
