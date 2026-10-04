import mongoose from "mongoose";
import Guesthouse, { IGuesthouse } from "../models/Guesthouse";
import User from "../models/User";
import Rating from "../models/Rating";

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
 *
 * Without this, a search for "a.b" or "(" could behave unexpectedly
 * or cause an error, because those characters have special meanings.
 */
const escapeRegex = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/*
 * The options a client can send to the search endpoint.
 * Every field is optional, so a search can use any combination of them.
 */
export interface GuesthouseSearchParams {
  name?: string; // Part of the guesthouse name
  city?: string; // Part of the city name
  minPrice?: number; // Lowest price per night
  maxPrice?: number; // Highest price per night
  minRating?: number; // Lowest average rating (0 to 5)
  amenities?: string[]; // Amenities the guesthouse must have
  verified?: boolean; // Only show verified guesthouses
  sortBy?: string; // One of the keys in searchSortOptions below
  page?: number; // Which page of results to return
  limit?: number; // How many results per page
}

/*
 * The sort options the client can choose with sortBy.
 * 1 means smallest first (ascending) and -1 means largest first (descending).
 *
 * price_asc is the default, so the cheapest guesthouses come first.
 * budget_friendly currently sorts the same way as price_asc.
 */
const searchSortOptions: Record<string, Record<string, 1 | -1>> = {
  price_asc: { pricePerNight: 1 },
  price_desc: { pricePerNight: -1 },
  rating_asc: { averageRating: 1 },
  rating_desc: { averageRating: -1 },
  recent: { createdAt: -1 },
  // If two guesthouses have the same average, the one with more ratings comes first
  highly_rated: { averageRating: -1, ratingsCount: -1 },
  budget_friendly: { pricePerNight: 1 }
};

/*
 * Search, filter and sort active guesthouses.
 *
 * Ratings are stored in their own collection, so the average rating and
 * the number of ratings are calculated here and attached to each result.
 *
 * The query is built as an aggregation pipeline, which is a list of
 * stages that the data passes through one after the other.
 */
export const searchGuesthouses = async (params: GuesthouseSearchParams) => {
  // Read the options and set a default for any that were not sent
  const {
    name,
    city,
    minPrice,
    maxPrice,
    minRating,
    amenities,
    verified = false,
    sortBy = "price_asc", // Cheapest first unless the client asks otherwise
    page = 1,
    limit = 20
  } = params;

  // Look up the sort order, and reject a sortBy value we do not support
  const sort = searchSortOptions[sortBy];

  if (!sort) {
    throw new Error("Invalid sortBy option.");
  }

  // Start with the rule every search follows: hide inactive guesthouses
  const match: Record<string, any> = { isActive: true };

  // Name search: matches part of the name and ignores upper/lower case
  if (name) {
    match.name = { $regex: escapeRegex(name), $options: "i" };
  }

  // City search: matches part of the city name and ignores case
  if (city) {
    match.city = { $regex: escapeRegex(city), $options: "i" };
  }

  // Price filter: add a lower limit, an upper limit, or both
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Record<string, number> = {};

    if (minPrice !== undefined) priceFilter.$gte = minPrice; // greater than or equal
    if (maxPrice !== undefined) priceFilter.$lte = maxPrice; // less than or equal

    match.pricePerNight = priceFilter;
  }

  // Amenities filter: the guesthouse must have every amenity listed.
  // Each one is matched exactly but ignoring case, so "WiFi" finds "wifi".
  if (amenities && amenities.length > 0) {
    match.amenities = {
      $all: amenities.map((a) => new RegExp(`^${escapeRegex(a)}$`, "i"))
    };
  }

  // Verified filter: only guesthouses whose status is "verified"
  if (verified) {
    match.verificationStatus = "verified";
  }

  const pipeline: mongoose.PipelineStage[] = [
    // Stage 1: keep only the guesthouses that pass the filters above
    { $match: match },

    // Stage 2: attach each guesthouse's ratings from the ratings collection
    {
      $lookup: {
        from: Rating.collection.name,
        localField: "_id",
        foreignField: "guesthouseId",
        as: "ratingsData"
      }
    },

    // Stage 3: work out the number of ratings and the average rating.
    // A guesthouse with no ratings gets an average of 0.
    {
      $addFields: {
        ratingsCount: { $size: "$ratingsData" },
        averageRating: {
          $round: [{ $ifNull: [{ $avg: "$ratingsData.rating" }, 0] }, 1]
        }
      }
    }
  ];

  // The rating filter can only run now, because averageRating
  // did not exist until stage 3 calculated it
  if (minRating !== undefined) {
    pipeline.push({ $match: { averageRating: { $gte: minRating } } });
  }

  pipeline.push(
    // Sort the results. Sorting by _id last keeps the order the same
    // every time when two guesthouses are equal on the main sort.
    { $sort: { ...sort, _id: 1 } },

    // Run two small queries on the same sorted results at once:
    // one gets the requested page, the other counts all matches
    {
      $facet: {
        guesthouses: [
          { $skip: (page - 1) * limit }, // skip the earlier pages
          { $limit: limit }, // keep one page of results
          { $project: { ratingsData: 0 } } // do not send the raw ratings back
        ],
        total: [{ $count: "count" }] // total matches across all pages
      }
    }
  );

  // Run the pipeline against the guesthouses collection
  const [result] = await Guesthouse.aggregate<{
    guesthouses: unknown[];
    total: { count: number }[];
  }>(pipeline);

  // If nothing matched, the count list is empty, so the total is 0
  return {
    guesthouses: result.guesthouses,
    total: result.total[0]?.count ?? 0,
    page,
    limit
  };
};