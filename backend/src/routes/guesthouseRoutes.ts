import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";
import Guesthouse from "../models/Guesthouse";

const router = Router();

const writableFields = [
  "name",
  "logo",
  "gallery",
  "description",
  "amenities",
  "pricePerNight",
  "city",
  "country",
  "location",
  "contact",
  "isActive"
] as const;

function isRequestObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function pickWritableFields(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    writableFields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]])
  );
}

function sendValidationError(error: mongoose.Error.ValidationError, res: Response) {
  const errors = Object.fromEntries(
    Object.entries(error.errors).map(([field, issue]) => [field, issue.message])
  );

  return res.status(400).json({ message: "Invalid guesthouse data.", errors });
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const guesthouses = await Guesthouse.find({ isActive: true }).sort({ createdAt: -1 });
    return res.json({ guesthouses });
  } catch (error) {
    console.error("Could not list guesthouses.", error);
    return res.status(500).json({ message: "Could not retrieve guesthouses." });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Guesthouse ID is invalid." });
  }

  try {
    const guesthouse = await Guesthouse.findOne({ _id: req.params.id, isActive: true });
    if (!guesthouse) {
      return res.status(404).json({ message: "Guesthouse not found." });
    }

    return res.json({ guesthouse });
  } catch (error) {
    console.error("Could not retrieve guesthouse.", error);
    return res.status(500).json({ message: "Could not retrieve guesthouse." });
  }
});

router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  if (!isRequestObject(req.body)) {
    return res.status(400).json({ message: "Request body must be a JSON object." });
  }

  try {
    const guesthouse = new Guesthouse({
      ...pickWritableFields(req.body),
      createdBy: req.authenticatedUser!.id
    });
    await guesthouse.save();
    return res.status(201).json({ guesthouse });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return sendValidationError(error, res);
    }

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: "Invalid guesthouse data.", field: error.path });
    }

    console.error("Could not create guesthouse.", error);
    return res.status(500).json({ message: "Could not create guesthouse." });
  }
});

router.put("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Guesthouse ID is invalid." });
  }

  if (!isRequestObject(req.body)) {
    return res.status(400).json({ message: "Request body must be a JSON object." });
  }

  const updates = pickWritableFields(req.body);
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "Provide at least one guesthouse field to update." });
  }

  if (
    Object.prototype.hasOwnProperty.call(updates, "isActive") &&
    typeof updates.isActive !== "boolean"
  ) {
    return res.status(400).json({ message: "isActive must be a boolean." });
  }

  try {
    const guesthouse = await Guesthouse.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!guesthouse) {
      return res.status(404).json({ message: "Guesthouse not found." });
    }

    return res.json({ guesthouse });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return sendValidationError(error, res);
    }

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: "Invalid guesthouse data.", field: error.path });
    }

    console.error("Could not update guesthouse.", error);
    return res.status(500).json({ message: "Could not update guesthouse." });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Guesthouse ID is invalid." });
  }

  try {
    const guesthouse = await Guesthouse.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true, runValidators: true }
    );

    if (!guesthouse) {
      return res.status(404).json({ message: "Guesthouse not found." });
    }

    return res.status(204).end();
  } catch (error) {
    console.error("Could not delete guesthouse.", error);
    return res.status(500).json({ message: "Could not delete guesthouse." });
  }
});

export default router;
