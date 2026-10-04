import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { authenticate, requireCustomer } from "../middleware/authMiddleware";
import Favourite from "../models/Favourite";

const router = Router();

function isDuplicateKeyError(error: unknown): error is mongoose.mongo.MongoServerError {
  return error instanceof mongoose.mongo.MongoServerError && error.code === 11000;
}

router.get("/", authenticate, requireCustomer, async (req: Request, res: Response) => {
  try {
    const favourites = await Favourite.find({ customerId: req.authenticatedUser!.id })
      .populate("guesthouseId")
      .sort({ createdAt: -1 });

    return res.json({ favourites });
  } catch (error) {
    console.error("Could not retrieve favourites.", error);
    return res.status(500).json({ message: "Could not retrieve favourites." });
  }
});

router.post("/", authenticate, requireCustomer, async (req: Request, res: Response) => {
  const { guesthouseId } = (req.body ?? {}) as { guesthouseId?: unknown };

  if (typeof guesthouseId !== "string" || !mongoose.isObjectIdOrHexString(guesthouseId)) {
    return res.status(400).json({ message: "A valid guesthouseId is required." });
  }

  try {
    const favourite = await Favourite.create({
      customerId: req.authenticatedUser!.id,
      guesthouseId
    });

    return res.status(201).json({ favourite });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: "This guesthouse is already in your favourites." });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: "Invalid favourite data." });
    }

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: "Invalid favourite data.", field: error.path });
    }

    console.error("Could not add favourite.", error);
    return res.status(500).json({ message: "Could not add favourite." });
  }
});

router.delete("/:guesthouseId", authenticate, requireCustomer, async (req: Request, res: Response) => {
  if (!mongoose.isObjectIdOrHexString(req.params.guesthouseId)) {
    return res.status(400).json({ message: "Guesthouse ID is invalid." });
  }

  try {
    const favourite = await Favourite.findOneAndDelete({
      customerId: req.authenticatedUser!.id,
      guesthouseId: req.params.guesthouseId
    });

    if (!favourite) {
      return res.status(404).json({ message: "Favourite not found." });
    }

    return res.status(204).end();
  } catch (error) {
    console.error("Could not remove favourite.", error);
    return res.status(500).json({ message: "Could not remove favourite." });
  }
});

export default router;