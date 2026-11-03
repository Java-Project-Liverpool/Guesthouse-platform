import { Document, Schema, Types, model } from "mongoose";
import User from "./User";

/*
 * Which kinds of notification a customer wants to receive.
 * Each customer has exactly one preferences document.
 */
export interface INotificationPreference extends Document {
  customerId: Types.ObjectId;
  newGuesthouses: boolean;
  favouriteUpdates: boolean;
  ratingsComments: boolean;
  priceChanges: boolean;
  recommendations: boolean;
  updatedAt: Date;
}

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    // The customer these preferences belong to
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required."]
    },
    // Everything is switched on by default, and the customer can turn
    // each kind off later
    newGuesthouses: { type: Boolean, default: true },
    favouriteUpdates: { type: Boolean, default: true },
    ratingsComments: { type: Boolean, default: true },
    priceChanges: { type: Boolean, default: true },
    recommendations: { type: Boolean, default: true }
  },
  {
    // Only updatedAt is needed, so createdAt is switched off.
    // The collection name is set so it matches the issue exactly.
    timestamps: { createdAt: false, updatedAt: true },
    collection: "notificationPreferences"
  }
);

// Before saving, check that the customer really exists
notificationPreferenceSchema.pre("validate", async function () {
  const customer = this.customerId
    ? await User.exists({ _id: this.customerId, role: "customer" })
    : null;

  if (this.customerId && !customer) {
    this.invalidate("customerId", "Customer does not exist or is not a customer.");
  }
});

// One preferences document per customer, and fast lookups by customer
notificationPreferenceSchema.index({ customerId: 1 }, { unique: true });

const NotificationPreference = model<INotificationPreference>(
  "NotificationPreference",
  notificationPreferenceSchema
);

export default NotificationPreference;