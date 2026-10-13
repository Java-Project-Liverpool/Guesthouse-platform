import { Document, Schema, Types, model } from "mongoose";
 
// A report is a customer's request for an admin to review a rating (review).
export const reportStatuses = ["pending", "reviewed", "resolved", "dismissed"] as const;
 
export type ReportStatus = (typeof reportStatuses)[number];
 
export interface IReport extends Document {
  customerId: Types.ObjectId;
  ratingId: Types.ObjectId;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
  /** The time an admin finished handling this report; empty while it is still open. */
  resolvedAt?: Date;
  /** The admin who finished handling the report; empty while it is still open. */
  resolvedBy?: Types.ObjectId;
}
 
const reportSchema = new Schema<IReport>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required."]
    },
    ratingId: {
      type: Schema.Types.ObjectId,
      ref: "Rating",
      required: [true, "Rating ID is required."]
    },
    reason: {
      type: String,
      required: [true, "Reason is required."],
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters."]
    },
    status: {
      type: String,
      enum: {
        values: reportStatuses,
        message: "Status must be pending, reviewed, resolved or dismissed."
      },
      default: "pending",
      required: true
    },
    // These details are saved when an admin chooses a final outcome for the report.
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    // Keep when the customer filed the report; changing its status does not reset this time.
    timestamps: { createdAt: true, updatedAt: false }
  }
);
 
// These indexes speed up the lists and lookups used by the report routes.
reportSchema.index({ status: 1 });
reportSchema.index({ customerId: 1 });
reportSchema.index({ ratingId: 1 });
reportSchema.index({ createdAt: -1 });
 
const Report = model<IReport>("Report", reportSchema);
 
export default Report;
 
