import User from "../models/User.model.js";
import { generateToken } from "../utils/jwt.util.js";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "../utils/authCookie.util.js";

// This turns a user document into the plain object we send to the frontend.
// The frontend should never receive the password hash.
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

  const newUser = await User.create({
    name,
    email,
    password,
    role: userRole,
    ...(userRole === "student"
      ? {
          rollNo: rollNumber,
          course,
          class: studentClass,
          section,
        }
      : {}),
  });

  sendAuthCookie(res, newUser);

  return res.status(201).json({ user: toSafeUser(newUser) });
};

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  const passwordMatches = user ? await user.comparePassword(password) : false;

  if (!user || !passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  sendAuthCookie(res, user);

  return res.json({ user: toSafeUser(user) });
};

// LOGOUT
export const logout = async (req, res) => {
  // Clearing a cookie means sending it again with an empty value and no expiry.
  res.clearCookie(AUTH_COOKIE_NAME);

  return res.json({ message: "Logged out successfully" });
};

// GET CURRENT USER
export const getMe = async (req, res) => {
  return res.json(toSafeUser(req.user));
};
