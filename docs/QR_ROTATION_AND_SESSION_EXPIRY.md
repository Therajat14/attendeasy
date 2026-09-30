# Rotating the QR Link and Expiring Old Sessions

A plan for two related changes. **Nothing here is implemented yet** — this
document is the design, so it can be agreed on before any code is written.

|                |                                                              |
| -------------- | ------------------------------------------------------------ |
| **Feature 1**  | The attendance link and QR code renew every 30 seconds         |
| **Feature 2**  | The previously started session expires on its own, unattended  |

Line numbers refer to commit `8acd9b6`.

---

## 1. Why we want this

Today a teacher starts a session, and the link
`https://frontend/form/<formToken>` stays valid for the full 30 minutes
(`SESSION_DURATION_MINUTES` at `server/src/controllers/attendance/attendance.helpers.js:7`).

That is a long time for a URL that is meant to be shown on a projector. If
somebody photographs the QR code, or forwards the link on WhatsApp, that copy
works for anyone in the right class for the rest of the half hour. This is the
"proxy attendance" problem: your friend marks your attendance for you.

Two changes push back on it:

- **Feature 1** makes a photograph worthless after 30 seconds.
- **Feature 2** makes sure a session nobody is looking at still closes itself.

### What this does not do

Be clear about this before promising anyone anything. A friend standing next to
you in the room can still scan within the same 30-second window. Rotation
shrinks the window; it does not prove identity. No link scheme does. If someone
is physically present, the thing that actually catches it is a teacher watching
the live roster, which we already render.

---

## 2. The two clocks

The most important idea in this document. There are **two different deadlines**,
and they must not be confused in code, in the API, or in the UI.

| Clock           | How long            | What it governs                    | Where it lives             |
| --------------- | ------------------- | ---------------------------------- | -------------------------- |
| **Session**     | 30 minutes          | Is this lecture still being taken? | `expiresAt` on the session |
| **Link**        | 30 seconds          | Is this particular URL still good?  | `linkIssuedAt` (to add)    |

They stack. A link dies every 30 seconds, but the session behind it stays alive
for 30 minutes, so students simply scan the next QR code. A 30-second session
would be pointless — hence two clocks rather than shortening the existing one.

---

## 3. Feature 1 — renewing the link and QR every 30 seconds

### 3.1 The design decision

There are two ways to make old links stop working. Pick one, not both.

**Option A — overwrite the stored token (recommended).**

Every 30 seconds the teacher's page asks the server for a fresh link. The server
generates a new random token and writes it over the old one on the session
document.

Why this is the simplest correct answer: the lookup in `markAttendance` is an
exact match on `formToken` (`student.controller.js:18`). Overwriting the
field therefore **invalidates the previous token automatically** — there is no
second list of valid tokens, no revocation table, and nothing to forget to
clean up. A link that is 31 seconds old simply stops matching a document.

**Option B — stateless signed token.**

Skip the database. Encode `sessionId`, a time bucket
(`floor(Date.now() / 30000)`), and an HMAC of the two. All 16 workers share
`JWT_SECRET`, so any worker can verify any token with no lookup and no write.

This is the cleverer option and it saves one small write every 30 seconds per
session. It is not worth it here: it adds a signing scheme that can be got
wrong, introduces clock-skew handling, and changes the lookup from "find by
token" to "find by id". We already need the document, because `markAttendance`
must read `course`, `class`, `section` and `isActive` anyway.

**Decision: Option A.**

### 3.2 Server changes

**Step 1 — a small utility, so the lifetime is written down once.**

New file `server/src/utils/formToken.util.js`:

```js
import crypto from "node:crypto";

// How long one link stays usable before the QR code has to change.
export const LINK_LIFETIME_SECONDS = 30;

// A fresh, unguessable token. 32 random bytes as hex is what we use today.
export function mintFormToken() {
  return crypto.randomBytes(32).toString("hex");
}
```

Move the `crypto.randomBytes(32).toString("hex")` currently sitting at
`session.controller.js:51` into this file, and replace it with a call to
`mintFormToken()`.

**Step 2 — remember when the current link was handed out.**

In `server/src/models/Attendance.model.js`, next to `expiresAt` on line 34, add:

```js
linkIssuedAt: { type: Date, required: true, default: Date.now },
```

`formToken` stays exactly as it is. Keep `unique: true` — it is still doing its
job of making sure two sessions can never share a link.

