import jwt from "jsonwebtoken";

// The token carries the user's id and role. It lives in an HTTP-only cookie
// for 7 days, so this lifetime has to match TOKEN_AGE_IN_MS in
// authCookie.util.js, otherwise one of the two would expire first.
export function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}
