import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";
import Guesthouse from "../models/Guesthouse";
import Rating from "../models/Rating";
import Report from "../models/Report";
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

// Only a signed-in admin may add another admin account.
router.post("/users", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const body: unknown = req.body;

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "Request body must be a JSON object." });
  }

  // Deliberately read only these fields; callers cannot choose their own role or provider.
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

  // Match the User model's lowercase email format before checking for duplicates.
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await User.exists({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // The User model hashes this password before saving; the role is assigned here.
    const admin = new User({
      name,
      email: normalizedEmail,
      password,
      role: "admin",
      authProvider: "local"
    });

    // The unique email index also protects against two requests racing past the check above.
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

// GET /api/admin/stats — Real database statistics for the admin dashboard
router.get("/stats", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [
      totalGuesthouses,
      totalAllGuesthouses,
      cityAgg,
      priceAgg,
      recentlyAdded,
      totalCustomers,
      totalAdmins,
      ratingStats,
      ratingDist,
      recentRatings
    ] = await Promise.all([
      Guesthouse.countDocuments({ isActive: true }),
      Guesthouse.countDocuments(),
      Guesthouse.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$city", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Guesthouse.aggregate([
        { $match: { isActive: true, pricePerNight: { $gt: 0 } } },
        { $group: { _id: null, avgPrice: { $avg: "$pricePerNight" } } }
      ]),
      Guesthouse.find().sort({ createdAt: -1 }).limit(5),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "admin" }),
      Rating.aggregate([
        {
          $group: {
            _id: null,
            overallAvgRating: { $avg: "$rating" },
            totalRatings: { $sum: 1 }
          }
        }
      ]),
      Rating.aggregate([
        { $group: { _id: "$rating", count: { $sum: 1 } } }
      ]),
      Rating.find()
        .populate("customerId", "name email")
        .populate("guesthouseId", "name city")
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const cityCounts = cityAgg.map((c) => ({ city: String(c._id || "Unknown"), count: Number(c.count) }));
    const topCity = cityCounts.length > 0 ? cityCounts[0].city : null;
    const avgPrice = priceAgg.length > 0 && priceAgg[0].avgPrice ? Math.round(priceAgg[0].avgPrice) : null;
    const totalRatings = ratingStats.length > 0 ? Number(ratingStats[0].totalRatings) : 0;
    const overallAvgRating = ratingStats.length > 0 && ratingStats[0].overallAvgRating
      ? Number(ratingStats[0].overallAvgRating.toFixed(1))
      : null;

    // Star rating breakdown 1..5
    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratingDist) {
      const star = Number(r._id);
      if (star >= 1 && star <= 5) {
        ratingBreakdown[star] = Number(r.count);
      }
    }

    // Top rated guesthouse derived from ratings
    let topRatedStay: { name: string; rating: number; city?: string } | null = null;
    const topRatedAgg = await Rating.aggregate([
      { $group: { _id: "$guesthouseId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
      { $sort: { avgRating: -1, count: -1 } },
      { $limit: 1 }
    ]);

    if (topRatedAgg.length > 0) {
      const guesthouseDoc = await Guesthouse.findById(topRatedAgg[0]._id).select("name city");
      if (guesthouseDoc) {
        topRatedStay = {
          name: guesthouseDoc.name,
          rating: Number(topRatedAgg[0].avgRating.toFixed(1)),
          city: guesthouseDoc.city
        };
      }
    }

    // Real chronological activity combining guesthouse additions and reviews
    const activityItems: Array<{
      id: string;
      type: "guesthouse_added" | "review_submitted";
      title: string;
      subtitle: string;
      timestamp: Date;
    }> = [];

    for (const g of recentlyAdded) {
      activityItems.push({
        id: `g-${g._id}`,
        type: "guesthouse_added",
        title: "Guesthouse added",
        subtitle: `${g.name} (${g.city})`,
        timestamp: g.createdAt || new Date()
      });
    }

    for (const r of recentRatings) {
      const cust = r.customerId as unknown as { name?: string; email?: string } | null;
      const gh = r.guesthouseId as unknown as { name?: string; city?: string } | null;
      activityItems.push({
        id: `r-${r._id}`,
        type: "review_submitted",
        title: `New ${r.rating}-star review`,
        subtitle: `${gh?.name || "Guesthouse"} by ${cust?.name || "Customer"}`,
        timestamp: r.createdAt || new Date()
      });
    }

    activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = activityItems.slice(0, 6);

    return res.json({
      totalGuesthouses,
      totalAllGuesthouses,
      topCity,
      topRatedStay,
      avgPrice,
      cityCounts,
      recentlyAdded,
      totalCustomers,
      totalAdmins,
      totalRatings,
      overallAvgRating,
      ratingBreakdown,
      recentActivity
    });
  } catch (error) {
    console.error("Dashboard statistics retrieval failed.", error);
    return res.status(500).json({ message: "Could not retrieve dashboard statistics." });
  }
});

