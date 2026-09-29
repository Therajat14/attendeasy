# System Design

The reasoning behind AttendEasy: what it has to do, what it refuses to trade
away, and what each major decision buys and costs. For the structure of the code
itself, read `ARCHITECTURE.md`; line numbers here refer to commit `1e6cc05`.

---

## 1. The problem, stated as constraints

A college lecturer takes attendance for a class of 60. The old way is a paper
register, read out, and typed up later. The constraints that shape everything
else:

1. **The lecturer is standing in front of a class.** Whatever the students use
   has to work within seconds, on a phone, possibly on college Wi-Fi.
2. **The result has to be defensible.** If a student's attendance is challenged,
   there is a record of what happened. "The app said so" is not good enough for
   an attendance dispute.
3. **Cheating is the obvious failure mode, and it is social.** Students sit next
   to each other. A QR code on a projector is a URL that a neighbour can open.
4. **Nobody is going to run a Kubernetes cluster for a college project.**
5. **The code has to be explainable.** This is a portfolio project. A reviewer
   should be able to open any file and follow it.

Constraint 3 is why this is not "a CRUD app with a QR code", and constraint 5 is
why it is not TypeScript with a service layer and a DI container. Both pull in
opposite directions, and the resolution throughout is: _keep the logic simple and
obvious, keep the invariants in one place, and be honest about the trade-offs._

---

## 2. Non-goals

Naming these early prevents a lot of bad architecture.

| Not doing                                  | Why                                                                                                                                                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Offline attendance                         | Conflict of interest: it has to work without a server, and a mark recorded offline needs reconciling later, which is exactly the double-mark problem we are trying to prevent |
| Photo or face recognition                  | Privacy, cost, and a failure mode that produces _wrong_ attendance rather than none                                                                                           |
| A native app                               | Constraint 4 and 5. A responsive web app is one deploy                                                                                                                        |
| A pluggable provider system (Twilio, Zoom) | Nothing to integrate with yet; abstraction without a second implementation is just indirection                                                                                |
| Multi-tenancy                              | One college per deployment. It would complicate every query for a case that does not exist                                                                                    |

---

## 3. The central design decision

**The mark is recorded against the signed-in student, never against whoever
scanned the code.**

`markAttendance` derives the student from `req.user._id`
(`server/src/controllers/attendance.controller.js:243`), and `req.user` comes
from a verified JWT cookie via `protect`
(`server/src/middlewares/auth.middleware.js:33`). No field in the request names a
student. The QR carries a token that identifies a _session_, nothing more.

This one decision removes the entire class of "scan on someone else's behalf"
attacks:

- A forwarded link marks the forwarder's own attendance, not their friend's.
- A screenshot of the QR does not let anyone claim to be anybody.
- There is no endpoint anywhere that accepts a student id, so there is nothing
  to validate and nothing to get wrong.

The cost is that a student who _borrows_ a logged-in phone can still mark for the
account owner. That is account security, not a marking bug, and the honest
response is device binding and anomaly detection — not a change to this model.
See `docs/DEVICE_IDENTITY_AND_PROXY_PREVENTION.md`.

### 3.1 The second decision: one atomic write

One mark per student per session is enforced by the database, not by the client:

```js
Attendance.findOneAndUpdate(
  { _id, course, class, section, isActive: true, expiresAt: { $gt: new Date() },
    students: { $not: { $elemMatch: { studentId: req.user._id } } } },
  { $push: { students: { studentId: req.user._id, submittedAt: new Date() } } },
)
```

The guard and the insert are the same operation, so two simultaneous taps cannot
both match. An `if (!exists) insert` pair would have a race; a client-side
`disabled` flag would be bypassed by anyone with devtools.

The same filter carries the class check, the active check and the expiry check,
so all four rules are decided in one round trip. The second concurrent tap gets
`409 Already marked`.

---

## 4. Data model

Two collections, and both are shaped by the questions the app actually asks.

**Users** are a flat document with four student-only fields. The conditional
`required` on those fields is a function, so Mongoose can read `this.role` at
save time.

**Attendance sessions** embed their roster. This is the decision most worth
justifying, because embedding is usually the thing to avoid.

