# Architecture

What AttendEasy is actually made of today, and how a request travels through
it. Every file path here is real and every line number refers to commit `1e6cc05`.

If you want the reasoning behind the choices rather than the shape of the code,
read `SYSTEM_DESIGN.md`. This document is the map.

---

## 1. What it is

A college attendance system. A teacher starts a live session, which produces a
QR code; students scan it and mark themselves present. Sessions expire on their
own, and every student sees their own attendance history.

Two things shape almost every decision in the codebase:

1. **A mark is recorded against the signed-in student, never against whoever
   scanned the code.** The QR carries a token, not an identity.
2. **The project is meant to be read and explained.** So: plain JavaScript, no
   TypeScript, no framework abstractions, explicit branching, and comments that
   explain _why_ rather than restate the code.

---

## 2. The stack

| Layer      | Choice                                     | Why this and not something else                         |
| ---------- | ------------------------------------------ | ------------------------------------------------------- |
| Build      | Vite 7                                     | Fast, and the config is one file                        |
| UI         | React 19, React Router 7                   | The obvious choice, now with data routers               |
| Styling    | Tailwind CSS 4 via `@tailwindcss/vite`     | No stylesheet to maintain; see `client/src/index.css`   |
| Animation  | Framer Motion 12                           | Used sparingly, for page transitions                    |
| Icons      | lucide-react                               | Tree-shakeable, consistent stroke widths                |
| QR         | `qrcode.react` (`QRCodeSVG`)               | Renders SVG, so it stays sharp on a projector           |
| HTTP       | axios                                      | One configured instance in `client/src/services/api.js` |
| API        | Express 5                                  | Small and boring, which is the point                    |
| Database   | MongoDB via Mongoose 9                     | Schema validation in the model layer                    |
| Auth       | `jsonwebtoken` in an HTTP-only cookie      | Nothing sensitive in `localStorage`                     |
| Hashing    | `bcryptjs`                                 | Pure JS, so no native build step                        |
| Logging    | `morgan` plus a hand-rolled request logger | `app.js` uses both                                      |
| Processes  | `node:cluster`                             | One box, many cores, no extra infrastructure            |
| Containers | Docker, multi-stage build, Compose         | `docker compose up` is the whole install                |

JavaScript everywhere, `"type": "module"` on both sides. No build step for the
server at all — Node runs the source directly.

---

## 3. System shape

```
                    ┌──────────────────────────────────────────┐
   browser          │  one container, one origin (port 8080)    │
   ────────────────▶│                                          │
                    │  Express serves BOTH:                    │
   GET /teacher/…   │    • the built React app (static files)   │
   GET /api/…       │    • the JSON API                        │
                    └───────────────┬──────────────────────────┘
                                    │
                    ┌───────────────▼──────────────────────────┐
                    │  primary process  (server.js)            │
                    │  forks N workers, restarts dead ones     │
                    │  serves nothing itself                   │
                    └───────────────┬──────────────────────────┘
                                    │  node:cluster shares one
                                    │  listening socket
             ┌──────────────┬───────┴────────┬──────────────┐
             ▼              ▼                ▼              ▼
          worker 1      worker 2        worker 3   …  worker N
          own app       own app         own app        own app
          own Mongo     own Mongo       own Mongo      own Mongo
          connection    connection      connection     connection
             └──────────────┴────────────────┴──────────────┘
                                    │
                    ┌───────────────▼──────────────────────────┐
                    │  MongoDB                                  │
                    │    users        29 in the demo seed      │
                    │    attendances  13 in the demo seed      │
                    └──────────────────────────────────────────┘
```

One process serves the frontend and the API, so there is no CORS in the common
case and no second deployment to manage. A split deployment is still supported:
`server/src/app.js` looks for `client/dist`, and if it is not there the API
runs on its own and says hello at `/`.

The cluster exists because the API is I/O-bound (it waits on Mongo), so one
core does not go far. Nodemon and `npm run dev` deliberately stay on a single
process — see `shouldStartCluster` in `server/src/server.js`.

---

## 4. Repository layout

