import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Keep the app on the database that contains its users, regardless of the URI path.
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: process.env.MONGODB_DB_NAME || "DumelaStays"
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error instanceof Error ? error.name : "UnknownError");
    process.exit(1);
  }
};

export default connectDB;
