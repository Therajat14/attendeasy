import crypto from "crypto";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.model.js";

// How long a session stays open after a teacher starts it.
const SESSION_DURATION_MINUTES = 30;

// The only student details we load alongside a session.
const STUDENT_DETAILS_TO_LOAD = "name email rollNo role";

// The four fields the "start a session" form sends.
const SESSION_FIELDS = ["lectureName", "course", "class", "section"];

// Builds the link a student opens to mark attendance.
function buildFormUrl(token) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${frontendUrl.replace(/\/$/, "")}/form/${token}`;
}

// Reads the four fields out of the request body, trimmed.
// Anything that is not a string becomes an empty string.
function readSessionInput(body) {
  const input = {};

  for (const field of SESSION_FIELDS) {
    const value = body[field];

    if (typeof value === "string") {
      input[field] = value.trim();
    } else {
      input[field] = "";
    }
  }

  return input;
}

// True when the student belongs to the course, year and section of this session.
function isSameClass(student, session) {
  if (student.course !== session.course) {
    return false;
  }

  if (student.class !== session.class) {
    return false;
  }

  if (student.section !== session.section) {
    return false;
  }

  return true;
}

// Marks finished sessions as closed.
//
// A session has an end time, and we check it whenever the data is read instead
// of running a background job every minute to close them.
// Passing a teacherId only closes that teacher's sessions.
async function closeExpiredSessions(teacherId) {
  const sessionsToClose = {
    isActive: true,
    expiresAt: { $lte: new Date() },
  };

  if (teacherId) {
    sessionsToClose.teacherId = teacherId;
  }

  await Attendance.updateMany(sessionsToClose, { $set: { isActive: false } });
}

// The teacher shown on a session card. Left out when the session has no teacher.
function serializeTeacher(teacher) {
  if (!teacher || !teacher.name) {
    return undefined;
  }

  return {
    id: teacher._id,
    name: teacher.name,
    email: teacher.email,
  };
}

// Compares two students by roll number, so the roster reads in order.
// Anyone without a roll number goes to the end of the list.
function compareByRollNumber(first, second) {
  const firstRoll = first.rollNo ?? Number.MAX_SAFE_INTEGER;
  const secondRoll = second.rollNo ?? Number.MAX_SAFE_INTEGER;

  return firstRoll - secondRoll;
}

// Turns one student entry on a session into the JSON the frontend receives.
//
// `entry.studentId` is a full user document when we asked MongoDB to load the
// student's details, and just an id when we did not. Each line below handles
// both cases: take the value from the document if it is there, otherwise send
// the id with empty details.
function serializeStudent(entry) {
  return {
    studentId: entry.studentId?._id || entry.studentId,
    name: entry.studentId?.name || "Unknown student",
    email: entry.studentId?.email || "",
    rollNo: entry.studentId?.rollNo || null,
    submittedAt: entry.submittedAt,
  };
}

// Turns a session from the database into the JSON the frontend receives.
function serializeAttendance(attendance) {
  const students = [];

  for (const entry of attendance.students) {
    students.push(serializeStudent(entry));
  }

  students.sort(compareByRollNumber);

  return {
    id: attendance._id,
    teacher: serializeTeacher(attendance.teacherId),
    lectureName: attendance.lectureName,
    course: attendance.course,
    class: attendance.class,
    section: attendance.section,
    date: attendance.date,
    formToken: attendance.formToken,
    formUrl: buildFormUrl(attendance.formToken),
    expiresAt: attendance.expiresAt,
    isActive: attendance.isActive,
    students,
    studentCount: attendance.students.length,
  };
}

// START A SESSION
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

// EVERY SESSION A TEACHER HAS RUN
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

  const result = [];

  for (const session of sessions) {
    result.push(serializeAttendance(session));
  }

  return res.json(result);
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

  const result = [];

  for (const session of sessions) {
    result.push(serializeAttendance(session));
  }

  return res.json(result);
};

// CLOSE A SESSION EARLY
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

  const result = [];

  for (const session of sessions) {
    result.push(serializeAttendance(session));
  }

  return res.json(result);
};
