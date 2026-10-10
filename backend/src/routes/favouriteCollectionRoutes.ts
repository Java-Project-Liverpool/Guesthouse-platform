
import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { authenticate, requireCustomer } from "../middleware/authMiddleware";
import FavouriteCollection from "../models/FavouriteCollection";
import Guesthouse from "../models/Guesthouse";

const router = Router();

// Check that all supplied guesthouse IDs are valid and exist.
async function validateGuesthouseIds(ids: unknown): Promise<boolean> {
  if (!Array.isArray(ids)) {
    return false;
  }

  if (
    !ids.every(
      (id) =>
        typeof id === "string" &&
        mongoose.isObjectIdOrHexString(id)
    )
  ) {
    return false;
  }

  // Remove duplicates before checking the database.
  const uniqueIds = [...new Set(ids as string[])];

  const count = await Guesthouse.countDocuments({
    _id: { $in: uniqueIds }
  });

  return count === uniqueIds.length;
}

// Retrieve only the logged-in customer's collections.
router.get(
  "/",
  authenticate,
  requireCustomer,
  async (req: Request, res: Response) => {
    try {
      const collections = await FavouriteCollection.find({
        customerId: req.authenticatedUser!.id
      }).sort({ createdAt: -1 });

      return res.json({ collections });
    } catch (error) {
      console.error("Could not retrieve favourite collections.", error);
      return res.status(500).json({
        message: "Could not retrieve favourite collections."
      });
    }
  }
);

// Create a collection. Empty guesthouseIds is allowed.
router.post(
  "/",
  authenticate,
  requireCustomer,
  async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const { name, guesthouseIds = [] } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100
    ) {
      return res.status(400).json({
        message: "A collection name between 1 and 100 characters is required."
      });
    }

    try {
      if (!(await validateGuesthouseIds(guesthouseIds))) {
        return res.status(400).json({
          message: "guesthouseIds must contain only existing guesthouse IDs."
        });
      }

      const collection = await FavouriteCollection.create({
        customerId: req.authenticatedUser!.id,
        name: name.trim(),
        guesthouseIds: [...new Set(guesthouseIds as string[])]
      });

      return res.status(201).json({ collection });
    } catch (error) {
      if (
        error instanceof mongoose.Error.ValidationError ||
        error instanceof mongoose.Error.CastError
      ) {
        return res.status(400).json({
          message: "Invalid favourite collection data."
        });
      }

      console.error("Could not create favourite collection.", error);
      return res.status(500).json({
        message: "Could not create favourite collection."
      });
    }
  }
);

// Update a collection only if it belongs to the logged-in customer.
router.patch(
  "/:id",
  authenticate,
  requireCustomer,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body ?? {};

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        message: "Collection ID is invalid."
      });
    }

    const updates: { name?: string; guesthouseIds?: string[] } = {};

    if ("name" in body) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.trim().length > 100
      ) {
        return res.status(400).json({
          message: "Collection name must be between 1 and 100 characters."
        });
      }

      updates.name = body.name.trim();
    }

    if ("guesthouseIds" in body) {
      if (!(await validateGuesthouseIds(body.guesthouseIds))) {
        return res.status(400).json({
          message: "guesthouseIds must contain only existing guesthouse IDs."
        });
      }

      updates.guesthouseIds = [
        ...new Set(body.guesthouseIds as string[])
      ];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide a valid name or guesthouseIds to update."
      });
    }

    try {
      const collection = await FavouriteCollection.findOneAndUpdate(
        {
          _id: id,
          customerId: req.authenticatedUser!.id
        },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!collection) {
        return res.status(404).json({
          message: "Collection not found."
        });
      }

      return res.json({ collection });
    } catch (error) {
      if (
        error instanceof mongoose.Error.ValidationError ||
        error instanceof mongoose.Error.CastError
      ) {
        return res.status(400).json({
          message: "Invalid favourite collection data."
        });
      }

      console.error("Could not update favourite collection.", error);
      return res.status(500).json({
        message: "Could not update favourite collection."
      });
    }
  }
);

// Delete only the logged-in customer's collection.
router.delete(
  "/:id",
  authenticate,
  requireCustomer,
  async (req: Request, res: Response) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({
        message: "Collection ID is invalid."
      });
    }

    try {
      const collection = await FavouriteCollection.findOneAndDelete({
        _id: req.params.id,
        customerId: req.authenticatedUser!.id
      });

      if (!collection) {
        return res.status(404).json({
          message: "Collection not found."
        });
      }

      return res.status(204).end();
    } catch (error) {
      console.error("Could not delete favourite collection.", error);
      return res.status(500).json({
        message: "Could not delete favourite collection."
      });
    }
  }
);

export default router;
