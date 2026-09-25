export const COURSES = ["BCA", "BTech", "MCA", "MBA", "BSc", "BA"];
export const CLASSES = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
export const SECTIONS = ["A", "B", "C"];

export const LOW_ATTENDANCE_THRESHOLD = 75;

export const ROLE_LABELS = {
  student: "Student",
  teacher: "Teacher",
  cr: "Class Representative",
  admin: "Administrator",
};

export const ROLE_OPTIONS = [
  { value: "student", label: "Student", hint: "Mark attendance and track your record" },
  {
    value: "teacher",
    label: "Teacher",
    hint: "Run live sessions and view class reports",
  },
  {
    value: "cr",
    label: "Class Representative",
    hint: "Run sessions for your assigned teacher",
  },
];