**Step 3 — an endpoint that issues the next link.**

New handler in `session.controller.js`, next to the other exports:

```js
// A NEW LINK FOR THE CURRENT SESSION (the QR code renews every 30 seconds)
export const refreshAttendanceLink = async (req, res) => {
  const session = await Attendance.findOne({
    _id: req.params.id,
    teacherId: req.user._id, // a teacher can only rotate their own session
  });

  if (!session) {
    return res.status(404).json({ message: "Attendance session not found" });
  }

  // A closed session has no link to give.
  if (!session.isActive || session.expiresAt <= new Date()) {
    return res
      .status(410)
      .json({ message: "This attendance session has already closed" });
  }

  session.formToken = mintFormToken();
  session.linkIssuedAt = new Date();
  await session.save();

  return res.json({
    formUrl: buildFormUrl(session.formToken),
    linkExpiresAt: new Date(session.linkIssuedAt.getTime() + LINK_LIFETIME_SECONDS * 1000),
  });
};
```

Two naming details that matter:

- The response field is `linkExpiresAt`, **not** `expiresAt`. `expiresAt` already
  means the 30-minute session clock, and overloading it is how you get a
  countdown on the teacher screen that jumps from 30 minutes to 30 seconds.
- `linkExpiresAt` is informational. The server never trusts it — it re-derives
  freshness from `linkIssuedAt`. A student can hold that timestamp forever; it
  buys them nothing.

**Step 4 — register the route.**

In `server/src/routes/attendance.routes.js`:

```js
router.post("/:id/refresh-link", protect, refreshAttendanceLink);
```

Safe to add anywhere: the existing `router.get("/:id")` on line 23 is one path
segment, and `/:id/refresh-link` is two, so they cannot collide. Use `POST`
rather than `GET` because it writes, and a browser prefetch or a link scanner
must not be able to trigger a rotation.

**Step 5 — reject stale links in `markAttendance`.**

This is the step that actually prevents proxying. It has to be behind a feature
flag, and the reason is not optional politeness.

`linkIssuedAt` defaults to the moment the session was created, but a session
lives 30 minutes. So if you add this check before anything rotates, **every link
is instantly stale and marking stops working for the whole class.** The endpoint
and the field are safe to ship first; this check is not, because until the
teacher's page starts rotating, nothing ever issues a fresh token.

Add it inside `markAttendance` (`student.controller.js:12`), after the
session-expired check and before the class check:

```js
const LINK_LIFETIME_MS = LINK_LIFETIME_SECONDS * 1000;

// A few seconds of slack, so a phone with a slightly slow clock is not
// locked out of a code it scanned in time.
const CLOCK_SLACK_MS = 5000;

const linkIsStale =
  Date.now() - attendance.linkIssuedAt.getTime() > LINK_LIFETIME_MS + CLOCK_SLACK_MS;

// Off by default, so the check and the rotation that feeds it can never be
// half-deployed. Turn it on at the same time as the teacher-side timer.
if (LINK_ROTATION_ENABLED && linkIsStale) {
  return res.status(410).json({
    message: "This QR code has expired. Scan the code on screen again.",
    code: "LINK_EXPIRED",
  });
}
```

`code: "LINK_EXPIRED"` is new and deliberate. The existing 410 on line 211
means "the session is over, give up" and the student should go home. This 410
means "this code is old, look up and scan again" and the student should be
offered a retry. Same status code, different meaning, so the client needs a way
to tell them apart — hence the `code`.

Put this check **after** the session check on purpose. If a session is over, a
stale link is a side issue and the student should hear about the real reason.

### 3.3 Client changes

**The teacher's page drives the rotation**, not the server. The teacher's own
browser is already open and polling, and it stops the rotation the moment the
teacher closes the tab — which is correct, because at that point nobody is
scanning.

In `client/src/pages/TeacherDashboard.jsx`:

- Add a `currentFormUrl` state, initialised from `activeSession.formUrl` (the
  property is built at `attendance.serializer.js:51` and consumed at
  `TeacherDashboard.jsx:428` and `:435`).
- Add a `useEffect` keyed on `activeSession?.id` that calls
  `api.post(`/attendance/${activeSession.id}/refresh-link`)` every 30 seconds and
  stores the returned `formUrl` in that state.
- Pass `currentFormUrl` to both `AttendanceQRCode` and `QRPresentation` instead
  of `activeSession.formUrl`.