// GET /api/admin/users — List all administrators
router.get("/users", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const admins = await User.find({ role: "admin" }).sort({ createdAt: -1 });
    return res.json({ users: admins });
  } catch (error) {
    console.error("Admin user list failed.", error);
    return res.status(500).json({ message: "Could not retrieve admin accounts." });
  }
});

// GET /api/admin/customers — List all customer users
router.get("/customers", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const customers = await User.find({ role: "customer" }).sort({ createdAt: -1 });
    return res.json({ users: customers });
  } catch (error) {
    console.error("Customer user list failed.", error);
    return res.status(500).json({ message: "Could not retrieve customer accounts." });
  }
});

// GET /api/admin/ratings — List all ratings for moderation
router.get("/ratings", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const ratings = await Rating.find()
      .populate("customerId", "name email")
      .populate("guesthouseId", "name city logo")
      .sort({ createdAt: -1 });
    return res.json({ ratings });
  } catch (error) {
    console.error("Rating list failed.", error);
    return res.status(500).json({ message: "Could not retrieve ratings." });
  }
});

// DELETE /api/admin/ratings/:id — Delete a rating/review (admin moderation)
router.delete("/ratings/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Rating ID is invalid." });
  }

  try {
    const deleted = await Rating.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Rating not found." });
    }

    // Clean up any reports tied to this deleted rating
    await Report.deleteMany({ ratingId: req.params.id });

    return res.status(204).end();
  } catch (error) {
    console.error("Could not delete rating.", error);
    return res.status(500).json({ message: "Could not delete rating." });
  }
});

// PUT /api/admin/customers/:id/status — Suspend or activate a customer
router.put("/customers/:id/status", authenticate, requireAdmin, async (req: Request, res: Response) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Customer ID is invalid." });
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ message: "Request body must be a JSON object." });
  }
  const { isActive } = req.body as { isActive?: unknown };
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ message: "isActive must be a boolean (true or false)." });
  }

  // Prevent admin from suspending their own account through customer interface
  if (req.authenticatedUser && req.authenticatedUser.id === req.params.id && isActive === false) {
    return res.status(403).json({ message: "Cannot suspend your own account through the customer interface." });
  }

  try {
    // Update only the requested status field; saving a partially selected User
    // would rerun local-account validation without its deliberately hidden hash.
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "customer" },
      { $set: { isActive } },
      { returnDocument: "after", runValidators: true }
    ).select("_id name email role isActive");
    if (!user) {
      return res.status(404).json({ message: "Customer not found." });
    }

    return res.json({ message: isActive ? "Account reactivated." : "Account suspended.", user });
  } catch (error) {
    console.error("admin.customer_status_update_failed", {
      operation: "customer_status_update",
      status: 500,
      requestId: res.locals.requestId,
      errorType: error instanceof Error ? error.name : "UnknownError"
    });
    return res.status(500).json({
      message: "Could not update customer status.",
      requestId: res.locals.requestId
    });
  }
});

export default router;
