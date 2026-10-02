import mongoose from "mongoose";
import Guesthouse, { IGuesthouse } from "../models/Guesthouse";
import User from "../models/User";

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