- Clear the interval when `activeSession` changes or becomes null, so you never
  rotate a session that is no longer on screen.
- Show the link countdown next to the existing session countdown. That file
  already has a one-second clock at `TeacherDashboard.jsx:61-64` and derives
  `remaining` from `getRemainingTime` on line 108, so this is a small addition
  next to existing work.

`AttendanceQRCode.jsx` itself needs **no change at all**. It takes `value` and
renders a `<QRCodeSVG value={value}>` (line 12-20), so a new `value` re-renders
a new code for free.

**Do not put the rotation timer in `useSessions.js`.** That hook polls every
10 seconds (`useSessions.js:6`) and is enabled for every page that shows
sessions. Rotation belongs to the live-session card, and 10 seconds is not the
cadence we want.

### 3.4 The problem with the Copy Link button

`TeacherDashboard.jsx:463` copies `activeSession.formUrl` to the clipboard. After
this change, that copy is dead in 30 seconds, which makes the button close to
useless and quietly annoying for a teacher who pastes it into a class group.

Two ways out. The second is the one worth building.

**Option 1 — leave it, and relabel the button** as "Copy current code" with a
warning. Honest, but the teacher has to re-copy every 30 seconds.

**Option 2 (recommended) — a stable entry page.**

Give students a URL that never changes and hands out whatever the current token
is:

```
https://frontend/form/session/<sessionId>
```

The `/form/:token` route already exists
(`client/src/routes/AppRoutes.jsx:43`). Add a sibling route, and a small
controller endpoint that looks up the session by id, checks it is active, mints
or reuses a current token, and returns it. The student's browser then lands on
the real form with a live token.

The link in the WhatsApp group never dies. What dies is the *token inside it*,
and it is regenerated server-side the moment the student opens the page. A photo
of the QR is still useless, because the QR encodes the raw token, not this URL.

Note that this endpoint is a token-minting endpoint, so it needs the same
ownership and liveness checks as `refreshAttendanceLink`, and it must not be
behind the form submission rate limiter (see section 5).

### 3.5 What the student sees

Nothing changes for the happy path: scan, page opens, tap once, done. The only
new state is the failure. When `code === "LINK_EXPIRED"`:

- `client/src/pages/StudentForm.jsx:51` is the single call site
  (`api.post(`/attendance/mark/${token}`)`). Catch the 410 there, read `code` off
  the error body, and show a "Scan the new code on screen" message with a
  Retry button, rather than the current generic failure.

`getErrorMessage` in `client/src/lib/errors.js` is where that message should be
phrased, so it reads like the rest of the app.

---

## 4. Feature 2 — the previously started session expires by itself

This one is ambiguous, so here are the two readings. Both are worth having and
they are independent of each other.

### 4.1 Reading A — the background sweeper (recommended first)

**What exists today.** `closeExpiredSessions` (`attendance.helpers.js:59`)
flips `isActive` to `false` for anything past `expiresAt`. It is called at the
start of five handlers — `session.controller.js:32`, `query.controller.js:18`
and `:48`, and `student.controller.js:85` and `:123`. It is **lazy cleanup** —
the flag only changes when somebody happens to read.

That works well enough for correctness of the API. `startAttendanceSession`
filters on `expiresAt: { $gt: new Date() }` (`session.controller.js:37`), so a stale session
flagged `isActive: true` can never block a new one, and `markAttendance` checks
`expiresAt` directly. The teacher and the student never see a ghost session.

**The gap.** The database disagrees with reality until a read happens. Open
MongoDB Compass during a quiet minute and you will see sessions with
`isActive: true` whose `expiresAt` is an hour old. Anything you build later on
top of that flag — a notification, a report, a "live now" query, a dashboard
count — inherits the flakiness.

Incidentally, lines 390 and 428 call `closeExpiredSessions()` with no teacher id,
which sweeps **every** teacher's sessions. Students are already doing the
cleanup as a side effect. That is fine, and it is a good reason to expect the
sweeper to be cheap, but it is accidental, not a design.

**The change.** A timer that runs the same query on a schedule, so the database
is correct even when nobody is looking.

New file `server/src/jobs/closeExpiredSessions.job.js`:

