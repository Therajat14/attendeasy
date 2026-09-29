import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.model.js";
import Attendance from "../models/Attendance.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const DEMO_PASSWORD = "Attend@2026";
const SESSION_MINUTES = 30;
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(
  /\/$/,
  "",
);

// Two switches you can pass when running this file:
//   --force     wipe whatever is there and start again
//   --if-empty  only seed when the database has no users at all
const force = process.argv.includes("--force");

// --if-empty is what the Docker entrypoint uses on every boot: seed a brand new
// database, but leave a database that already has data completely alone.
// Without it, the guard further down would stop the container from starting on
// every boot after the first.
const ifEmpty = process.argv.includes("--if-empty");

// A tiny random number generator that always produces the same sequence for the
// same seed number. That is the point: every run of this script produces exactly
// the same demo data, so the sample logins never change.
function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20260926);

// Picks one item from a list at random.
function pick(list) {
  const position = Math.floor(random() * list.length);
  return list[position];
}

// Picks `count` different items from a list at random.
// It works on a copy, so the original list is left alone.
function sample(list, count) {
  const pool = [...list];
  const taken = [];

  while (taken.length < count && pool.length > 0) {
    const position = Math.floor(random() * pool.length);
    const chosen = pool.splice(position, 1)[0];
    taken.push(chosen);
  }

  return taken;
}

const TEACHERS = [
  { name: "Dr. Ananya Iyer", email: "ananya.iyer@college.edu" },
  { name: "Prof. Rahul Verma", email: "rahul.verma@college.edu" },
  { name: "Dr. Sunita Nair", email: "sunita.nair@college.edu" },
];

const REPS = [
  {
    name: "Karan Mehta",
    email: "karan.mehta@college.edu",
    class: "2nd Year",
    section: "A",
  },
  {
    name: "Priya Singh",
    email: "priya.singh@college.edu",
    class: "2nd Year",
    section: "B",
  },
];

const CLASS_GROUPS = [
  { course: "BCA", class: "2nd Year", section: "A" },
  { course: "BCA", class: "2nd Year", section: "B" },
  { course: "BTech", class: "2nd Year", section: "A" },
];

const SUBJECTS = {
  ananya: ["Data Structures", "Database Management Systems", "Operating Systems"],
  rahul: ["Discrete Mathematics", "Computer Networks", "Software Engineering"],
  sunita: ["Web Development", "Human Computer Interaction", "Data Science Lab"],
};

// Enough names for every class below, so the generated email addresses are all
// different. Two students sharing a name would also share an email, and email is
// unique in the database, so the count here has to be at least the total number
// of students.
const STUDENT_NAMES = [
  "Aarav Patel",
  "Rohan Mehta",
  "Isha Sharma",
  "Kabir Nair",
  "Ananya Gupta",
  "Vivaan Joshi",
  "Diya Kapoor",
  "Arjun Rao",
  "Saanvi Pillai",
  "Advait Singh",
  "Kiara Malhotra",
  "Reyansh Bhat",
  "Anika Desai",
  "Vihaan Chopra",
  "Myra Khanna",
  "Aditya Menon",
  "Ira Bhatt",
  "Kian Dsouza",
  "Navya Prasad",
  "Yash Thakur",
  "Prisha Agarwal",
  "Dev Malhotra",
  "Tara Bedi",
  "Neel Kulkarni",
  "Aisha Fernandes",
  "Rishi Banerjee",
  "Simran Sandhu",
  "Tarun Reddy",
  "Meera Krishnan",
  "Zoya Mirza",
  "Nikhil Verma",
  "Pooja Sinha",
  "Manav Grover",
  "Riya Chawla",
  "Aman Tiwari",
  "Sneha Kulkarni",
  "Harsh Agarwal",
  "Divya Menon",
  "Kabir Anand",
  "Neha Bhattacharya",
  "Siddharth Rana",
  "Anjali Pillai",
  "Farhan Qureshi",
  "Lakshmi Iyer",
  "Arjun Deshpande",
  "Tanya Srivastava",
  "Imran Shaikh",
  "Kritika Bose",
  "Varun Sethi",
  "Bhavna Joshi",
  "Yash Varma",
  "Charita Dutta",
  "Omkar Naik",
  "Shruti Gaikwad",
  "Pranav Shetty",
  "Deepika Rathore",
  "Sameer Khan",
  "Aditi Chavan",
  "Rishi Kulkarni",
  "Nandini Rao",
  "Tejas Patil",
  "Ishita Saxena",
];

