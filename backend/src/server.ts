import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database";
import authRoutes from "./routes/authRoutes";
import guesthouseRoutes from "./routes/guesthouseRoutes";
import favouriteRoutes from "./routes/favouriteRoutes";
import favouriteCollectionRoutes from "./routes/favouriteCollectionRoutes";
import comparisonRoutes from "./routes/comparisonRoutes";
import searchHistoryRoutes from "./routes/searchHistoryRoutes";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/guesthouses", guesthouseRoutes);
app.use("/api/favourites", favouriteRoutes);
app.use("/api/favourite-collections", favouriteCollectionRoutes);
app.use("/api/comparisons", comparisonRoutes);
app.use("/api/search-history", searchHistoryRoutes);


// Render checks /health; retain the API-prefixed path for existing clients.
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

// Keep parser and unexpected server errors in the same JSON response format as the API.
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});