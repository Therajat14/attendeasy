// Name of the cookie that holds the login token.
export const AUTH_COOKIE_NAME = "token";

// The token inside the cookie is valid for 7 days.
export const TOKEN_AGE_IN_MS = 7 * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

// SameSite decides which sites may send this cookie along with a request.
//
// A site is the domain, not the full address: localhost:5173 and localhost:5000
// are the same site, which is why `lax` works in development. Once the two are
// deployed separately (frontend on one host, API on another) they are two
// different sites, and the browser then refuses to attach a `lax` cookie to an
// API call. Sign-in appears to work because the response body still carries the
// user, but the very next request arrives with no cookie and comes back 401.
//
// `none` is the only value that lets the cookie ride along on a cross-site
// request. Set COOKIE_SAME_SITE=lax when both halves really are served from one
// site and you would rather not require HTTPS.
//
// Browsers only accept `none` together with `secure`, so that is not optional.
const sameSite = (process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax"))
  .trim()
  .toLowerCase();

// Options used every time we set the cookie.
//
// httpOnly: JavaScript in the browser cannot read the cookie, so an XSS
//            attack cannot steal the token.
// secure:    only send the cookie over HTTPS. We skip this in development
//            because localhost is not using HTTPS.
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite,
  secure: sameSite === "none" ? true : isProduction,
  maxAge: TOKEN_AGE_IN_MS,
};
