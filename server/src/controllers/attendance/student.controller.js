import Attendance from "../../models/Attendance.model.js";
import { closeExpiredSessions, isSameClass } from "./attendance.helpers.js";
import {
  serializeAttendance,
  serializeAttendanceList,
} from "./attendance.serializer.js";

// The student side: marking a lecture, seeing what is open right now, and the
// record of everything already marked.

// MARK ATTENDANCE (student taps once on the shared link)
export const markAttendance = async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only students can mark attendance" });
  }

  const token = req.params.token;
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

  if (!isSameClass(req.user, attendance)) {
    return res.status(403).json({
      message: "This attendance session is not for your course, class, or section",
    });
  }

  // One database call does two jobs at once:
  // 1. it matches the session only if the student is not on the list yet
  //    (the $not / $elemMatch part), so two taps cannot create two entries
  //    even if they arrive at the same moment
  // 2. it adds the student to the list and returns the updated session
  const updatedSession = await Attendance.findOneAndUpdate(
    {
      _id: attendance._id,
      course: req.user.course,
      class: req.user.class,
      section: req.user.section,
      isActive: true,
      expiresAt: { $gt: new Date() },
      students: {
        $not: { $elemMatch: { studentId: req.user._id } },
      },
    },
    {
      $push: {
        students: { studentId: req.user._id, submittedAt: new Date() },
      },
    },
    { new: true, runValidators: true },
  );

  // The update matched nothing, which means the student was already on the list.
  if (!updatedSession) {
    return res.status(409).json({ message: "Already marked" });
  }

  return res.status(201).json({ message: "Attendance marked successfully" });
};

// LIVE SESSIONS A STUDENT CAN MARK RIGHT NOW
export const getLiveAttendanceForStudent = async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only students can view live attendance" });
  }

  if (!req.user.course || !req.user.class || !req.user.section) {
    return res
      .status(400)
      .json({ message: "Student course, class, and section are required" });
  }

  await closeExpiredSessions();

  const sessions = await Attendance.find({
    isActive: true,
    expiresAt: { $gt: new Date() },
    course: req.user.course,
    class: req.user.class,
    section: req.user.section,
  })
    .populate("teacherId", "name email")
    .sort({ date: -1 });

  const result = [];

  for (const session of sessions) {
    const sessionJson = serializeAttendance(session);

    // `students` holds ids here, so compare them as text.
    const hasMarked = session.students.some((entry) => {
      return entry.studentId.toString() === req.user._id.toString();
    });

    // Tells the frontend to show "Mark present" or "You're marked".
    sessionJson.hasMarked = hasMarked;
    result.push(sessionJson);
  }

  return res.json(result);
};

// EVERY SESSION THIS STUDENT HAS ATTENDED
export const getStudentAttendanceHistory = async (req, res) => {
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ message: "Only students can view attendance history" });
  }

  await closeExpiredSessions();

  const sessions = await Attendance.find({
    "students.studentId": req.user._id,
  })
    .populate("teacherId", "name email")
    .sort({ date: -1 });

  return res.json(serializeAttendanceList(sessions));
};