```
attendeasy/
├── docker-compose.yml            # the whole stack: app + mongo
├── Dockerfile                    # 3 stages: build client, prod deps, runtime
├── package.json                  # one script that runs both halves
│
├── client/
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── src/
│       ├── main.jsx              # mounts React
│       ├── App.jsx               # providers only
│       ├── routes/AppRoutes.jsx  # every URL in the app
│       │
│       ├── context/              # app-wide state
│       │   ├── AuthContext.jsx     signed-in user, login/logout
│       │   ├── ThemeContext.jsx    light/dark, stored in localStorage
│       │   └── ToastContext.jsx    transient notifications
│       │
│       ├── hooks/                # data fetching
│       │   ├── useSessions.js         teacher's list, polls every 10s
│       │   └── useStudentAttendance.js student's view, polls every 8s
│       │
│       ├── services/api.js       # the single axios instance
│       ├── lib/                  # pure helpers, no React
│       │   ├── attendance.js       percentage → colour
│       │   ├── constants.js        courses, years, sections, roles
│       │   ├── errors.js           axios error → a sentence a human can read
│       │   └── format.js           dates, countdowns, grouping
│       │
│       ├── pages/                # one file per screen
│       ├── layouts/              # Auth, Dashboard, Marketing shells
│       └── components/
│           ├── attendance/         AttendanceQRCode, QRPresentation
│           ├── common/             sidebar, topbar, logo, nav
│           └── ui/                 Button, Card, Field, Badge, Spinner …
│
├── server/
│   ├── docker-entrypoint.sh      # wait for mongo, seed once, exec node
│   └── src/
│       ├── server.js             # process entry: primary vs worker
│       ├── app.js                # the Express app: middleware + routes
│       │
│       ├── config/
│       │   ├── env.js              loads server/.env (imported first)
│       │   └── database.js         mongoose connect / disconnect
│       │
│       ├── routes/               # URL → function
│       ├── middlewares/           # protect, rate limit, error handler
│       ├── controllers/           # the actual work
│       ├── models/                # Mongoose schemas
│       ├── utils/                 # jwt, auth cookie
│       └── seed/seed.js          # deterministic demo data
│
└── docs/
```

The server is the standard Express four-layer split: route → middleware →
controller → model. There is no service layer, because with two controllers
that would be a layer of indirection and nothing else.

---

## 5. The backend, layer by layer

### 5.1 Entry: primary and worker

`server/src/server.js` is the only entry point, and it runs in one of two modes.

`getWorkerCount()` reads `WEB_CONCURRENCY`, which hosting platforms already set:

| Value           | Workers                                   |
| --------------- | ----------------------------------------- |
| `1`             | 1 — no cluster, just this process         |
| `4`             | 4                                         |
| `auto` or unset | one per CPU (`os.availableParallelism()`) |
| anything else   | 1, so a typo cannot take the site down    |

A cluster only starts when it is not Windows, more than one worker was asked
for, **and** either `NODE_ENV=production` or the platform set `WEB_CONCURRENCY`.
That last condition is why `npm run dev` stays on one process.

`createWorker()` is the one place a worker is forked, and it always passes
`WORKER_COUNT`. That is not cosmetic: the rate limiter divides its allowance by
the worker count, so without it every worker would think it was alone and the
site would allow `5 × workers` requests a minute. See
`server/src/middlewares/rateLimit.middleware.js`.

**Shutdown** is graceful in both modes. A worker stops accepting connections,
lets in-flight requests finish, closes Mongo, and exits. The primary kills every
worker on `SIGTERM` and exits once the last one is gone. Both have a
`SHUTDOWN_TIMEOUT_MS` escape hatch, because `server.close()` waits for keep-alive
connections that may never end.

### 5.2 The Express app

`server/src/app.js`, in the order the middleware runs:

| #   | Line | What it does                                                     |
| --- | ---- | ---------------------------------------------------------------- |
| 1   | 17   | Logs `METHOD /url` for every request, handy while learning       |
| 2   | 40   | CORS, echoing back only the origins listed in `FRONTEND_URL`     |
| 3   | 49   | `express.json()` — parses request bodies                         |
| 4   | 52   | `cookieParser()` — turns the `Cookie` header into `req.cookies`  |
| 5   | 53   | `morgan("dev")` — a second, prettier request log                 |
| 6   | 55   | Mounts `/api/auth`                                               |
| 7   | 56   | Mounts `/api/attendance`                                         |
| 8   | 68   | If `client/dist` exists: serves the built frontend               |
| 9   | 70   | …and any other GET that is not an API route answers `index.html` |
| 10  | 91   | `errorHandler` — the last stop, so it can catch everything above |

CORS cannot be `"*"` here, because the browser forbids that combination with
credentials. `FRONTEND_URL` accepts a comma-separated list, and the server echoes
back whichever origin the browser asked from.

The SPA fallback at line 70 is what makes client-side routing work on a hard
refresh: React Router owns the page URLs, so `/teacher/dashboard` has to answer
with `index.html` and let the router decide what to render.

### 5.3 Authentication

Sign-in is the only part of the system with a security design worth spelling out.

