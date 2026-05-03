import crypto from "crypto";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.model.js";

const ATTENDANCE_DURATION_MINUTES = 30;

function getFrontendUrl() {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

function buildFormUrl(token) {
  return `${getFrontendUrl().replace(/\/$/, "")}/form/${token}`;
}

function normalizeSessionPayload(body) {
  return {
    lectureName: typeof body.lectureName === "string" ? body.lectureName.trim() : "",
    class: typeof body.class === "string" ? body.class.trim() : "",
    section: typeof body.section === "string" ? body.section.trim() : "",
  };
}

function serializeAttendance(attendance) {
  return {
    id: attendance._id,
    lectureName: attendance.lectureName,
    class: attendance.class,
    section: attendance.section,
    date: attendance.date,
    formToken: attendance.formToken,
    formUrl: buildFormUrl(attendance.formToken),
    expiresAt: attendance.expiresAt,
    isActive: attendance.isActive,
    students: attendance.students.map((student) => ({
      studentId: student.studentId?._id || student.studentId,
      name: student.studentId?.name || "Unknown student",
      email: student.studentId?.email || "",
      rollNo: student.studentId?.rollNo || null,
      submittedAt: student.submittedAt,
    })).sort((a, b) => (a.rollNo ?? Number.MAX_SAFE_INTEGER) - (b.rollNo ?? Number.MAX_SAFE_INTEGER)),
    studentCount: attendance.students.length,
  };
}

async function expireOldSessions(filter = {}) {
  await Attendance.updateMany(
    {
      ...filter,
      isActive: true,
      expiresAt: { $lte: new Date() },
    },
    { $set: { isActive: false } },
  );
}

export const startAttendanceSession = async (req, res) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ message: "Only teachers can start attendance sessions" });
  }

  const session = normalizeSessionPayload(req.body);
  if (!session.lectureName || !session.class || !session.section) {
    return res.status(400).json({ message: "lectureName, class, and section are required" });
  }

  await expireOldSessions({ teacherId: req.user._id });

  const existingActiveSession = await Attendance.findOne({
    teacherId: req.user._id,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (existingActiveSession) {
    await existingActiveSession.populate("students.studentId", "name email rollNo role");

    return res.status(409).json({
      message: "You already have an active attendance session",
      session: serializeAttendance(existingActiveSession),
    });
  }

  const formToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ATTENDANCE_DURATION_MINUTES * 60 * 1000);

  const attendance = await Attendance.create({
    teacherId: req.user._id,
    ...session,
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

export const markAttendance = async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only students can mark attendance" });
  }

  const { token } = req.params;

  const attendance = await Attendance.findOne({ formToken: token });
  if (!attendance) {
    return res.status(404).json({ message: "Attendance session not found" });
  }

  if (attendance.expiresAt <= new Date()) {
    attendance.isActive = false;
    await attendance.save();
    return res.status(410).json({ message: "Attendance link has expired" });
  }

  if (!attendance.isActive) {
    return res.status(400).json({ message: "Attendance session is not active" });
  }

  const updatedAttendance = await Attendance.findOneAndUpdate(
    {
      _id: attendance._id,
      isActive: true,
      expiresAt: { $gt: new Date() },
      students: {
        $not: {
          $elemMatch: {
            studentId: req.user._id,
          },
        },
      },
    },
    {
      $push: {
        students: {
          studentId: req.user._id,
          submittedAt: new Date(),
        },
      },
    },
    { new: true, runValidators: true },
  );

  if (!updatedAttendance) {
    return res.status(409).json({ message: "Already marked" });
  }

  return res.status(201).json({
    message: "Attendance marked successfully",
  });
};

export const getAttendanceSessions = async (req, res) => {
  await expireOldSessions({ teacherId: req.user._id });

  const sessions = await Attendance.find({ teacherId: req.user._id })
    .populate("students.studentId", "name email rollNo role")
    .sort({ date: -1 });

  return res.json(sessions.map(serializeAttendance));
};

export const getAttendanceSessionById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid attendance session id" });
  }

  const session = await Attendance.findOne({
    _id: req.params.id,
    teacherId: req.user._id,
  }).populate("students.studentId", "name email rollNo role");

  if (!session) {
    return res.status(404).json({ message: "Attendance session not found" });
  }

  if (session.isActive && session.expiresAt <= new Date()) {
    session.isActive = false;
    await session.save();
  }

  return res.json(serializeAttendance(session));
};

export const getAttendanceSessionsByDate = async (req, res) => {
  const requestedDate = new Date(req.params.date);

  if (Number.isNaN(requestedDate.getTime())) {
    return res.status(400).json({ message: "Invalid date. Use YYYY-MM-DD format." });
  }

  const startOfDay = new Date(requestedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  await expireOldSessions({ teacherId: req.user._id });

  const sessions = await Attendance.find({
    teacherId: req.user._id,
    date: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
  })
    .populate("students.studentId", "name email rollNo role")
    .sort({ date: -1 });

  return res.json(sessions.map(serializeAttendance));
};

export const endAttendanceSession = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid attendance session id" });
  }

  const session = await Attendance.findOneAndUpdate(
    {
      _id: req.params.id,
      teacherId: req.user._id,
    },
    { $set: { isActive: false } },
    { new: true },
  );

  if (!session) {
    return res.status(404).json({ message: "Attendance session not found" });
  }

  await session.populate("students.studentId", "name email rollNo role");

  return res.json({
    message: "Attendance session ended successfully",
    session: serializeAttendance(session),
  });
};
