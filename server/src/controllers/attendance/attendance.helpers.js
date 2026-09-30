import Attendance from "../../models/Attendance.model.js";

// The small pieces of attendance logic that more than one handler needs.
// Anything used by a single handler stays in that handler's own file.

// How long a session stays open after a teacher starts it.
export const SESSION_DURATION_MINUTES = 30;

// The four fields the "start a session" form sends.
const SESSION_FIELDS = ["lectureName", "course", "class", "section"];

// Builds the link a student opens to mark attendance.
export function buildFormUrl(token) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${frontendUrl.replace(/\/$/, "")}/form/${token}`;
}

// Reads the four fields out of the request body, trimmed.
// Anything that is not a string becomes an empty string, and the caller checks
// for the empty ones.
export function readSessionInput(body) {
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
export function isSameClass(student, session) {
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
export async function closeExpiredSessions(teacherId) {
  const sessionsToClose = {
    isActive: true,
    expiresAt: { $lte: new Date() },
  };

  if (teacherId) {
    sessionsToClose.teacherId = teacherId;
  }

  await Attendance.updateMany(sessionsToClose, { $set: { isActive: false } });
}
