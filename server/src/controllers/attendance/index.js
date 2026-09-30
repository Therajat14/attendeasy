// One place for the routes to import every attendance handler from.
//
// The handlers themselves are split by what they do:
//
//   session.controller.js  a teacher opens, closes and reads one session
//   query.controller.js    a teacher browses their list and the calendar
//   student.controller.js  a student marks, and reads live and past sessions
//   attendance.serializer.js  database document to the JSON the frontend wants
//   attendance.helpers.js     the few shared helpers and constants
//
// This split exists so each file holds one idea. The HTTP behaviour did not
// change: same handlers, same status codes, same messages.

export {
  endAttendanceSession,
  getAttendanceSessionById,
  startAttendanceSession,
} from "./session.controller.js";

export {
  getAttendanceSessions,
  getAttendanceSessionsByDate,
} from "./query.controller.js";

export {
  getLiveAttendanceForStudent,
  getStudentAttendanceHistory,
  markAttendance,
} from "./student.controller.js";
