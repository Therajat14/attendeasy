import Attendance from "../../models/Attendance.model.js";
import { closeExpiredSessions } from "./attendance.helpers.js";
import {
  STUDENT_DETAILS_TO_LOAD,
  serializeAttendanceList,
} from "./attendance.serializer.js";

// The read-only views a teacher browses: everything they have run, and the
// calendar view for a single day.

export const getAttendanceSessions = async (req, res) => {
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ message: "Only teachers can view attendance sessions" });
  }

  await closeExpiredSessions(req.user._id);

  const sessions = await Attendance.find({ teacherId: req.user._id })
    .populate("students.studentId", STUDENT_DETAILS_TO_LOAD)
    .sort({ date: -1 });

  return res.json(serializeAttendanceList(sessions));
};

// SESSIONS ON ONE DAY, USED BY THE CALENDAR
export const getAttendanceSessionsByDate = async (req, res) => {
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ message: "Only teachers can view attendance sessions" });
  }

  const requestedDate = new Date(req.params.date);

  if (Number.isNaN(requestedDate.getTime())) {
    return res.status(400).json({ message: "Invalid date. Use YYYY-MM-DD format." });
  }

  // Everything from midnight on that day, up to midnight the next morning.
  const startOfDay = new Date(requestedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  await closeExpiredSessions(req.user._id);

  const sessions = await Attendance.find({
    teacherId: req.user._id,
    date: { $gte: startOfDay, $lt: endOfDay },
  })
    .populate("students.studentId", STUDENT_DETAILS_TO_LOAD)
    .sort({ date: -1 });

  return res.json(serializeAttendanceList(sessions));
};
