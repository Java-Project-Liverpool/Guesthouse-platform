import { Document, Schema, Types, model } from "mongoose";
import Guesthouse from "./Guesthouse";
import User from "./User";

export interface IRating extends Document {
  guesthouseId: Types.ObjectId;
  customerId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<IRating>(
  {
    guesthouseId: {
      type: Schema.Types.ObjectId,
      ref: "Guesthouse",
      required: [true, "Guesthouse is required."]
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required."]
    },
    rating: {
      type: Number,
      required: [true, "A rating from 1 to 5 is required."],
      min: [1, "Rating must be at least 1."],
      max: [5, "Rating cannot exceed 5."],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number from 1 to 5."
      }
    },
    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Comment cannot exceed 2000 characters."]
    }
  },
  { timestamps: true }
);

ratingSchema.pre("validate", async function () {
  const [guesthouse, customer] = await Promise.all([
    this.guesthouseId ? Guesthouse.exists({ _id: this.guesthouseId }) : null,
    this.customerId
      ? User.exists({ _id: this.customerId, role: "customer" })
      : null
  ]);

  if (this.guesthouseId && !guesthouse) {
    this.invalidate("guesthouseId", "Guesthouse does not exist.");
  }

  if (this.customerId && !customer) {
    this.invalidate("customerId", "Customer does not exist or is not a customer.");
  }
});

ratingSchema.index({ customerId: 1, guesthouseId: 1 }, { unique: true });

const Rating = model<IRating>("Rating", ratingSchema);

export default Rating;
