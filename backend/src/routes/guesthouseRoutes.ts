import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";
import Guesthouse from "../models/Guesthouse";
import Rating from "../models/Rating";
import {
  searchGuesthouses,
  type GuesthouseSearchParams
} from "../services/guesthouseService";
// Image helpers: deleting images from Cloudinary and checking image data
import {
  deleteImages,
  galleryFolder,
  isOwnImage,
  logoFolder
} from "../services/imageService";

const router = Router();

const writableFields = [
  "name",
  "logo",
  "gallery",
  "logoPublicId",
  "galleryPublicIds",
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

function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  return Number(value);
}

/*
 * Check the image fields in a create or update request.
 *
 * Images must come from the upload endpoint, so each URL has to be sent
 * together with its Cloudinary public ID, and both have to belong to our
 * Cloudinary account and folders. The public ID is later used to delete
 * the image, so it must never point at someone else's file.
 *
 * Returns an error message, or null if everything is fine.
 */
function checkImageFields(fields: Record<string, unknown>): string | null {
  const has = (field: string) => Object.prototype.hasOwnProperty.call(fields, field);

  // When Cloudinary is configured, enforce strict Cloudinary uploads
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    // A URL and its public ID only make sense as a pair
    if (has("logo") !== has("logoPublicId")) {
      return "logo and logoPublicId must be sent together.";
    }

    if (has("gallery") !== has("galleryPublicIds")) {
      return "gallery and galleryPublicIds must be sent together.";
    }

    if (has("logo") && !isOwnImage(fields.logo, fields.logoPublicId, logoFolder)) {
      return "logo must be an image uploaded through the upload endpoint.";
    }

    if (has("gallery")) {
      const gallery = fields.gallery;
      const ids = fields.galleryPublicIds;

      // The two lists must line up, one public ID for each URL
      if (!Array.isArray(gallery) || !Array.isArray(ids) || gallery.length !== ids.length) {
        return "gallery and galleryPublicIds must be lists of the same length.";
      }

      const allValid = gallery.every((url, index) =>
        isOwnImage(url, ids[index], galleryFolder)
      );

      if (!allValid) {
        return "Every gallery image must be an image uploaded through the upload endpoint.";
      }

      if (new Set(ids).size !== ids.length) {
        return "The same image cannot be in the gallery twice.";
      }
    }
  } else {
    // When Cloudinary credentials are not present (prototype/local dev), allow valid URLs
    if (has("logo") && (typeof fields.logo !== "string" || fields.logo.trim() === "")) {
      return "logo must be a valid image URL string.";
    }
    if (has("gallery")) {
      if (!Array.isArray(fields.gallery) || fields.gallery.some((url) => typeof url !== "string")) {
        return "gallery must be a list of image URL strings.";
      }
    }
  }

  return null;
}

/*
 * Check whether any of the public IDs in the request already belong to a
 * different guesthouse. Otherwise, removing an image from one guesthouse
 * could delete a file that another guesthouse is still showing.
 *
 * currentId is the guesthouse being updated, so it is left out of the check.
 */
