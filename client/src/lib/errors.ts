import type { AxiosError } from "axios";

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  const raw = axiosError?.response?.data?.message;

  if (typeof raw !== "string" || !raw.trim()) {
    if (axiosError?.response?.status === 429) {
      return "Too many attempts in a row. Please wait a moment and try again.";
    }
    if (
      axiosError?.code === "ECONNABORTED" ||
      axiosError?.message === "Network Error"
    ) {
      return "We could not reach AttendEasy. Please check your connection and try again.";
    }
    return fallback;
  }

  return humanizeApiMessage(raw);
}

const FRIENDLY_RULES: Array<[RegExp, string]> = [
  [/lectureName|course|class|section/i, "Please fill in every field to continue."],
  [/invalid credential/i, "That email and password combination doesn't look right."],
  [
    /user already exists|already registered/i,
    "An account with this email already exists. Try signing in instead.",
  ],
  [/roll number is required/i, "Please enter your roll number."],
  [/roll number/i, "Please enter a valid roll number."],
  [/only teachers can/i, "This action is available to teachers only."],
  [/only students can/i, "This action is available to students only."],
  [
    /not for your course, class, or section/i,
    "This session is for a different class. Ask your teacher for the right link.",
  ],
  [/already marked/i, "You've already marked attendance for this session."],
  [
    /attendance link has expired|expired/i,
    "This attendance window has closed. Ask your teacher for a new code.",
  ],
  [/not active/i, "This attendance session is no longer open."],
  [/session not found/i, "We couldn't find this attendance session."],
  [
    /you already have an active/i,
    "You already have a live session running. End it before starting a new one.",
  ],
  [/invalid attendance session id/i, "That session could not be found."],
  [/invalid date/i, "Please choose a valid date."],
  [/password/i, "Please use a stronger password (at least 6 characters)."],
  [/required/i, "Some required details are missing. Please review the form."],
  [
    /not authorized|unauthorized|forbidden/i,
    "You don't have access to this. Please sign in again.",
  ],
  [
    /token|jwt|signature|expired token/i,
    "Your session has expired. Please sign in again.",
  ],
  [
    /database|duplicate key|cast to|validation failed/i,
    "We hit a snag on our side. Please try again.",
  ],
];

function humanizeApiMessage(raw: string): string {
  const trimmed = raw.trim();
  const match = FRIENDLY_RULES.find(([pattern]) => pattern.test(trimmed));
  return match ? match[1] : trimmed;
}

export function getInitials(name?: string): string {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
