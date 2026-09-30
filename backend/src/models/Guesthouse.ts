import mongoose, { Schema, Document } from "mongoose";

export interface IGuesthouse extends Document {
  name: string;
  logo: string;
  gallery: string[];
  description: string;
  amenities: string[];
  pricePerNight: number;
  city: string;
  country: string;

  location: {
    latitude: number;
    longitude: number;
  };

  contact: {
    phone: string;
    email: string;
  };

  createdBy: mongoose.Types.ObjectId;

  verificationStatus: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const guesthouseSchema = new Schema<IGuesthouse>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    logo: {
      type: String,
      required: true,
      trim: true
    },

    gallery: {
      type: [String],
      default: []
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    amenities: {
      type: [String],
      default: []
    },

    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    country: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },

      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    },

    contact: {
      phone: {
        type: String,
        required: true,
        trim: true
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
      }
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    verifiedAt: {
      type: Date
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IGuesthouse>("Guesthouse", guesthouseSchema);