
import { Document, Schema, Types, model } from "mongoose";

export interface IComparison extends Document {
  customerId: Types.ObjectId;
  name: string;
  guesthouseIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const comparisonSchema = new Schema<IComparison>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required."]
    },

    name: {
      type: String,
      required: [true, "Comparison name is required."],
      trim: true,
      minlength: [1, "Comparison name cannot be empty."],
      maxlength: [100, "Comparison name cannot exceed 100 characters."]
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

// Find comparisons belonging to a customer.
comparisonSchema.index({ customerId: 1 });

// Find comparisons containing a guesthouse.
comparisonSchema.index({ guesthouseIds: 1 });

// Retrieve a customer's comparisons in creation order.
comparisonSchema.index({ customerId: 1, createdAt: -1 });
comparisonSchema.index({ createdAt: -1 });

export default model<IComparison>("Comparison", comparisonSchema);
