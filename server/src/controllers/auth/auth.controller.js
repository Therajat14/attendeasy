import User from "../../models/User.model.js";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "../../utils/authCookie.util.js";
import { readRegisterInput, sendAuthCookie, toSafeUser } from "./auth.helpers.js";

// The four auth requests. Each one reads the request, does one thing, and
// returns JSON. The supporting pieces live in auth.helpers.js.

// REGISTER
export const register = async (req, res) => {
  // Checked before the form is read, so a duplicate email is reported as a
  // duplicate even when the rest of the form is also wrong.
  const existingUser = await User.findOne({ email: req.body.email });

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const { userDetails, error } = readRegisterInput(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const newUser = await User.create(userDetails);

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