```js
import Attendance from "../models/Attendance.model.js";

const SWEEP_INTERVAL_MS = 60 * 1000;

export function startSessionSweeper() {
  if (process.env.NODE_ENV === "test") return;

  const timer = setInterval(async () => {
    // updateMany is a no-op when there is nothing to close, so this is cheap
    // to run every minute forever.
    const result = await Attendance.updateMany(
      { isActive: true, expiresAt: { $lte: new Date() } },
      { $set: { isActive: false } },
    );

    if (result.modifiedCount > 0) {
      console.log(`Closed ${result.modifiedCount} expired session(s)`);
    }
  }, SWEEP_INTERVAL_MS);

  // Never hold the process open just for this timer.
  timer.unref();
}
```

Call `startSessionSweeper()` from `startWorker()` in `server/src/server.js`,
next to the `connectToDatabase()` on line 73, so the timer only exists once the
database is actually connected.

**Run it in every worker, not once in the primary.** The primary does not open a
Mongo connection — `startPrimary` on line 102 only forks workers — so a sweeper
there would need a new connection and a new shutdown path. In the workers it
needs nothing. Sixteen workers running the same idempotent `updateMany` once a
minute is sixteen redundant writes, which is noise. Leader election would be the
"proper" answer and is not remotely worth it for this.

Add the matching shutdown so the timer cannot outlive the worker, alongside the
`SIGTERM` handler already at `server/src/server.js:97`.

### 4.2 Reading B — starting a new session closes the old one

**What exists today.** If a teacher starts a session while one is already open,
`startAttendanceSession` returns **409** with the open session attached
(`session.controller.js:34-49`). The teacher is told "you already have an
active session" and has to go and close it first.

That is defensible, but it is a real annoyance in a lecture: a teacher who
accidentally starts the wrong session, or who wants to run two back to back,
has to find the old card and press End. Auto-expiring the previously started
session removes the step.

**The change.** Replace the 409 branch with a close-then-create:

```js
if (openSession) {
  // A teacher can only run one session at a time, so starting a new one
  // closes whatever was still open instead of refusing.
  openSession.isActive = false;
  await openSession.save();
}
```

**This is an API contract change and needs to be deliberate:**

- `POST /api/attendance/start` goes from returning 409 in this case to
  returning 201. Any client checking for 409 stops working.
- Sessions can now end with students on the roster who never got to scan the
  final QR, so partial rosters are normal. The history pages must not assume a
  closed session is complete.
- A mis-click now silently kills a live session. Consider keeping a short
  confirmation, or logging loudly, before you accept that.

If you are not sure you want this, ship 4.1 and leave 4.2 alone. The sweeper is
unambiguous; this one changes a contract.

---

## 5. Traps

**A TTL index would destroy the attendance records.** The obvious way to expire
sessions automatically is

```js
attendanceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

Do not do this. TTL deletes the document when `expiresAt` passes, and an
attendance session *is* the attendance record. Thirty minutes after every
lecture, the history pages go blank and the data is gone. There is no undelete.
Expire by flipping `isActive`, exactly as `closeExpiredSessions` does today.

**The form rate limiter is per IP, and a class shares one IP.** The limiter is
5 requests per minute per address
(`server/src/middlewares/rateLimit.middleware.js`), and every student in a
lecture hall typically arrives through one NAT address. Keep the new rotation
and link-issuing endpoints off it, or one over-eager student throttles the whole
room. This is pre-existing and documented in
`docs/INTERVIEW_GUIDE.md`; the rotation code just has to not make it worse.

**Do not "simplify" the worker's `cluster.fork()` call.** The primary passes
`WORKER_COUNT` to each worker on fork (`server/src/server.js:109` and `:130`),
and the rate limiter reads it back at
`server/src/middlewares/rateLimit.middleware.js:19` to work out how many
requests a single worker should allow. It is an invisible contract between the
two files. Drop the argument and `WORKER_COUNT` becomes `undefined`, every
worker falls back to `1`, and with 16 workers the effective limit quietly goes
from 5 requests a minute to 80 — with no error, no warning, and no failing
test, because each worker on its own is behaving correctly.

**Do not rotate inside `serializeAttendance`.** It is tempting to mint a token
while building the response, since that is where `formUrl` is built
(`attendance.serializer.js:51`). Resist. It is called from five different read
handlers, including the student's `/live` poll, so any read anywhere would burn
a token and students' screens would start failing at random. A function that
formats a response should not have side effects.

**Trust the server clock only.** Both deadlines are computed with
`Date.now()` on the server. The client countdown is for display, and
`TeacherDashboard.jsx:72` already derives "is this still live" locally from
`expiresAt` — keep that as a display convenience only, never as the check that
grants attendance.

**Rotation costs one write per 30 seconds per session.** Two per minute, per
teacher. Negligible, but worth knowing before someone worries about it.

**The teacher closing the tab stops rotation.** No polling client, no new token,
so a link shared out of band goes stale and stays stale. This is correct for the
QR-on-a-projector case and wrong for a link-in-a-group case, which is exactly
why section 3.4 recommends a stable entry URL.

---

## 6. Configuration

Add to `server/.env.example` and to the Dockerfile/compose environment, with
sane defaults so nothing breaks if they are unset:

```bash
# Whether a link stops working 30 seconds after the QR code was last issued.
# Leave this off until the teacher-side rotation timer is deployed too, or
# every student link dies with nothing to replace it.
# LINK_ROTATION_ENABLED=false