|                                                  | Embedded roster (chosen)            | Separate marks collection           |
| ------------------------------------------------ | ----------------------------------- | ----------------------------------- |
| Read a session with its roster                   | one query                           | join or two queries                 |
| Write one mark                                   | one atomic `update` on the session  | insert, then a second read          |
| Enforce one mark per student                     | free, in the same filter            | needs a unique index plus handling  |
| A session's marks are ever queried independently | never                               | would matter                        |
| Document growth                                  | unbounded, but capped by class size | —                                   |
| Deleting a session                               | one delete                          | delete the session _and_ every mark |

A session belongs to one class and one lecture, and its roster is read with it
every single time — by the teacher's live view, by the student who just marked,
and by the history page. There is no query in the app that wants the marks
without the session. So embedding wins on every access pattern, and the one real
cost (a document can grow) is bounded by how many students are in a class.

The indexes follow from the questions, not from the fields:

```js
{ teacherId: 1, date: -1 }                        // "my sessions, newest first"
{ teacherId: 1, isActive: 1 }                     // "do I already have one open?"
{ course: 1, class: 1, section: 1, isActive: 1 }  // "what is live for my class?"
```

`formToken` is unique. It costs an index and buys a guarantee that two sessions
can never share a link, which is a class of bug that would otherwise be
invisible until it mattered.

**If this grew.** Past a few hundred students in a session, or if marks ever
needed to be queried across sessions, the roster moves to its own collection
with a unique index on `(sessionId, studentId)`. The controller signature would
not change, only the query. Keeping the access patterns behind one controller is
what makes that migration cheap.

---

## 5. Expiry: two clocks, and why neither alone works

A session lives 30 minutes. Today one URL identifies it for all 30.

That is a long time for a URL on a projector. A photograph of the QR works for
half an hour, for anyone in the right class.

The obvious fix — shorten the session to 30 seconds — is wrong, because then the
lecture ends. So there are two clocks:

| Clock   | Length | Governs                  | Field          |
| ------- | ------ | ------------------------ | -------------- |
| Session | 30 min | Is the lecture still on? | `expiresAt`    |
| Link    | 30 sec | Is this exact URL good?  | `linkIssuedAt` |

The QR renews on the second clock while the session runs on the first. The design
is written up in full, with the rollout and the traps, in
`docs/QR_ROTATION_AND_SESSION_EXPIRY.md`.

The one non-negotiable detail: **expiry is enforced on the server.** Rotating the
image on screen while the server still accepts any token it ever issued is a
cosmetic change that defeats the purpose.

**Expiry today is lazy.** `closeExpiredSessions()` runs at the top of five
handlers rather than on a timer, so a session nobody has read keeps saying
`isActive: true` in the database. It is safe — `startAttendanceSession` filters
on `expiresAt > now` and `markAttendance` checks `expiresAt` itself — but the
database disagrees with reality, and anything built on that flag inherits the
flakiness. A one-minute background sweeper fixes it, and because
`updateMany` is idempotent it can run in every one of 16 workers without leader
election.

---

## 6. Scale and process model

The API is I/O-bound: nearly every request waits on Mongo. That means extra
processes help, and it is why `node:cluster` earns its place in a project this
small.

One primary forks N workers and shares a single listening socket, so the OS
spreads connections. Workers are disposable: a crash is replaced. N comes from
`WEB_CONCURRENCY`, the variable hosting platforms already set, defaulting to
`os.availableParallelism()` — which respects container CPU limits, so it reports
the CPUs the container was actually given rather than the host's.

**The cluster is where the two subtle bugs in this project live**, and both are
worth understanding because either could be reintroduced silently:

1. **The rate limiter is per-process.** It counts in a `Map` inside each worker,
   so the cluster-wide limit is `allowedPerWorker × workers` unless the divisor
   is right. Hence `WORKER_COUNT` is passed to every worker on fork, and
   `allowedPerWorker = ceil(5 / WORKER_COUNT)`. Lose that argument on `fork()` and
   the limit silently becomes 5 _per worker_ — 80 a minute across 16 — with no
   error and no failing test, because every worker is individually correct. This
   actually happened during development.
2. **Shutdown has to be coordinated.** The primary kills all workers on
   `SIGTERM`; without a flag, the `exit` handler sees them dying and
   helpfully respawns replacements, so the container never stops. Hence
   `isShuttingDown`, which turns respawn off and lets the primary exit once the
   last worker is gone.

