export const COURSES = ["BCA", "BTech", "MCA", "MBA", "BSc", "BA"] as const;
export const CLASSES = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;
export const SECTIONS = ["A", "B", "C"] as const;

export const SESSION_WINDOW_MINUTES = 30;

export const LOW_ATTENDANCE_THRESHOLD = 75;

export const ROLE_LABELS: Record<string, string> = {
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
] as const;
