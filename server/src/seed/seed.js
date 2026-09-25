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

const force = process.argv.includes("--force");

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

const pick = (list) => list[Math.floor(random() * list.length)];

function sample(list, count) {
  const pool = [...list];
  const taken = [];

  while (taken.length < count && pool.length) {
    taken.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
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
];

function buildStudents() {
  const students = [];
  let rollNo = 1;

  CLASS_GROUPS.forEach((group, groupIndex) => {
    const size = [10, 8, 6][groupIndex];

    for (let i = 0; i < size; i += 1) {
      const name = STUDENT_NAMES[rollNo - 1] || `Student ${rollNo}`;
      const emailName = name
        .toLowerCase()
        .replace(/[^a-z]+/g, ".")
        .replace(/^\.|\.$/g, "");

      students.push({
        name,
        email: `${emailName}@college.edu`,
        role: "student",
        rollNo,
        course: group.course,
        class: group.class,
        section: group.section,
      });

      rollNo += 1;
    }
  });

  return students;
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

function buildHistory(teachers, groups) {
  const sessions = [];

  // Two weeks of finished lectures, three per weekday block.
  const pastDays = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  pastDays.forEach((daysAgo, index) => {
    const teacher = teachers[index % 2];
    const group = groups[index % 2];
    const roster = groupsStudents[groupKey(group)];
    const subject = pick(SUBJECTS[teacher.email.split(".")[0]] || SUBJECTS.ananya);
    const startOfDay = new Date();
    startOfDay.setDate(startOfDay.getDate() - daysAgo);
    startOfDay.setHours(9 + (index % 3) * 2, 15, 0, 0);

    if (startOfDay > new Date()) return;

    const date = startOfDay;
    const rate = 0.55 + random() * 0.42;
    const markedCount = Math.max(1, Math.round(roster.length * rate));

    sessions.push({
      teacherId: teacher._id,
      lectureName: subject,
      course: group.course,
      class: group.class,
      section: group.section,
      date,
      formToken: crypto.randomBytes(32).toString("hex"),
      expiresAt: new Date(date.getTime() + SESSION_MINUTES * 60 * 1000),
      isActive: false,
      students: sample(roster, markedCount).map((student) => ({
        studentId: student._id,
        submittedAt: new Date(date.getTime() + Math.floor(random() * 12 * 60 * 1000)),
      })),
    });
  });

  return sessions;
}

let groupsStudents = {};

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

  groupsStudents = Object.fromEntries(
    CLASS_GROUPS.map((group) => [
      groupKey(group),
      students.filter(
        (student) =>
          student.course === group.course &&
          student.class === group.class &&
          student.section === group.section,
      ),
    ]),
  );

  const history = buildHistory(teachers, CLASS_GROUPS);
  await Attendance.insertMany(history);
  console.log(`Created ${history.length} past attendance sessions`);

  const liveGroup = CLASS_GROUPS[0];
  const liveRoster = groupsStudents[groupKey(liveGroup)];
  const liveToken = crypto.randomBytes(32).toString("hex");

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
    students: sample(liveRoster, 4).map((student) => ({
      studentId: student._id,
      submittedAt: new Date(),
    })),
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
  console.log(`    ${teachers[0].email}`);
  console.log(`    ${teachers[1].email}`);
  console.log(`    ${teachers[2].email}\n`);

  console.log("  STUDENTS (BCA / 2nd Year)");
  students
    .filter((student) => student.course === "BCA")
    .slice(0, 6)
    .forEach((student) => {
      console.log(
        `    roll ${String(student.rollNo).padStart(2, "0")}  ${student.email}  (Section ${student.section})`,
      );
    });

  console.log(`\n  CLASS REPS`);
  REPS.forEach((rep) => {
    console.log(`    ${rep.email}  (${rep.class}, Section ${rep.section})`);
  });

  console.log(`\n  LIVE ATTENDANCE LINK`);
  console.log(`    ${FRONTEND_URL}/form/${liveToken}`);
  console.log(`${line}\n`);
}

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
