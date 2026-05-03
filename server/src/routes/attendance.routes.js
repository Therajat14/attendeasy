import express from "express";
import {
  endAttendanceSession,
  getAttendanceSessionById,
  getAttendanceSessions,
  getAttendanceSessionsByDate,
  getLiveAttendanceForStudent,
  getStudentAttendanceHistory,
  markAttendance,
  startAttendanceSession,
} from "../controllers/attendance.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { formSubmissionRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/start", protect, startAttendanceSession);
router.post("/mark/:token", protect, formSubmissionRateLimiter, markAttendance);
router.get("/live", protect, getLiveAttendanceForStudent);
router.get("/student/history", protect, getStudentAttendanceHistory);
router.get("/", protect, getAttendanceSessions);
router.get("/date/:date", protect, getAttendanceSessionsByDate);
router.get("/:id", protect, getAttendanceSessionById);
router.patch("/:id/end", protect, endAttendanceSession);

export default router;