1. `POST /api/auth/login` finds the user, compares the password with
   `user.comparePassword()` (bcrypt), and signs a JWT holding `{ id, role }`
   (`server/src/utils/jwt.util.js`).
2. The token goes into an **HTTP-only cookie**, not into `localStorage`. Page
   scripts cannot read it, so an XSS bug cannot steal it.
3. `protect` (`server/src/middlewares/auth.middleware.js`) verifies the cookie,
   reloads the user from the database, and puts it on `req.user`. Controllers
   never trust anything from the request body about who the caller is.
4. The JWT lives 7 days; the cookie `Max-Age` is set to match, or one would
   expire before the other.

Cookie options live in `server/src/utils/authCookie.util.js`. In production the
defaults are `SameSite=None; Secure`, which is what lets the cookie reach an API
on a different site. Compose overrides both to `SameSite=Lax` and
`COOKIE_SECURE=false`, because the single-container setup is one origin over
plain HTTP on a LAN.

### 5.4 Attendance

`server/src/controllers/attendance.controller.js` is the heart of the app.

**Starting a session** generates a 32-byte random `formToken`
(`crypto.randomBytes`), which becomes the URL the QR encodes. A teacher may run
one session at a time: if one is already open, the API answers `409` and hands
back the open session rather than creating a second.

**Expiry is lazy.** `closeExpiredSessions()` (line 60) flips `isActive` to
`false` for anything past `expiresAt`, and is called at the top of five
handlers. There is no background job, so a session nobody looks at keeps saying
`isActive: true` in the database — harmless, because `startAttendanceSession`
filters on `expiresAt > now` and `markAttendance` checks `expiresAt` itself. A
background sweeper is the planned fix; see
`docs/QR_ROTATION_AND_SESSION_EXPIRY.md` section 4.1.

**Marking** is one `findOneAndUpdate` doing two jobs at once (line 229):

```js
{
  _id, course, class, section,     // the class must match the caller's
  isActive: true,                  // still open
  expiresAt: { $gt: new Date() },  // not past its time
  students: {                      // …and the caller is not on the list yet
    $not: { $elemMatch: { studentId: req.user._id } },
  },
}
// → $push: { students: { studentId: req.user._id, submittedAt } }
```

Because the filter and the insert are the same atomic operation, two taps at
once cannot both land. The loser gets `409 Already marked`. This holds no matter
what the client does, which is the point: the roster is decided by the database,
not by the browser.

`isSameClass()` is checked first and returns `403` for anyone outside the
session's course, class and section.

### 5.5 Rate limiting

`formSubmissionRateLimiter` allows 5 requests a minute per IP on
`POST /mark/:token` only. The count lives in a `Map` in the worker, and
`allowedPerWorker = ceil(5 / WORKER_COUNT)`, so the limit for the whole cluster
stays 5 rather than growing with the worker count.

Two honest caveats, both documented in the code and in
`docs/DEVICE_IDENTITY_AND_PROXY_PREVENTION.md` section 4: the storage is
per-process, so a restart clears the counters; and an entire lecture hall
usually shares one NAT address, so the per-IP limit is not really per student.
This is a deliberate trade-off — a shared counter would need Redis.

---

## 6. The frontend

`main.jsx` mounts `App`, which is nothing but providers. `AppRoutes.jsx` then
owns every URL in the product:

| URL                  | Page             | Who can see it                                  |
| -------------------- | ---------------- | ----------------------------------------------- |
| `/`                  | Landing          | anyone                                          |
| `/login`, `/signup`  | Login, Signup    | anyone, but only when signed out                |
| `/form/:token`       | StudentForm      | anyone signed in; needs the token               |
| `/dashboard`         | RoleRedirect     | anyone signed in; sends them to the right place |
| `/teacher/dashboard` | TeacherDashboard | `teacher`, `admin`                              |
| `/teacher/sessions`  | TeacherSessions  | `teacher`, `admin`                              |
| `/student/dashboard` | StudentDashboard | `student`, `cr`                                 |
| `/student/history`   | StudentHistory   | `student`, `cr`                                 |
| anything else        | NotFound         | anyone                                          |

Guarding happens twice on purpose. `ProtectedRoute` hides the page in the
browser for a good experience, but the real check is `protect` on the server,
because anything in a browser can be bypassed by anyone with devtools.

**State** lives in three contexts: `AuthContext` (the user, and
`checkIfLoggedIn()` on mount), `ThemeContext` (light/dark, remembered in
`localStorage`), and `ToastContext` (transient messages).