// How many students are in each of the three classes above.
const STUDENTS_PER_CLASS = [24, 18, 14];

// Builds the list of student accounts. Roll numbers run 1, 2, 3... across all
// three classes, and the email is built from the name.
function buildStudents() {
  const students = [];
  let rollNo = 1;

  for (let classIndex = 0; classIndex < CLASS_GROUPS.length; classIndex++) {
    const group = CLASS_GROUPS[classIndex];
    const size = STUDENTS_PER_CLASS[classIndex];

    for (let i = 0; i < size; i++) {
      const name = STUDENT_NAMES[rollNo - 1] || `Student ${rollNo}`;

      // "Rohan Mehta" becomes "rohan.mehta"
      const emailName = name
        .toLowerCase()
        .replace(/[^a-z]+/g, ".")
        .replace(/^\.|\.$/g, "");

      students.push({
        name: name,
        email: `${emailName}@college.edu`,
        role: "student",
        rollNo: rollNo,
        course: group.course,
        class: group.class,
        section: group.section,
      });

      rollNo += 1;
    }
  }

  return students;
}

// How many weekdays of finished lectures to create. Six weeks of weekdays
// gives each class around ten lectures, so even the unluckiest student has a
// history page worth looking at.
const WEEKS_OF_HISTORY = 6;

// Lecture times across the day, so the list is not all one slot.
const LECTURE_HOURS = [9, 11, 13, 15];

