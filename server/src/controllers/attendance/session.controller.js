import crypto from "crypto";
import mongoose from "mongoose";
import Attendance from "../../models/Attendance.model.js";
import {
  SESSION_DURATION_MINUTES,
  buildFormUrl,
  closeExpiredSessions,
  readSessionInput,
} from "./attendance.helpers.js";
import {
  STUDENT_DETAILS_TO_LOAD,
  serializeAttendance,
} from "./attendance.serializer.js";

// The teacher side of a session: opening one, closing one, and reading one back.

export const startAttendanceSession = async (req, res) => {
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ message: "Only teachers can start attendance sessions" });
  }

  const input = readSessionInput(req.body);

  if (!input.lectureName || !input.course || !input.class || !input.section) {
    return res
      .status(400)
      .json({ message: "lectureName, course, class, and section are required" });
  }

  await closeExpiredSessions(req.user._id);

  const openSession = await Attendance.findOne({
    teacherId: req.user._id,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  // A teacher can only run one session at a time, so we hand back the session
  // that is already open instead of creating a second one.
  if (openSession) {
    await openSession.populate("students.studentId", STUDENT_DETAILS_TO_LOAD);

    return res.status(409).json({
      message: "You already have an active attendance session",
      session: serializeAttendance(openSession),
    });
  }

  const formToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MINUTES * 60 * 1000);

  const attendance = await Attendance.create({
    teacherId: req.user._id,
    lectureName: input.lectureName,
    course: input.course,
    class: input.class,
    section: input.section,
    formToken,
    expiresAt,
    isActive: true,
  });

  return res.status(201).json({
    message: "Attendance session started successfully",
    formUrl: buildFormUrl(formToken),
    expiresAt,
    session: serializeAttendance(attendance),
  });
};

export const endAttendanceSession = async (req, res) => {
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ message: "Only teachers can end attendance sessions" });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid attendance session id" });
  }

  const session = await Attendance.findOneAndUpdate(
    { _id: req.params.id, teacherId: req.user._id },
    { $set: { isActive: false } },
    { new: true },
  );

  if (!session) {
    return res.status(404).json({ message: "Attendance session not found" });
  }

  await session.populate("students.studentId", STUDENT_DETAILS_TO_LOAD);

  return res.json({
    message: "Attendance session ended successfully",
    session: serializeAttendance(session),
  });
};

// ONE SESSION, WITH ITS ROSTER
export const getAttendanceSessionById = async (req, res) => {
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ message: "Only teachers can view attendance sessions" });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid attendance session id" });
  }

  const session = await Attendance.findOne({
    _id: req.params.id,
    teacherId: req.user._id,
  }).populate("students.studentId", STUDENT_DETAILS_TO_LOAD);

  if (!session) {
    return res.status(404).json({ message: "Attendance session not found" });
  }

  if (session.isActive && session.expiresAt <= new Date()) {
    session.isActive = false;
    await session.save();
  }

  return res.json(serializeAttendance(session));
};