**The real ceiling is Mongo connections, not CPU.** Each of N workers opens its
own pool (Mongoose defaults to 10 per process), so 16 workers want 160
connections — and MongoDB's default `maxIncomingConnections` historically sits
around 100. A single box will exhaust the server's connection limit well before
it exhausts its CPUs. If this grew, the fix is a smaller per-worker pool
(`maxPoolSize: 2-3`) rather than fewer workers, since the workers are idle while
waiting on I/O anyway.

**Where the real limit bites:** a 30-second link window with a class of 60 is
about 2 requests per second at the mark endpoint, and the limiter allows 5 a
minute per IP. On a single lecture-hall NAT address, that is the binding
constraint — not the server. Which is why the limiter's keying is called out as
a known weak point rather than presented as a security control.

---

## 7. Frontend design

**Plain JavaScript, no TypeScript.** The project was converted from TypeScript,
and the reason to stay in JS is explicit: this is meant to be read end to end
without a build step or a type checker in the way. Types would catch real bugs,
but the bugs that mattered here were all about _when_ two requests race, which
is a runtime property a type system cannot see.

**Polling, not WebSockets.** `useSessions` refetches every 10s,
`useStudentAttendance` every 8s. For this product the interesting moment is a
name appearing on a roster; a socket would remove at most 8 seconds from a page
that is not real-time in any meaningful sense. A socket would also add
reconnection, ordering and cluster-sticky-session concerns, and — with 16
workers — a naive socket layer would reconnect a student to a worker that knows
nothing about the others.

If it ever needed to be instant, the honest order would be: SSE first (one-way,
fits the problem, survives the cluster because state lives in Mongo), then
WebSockets only if two-way became necessary. Adding Redis pub/sub to fan out
across workers comes with that step, not before.

**Client-side routes are guarded twice.** `ProtectedRoute` hides a page for
comfort; `protect` on the server is the actual control. Anything in a browser is
bypassable with devtools, so a design that relied on the first would be relying
on something the user controls.

**Errors are a feature.** `client/src/lib/errors.js` turns an axios error into a
sentence a person can act on. A student who taps a stale code should be told what
to do next, not shown "Request failed with status code 410".

---

## 8. Security model

What is defended, how, and what is explicitly out of scope.

| Threat                               | Control                                                                  | Strength                                         |
| ------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------ |
| Someone marks a _different_ student  | Mark is bound to the verified cookie, `req.user._id`                     | **Strong** — not attackable via the API          |
| The same student marks twice         | Atomic `$not/$elemMatch` in the same write as the insert                 | **Strong** — holds under concurrency             |
| A teacher reads another's session    | `teacherId: req.user._id` in every query, answers `404`                  | **Strong**                                       |
| A student marks from the wrong class | `isSameClass` before the write, `403`                                    | **Strong**                                       |
| Brute force or credential stuffing   | 5/min limiter on the mark endpoint only                                  | **Weak** — see below                             |
| A stolen token                       | HTTP-only cookie, so page scripts cannot read it                         | **Good** — but an unlocked device still leaks it |
| Clickjacking                         | Nothing                                                                  | **Gap** — needs a frame-options header           |
| A replayed or photographed QR        | Not yet — planned, see the QR rotation document                          | **Gap**                                          |
| CSRF                                 | `SameSite=Lax` in the one-origin setup, `None`+`Secure` in the split one | **Needs review** — see below                     |

**The auth cookie.** It is HTTP-only, so an XSS bug cannot read it, and that is
the main reason it is not in `localStorage`. In production the default is
`SameSite=None; Secure` so it can reach an API on a different site. `None`
without a working CSRF defence is the one place this design would need a real
decision — a CSRF token, or keeping the API same-site. It has not been made yet,
and the split-deployment path is where it bites.

**The rate limiter is not a security control.** It is per IP, in memory, per
process, and an entire lecture hall usually shares one address. It stops casual
hammering and nothing else. Saying otherwise would be the kind of claim that
looks better on a résumé than it is true in a lecture hall.

**What is genuinely missing**: `trust proxy` is never set, so the limiter's
`x-forwarded-for` branch is dead code and a reverse proxy makes every request
look like the proxy. Fix: `app.set("trust proxy", 1)`. And there are no security
headers at all — `X-Frame-Options`, `Content-Security-Policy` and
`X-Content-Type-Options` would be a cheap addition, most likely via a small
middleware or `helmet`.

---

## 9. Reliability and failure modes

