import { buildFormUrl } from "./attendance.helpers.js";

// Turning database documents into the JSON the frontend receives.
//
// Every list endpoint and every single-session endpoint answers with the same
// shape, so the mapping lives in one place. A change to the API response is a
// change to this file.

// The only student details we load alongside a session.
export const STUDENT_DETAILS_TO_LOAD = "name email rollNo role";

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
export function serializeAttendance(attendance) {
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

// The list endpoints all answer with an array, so they share this.
export function serializeAttendanceList(sessions) {
  const result = [];

  for (const session of sessions) {
    result.push(serializeAttendance(session));
  }

  return result;
}