**Data fetching is polling, not WebSockets.** `useSessions` refetches every 10
seconds; `useStudentAttendance` every 8. The reason is in
`useSessions.js:19-21` — `useCallback` keeps the loader's identity stable so the
interval is not torn down and recreated on every render. Polling was the right
call for a classroom where the interesting moment is a name appearing on a list;
a socket would only remove up to 8 seconds of lag from a page that is not
mission-critical in real time.

**The QR** is the one component worth pointing at. `AttendanceQRCode` takes a
`value` and renders a `<QRCodeSVG>`; that is all it does, which is why adding
rotating links later needs no change to it. `QRPresentation` wraps it for
projector mode — fullscreen, closes on Escape, and locks body scroll while open.

---

## 7. Data model

### User — `server/src/models/User.model.js`

| Field      | Type   | Notes                               |
| ---------- | ------ | ----------------------------------- |
| `name`     | String | required                            |
| `email`    | String | required, unique, lowercased        |
| `password` | String | required; bcrypt-hashed before save |
| `role`     | String | `student`, `teacher`, `cr`, `admin` |
| `rollNo`   | Number | ≥ 1, **required for students only** |
| `course`   | String | required for students only          |
| `class`    | String | required for students only          |
| `section`  | String | required for students only          |
| timestamps |        | `createdAt`, `updatedAt`            |

The four student-only fields share one `requiredForStudents()` helper, which
Mongoose calls with `this` bound to the document being saved, so it can read
`this.role`. Password hashing is a `pre("save")` hook that only runs when the
field actually changed.

### Attendance — `server/src/models/Attendance.model.js`

| Field                                       | Type     | Notes                                      |
| ------------------------------------------- | -------- | ------------------------------------------ |
| `teacherId`                                 | ObjectId | ref User, indexed                          |
| `lectureName`, `course`, `class`, `section` | String   | all required, trimmed                      |
| `date`                                      | Date     | defaults to now, indexed                   |
| `formToken`                                 | String   | required, **unique**, indexed              |
| `expiresAt`                                 | Date     | required — the 30-minute clock             |
| `isActive`                                  | Boolean  | defaults true, indexed                     |
| `students`                                  | Array    | `{ studentId, submittedAt }`, no own `_id` |

Indexes worth knowing about:

```js
{ teacherId: 1, date: -1 }                            // a teacher's list
{ teacherId: 1, isActive: 1 }                         // "do I have one open?"
{ course: 1, class: 1, section: 1, isActive: 1 }      // a student's live list
```

`formToken` is unique so two sessions can never share a link.

---

## 8. The API

All under `/api`. Everything except register, login and logout needs the cookie.

| Method  | Path                          | Who       | Does                                     |
| ------- | ----------------------------- | --------- | ---------------------------------------- |
| `POST`  | `/auth/register`              | anyone    | Creates an account, sets the cookie      |
| `POST`  | `/auth/login`                 | anyone    | Checks the password, sets the cookie     |
| `POST`  | `/auth/logout`                | anyone    | Clears the cookie                        |
| `GET`   | `/auth/me`                    | signed in | The current user                         |
| `POST`  | `/attendance/start`           | teacher   | Opens a session, or `409` if one is open |
| `POST`  | `/attendance/mark/:token`     | student   | Records one mark — rate limited          |
| `PATCH` | `/attendance/:id/end`         | teacher   | Closes a session early                   |
| `GET`   | `/attendance`                 | teacher   | Every session for this teacher           |
| `GET`   | `/attendance/date/:date`      | teacher   | Sessions on one day, `YYYY-MM-DD`        |
| `GET`   | `/attendance/:id`             | teacher   | One session with its roster              |
| `GET`   | `/attendance/live`            | student   | Open sessions, each with `hasMarked`     |
| `GET`   | `/attendance/student/history` | student   | Every session this student attended      |

Ownership is enforced in every teacher query — `teacherId: req.user._id` — so one
teacher cannot read or close another's session; it answers `404`.

Status codes carry meaning here and are worth keeping consistent: `403` for the
wrong role or the wrong class, `404` for missing or not yours, `409` for a
duplicate mark or an already-open session, `410` for a link that has expired.

---

## 9. Configuration

