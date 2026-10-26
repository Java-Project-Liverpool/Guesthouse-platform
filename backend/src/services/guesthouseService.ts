import mongoose from "mongoose";
import Guesthouse, { IGuesthouse } from "../models/Guesthouse";
import User from "../models/User";
import Rating from "../models/Rating";
import Favourite from "../models/Favourite";

/*
 * Check whether a string is a valid MongoDB ObjectId.
 */
const validateId = (id: string): void => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid guesthouse ID.");
  }
};

/*
 * Check whether the user exists and is an administrator.
 */
const checkAdmin = async (userId: string): Promise<void> => {
  validateId(userId);

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.role !== "admin") {
    throw new Error("Only administrators can modify guesthouses.");
  }
};

/*
 * Create a new guesthouse.
 *
 * The user creating the guesthouse is recorded in createdBy.
 */
export const createGuesthouse = async (
  data: Partial<IGuesthouse>,
  userId: string
): Promise<IGuesthouse> => {
  await checkAdmin(userId);

  const guesthouse = new Guesthouse({
    ...data,
    createdBy: userId
  });

  return await guesthouse.save();
};

/*
 * Get all guesthouses.
 */
export const getAllGuesthouses = async (): Promise<IGuesthouse[]> => {
  return await Guesthouse.find();
};

/*
 * Get one guesthouse by ID.
 */
export const getGuesthouseById = async (
  guesthouseId: string
): Promise<IGuesthouse> => {
  validateId(guesthouseId);

  const guesthouse = await Guesthouse.findById(guesthouseId);

  if (!guesthouse) {
    throw new Error("Guesthouse not found.");
  }

  return guesthouse;
};

/*
 * Update a guesthouse.
 *
 * Only the admin who created the guesthouse can update it.
 */
export const updateGuesthouse = async (
  guesthouseId: string,
  data: Partial<IGuesthouse>,
  userId: string
): Promise<IGuesthouse> => {
  validateId(guesthouseId);
  await checkAdmin(userId);

  const guesthouse = await Guesthouse.findById(guesthouseId);

  if (!guesthouse) {
    throw new Error("Guesthouse not found.");
  }

  if (guesthouse.createdBy.toString() !== userId) {
    throw new Error("You are not authorized to modify this guesthouse.");
  }

  /*
   * Do not allow the request to change ownership
   * or other automatically managed fields.
   */
  const {
    createdBy,
    createdAt,
    updatedAt,
    _id,
    ...allowedData
  } = data;

  Object.assign(guesthouse, allowedData);

  return await guesthouse.save();
};

/*
 * Delete a guesthouse.
 *
 * Only the admin who created the guesthouse can delete it.
 */
export const deleteGuesthouse = async (
  guesthouseId: string,
  userId: string
): Promise<IGuesthouse> => {
  validateId(guesthouseId);
  await checkAdmin(userId);

  const guesthouse = await Guesthouse.findById(guesthouseId);

  if (!guesthouse) {
    throw new Error("Guesthouse not found.");
  }

  if (guesthouse.createdBy.toString() !== userId) {
    throw new Error("You are not authorized to delete this guesthouse.");
  }

  await guesthouse.deleteOne();

  return guesthouse;
};

/*
 * Escape special characters so user input is treated as plain text
 * when it is used inside a regular expression.
 */
