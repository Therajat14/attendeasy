// Name of the cookie that holds the login token.
export const AUTH_COOKIE_NAME = "token";

// The token inside the cookie is valid for 7 days.
export const TOKEN_AGE_IN_MS = 7 * 24 * 60 * 60 * 1000;

// Options used every time we set the cookie.
//
// httpOnly: JavaScript in the browser cannot read the cookie, so an XSS
//            attack cannot steal the token.
// sameSite: "lax" stops other websites from sending the cookie along with
//            their own requests (basic CSRF protection).
// secure:    only send the cookie over HTTPS. We skip this in development
//            because localhost is not using HTTPS.
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: TOKEN_AGE_IN_MS,
};