| Variable                    | Where              | Default                 | Notes                                                      |
| --------------------------- | ------------------ | ----------------------- | ---------------------------------------------------------- |
| `PORT`                      | server             | `5000`                  | `8080` in Compose                                          |
| `MONGO_URI`                 | server             | — **required**          | Atlas or local                                             |
| `JWT_SECRET`                | server             | — **required in prod**  | Signs the login token                                      |
| `FRONTEND_URL`              | server             | `http://localhost:5173` | Comma-separated for CORS. Also used to build the form link |
| `NODE_ENV`                  | server             | —                       | `production` enables the cluster and strict cookies        |
| `WEB_CONCURRENCY`           | server             | `auto`                  | `1` disables the cluster                                   |
| `SHUTDOWN_TIMEOUT_MS`       | server             | `10000`                 | Give up waiting this long on shutdown                      |
| `WORKER_COUNT`              | server, internal   | set by the primary      | **Do not set by hand**                                     |
| `COOKIE_SAME_SITE`          | server             | `none` in prod          | `lax` for one-origin setups                                |
| `COOKIE_SECURE`             | server             | `true` in prod          | `false` only for plain-HTTP LAN testing                    |
| `VITE_API_BASE_URL`         | client, build time | `/api`                  | Baked in by Vite, so it must be set at build               |
| `AUTO_SEED`                 | Compose            | `true`                  | Seed demo data on first boot                               |
| `MONGO_MAX_ATTEMPTS`        | Compose            | `30`                    | Entrypoint retries for the database                        |
| `MONGO_RETRY_DELAY_SECONDS` | Compose            | `2`                     | …with this pause                                           |

`server/src/config/env.js` is imported **first** in `server.js`, before `app.js`.
`app.js` and `authCookie.util.js` both read `process.env` while they are being
imported, and ES modules evaluate imports in written order, so anything that
loads the environment has to come first or those values would be read too early.

---

## 10. Build, run, deploy

```bash
# development — two terminals
cd server && npm run dev          # nodemon, single process, port 5000
cd client && npm run dev          # Vite, port 5173, proxies /api to 5000

# production, one container
docker compose up --build         # http://localhost:8080
```

`docker compose up --build` is the whole install. It:

1. builds the client in stage 1 and keeps only `dist`;
2. installs production-only server dependencies in stage 2;
3. copies both into a slim runtime image with `curl` for the healthcheck.

On start, `server/docker-entrypoint.sh` waits for Mongo, seeds demo data **only
if the database has no users**, and then `exec`s Node so the API becomes PID 1
and receives `SIGTERM` directly. Without that `exec`, `docker stop` would kill
the shell and the graceful shutdown in `server.js` would never run.

The layout matters: `app.js` resolves the frontend at `../../client/dist`, so the
server has to stay at `/app/server` and the built client at `/app/client/dist`.

Seeding is idempotent by design. `npm run seed` refuses to run against a database
that already has users unless you pass `--force`, so it cannot wipe real data by
accident.

---

## 11. Known rough edges

Documented so they are not mistaken for intended behaviour.

**The `cr` role does not work end to end.** The frontend offers "Class
Representative" at sign-up (`client/src/lib/constants.js`) and routes them to the
student dashboard (`AppRoutes.jsx`), but every controller checks
`role === "teacher"` or `role === "student"` exactly, so a class rep who signs up
gets `403` from all of them. Verified: register `201`, then `403` on
`/attendance/live`, `/attendance/student/history` and `/attendance`. Either the
role needs real permissions or it should come off the sign-up list.

**`/auth/me` and `/auth/login` return different shapes.** `/auth/login` and
`/auth/register` wrap the user as `{ user: … }`; `/auth/me` returns the user
object on its own. The frontend handles both (`AuthContext.jsx:30` versus `:45`),
so nothing is broken, but the API is inconsistent.

**`trust proxy` is not set.** `rateLimit.middleware.js` falls back to
`x-forwarded-for`, but `app.js` never calls `app.set("trust proxy", …)`, so
`req.ip` is always populated and that branch can never run. Behind a load
balancer the limiter would see one address for everybody. Setting
`app.set("trust proxy", 1)` fixes it.

**Expiry is lazy, so the database can disagree with reality** for a session
nobody has read since it expired. See `docs/QR_ROTATION_AND_SESSION_EXPIRY.md`.

**The rate limit is per IP, and a class shares one IP.** See section 5.5.

---

## 12. Where to go next

| If you want to…                         | Start at                                       |
| --------------------------------------- | ---------------------------------------------- |
| Explain the project in an interview     | `docs/INTERVIEW_GUIDE.md`                      |
| Log in and click around                 | `docs/DEMO_CREDENTIALS.md`                     |
| Understand a choice, not just the shape | `SYSTEM_DESIGN.md`                             |
| Stop QR screenshots working             | `docs/QR_ROTATION_AND_SESSION_EXPIRY.md`       |
| Stop proxy attendance                   | `docs/DEVICE_IDENTITY_AND_PROXY_PREVENTION.md` |
