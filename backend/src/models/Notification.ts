import { Document, Schema, Types, model } from "mongoose";
import Guesthouse from "./Guesthouse";
import User from "./User";

/*
 * The kinds of notification a customer can receive.
 *
 * These cover guesthouse discovery only. There are no booking,
 * reservation, payment or checkout notifications.
 */
export const notificationTypes = [
  "NEW_GUESTHOUSE",
  "FAVOURITE_UPDATE",
  "NEW_REVIEW",
  "PRICE_CHANGE",
  "RECOMMENDATION",
  "GUESTHOUSE_VERIFIED"
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export interface INotification extends Document {
  customerId: Types.ObjectId;
  guesthouseId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    // The customer who receives the notification
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required."]
    },
    // The guesthouse the notification is about. Optional, because some
    // notifications (for example a recommendation) may not be about one.
    guesthouseId: {
      type: Schema.Types.ObjectId,
      ref: "Guesthouse"
    },
    type: {
      type: String,
      enum: {
        values: [...notificationTypes],
        message: "Notification type is invalid."
      },
      required: [true, "Notification type is required."]
    },
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters."]
    },
    message: {
      type: String,
      required: [true, "Message is required."],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters."]
    },
    // New notifications start as unread
    isRead: {
      type: Boolean,
      default: false
    }
  },
  // Only createdAt is needed, so updatedAt is switched off
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Before saving, check that the customer and the guesthouse really exist
notificationSchema.pre("validate", async function () {
  const [customer, guesthouse] = await Promise.all([
    this.customerId
      ? User.exists({ _id: this.customerId, role: "customer" })
      : null,
    this.guesthouseId ? Guesthouse.exists({ _id: this.guesthouseId }) : null
  ]);

  if (this.customerId && !customer) {
    this.invalidate("customerId", "Customer does not exist or is not a customer.");
  }

  if (this.guesthouseId && !guesthouse) {
    this.invalidate("guesthouseId", "Guesthouse does not exist.");
  }
});

// Indexes to keep lookups fast
notificationSchema.index({ customerId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 }); // newest first

const Notification = model<INotification>("Notification", notificationSchema);

export default Notification;