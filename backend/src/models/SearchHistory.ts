
import { Document, Schema, Types, model } from "mongoose";

export interface ISearchHistory extends Document {
  customerId: Types.ObjectId;
  searchTerm: string;
  location: string;
  filters: Record<string, unknown>;
  createdAt: Date;
}

const searchHistorySchema = new Schema<ISearchHistory>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required."]
    },

    searchTerm: {
      type: String,
      trim: true,
      maxlength: [200, "Search term cannot exceed 200 characters."],
      default: ""
    },

    location: {
      type: String,
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters."],
      default: ""
    },

    filters: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Retrieve a customer's search history.
searchHistorySchema.index({ customerId: 1 });

// Retrieve recent searches first.
searchHistorySchema.index({ customerId: 1, createdAt: -1 });
searchHistorySchema.index({ createdAt: -1 });

// Support queries involving a search location.
searchHistorySchema.index({ location: 1 });

export default model<ISearchHistory>("SearchHistory", searchHistorySchema);