| Failure                          | What happens                                     | Handled by                                 |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------ |
| Mongo is down at boot            | Worker logs and exits 1; Compose restarts it     | `try/catch` in `startWorker`               |
| Mongo is slow to start in Docker | Entrypoint retries 30× every 2s before seeding   | `docker-entrypoint.sh`                     |
| A worker crashes mid-lecture     | Primary forks a replacement                      | `cluster.on("exit")`                       |
| `docker stop`                    | SIGTERM reaches Node directly, graceful shutdown | `exec` in the entrypoint, then `server.js` |
| A client holds keep-alive open   | Shutdown gives up after `SHUTDOWN_TIMEOUT_MS`    | `setTimeout` escape hatch                  |
| Duplicate tap                    | Second write matches nothing → `409`             | The atomic filter                          |
| Seed run twice                   | Second run refuses, database untouched           | User count check in `seed.js`              |
| A stale QR                       | Session-level check still applies                | `expiresAt` compared in the filter         |
| Frontend build missing           | API-only mode, says hello at `/`                 | `fs.existsSync` in `app.js`                |

The pattern throughout: **fail closed on attendance, fail open on convenience.**
A mark that cannot be validated is refused; a missing frontend build does not stop
the API.

---

## 10. Testing strategy

The suite that matters is behavioural, against a running server, because almost
every real risk in this project is a timing or ownership bug that a unit test
would not catch:

- **Full API sweep, single worker** — 106 checks: every endpoint, every role,
  cross-class rejection, ownership, duplicate marks, cookie attributes, and that
  unknown API routes return `404` while unknown page routes return the SPA.
- **Rate limiter and expiry** — 11 checks, including waiting out the 65-second
  window to prove it resets.
- **Cluster smoke** — 27 checks against 16 real workers, because ownership and
  the shared limiter only behave differently there.
- **Deployment** — `docker compose down -v && up --build` from scratch, then seed
  idempotency, graceful `docker stop`, and `WEB_CONCURRENCY` across `1`, `4`,
  `8`, `auto`, empty and invalid.
- **The env-ordering trap** — verified by putting a sentinel `FRONTEND_URL` in
  `.env` and checking the CORS header reflected it, which is the only way to
  prove `dotenv` ran before the modules that read the environment.

**What is not covered:** no browser automation, so the QR rendering and the
polling hooks are only checked by hand; no unit tests on `lib/format.js` and
`lib/errors.js`, though the simplification of those two was verified by
differential testing against the old implementations (162 comparisons, no
mismatches) rather than by a test that now guards them.

---

## 11. Known weaknesses, honestly

1. **The `cr` role is non-functional.** Offered at sign-up, routed to the student
   dashboard, and rejected by every controller with `403`. Verified end to end.
2. **No security headers**, and `trust proxy` unset.
3. **The rate limiter is per IP and per process** — see section 8.
4. **Lazy expiry** means the database can be stale — see section 5.
5. **One box.** No horizontal scale, no Redis, no shared rate limiting. Fine for
   a college; the day it is not, section 6 says what changes.
6. **JWTs cannot be revoked.** A stolen token is valid for 7 days. The fix is a
   token version on the user document, checked in `protect` — cheap, and not
   done.
7. **No audit log.** For an attendance system that will be argued about, there is
   no record of who marked what from where, beyond the roster itself.

---

## 12. What I would build next

In order, with the reasoning:

| #   | Change                                                    | Why this order                                          |
| --- | --------------------------------------------------------- | ------------------------------------------------------- |
| 1   | `trust proxy` + a small security-headers middleware       | An afternoon, and it removes a real gap                 |
| 2   | JWT version field for revocation                          | Cheapest fix for the worst residual risk                |
| 3   | Background expiry sweeper                                 | Makes the database honest; a few dozen lines            |
| 4   | Fix or remove the `cr` role                               | A role that 403s on every screen is worse than no role  |
| 5   | Rotating links (`docs/QR_ROTATION_AND_SESSION_EXPIRY.md`) | Behind a flag, and the flag ships with the client timer |
| 6   | An audit log + teacher-facing anomaly markers             | Catches proxy attendance, which nothing else can        |
| 7   | CSRF defence for the split deployment                     | Only matters once someone deploys that way              |

The ordering principle: cheap correctness first, then the features that change
what a student experiences, and the identity work last because it is the most
expensive and the most likely to be blocked by a deployment constraint —
WebAuthn needs both halves of the app under one registrable domain, and this app
supports deploying them apart.