# How long one attendance link stays valid before the QR code renews.
# LINK_LIFETIME_SECONDS=30

# How often the background job closes sessions that have run out.
# SESSION_SWEEP_INTERVAL_MS=60000
```

Read them once at the top of the module, the way
`attendance.helpers.js:7` reads its duration, rather than inline at every
use, so the value cannot drift between two places. The flag in particular is
read in one place only — `markAttendance` — and the teacher-side timer should
ask the server which mode it is in rather than assuming, so the two can never
disagree.

---

## 7. Testing

Feature 1, against a single worker (`WEB_CONCURRENCY=1`) so the rate limiter
behaves predictably:

| Check                                                        | Expected                                          |
| ------------------------------------------------------------- | ------------------------------------------------- |
| With `LINK_ROTATION_ENABLED` unset, a 10-minute-old link still marks | 201 — proves it really is off            |
| `POST /:id/refresh-link` returns a different `formUrl`        | new token each call                               |
| Old token still works immediately after rotation               | 201, one student added                            |
| Old token used 31+ seconds after rotation                      | 410 with `code: "LINK_EXPIRED"`                   |
| New token works                                               | 201                                              |
| A teacher rotating somebody else's session                    | 404                                              |
| Rotating a session that already ended                         | 410, not a new token                             |
| `linkExpiresAt` is ~30s out but `expiresAt` is ~30 min out    | proves the two clocks are separate                |
| Student from another class uses a fresh token                  | 403                                              |
| Same student twice within one token                            | 409 `Already marked`                              |
| Rotation across all workers (`WEB_CONCURRENCY=auto`)          | every worker honours the same token               |

Feature 2:

| Check                                              | Expected                                        |
| -------------------------------------------------- | ----------------------------------------------- |
| Insert a session with `expiresAt` in the past, `isActive: true` | sweeper flips it within a minute     |
| Sweeper runs with no expired sessions             | `modifiedCount` 0, no error, keeps running      |
| Two workers sweep the same expired session        | no duplicate work, no error                     |
| `start` twice with a session open                 | 409 under 4.1, or 201 + old session closed under 4.2 |
| History after an auto-closed session              | session listed, `isActive: false`, roster intact |

And a manual pass, because none of the above proves the QR actually changes on
screen: start a session, watch the code redraw every 30 seconds, scan it, then
photograph the screen and try the photo after 30 seconds.

---

## 8. Suggested order

1. **Feature 2a, the sweeper.** Small, no API change, no client change. Lowest
   risk, and it stops the database lying about what is live.
2. **Feature 1's token plumbing** — the utility, the model field, the endpoint
   and the route, all with `LINK_ROTATION_ENABLED` left off. Server only, and
   with the flag off the existing link keeps working exactly as it does now.
3. **The teacher-side timer** and the `LINK_EXPIRED` message. **Flip
   `LINK_ROTATION_ENABLED=true` in the same deploy as this step.** The check and
   the rotation that feeds it have to arrive together; a 30-second link with
   nothing rotating it is an outage, not a gradual degradation.
4. **The stable entry URL** (section 3.4), so copying a link is useful again.
5. **Feature 2b**, if it is still wanted. It changes a contract; give it its
   own commit and its own decision.

Steps 1 and 2 are independent and can go in parallel. Step 3 is the only one
that changes what a student experiences, and the flag is what makes it a
one-line revert: turn it off, and marking goes back to accepting any
unexpired-session link immediately.
