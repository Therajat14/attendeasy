import cors from "cors";
import express from "express";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.middleware.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use((req, res, next) => {
  console.log(req.method + " " + req.url);
  next();
});

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/", (req, res) => {
  res.send("AttendEasy API is running");
});

app.use(errorHandler);

export default app;