const escapeRegex = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export interface GuesthouseSearchParams {
  name?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  amenities?: string[];
  verified?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

/*
 * Supported sort options. Cheapest first (price_asc) is the default.
 */
const searchSortOptions: Record<string, Record<string, 1 | -1>> = {
  price_asc: { pricePerNight: 1 },
  price_desc: { pricePerNight: -1 },
  rating_asc: { averageRating: 1 },
  rating_desc: { averageRating: -1 },
  recent: { createdAt: -1 },
  highly_rated: { averageRating: -1, ratingsCount: -1 },
  budget_friendly: { pricePerNight: 1 },
  most_favourited: { favouritesCount: -1, averageRating: -1 }
};

/*
 * Search, filter and sort active guesthouses.
 *
 * Ratings are stored in their own collection, so the average rating and
 * the number of ratings are calculated here and attached to each result.
 */
export const searchGuesthouses = async (params: GuesthouseSearchParams) => {
  const {
    name,
    city,
    minPrice,
    maxPrice,
    minRating,
    amenities,
    verified = false,
    sortBy = "price_asc",
    page = 1,
    limit = 20,
    includeHidden = false
  } = params;

  const sort = searchSortOptions[sortBy];

  if (!sort) {
    throw new Error("Invalid sortBy option.");
  }

  const match: Record<string, any> = {};
  if (!includeHidden) {
    match.isActive = true;
  }

  if (name) {
    match.name = { $regex: escapeRegex(name), $options: "i" };
  }

  if (city) {
    match.city = { $regex: escapeRegex(city), $options: "i" };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Record<string, number> = {};

    if (minPrice !== undefined) priceFilter.$gte = minPrice;
    if (maxPrice !== undefined) priceFilter.$lte = maxPrice;

    match.pricePerNight = priceFilter;
  }

  if (amenities && amenities.length > 0) {
    match.amenities = {
      $all: amenities.map((a) => new RegExp(`^${escapeRegex(a)}$`, "i"))
    };
  }

  if (verified) {
    match.verificationStatus = "verified";
  }

  const pipeline: mongoose.PipelineStage[] = [
    { $match: match },
    {
      $lookup: {
        from: Rating.collection.name,
        localField: "_id",
        foreignField: "guesthouseId",
        as: "ratingsData"
      }
    },
    {
      $addFields: {
        ratingsCount: { $size: "$ratingsData" },
        averageRating: {
          $round: [{ $ifNull: [{ $avg: "$ratingsData.rating" }, 0] }, 1]
        }
      }
    },
    {
      $lookup: {
        from: Favourite.collection.name,
        localField: "_id",
        foreignField: "guesthouseId",
        as: "favouritesData"
      }
    },
    {
      $addFields: {
        favouritesCount: {
          $size: "$favouritesData"
        }
      }
    },

    {
      $project: { ratingsData: 0, favouritesData: 0 }
    }
  ];

  if (minRating !== undefined) {
    pipeline.push({ $match: { averageRating: { $gte: minRating } } });
  }

  pipeline.push(
    { $sort: { ...sort, _id: 1 } },
    {
      $facet: {
        guesthouses: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: { ratingsData: 0 } }
        ],
        total: [{ $count: "count" }]
      }
    }
  );

  const [result] = await Guesthouse.aggregate<{
    guesthouses: unknown[];
    total: { count: number }[];
  }>(pipeline);


  const discoveryStats = await Guesthouse.aggregate<{
    _id: mongoose.Types.ObjectId;
    pricePerNight: number;
    createdAt: Date;
    verificationStatus: string;
    ratingsCount: number;
    averageRating: number;
    favouritesCount: number;
  }>([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: Rating.collection.name,
        localField: "_id",
        foreignField: "guesthouseId",
        as: "ratingsData"
      }
    },
    {
      $addFields: {
        ratingsCount: { $size: "$ratingsData" },
        averageRating: {
          $round: [{ $ifNull: [{ $avg: "$ratingsData.rating" }, 0] }, 1]
        }
      }
    },
    {
      $lookup: {
        from: Favourite.collection.name,
        localField: "_id",
        foreignField: "guesthouseId",
        as: "favouritesData"
      }
    },
    {
      $addFields: {
        favouritesCount: { $size: "$favouritesData" }
      }
    },
    {
      $project: {
        pricePerNight: 1,
        createdAt: 1,
        verificationStatus: 1,
        ratingsCount: 1,
        averageRating: 1,
        favouritesCount: 1
      }
    }
  ]);

  const prices = discoveryStats
    .map((guesthouse) => guesthouse.pricePerNight)
    .sort((a, b) => a - b);

  const middle = Math.floor(prices.length / 2);

  const medianPrice =
    prices.length === 0
      ? 0
      : prices.length % 2 === 0
        ? (prices[middle - 1] + prices[middle]) / 2
        : prices[middle];

  const mostFavouritedIds = new Set(
    [...discoveryStats]
      .filter((guesthouse) => guesthouse.favouritesCount > 0)
      .sort((a, b) => b.favouritesCount - a.favouritesCount)
      .slice(0, 10)
      .map((guesthouse) => guesthouse._id.toString())
  );

  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 30);

  const statsById = new Map(
    discoveryStats.map((guesthouse) => [
      guesthouse._id.toString(),
      guesthouse
    ])
  );

  const guesthousesWithBadges = (
    result.guesthouses as Array<Record<string, any>>
  ).map((guesthouse) => {
    const stats = statsById.get(String(guesthouse._id));

    const badges: string[] = [];

    if (stats) {
      if (stats.averageRating >= 4.5 && stats.ratingsCount >= 3) {
        badges.push("Highly Rated");
      }

      if (
        prices.length > 0 &&
        stats.pricePerNight <= medianPrice
      ) {
        badges.push("Budget Friendly");
      }

      if (new Date(stats.createdAt) >= recentCutoff) {
        badges.push("Recently Added");
      }

      if (mostFavouritedIds.has(String(guesthouse._id))) {
        badges.push("Most Favourited");
      }

      if (stats.verificationStatus === "verified") {
        badges.push("Verified Guesthouse");
      }

      if (
        (stats.ratingsCount >= 5 && stats.averageRating >= 4) ||
        stats.favouritesCount >= 10
      ) {
        badges.push("Popular");
      }
    }

    return { ...guesthouse, badges };
  });

  return {
    guesthouses: guesthousesWithBadges,
    total: result.total[0]?.count ?? 0,
    page,
    limit
  };
};
