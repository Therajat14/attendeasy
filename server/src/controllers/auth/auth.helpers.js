import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "../../utils/authCookie.util.js";
import { generateToken } from "../../utils/jwt.util.js";

// The pieces of auth that are not request handling: what a user looks like on
// the way out, how the cookie is sent, and how a signup form is read.

// Turns a user document from the database into the plain object we send to the
// frontend. The frontend should never receive the password hash.
export function toSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    rollNo: user.rollNo,
    course: user.course,
    class: user.class,
    section: user.section,
  };
}

// Creates the token and puts it in an HTTP-only cookie.
export function sendAuthCookie(res, user) {
  const token = generateToken(user);

  res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}

// Reads the signup form and returns what should be saved.
//
// Students belong to a class, so they have to send their class details.
// Teachers, class reps and admins do not, and get the object without them.
// Returns `{ userDetails }` when the form is good enough, or `{ error }` with
// the message to send back.
export function readRegisterInput(body) {
  const {
    name,
    email,
    password,
    role,
    rollNo,
    course,
    class: studentClass,
    section,
  } = body;

  const userRole = role || "student";
  const rollNumber = Number(rollNo);

  // We build the new user in pieces, because only a student gets the class
  // details. Spreading the object with `...` in between would be shorter, but
  // the separate steps here are easier to follow.
  const userDetails = {
    name: name,
    email: email,
    password: password,
    role: userRole,
  };

  if (userRole === "student") {
    if (!Number.isInteger(rollNumber) || rollNumber < 1) {
      return { error: "Roll number is required for students" };
    }

    if (!course || !studentClass || !section) {
      return { error: "Course, class, and section are required for students" };
    }

    userDetails.rollNo = rollNumber;
    userDetails.course = course;
    userDetails.class = studentClass;
    userDetails.section = section;
  }

  return { userDetails };
}
