import User from "../models/User.model.js";
import { generateToken } from "../utils/jwt.util.js";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "../utils/authCookie.util.js";

// Turns a user document from the database into the plain object we send to the
// frontend. The frontend should never receive the password hash.
function toSafeUser(user) {
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
function sendAuthCookie(res, user) {
  const token = generateToken(user);

  res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}

// REGISTER
export const register = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    rollNo,
    course,
    class: studentClass,
    section,
  } = req.body;

  const userRole = role || "student";
  const rollNumber = Number(rollNo);

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Students belong to a class, so they must send their class details.
  // Teachers, class reps and admins do not need them.
  if (userRole === "student") {
    if (!Number.isInteger(rollNumber) || rollNumber < 1) {
      return res.status(400).json({ message: "Roll number is required for students" });
    }

    if (!course || !studentClass || !section) {
      return res
        .status(400)
        .json({ message: "Course, class, and section are required for students" });
    }
  }

  // We build the new user in pieces, because only a student gets the class
  // details. Spreading the object with `...` in between would be shorter, but
  // the three separate steps here are easier to follow.
  const newUserDetails = {
    name: name,
    email: email,
    password: password,
    role: userRole,
  };

  if (userRole === "student") {
    newUserDetails.rollNo = rollNumber;
    newUserDetails.course = course;
    newUserDetails.class = studentClass;
    newUserDetails.section = section;
  }

  const newUser = await User.create(newUserDetails);

  sendAuthCookie(res, newUser);

  return res.status(201).json({ user: toSafeUser(newUser) });
};

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  // We only compare a password when we actually found a user, because there is
  // nothing stored to compare against otherwise.
  let passwordMatches = false;

  if (user) {
    passwordMatches = await user.comparePassword(password);
  }

  if (!user || !passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  sendAuthCookie(res, user);

  return res.json({ user: toSafeUser(user) });
};

// LOGOUT
export const logout = async (req, res) => {
  // Clearing a cookie means sending it again with an empty value and no expiry.
  // We repeat the original options so the browser recognises the cookie we are
  // removing: a cookie only matches the one being cleared on name, path and
  // domain, but keeping the rest identical avoids surprises.
  res.clearCookie(AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS);

  return res.json({ message: "Logged out successfully" });
};

// GET CURRENT USER
export const getMe = async (req, res) => {
  return res.json(toSafeUser(req.user));
};
