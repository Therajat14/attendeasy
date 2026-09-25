import cookieParser from "cookie-parser";
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

// The browser is on a different port than the API, so it needs CORS.
//
// We cannot answer with "*" when credentials are allowed, because the browser
// rejects that combination. Instead we list the exact frontend URLs we accept
// and the browser receives back the one it asked from.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

// cookieParser turns the Cookie header into a plain object: req.cookies
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/", (req, res) => {
  res.send("AttendEasy API is running");
});

app.use(errorHandler);

export default app;
