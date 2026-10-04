import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/database";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import guesthouseRoutes from "./routes/guesthouseRoutes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:8081")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || allowedOrigins.includes(origin));
  }
}));
app.use(express.json());
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/guesthouses", guesthouseRoutes);

app.get(["/health", "/api/health"], (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  return res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "OK" : "UNAVAILABLE",
    database: databaseConnected ? "connected" : "disconnected"
  });
});

app.use((_req, res) => {
  return res.status(404).json({ message: "Route not found." });
});

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    return res.status(400).json({ message: "Request body contains invalid JSON." });
  }

  console.error("Unhandled request error:", error instanceof Error ? error.name : "UnknownError");
  return res.status(500).json({ message: "Internal server error." });
});

connectDB();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
