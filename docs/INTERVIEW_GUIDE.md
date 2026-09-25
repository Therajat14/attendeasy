# Interview Walkthrough

Everything here is taken from the code as it stands. File names and line numbers
are real, so you can open any file and put your finger on the answer.

---

## 1. The shape of the project in one picture

```
Browser (React + JavaScript)
┌───────────────────────────────────────────────────────────────┐
│  pages/           Screens: login, teacher, student, records    │
│      │                                                          │
│  components/      Reusable pieces (Button, Card, QR, sidebar)  │
│      │                                                          │
│  context/         Auth, Theme, Toast  ── app-wide state        │
│      │                                                          │
│  hooks/           useSessions, useStudentAttendance (fetch+poll)│
│      │                                                          │
│  services/api.js  one axios instance ──────────────────────────┼──┐
│  lib/             formatting + friendly error messages          │  │
└───────────────────────────────────────────────────────────────┘  │
                                                                   │  HTTPS, cookies travel
                                                                   │  with the request
┌───────────────────────────────────────────────────────────────┐  │
│  server.js      load .env, connect to Mongo, then listen       │◀─┘
│  app.js         cors, json, cookie parsing, mount the routes   │
│                                                                   │
│  routes/        which URL calls which function                   │
│  middlewares/   protect (sign-in check), rate limit, errors      │
│  controllers/   the actual work                                  │
│  models/        Mongoose schemas (User, Attendance)             │
└───────────────────────────────────────────────────────────────┘
                                                                   │
┌───────────────────────────────────────────────────────────────┐  │
│  MongoDB (Atlas or local)  users + attendance sessions          │◀─┘
└───────────────────────────────────────────────────────────────┘
```

**The one rule to remember:** a request goes `route → middleware → controller
→ model`, and never skips backwards. There is no service layer, no repository,
no dependency injection. `server/README.md` walks through it with a real
example.

---

## 2. How sign-in works, start to finish

### What we store, and where

Before this refactor the JWT was kept in `localStorage` and sent by hand as an
`Authorization: Bearer` header. Now the server puts it in a cookie and the
browser sends it by itself.

```
1. User types email + password on /login
        │
2. Login.jsx calls login() from AuthContext
        │
3. AuthContext does  api.post("/auth/login", input)
        │            api.js has withCredentials: true
        ▼
4. auth.controller.js → login()
        │  a) find the user by email
        │  b) user.comparePassword()  (bcrypt)
        │  c) generateToken(user)      (jwt.util.js)
        │  d) res.cookie("token", token, AUTH_COOKIE_OPTIONS)
        │
5. Browser stores the cookie. It is httpOnly, so page JavaScript
   cannot read it. The response body carries only the safe user fields.
        │
6. AuthContext saves the user in React state
        │
7. Any later request:  browser attaches the cookie automatically
        │
8. app.js cookieParser() turns the Cookie header into req.cookies
        │
9. auth.middleware.js protect() runs on every protected route
        │  a) read req.cookies.token
        │  b) jwt.verify(token, JWT_SECRET)
        │  c) load the user from the database -> req.user
        │  d) next()  ...or reply 401
        │
10. Controller uses req.user.role and req.user._id
```

### The important files

| Step                                      | File                                        | Line       |
| ----------------------------------------- | ------------------------------------------- | ---------- |
| Cookie name, age and options              | `server/src/utils/authCookie.util.js`       | 2, 5, 15   |
| Sign the token                            | `server/src/utils/jwt.util.js`              | 6          |
| Set the cookie                            | `server/src/controllers/auth.controller.js` | 21, 24     |
| Strip the password before replying        | `server/src/controllers/auth.controller.js` | 7          |
| Clear the cookie on sign-out              | `server/src/controllers/auth.controller.js` | 100, 102   |
| Read and verify the cookie                | `server/src/middlewares/auth.middleware.js` | 12, 21, 27 |
| Turn the Cookie header into `req.cookies` | `server/src/app.js`                         | 35         |
| Allow the real origin (not `*`)           | `server/src/app.js`                         | 21, 27     |
| Send cookies from the browser             | `client/src/services/api.js`                | 10         |
| "Who am I?" on page load                  | `client/src/context/AuthContext.jsx`        | 26, 29     |

### Why each cookie flag

| Flag       | Value           | Reason                                                                                                     |
| ---------- | --------------- | ---------------------------------------------------------------------------------------------------------- |
| `httpOnly` | `true`          | Page JavaScript cannot read the token, so a successful XSS cannot steal it                                 |
| `sameSite` | `lax`           | Another website cannot make the browser send our cookie along with its own request (basic CSRF protection) |
| `secure`   | production only | Never send a token over plain HTTP. Off in development because localhost has no HTTPS                      |
| `maxAge`   | 7 days          | Matches the `7d` inside the token, so the cookie and the token expire together                             |

