import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";
import Guesthouse from "../models/Guesthouse";
// The search logic lives in the service file; this file only handles the request
import {
  searchGuesthouses,
  type GuesthouseSearchParams
} from "../services/guesthouseService";

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

/*
 * Turn a query string value into a number.
 *
 * Values in a URL always arrive as text, so "500" has to be converted.
 * Returns undefined if the value was not sent or is empty.
 * Returns NaN if the value was sent but is not a number (for example "abc"),
 * which the search route checks for below.
 */
function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  return Number(value);
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

/*
 * GET /api/guesthouses/search
 *
 * Search, filter and sort guesthouses. All options are optional and go in the
 * URL, for example:
 *   /api/guesthouses/search?city=Gaborone&maxPrice=500&sortBy=rating_desc
 *
 * Options: name, city, minPrice, maxPrice, minRating, amenities (comma
 * separated), verified (true), sortBy, page, limit.
 *
 * This route must stay above "/:id" below. Otherwise Express would treat the
 * word "search" as a guesthouse ID and this route would never run.
 */
router.get("/search", async (req: Request, res: Response) => {
  // Convert the number options from text to numbers
  const minPrice = parseOptionalNumber(req.query.minPrice);
  const maxPrice = parseOptionalNumber(req.query.maxPrice);
  const minRating = parseOptionalNumber(req.query.minRating);
  const page = parseOptionalNumber(req.query.page);
  const limit = parseOptionalNumber(req.query.limit);

  // Reject the request if any of those values was sent but is not a number
  const numericValues = [minPrice, maxPrice, minRating, page, limit];
  if (numericValues.some((value) => value !== undefined && Number.isNaN(value))) {
    return res.status(400).json({
      message: "minPrice, maxPrice, minRating, page and limit must be numbers."
    });
  }

  // Ratings are from 0 to 5, so anything outside that range is a mistake
  if (minRating !== undefined && (minRating < 0 || minRating > 5)) {
    return res.status(400).json({ message: "minRating must be between 0 and 5." });
  }

  // Pages and result counts start at 1
  if ((page !== undefined && page < 1) || (limit !== undefined && limit < 1)) {
    return res.status(400).json({ message: "page and limit must be at least 1." });
  }

  // Collect only the options that were actually sent
  const params: GuesthouseSearchParams = {};

  if (typeof req.query.name === "string" && req.query.name.trim() !== "") {
    params.name = req.query.name.trim();
  }

  if (typeof req.query.city === "string" && req.query.city.trim() !== "") {
    params.city = req.query.city.trim();
  }

  // Amenities arrive as one text value like "wifi,pool", so split it into a list
  if (typeof req.query.amenities === "string" && req.query.amenities.trim() !== "") {
    params.amenities = req.query.amenities
      .split(",")
      .map((amenity) => amenity.trim())
      .filter((amenity) => amenity !== "");
  }

  if (typeof req.query.sortBy === "string" && req.query.sortBy.trim() !== "") {
    params.sortBy = req.query.sortBy.trim();
  }

  // The verified filter is only switched on by the exact text "true"
  if (req.query.verified === "true") {
    params.verified = true;
  }

  if (minPrice !== undefined) params.minPrice = minPrice;
  if (maxPrice !== undefined) params.maxPrice = maxPrice;
  if (minRating !== undefined) params.minRating = minRating;
  if (page !== undefined) params.page = page;
  // Cap the page size at 100 so one request cannot ask for everything
  if (limit !== undefined) params.limit = Math.min(limit, 100);

  try {
    // Hand the options to the service, which builds and runs the query
    const result = await searchGuesthouses(params);
    return res.json(result);
  } catch (error) {
    // An unknown sortBy value is the client's mistake, so answer with 400
    if (error instanceof Error && error.message === "Invalid sortBy option.") {
      return res.status(400).json({ message: error.message });
    }

    // Anything else is an unexpected problem on the server
    console.error("Could not search guesthouses.", error);
    return res.status(500).json({ message: "Could not search guesthouses." });
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