// Every weekday going back from yesterday, newest first. Weekends are skipped
// because a college does not hold lectures on Saturday or Sunday.
function weekdaysAgo(weeks) {
  const days = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Start from yesterday, so today is never in the finished history.
  cursor.setDate(cursor.getDate() - 1);

  while (days.length < weeks * 5) {
    const weekday = cursor.getDay();

    if (weekday !== 0 && weekday !== 6) {
      days.push(new Date(cursor));
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return days;
}

function buildHistory(teachers, groups, groupsStudents) {
  const sessions = [];
  const days = weekdaysAgo(WEEKS_OF_HISTORY);

  for (let index = 0; index < days.length; index++) {
    // Every class and every teacher gets a turn, rather than only the first two
    // of each. Without this, the third teacher never appears in any history and
    // the BTech class never gets a lecture.
    const teacher = teachers[index % teachers.length];
    const group = groups[index % groups.length];
    const roster = groupsStudents[groupKey(group)];

    const teacherFirstName = teacher.email.split(".")[0];
    const subject = pick(SUBJECTS[teacherFirstName] || SUBJECTS.ananya);

    // Spread the lectures over several slots in the day.
    const date = new Date(days[index]);
    date.setHours(LECTURE_HOURS[index % LECTURE_HOURS.length], 15, 0, 0);

    // A lecture that has not happened yet is skipped.
    if (date > new Date()) {
      continue;
    }

    // Somewhere between 55% and 97% of the class turns up.
    const attendanceRate = 0.55 + random() * 0.42;
    const markedCount = Math.max(1, Math.round(roster.length * attendanceRate));
    const markedStudents = sample(roster, markedCount);

    const students = [];

    for (const student of markedStudents) {
      // Each student marks a few minutes after the lecture starts.
      const submittedAt = new Date(
        date.getTime() + Math.floor(random() * 12 * 60 * 1000),
      );

      students.push({
        studentId: student._id,
        submittedAt: submittedAt,
      });
    }

    sessions.push({
      teacherId: teacher._id,
      lectureName: subject,
      course: group.course,
      class: group.class,
      section: group.section,
      date: date,
      formToken: crypto.randomBytes(32).toString("hex"),
      expiresAt: new Date(date.getTime() + SESSION_MINUTES * 60 * 1000),
      isActive: false,
      students: students,
    });
  }

  return sessions;
}

// One name for a class, so we can look up its students, for example
// "BCA-2nd Year-A".
function groupKey(group) {
  return `${group.course}-${group.class}-${group.section}`;
}

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it to server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to ${process.env.MONGO_URI.replace(/\/\/[^@]*@/, "//")}`);

  const existingUsers = await User.countDocuments();

  if (existingUsers > 0 && !force) {
    // --if-empty means "only if there is nothing here", which is not an error.
    if (ifEmpty) {
      console.log(`Database already has ${existingUsers} users, leaving it as it is.`);
      await mongoose.disconnect();
      return;
    }

    console.log(
      `\nDatabase already has ${existingUsers} users. Re-run with --force to wipe and reseed:\n  npm run seed -- --force\n`,
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  await Promise.all([User.deleteMany({}), Attendance.deleteMany({})]);
  console.log("Cleared existing users and attendance records");

  const teachers = await User.create(
    TEACHERS.map((teacher) => ({
      ...teacher,
      role: "teacher",
      password: DEMO_PASSWORD,
    })),
  );

  await User.create(
    REPS.map((rep) => ({
      name: rep.name,
      email: rep.email,
      role: "cr",
      password: DEMO_PASSWORD,
      course: "BCA",
      class: rep.class,
      section: rep.section,
    })),
  );

  const students = await User.create(
    buildStudents().map((student) => ({ ...student, password: DEMO_PASSWORD })),
  );

  console.log(
    `Created ${teachers.length} teachers, ${REPS.length} class reps, ${students.length} students`,
  );

  // Split the students up into one list per class, so we know who belongs to
  // which course, year and section.
  const groupsStudents = {};

  for (const group of CLASS_GROUPS) {
    const key = groupKey(group);

    groupsStudents[key] = students.filter((student) => {
      return (
        student.course === group.course &&
        student.class === group.class &&
        student.section === group.section
      );
    });
  }

  const history = buildHistory(teachers, CLASS_GROUPS, groupsStudents);
  await Attendance.insertMany(history);
  console.log(`Created ${history.length} past attendance sessions`);

  // One session that is open right now, so the student side has something live
  // to look at immediately.
  const liveGroup = CLASS_GROUPS[0];
  const liveRoster = groupsStudents[groupKey(liveGroup)];
  const liveToken = crypto.randomBytes(32).toString("hex");

  const markedStudents = sample(liveRoster, 4);
  const liveEntries = [];

  for (const student of markedStudents) {
    liveEntries.push({
      studentId: student._id,
      submittedAt: new Date(),
    });
  }

  await Attendance.create({
    teacherId: teachers[0]._id,
    lectureName: "Data Structures",
    course: liveGroup.course,
    class: liveGroup.class,
    section: liveGroup.section,
    date: new Date(),
    formToken: liveToken,
    expiresAt: new Date(Date.now() + SESSION_MINUTES * 60 * 1000),
    isActive: true,
    students: liveEntries,
  });

  console.log("Created 1 live session (open for the next 30 minutes)");
  printCredentials(teachers, students, liveToken);

  await mongoose.disconnect();
}

function printCredentials(teachers, students, liveToken) {
  const line = "-".repeat(72);

  console.log(`\n${line}\n  DEMO LOGIN DETAILS\n${line}`);
  console.log(`  Password for every account: ${DEMO_PASSWORD}\n`);

  console.log("  TEACHER (live session running)");

  for (const teacher of teachers) {
    console.log(`    ${teacher.email}`);
  }

  console.log("\n  STUDENTS (BCA / 2nd Year)");

  // Only the first few, so the list stays short enough to read.
  const bcaStudents = students.filter((student) => student.course === "BCA");
  const shownStudents = bcaStudents.slice(0, 6);

  for (const student of shownStudents) {
    const paddedRoll = String(student.rollNo).padStart(2, "0");
    console.log(
      `    roll ${paddedRoll}  ${student.email}  (Section ${student.section})`,
    );
  }

  console.log("\n  CLASS REPS");

  for (const rep of REPS) {
    console.log(`    ${rep.email}  (${rep.class}, Section ${rep.section})`);
  }

  console.log("\n  LIVE ATTENDANCE LINK");
  console.log(`    ${FRONTEND_URL}/form/${liveToken}`);
  console.log(`${line}\n`);
}

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
