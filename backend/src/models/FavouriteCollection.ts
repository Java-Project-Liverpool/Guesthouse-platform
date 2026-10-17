
import { Document, Schema, Types, model } from "mongoose";

export interface IFavouriteCollection extends Document {
  customerId: Types.ObjectId;
  name: string;
  guesthouseIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const favouriteCollectionSchema = new Schema<IFavouriteCollection>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required."]
    },

    name: {
      type: String,
      required: [true, "Collection name is required."],
      trim: true,
      minlength: [1, "Collection name cannot be empty."],
      maxlength: [100, "Collection name cannot exceed 100 characters."]
    },

    guesthouseIds: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: "Guesthouse"
      }],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Find collections belonging to a particular customer.
favouriteCollectionSchema.index({ customerId: 1 });

// Find collections containing a particular guesthouse.
favouriteCollectionSchema.index({ guesthouseIds: 1 });

// Sort a customer's collections by creation time.
favouriteCollectionSchema.index({ customerId: 1, createdAt: -1 });
favouriteCollectionSchema.index({ createdAt: -1 });

export default model<IFavouriteCollection>(
  "FavouriteCollection",
  favouriteCollectionSchema
);
