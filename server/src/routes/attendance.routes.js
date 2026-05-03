import express from "express";
import {
  endAttendanceSession,
  getAttendanceSessionById,
  getAttendanceSessions,
  getAttendanceSessionsByDate,
  startAttendanceSession,
  submitAttendance,
} from "../controllers/attendance.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { formSubmissionRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/start", protect, startAttendanceSession);
router.post("/submit/:token", formSubmissionRateLimiter, submitAttendance);
router.get("/", protect, getAttendanceSessions);
router.get("/date/:date", protect, getAttendanceSessionsByDate);
router.get("/:id", protect, getAttendanceSessionById);
router.patch("/:id/end", protect, endAttendanceSession);

export default router;
