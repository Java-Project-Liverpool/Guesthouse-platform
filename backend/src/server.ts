import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database";
import authRoutes from "./routes/authRoutes";
import guesthouseRoutes from "./routes/guesthouseRoutes";
import favouriteRoutes from "./routes/favouriteRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/guesthouses", guesthouseRoutes);
app.use("/api/favourites", favouriteRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});