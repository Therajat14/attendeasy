// The API sends messages like "Invalid credentials". This list turns those
// technical messages into messages that make sense to a student or teacher.
// Each entry is [pattern to look for, message to show instead].
const FRIENDLY_RULES = [
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

function makeMessageFriendly(serverMessage) {
  const trimmed = serverMessage.trim();

  // The rules are in priority order, so the first pattern that matches the
  // server's message is the one we use.
  for (const [pattern, friendlyMessage] of FRIENDLY_RULES) {
    if (pattern.test(trimmed)) {
      return friendlyMessage;
    }
  }

  // Nothing matched, so the server's own message is the best we have.
  return trimmed;
}

// Every page that calls the API catches errors with this function so the user
// sees one clear sentence instead of a raw server or network message.
//
// error is the object axios rejects with, so error.response holds the HTTP
// response and error.response.data holds the JSON the server sent back.
export function getErrorMessage(error, fallback = "Something went wrong") {
  const serverMessage = error?.response?.data?.message;

  // The server explained what went wrong, so translate that into plain English.
  if (typeof serverMessage === "string" && serverMessage.trim()) {
    return makeMessageFriendly(serverMessage);
  }

  // Rejected because of too many requests, with no explanation of which.
  if (error?.response?.status === 429) {
    return "Too many attempts in a row. Please wait a moment and try again.";
  }

  // Never reached the server at all: no internet, wrong address, or a request
  // that timed out. axios reports both of these in its own way.
  if (error?.code === "ECONNABORTED" || error?.message === "Network Error") {
    return "We could not reach AttendEasy. Please check your connection and try again.";
  }

  // Errors we created ourselves (for example inside AuthContext) do not come
  // from the API, but their message is already safe to show.
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