---

## 3. Questions an interviewer is likely to ask

### "Walk me through a protected request."

`GET /api/attendance/live` reaches `attendance.routes.js:19`, which lists
`protect` before `getLiveAttendanceForStudent`. `protect`
(`auth.middleware.js:11`) reads the cookie, verifies it, loads the user into
`req.user`, and calls `next()`. The controller then checks
`req.user.role === "student"` and reads `req.user.course`, `.class` and
`.section` to find sessions for that exact class.

### "Why hit the database on every request when the token already has the id?"

Because we want the _current_ user, not the user as they were at sign-in. If an
account is deleted or its role changes, the change takes effect on the next
request instead of after seven days. The cost is one extra indexed `_id` query
per request, which is cheap. A more advanced version would keep the role in the
token and skip the lookup, accepting that role changes need a fresh sign-in.

### "What stops a student marking a BTech lecture?"

Two checks. `isSameClass` (`attendance.controller.js:27`) compares the signed-in
user's course, class and section against the session and returns 403. Then the
update query itself also filters on `course`, `class` and `section`
(`attendance.controller.js:187-189`), so the database refuses the write even if
the first check were ever removed.

### "What stops a student marking twice?"

The update at `attendance.controller.js:184-202` only matches when the student
is **not already** in the array:

```js
students: {
  $not: {
    $elemMatch: {
      studentId: req.user._id;
    }
  }
}
```

If nothing matches, Mongo returns `null` and we answer 409 "Already marked"
(line 206). The check and the insert happen in one atomic operation, so two
taps arriving at the same moment cannot both succeed. Doing this in two
steps (read, then write) would leave a gap where both requests pass the read.

### "Why not just delete expired sessions on a timer?"

`closeExpiredSessions` (`attendance.controller.js:39`) flips `isActive` to false
whenever data is read, instead of running a background job every minute. It
means no extra process to deploy, and a session can never be _reported_ as live
after its 30 minutes are up, because the reading code just closed it first. The
trade-off is that the collection keeps rows for old sessions, which is what we
want anyway for the history feature.

### "How is the QR link protected?"

The link holds a random 64-character `formToken` (`crypto.randomBytes(32)`), not
the student's id, and it is only useful for one session of one class. A student
still has to be signed in, and still has to belong to the class. The token stops
a stranger from guessing `formToken` values; it is not the only protection.

### "What is the rate limiter, and what is wrong with it?"

`rateLimit.middleware.js` allows 5 marking requests per IP per minute, so one
student cannot spam the endpoint. It is honest about its limits: the counters
live in a JavaScript `Map` in memory (line 1), so a restart clears them and
several server instances would each keep their own. Redis would be the fix in
production, and it is deliberately not here because it would add a dependency
and a second thing to run.

### "How do you know a route is protected?"

By reading the route file. `attendance.routes.js` lists `protect` on every
route it has; if a route is missing it, that is a bug you can see in one place
without reading the controller.

### "Why is there a `getMe` endpoint at all?"

Because the cookie can expire while the tab is still open. On every page load
`AuthContext` calls `/auth/me` (line 29). If the cookie is still valid the
server replies with the user; if not, it replies 401 and the app shows the
login page. Without this, a stale tab would render an empty dashboard until the
first failed action.

---

## 4. Ten parts of this code that look hard, explained plainly

### 1. Why the token is in a cookie and not localStorage

`localStorage` is readable by any script on the page. One bad dependency or one
unescaped description is enough to run `localStorage.getItem("token")` and send
the token somewhere else. A cookie with `httpOnly` is attached to requests by
the browser itself, and page JavaScript cannot see it at all. The trade-off is
CSRF, which `sameSite: "lax"` covers for our case.

### 2. `res.clearCookie` is not a delete

You cannot delete a cookie from the browser. You can only ask the browser to
store it again with an empty value and no expiry, and the browser removes it.
That is all `clearCookie` does.

### 3. The CORS rule that breaks cookie apps

`Access-Control-Allow-Origin: *` cannot be combined with credentials. A browser
rejects it, so "just allow everything" silently breaks every signed-in request.
`app.js:21-32` lists the exact origins we accept, and the browser gets back the
one it asked with.

### 4. `withCredentials: true`

Axios does not send cookies to another origin unless you ask. That one line in
`api.js` is what makes the cookie reach the API from the Vite dev server.

### 5. `useCallback` in the two data hooks

