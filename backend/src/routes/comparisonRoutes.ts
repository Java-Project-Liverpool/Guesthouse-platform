
import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { authenticate, requireCustomer } from "../middleware/authMiddleware";
import Comparison from "../models/Comparison";
import Guesthouse from "../models/Guesthouse";

const router = Router();

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

  const uniqueIds = [...new Set(ids as string[])];

  const count = await Guesthouse.countDocuments({
    _id: { $in: uniqueIds }
  });

  return count === uniqueIds.length;
}

// List the logged-in customer's comparisons.
router.get(
  "/",
  authenticate,
  requireCustomer,
  async (req: Request, res: Response) => {
    try {
      const comparisons = await Comparison.find({
        customerId: req.authenticatedUser!.id
      }).sort({ createdAt: -1 });

      return res.json({ comparisons });
    } catch (error) {
      console.error("Could not retrieve comparisons.", error);
      return res.status(500).json({
        message: "Could not retrieve comparisons."
      });
    }
  }
);

// Create a comparison. An empty guesthouse list is allowed.
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
        message: "A comparison name between 1 and 100 characters is required."
      });
    }

    try {
      if (!(await validateGuesthouseIds(guesthouseIds))) {
        return res.status(400).json({
          message: "guesthouseIds must contain only existing guesthouse IDs."
        });
      }

      const comparison = await Comparison.create({
        customerId: req.authenticatedUser!.id,
        name: name.trim(),
        guesthouseIds: [...new Set(guesthouseIds as string[])]
      });

      return res.status(201).json({ comparison });
    } catch (error) {
      if (
        error instanceof mongoose.Error.ValidationError ||
        error instanceof mongoose.Error.CastError
      ) {
        return res.status(400).json({
          message: "Invalid comparison data."
        });
      }

      console.error("Could not create comparison.", error);
      return res.status(500).json({
        message: "Could not create comparison."
      });
    }
  }
);

// Update only a comparison belonging to the logged-in customer.
router.patch(
  "/:id",
  authenticate,
  requireCustomer,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body ?? {};

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        message: "Comparison ID is invalid."
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
          message: "Comparison name must be between 1 and 100 characters."
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
      const comparison = await Comparison.findOneAndUpdate(
        {
          _id: id,
          customerId: req.authenticatedUser!.id
        },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!comparison) {
        return res.status(404).json({
          message: "Comparison not found."
        });
      }

      return res.json({ comparison });
    } catch (error) {
      if (
        error instanceof mongoose.Error.ValidationError ||
        error instanceof mongoose.Error.CastError
      ) {
        return res.status(400).json({
          message: "Invalid comparison data."
        });
      }

      console.error("Could not update comparison.", error);
      return res.status(500).json({
        message: "Could not update comparison."
      });
    }
  }
);

// Delete only a comparison belonging to the logged-in customer.
router.delete(
  "/:id",
  authenticate,
  requireCustomer,
  async (req: Request, res: Response) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({
        message: "Comparison ID is invalid."
      });
    }

    try {
      const comparison = await Comparison.findOneAndDelete({
        _id: req.params.id,
        customerId: req.authenticatedUser!.id
      });

      if (!comparison) {
        return res.status(404).json({
          message: "Comparison not found."
        });
      }

      return res.status(204).end();
    } catch (error) {
      console.error("Could not delete comparison.", error);
      return res.status(500).json({
        message: "Could not delete comparison."
      });
    }
  }
);

export default router;
