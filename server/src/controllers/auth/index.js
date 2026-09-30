// One place for the routes to import every auth handler from.
//
//   auth.controller.js  the four requests: register, login, logout, me
//   auth.helpers.js     the safe user shape, the cookie, and the signup form
//
// The HTTP behaviour did not change: same handlers, same status codes, same
// messages.

export { getMe, login, logout, register } from "./auth.controller.js";