The polling effect calls `load()`, and React runs effects again whenever
anything they use changes. If `load` were a new function on every render, the
timer would be torn down and rebuilt on every render and the page would never
finish a poll cycle. `useCallback` keeps the function identical so the effect
runs once. This is the only place in the project where it is used, and it is
used for this one reason.

### 6. The two loading flags

`loading` shows skeleton rows on the first visit. `refreshing` spins the button
when a person asks for a refresh. The background poll uses neither, so the page
does not flicker every ten seconds. `refresh()` and `refreshSilently()` name
the two cases at the call site instead of `refresh(true)` and
`refresh(false)`.

### 7. `isSameClass` is checked twice

Once in JavaScript for a clear 403 message, and once inside the Mongo query as
the real guarantee. This is not duplicated work for no reason: the first gives
a good error, the second is the thing that actually protects the data if the
first is ever removed by mistake.

### 8. `Number.MAX_SAFE_INTEGER` in the student sort

Students are listed by roll number, and a few records have no roll number.
`rollNo ?? Number.MAX_SAFE_INTEGER` pushes those missing values to the end
instead of letting `undefined` produce `NaN` and break the sort
(`attendance.controller.js:60-66`).

### 9. The password hook in the User model

`userSchema.pre("save")` (`User.model.js:47-52`) hashes the password before it
is stored, but only `if (!this.isModified("password")) return`. Without that
guard, saving a user for an unrelated reason (a name change) would hash the
already-hashed password and lock the account out.

### 10. The error handler takes four parameters

`error.middleware.js:3` receives `(error, req, res, next)` and never uses `req`
or `next`. Express identifies an error handler by the _number_ of parameters, so
the fourth one has to stay or Express would treat the function as ordinary
middleware and the error would never reach it.

---

## 5. "Why did we do it this way?"

**Why move to cookies?**
The token was readable by any script on the page. `httpOnly` removes that class
of problem entirely, and it also deletes code: the interceptors, the
`localStorage` helpers and the client-side user normaliser are all gone.

**Why keep `protect` as middleware instead of checking inside each controller?**
One place decides who is signed in. A new route is protected by adding one word
to the route file, and you can audit every protected route by reading one file.

**Why does the middleware load the user from the database?**
So a deleted account stops working immediately rather than in seven days.

**Why is there no service layer?**
There are two features. A service layer would add an indirection with nothing to
hide, and the request path would become five files instead of four. The rule
"a controller may import a model, a model imports nothing of ours" is easy to
remember and easy to check.

**Why `router.get("/:id")` last in the attendance routes?**
Express matches in order, so `/:id` would swallow `/date` and `/live`. Order in
`attendance.routes.js` is not decoration; it is what makes the specific routes
work.

**Why poll every 8-10 seconds instead of WebSockets?**
The roster is small, a few seconds of delay is fine, and polling survives a
dropped connection with no recovery logic. WebSockets would be the right answer
if the delay became a problem, and this code is structured so only the two hook
files would change.

**Why are there no tests in the repository?**
The project was verified with three scripts that drive the real app: 38 API
checks, 20 browser checks for the cookie flow, and 24 page checks across both
roles. They are kept outside `src/`. If this were going to production I would
move them into a test folder and run them on every commit, because the checks
that matter most here are the permission ones, and those are exactly the ones
that break quietly.

---

## 6. What I know is still not right

Saying this out loud in an interview is a strength, not a weakness.

1. **`StudentHistory.jsx:263` compares a count against a percentage.** The "Good
   to know" card tests `subject.count < LOW_ATTENDANCE_THRESHOLD`, where the
   count is "lectures attended in this subject" and the threshold is 75, meant
   as a percentage. Any subject with fewer than 75 lectures attended shows the
   warning, so a student with 3 out of 3 is told to attend more. The progress bar
   a few lines above (line 228) uses `share`, a real percentage, and is correct.
   It was left as-is because fixing it changes what users see, so it needs a
   decision rather than a quiet patch.
2. **The rate limiter is per process and in memory.** A restart clears it, and
   more than one server instance would each allow the full quota.
3. **Subjects are plain text.** `lectureName`, `course`, `class` and `section`
   are strings, so "BCA" and "bca " are two different classes. Real
   normalisation would need a lookup table, which is a schema change.
4. **Session expiry is lazy.** Old rows stay in the collection and are only
   flagged closed when read.
5. **The build is one 514 kB chunk.** Fine for a demo, worth code splitting if
   this grew.
6. **`cr` and `admin` roles are half-wired.** They can sign in and are routed to
   a dashboard, but there are no class-rep tools behind them.
