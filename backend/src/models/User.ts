import bcrypt from "bcryptjs";
import { Document, Schema, model } from "mongoose";

export type UserRole = "customer" | "admin";
export type AuthProvider = "local" | "google";

export interface IUser extends Document {
  name: string;
  email: string;
  /** Excluded from query results by default. Local account hashes use bcrypt. */
  passwordHash?: string;
  role: UserRole;
  authProvider: AuthProvider;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
  /** Virtual input; plaintext is never persisted. */
  password?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long."],
      maxlength: [100, "Name cannot exceed 100 characters."]
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      trim: true,
      lowercase: true,
      maxlength: [254, "Email cannot exceed 254 characters."],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."]
    },
    passwordHash: {
      type: String,
      select: false,
      validate: {
        validator: (value: string | undefined) =>
          value === undefined || /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value),
        message: "Password must be stored as a bcrypt hash. Set it through the password field."
      }
    },
    role: {
      type: String,
      enum: {
        values: ["customer", "admin"],
        message: "Role must be either customer or admin."
      },
      default: "customer",
      required: true
    },
    authProvider: {
      type: String,
      enum: {
        values: ["local", "google"],
        message: "Authentication provider must be local or google."
      },
      default: "local",
      required: true
    },
    googleId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      required: function (this: IUser) {
        return this.authProvider === "google";
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_document, result) => {
        delete result.passwordHash;
        return result;
      }
    },
    toObject: {
      virtuals: true,
      transform: (_document, result) => {
        delete result.passwordHash;
        return result;
      }
    }
  }
);

userSchema.virtual("password").set(function (this: IUser, value: string) {
  this.$locals.pendingPassword = value;
});

userSchema.pre("validate", async function () {
  const pendingPassword = this.$locals.pendingPassword as string | undefined;

  if (pendingPassword !== undefined) {
    if (typeof pendingPassword !== "string" || pendingPassword.length < 8) {
      this.invalidate("password", "Password must be at least 8 characters long.");
    } else {
      this.passwordHash = await bcrypt.hash(pendingPassword, 12);
      delete this.$locals.pendingPassword;
    }
  }

  if (this.authProvider === "local" && !this.passwordHash) {
    this.invalidate("password", "A password is required for local accounts.");
  }

  if (this.authProvider === "google" && !this.googleId) {
    this.invalidate("googleId", "Google accounts must include a Google user ID.");
  }
});

userSchema.index({ email: 1 }, { unique: true });

userSchema.method("comparePassword", async function (this: IUser, candidate: string) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidate, this.passwordHash);
});

const User = model<IUser>("User", userSchema);

export default User;