async function imageInUseElsewhere(
  fields: Record<string, unknown>,
  currentId?: string
): Promise<boolean> {
  const ids: string[] = [];

  if (typeof fields.logoPublicId === "string") {
    ids.push(fields.logoPublicId);
  }

  if (Array.isArray(fields.galleryPublicIds)) {
    for (const id of fields.galleryPublicIds) {
      if (typeof id === "string") ids.push(id);
    }
  }

  if (ids.length === 0) {
    return false;
  }

  const found = await Guesthouse.exists({
    ...(currentId ? { _id: { $ne: currentId } } : {}),
    $or: [{ logoPublicId: { $in: ids } }, { galleryPublicIds: { $in: ids } }]
  });

  return found !== null;
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

router.get("/search", async (req: Request, res: Response) => {
  const minPrice = parseOptionalNumber(req.query.minPrice);
  const maxPrice = parseOptionalNumber(req.query.maxPrice);
  const minRating = parseOptionalNumber(req.query.minRating);
  const page = parseOptionalNumber(req.query.page);
  const limit = parseOptionalNumber(req.query.limit);

  const numericValues = [minPrice, maxPrice, minRating, page, limit];
  if (numericValues.some((value) => value !== undefined && Number.isNaN(value))) {
    return res.status(400).json({
      message: "minPrice, maxPrice, minRating, page and limit must be numbers."
    });
  }

  if (minRating !== undefined && (minRating < 0 || minRating > 5)) {
    return res.status(400).json({ message: "minRating must be between 0 and 5." });
  }

  if ((page !== undefined && page < 1) || (limit !== undefined && limit < 1)) {
    return res.status(400).json({ message: "page and limit must be at least 1." });
  }

  const params: GuesthouseSearchParams = {};

  if (typeof req.query.name === "string" && req.query.name.trim() !== "") {
    params.name = req.query.name.trim();
  }

  if (typeof req.query.city === "string" && req.query.city.trim() !== "") {
    params.city = req.query.city.trim();
  }

  if (typeof req.query.amenities === "string" && req.query.amenities.trim() !== "") {
    params.amenities = req.query.amenities
      .split(",")
      .map((amenity) => amenity.trim())
      .filter((amenity) => amenity !== "");
  }

  if (typeof req.query.sortBy === "string" && req.query.sortBy.trim() !== "") {
    params.sortBy = req.query.sortBy.trim();
  }

  if (req.query.verified === "true") {
    params.verified = true;
  }

  if (req.query.includeHidden === "true") {
    params.includeHidden = true;
  }

  if (minPrice !== undefined) params.minPrice = minPrice;
  if (maxPrice !== undefined) params.maxPrice = maxPrice;
  if (minRating !== undefined) params.minRating = minRating;
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = Math.min(limit, 100);

  try {
    const result = await searchGuesthouses(params);
    return res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid sortBy option.") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Could not search guesthouses.", error);
    return res.status(500).json({ message: "Could not search guesthouses." });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Guesthouse ID is invalid." });
  }

  try {
    // Check for admin authentication without requiring it
    let isAdmin = false;
    const authorization = req.get("authorization");
    if (authorization) {
      const match = authorization.match(/^Bearer\s+([\w.-]+)$/i);
      if (match) {
        try {
          const payload = jwt.verify(match[1], require("../config/jwt").getJwtSecret(), { algorithms: ["HS256"] });
          if (payload && (payload as any).sub && (payload as any).role === 'admin') {
            isAdmin = true;
          }
        } catch {
          // Ignore invalid token for public endpoint
        }
      }
    }

    const query: Record<string, unknown> = { _id: req.params.id };
    if (!isAdmin) {
      query.isActive = true;
    }
    const guesthouse = await Guesthouse.findOne(query);
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

  const fields = pickWritableFields(req.body);

  // Refuse image data that did not come from the upload endpoint
  const imageError = checkImageFields(fields);
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    if (await imageInUseElsewhere(fields)) {
      return res.status(400).json({ message: "An image is already used by another guesthouse." });
    }

    const guesthouse = new Guesthouse({
      ...fields,
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

  // Refuse image data that did not come from the upload endpoint
  const imageError = checkImageFields(updates);
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    // Load the guesthouse as it is now, so we know which images it has
    // and can tell afterwards which ones were replaced or removed
    const existing = await Guesthouse.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Guesthouse not found." });
    }

    if (await imageInUseElsewhere(updates, String(req.params.id))) {
      return res.status(400).json({ message: "An image is already used by another guesthouse." });
    }

    const guesthouse = await Guesthouse.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!guesthouse) {
      return res.status(404).json({ message: "Guesthouse not found." });
    }

    // Work out which old images are no longer used. This happens only
    // after the update succeeded, so a failed update never loses images.
    const removedImages: string[] = [];

    // A new logo replaces the old one
    if (
      typeof updates.logoPublicId === "string" &&
      existing.logoPublicId &&
      existing.logoPublicId !== updates.logoPublicId
    ) {
      removedImages.push(existing.logoPublicId);
    }

    // Gallery images missing from the new list were removed by the admin
    if (Array.isArray(updates.galleryPublicIds)) {
      const stillUsed = new Set<unknown>(updates.galleryPublicIds);
      for (const id of existing.galleryPublicIds) {
        if (!stillUsed.has(id)) removedImages.push(id);
      }
    }

    // Delete them from Cloudinary. A failure here is logged and does not
    // fail the request, because the guesthouse has already been saved.
    await deleteImages(removedImages);

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


router.patch("/:id/verification", authenticate, requireAdmin, async (req: Request, res: Response) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Guesthouse ID is invalid." });
  }
if (!isRequestObject(req.body)) {
  return res.status(400).json({
    message: "Request body must be a JSON object."
  });
}
  const { verificationStatus } = req.body;

  const allowedStatuses = ["pending", "verified", "needs_review"];

  if (
    typeof verificationStatus !== "string" ||
    !allowedStatuses.includes(verificationStatus)
  ) {
    return res.status(400).json({
      message: "verificationStatus must be pending, verified, or needs_review."
    });
  }

  try {
    const verificationUpdates: {
      verificationStatus: string;
      verifiedBy?: mongoose.Types.ObjectId | null;
      verifiedAt?: Date | null;
    } = {
      verificationStatus
    };

    if (verificationStatus === "verified") {
      verificationUpdates.verifiedBy = new mongoose.Types.ObjectId(
        req.authenticatedUser!.id
      );
      verificationUpdates.verifiedAt = new Date();
    } else {
      verificationUpdates.verifiedBy = null;
      verificationUpdates.verifiedAt = null;
    }

    const guesthouse = await Guesthouse.findByIdAndUpdate(
      req.params.id,
      { $set: verificationUpdates },
      { new: true, runValidators: true }
    );

    if (!guesthouse) {
      return res.status(404).json({ message: "Guesthouse not found." });
    }

    return res.json({ guesthouse });
  } catch (error) {
    console.error("Could not update guesthouse verification.", error);
    return res.status(500).json({
      message: "Could not update guesthouse verification."
    });
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

// POST /api/guesthouses/:id/ratings — Authenticated customer reviews a guesthouse
router.post("/:id/ratings", authenticate, async (req: Request, res: Response) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Guesthouse ID is invalid." });
  }

  const { rating, comment } = (req.body ?? {}) as { rating?: unknown; comment?: unknown };
  const numericRating = Number(rating);

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: "Rating must be an integer between 1 and 5." });
  }

  try {
    const guesthouse = await Guesthouse.findById(req.params.id);
    if (!guesthouse) {
      return res.status(404).json({ message: "Guesthouse not found." });
    }

    const ratingDoc = await Rating.findOneAndUpdate(
      { customerId: req.authenticatedUser!.id, guesthouseId: req.params.id },
      {
        $set: {
          rating: numericRating,
          comment: typeof comment === "string" ? comment.trim() : ""
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(201).json({ rating: ratingDoc });
  } catch (error) {
    console.error("Could not post rating.", error);
    return res.status(500).json({ message: "Could not post rating." });
  }
});

// GET /api/guesthouses/:id/ratings — List all ratings for a guesthouse
router.get("/:id/ratings", async (req: Request, res: Response) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Guesthouse ID is invalid." });
  }

  try {
    const ratings = await Rating.find({ guesthouseId: req.params.id })
      .populate("customerId", "name")
      .sort({ createdAt: -1 });

    return res.json({ ratings });
  } catch (error) {
    console.error("Could not get ratings.", error);
    return res.status(500).json({ message: "Could not retrieve ratings." });
  }
});

export default router;