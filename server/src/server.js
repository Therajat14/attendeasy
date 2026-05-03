import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import formRoutes from "./routes/form.routes.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import morgan from "morgan";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", formRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("AttendEasy API is running");
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });

export default app;
