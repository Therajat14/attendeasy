import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { AUTH_COOKIE_NAME } from "../utils/authCookie.util.js";

// Runs before any protected route.
//
// 1. Reads the token from the cookie.
// 2. Checks the token is genuine and not expired.
// 3. Loads the user from the database so the controller can use req.user.
// 4. Lets the request continue, or replies with 401.
export const protect = async (req, res, next) => {
  const token = req.cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  let userId;

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    userId = decodedToken.id;
  } catch (error) {
    // Token is invalid or expired.
    // Remove it from the browser.
    res.clearCookie(AUTH_COOKIE_NAME);
    return res.status(401).json({ message: "Invalid token" });
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    return res.status(401).json({ message: "User no longer exists" });
  }

  req.user = user;
  next();
};
