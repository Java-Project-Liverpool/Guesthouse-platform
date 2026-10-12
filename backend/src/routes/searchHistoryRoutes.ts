
import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { authenticate, requireCustomer } from "../middleware/authMiddleware";
import SearchHistory from "../models/SearchHistory";

const router = Router();

// Retrieve the logged-in customer's search history.
router.get(
  "/",
  authenticate,
  requireCustomer,
  async (req: Request, res: Response) => {
    try {
      const history = await SearchHistory.find({
        customerId: req.authenticatedUser!.id
      }).sort({ createdAt: -1 });

      return res.json({ history });
    } catch (error) {
      console.error("Could not retrieve search history.", error);
      return res.status(500).json({
        message: "Could not retrieve search history."
      });
    }
  }
);

// Save a search for future personalized recommendations.
router.post(
  "/",
  authenticate,
  requireCustomer,
  async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const {
      searchTerm = "",
      location = "",
      filters = {}
    } = body;

    if (
      typeof searchTerm !== "string" ||
      searchTerm.length > 200
    ) {
      return res.status(400).json({
        message: "searchTerm must be a string of at most 200 characters."
      });
    }

    if (
      typeof location !== "string" ||
      location.length > 200
    ) {
      return res.status(400).json({
        message: "location must be a string of at most 200 characters."
      });
    }

    if (
      filters === null ||
      typeof filters !== "object" ||
      Array.isArray(filters)
    ) {
      return res.status(400).json({
        message: "filters must be an object."
      });
    }

    try {
      const historyEntry = await SearchHistory.create({
        customerId: req.authenticatedUser!.id,
        searchTerm: searchTerm.trim(),
        location: location.trim(),
        filters
      });

      return res.status(201).json({
        historyEntry
      });
    } catch (error) {
      if (
        error instanceof mongoose.Error.ValidationError ||
        error instanceof mongoose.Error.CastError
      ) {
        return res.status(400).json({
          message: "Invalid search history data."
        });
      }

      console.error("Could not save search history.", error);
      return res.status(500).json({
        message: "Could not save search history."
      });
    }
  }
);

export default router;
