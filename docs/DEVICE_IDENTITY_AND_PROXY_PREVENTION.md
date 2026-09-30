# Identifying Devices and Stopping Proxy Attendance

How to stop one student marking another's attendance, and how much of that job
device identification can actually do.

This is a design document. **Nothing here is implemented.** Line numbers refer
to commit `8acd9b6`.

> Read section 2 before anything else. Most of what people mean by "identify the
> device" is already solved in this codebase, and the part that is not solved
> cannot be solved by device identification.

---

## 1. The headline, stated plainly

**A device fingerprint is evidence, not identity.**

Every value a fingerprint is built from is supplied by the client — the browser
the student is trying to cheat with. A determined person can lie about all of
them, and some of them change on their own when a phone rotates to cellular.

So a fingerprint is good at catching **automation** (a script, a bot, a mass
sweep) and **account lending**. It is not good at proving that a human in the
fourth row is the student named on the register. For that one case, the only
honest mechanisms are cryptographic proof of a key the account registered
(section 6) and a teacher watching the screen (section 7).

That distinction should drive the whole design, so it is worth being blunt: a
plan that claims to "prevent proxy attendance with device fingerprinting" is
promising more than fingerprinting delivers, and it will fail in front of a
class.

---

## 2. What the app already gets right

This is the part that surprises people, and it is the foundation everything else
sits on.

**The mark is bound to the signed-in student, not to whoever scanned the code.**

`protect` (`server/src/middlewares/auth.middleware.js:11`) verifies the JWT from
the HTTP-only cookie, then loads the user from the database and assigns
`req.user` (line 33). `markAttendance` then writes
`students: { studentId: req.user._id, ... }`
(`server/src/controllers/attendance/student.controller.js:59`) and filters on
`req.user._id` a few lines above.

There is **no field anywhere in the mark request that names a student.** The QR
carries no identity. A student who scans a colleague's code marks *themselves* —
it cannot produce a roster entry for anyone else.

**One mark per student per session is already atomic.**

The `$not: { $elemMatch: ... }` at
`student.controller.js:45` sits inside the same `findOneAndUpdate` that does
the `$push`. Two simultaneous requests cannot both insert, because the second
one's filter no longer matches once the first commits. The loser gets 409
`Already marked` (`student.controller.js:67`).

Both of these are properties of the database write, not of the client, so they
hold regardless of what the student does:

| The student changes…                    | Can they mark the same lecture twice? |
| ---------------------------------------- | -------------------------------------- |
| Browser (Chrome → Firefox)               | No                                     |
| IP address or network                    | No                                     |
| Cookie jar, incognito, cleared storage    | No — but they re-authenticate          |
| User agent string                        | No                                     |
| Device, phone, laptop                    | No                                     |

**So the literal request in the title is already satisfied:** nobody can mark
another student's attendance by changing browser or IP. The remaining exposure
is narrower, and it is worth naming precisely:

1. **Credential lending.** Student A signs in, then hands the phone to B, or
   writes down their password for B. B marks A's attendance. This is *not* a
   bug — the server is doing exactly what it was told. It is an account-security
   problem, and it is the real "proxy" vector in this app.
2. **Credential or token theft.** The JWT lives in an HTTP-only cookie, so
   script cannot read it, and the same-site settings in
   `server/src/utils/authCookie.util.js` stop it riding along to another site.
   But a stolen device with an unlocked browser session, or a shared password,
   still works.
3. **Automation.** One person, one phone, a script that marks 24 accounts
   before the lecturer looks up. This is the only threat that scales, and it is
   the one device-level controls genuinely address well.

---

## 3. The three threats, and whether device ID helps

| Threat                          | What it looks like                                  | Does device ID help?                        |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------- |
| A. Photo or forwarded QR        | Link sent to an absent friend; they mark themselves  | **No.** Needs a short link life (see `QR_ROTATION_AND_SESSION_EXPIRY.md`) |
| B. Account lending              | A hands B the phone, or shares the password          | **Partly.** Device binding and new-device alerts raise the cost and leave evidence |
| C. Automation / mass marking    | One device or script marks the whole section in seconds | **Yes, strongly.** This is where fingerprinting earns its cost |
| D. The friend standing next to you | B scans A's code while both are in the room         | **No.** Not by fingerprint. Needs section 6 or 7 |

A is a link-lifetime problem and is covered in the QR rotation document. D is
the case everyone actually worries about, and it is the one device
identification cannot touch. B and C are where the work below applies.

---

## 4. "Even if he changes the browser or the IP"

The requirement is reasonable, and the honest answer is a table of what survives
each change.

| Signal                            | Survives a new browser? | Survives a new IP?  | Spoofable? | Verdict                             |
| --------------------------------- | ------------------------ | ------------------- | ---------- | ----------------------------------- |
| `userAgent`                       | No                       | Yes                 | Trivially  | Useless on its own                  |
| `navigator.hardwareConcurrency`   | Sometimes                | Yes                 | Yes        | Weak contributing signal            |
| `deviceMemory`                    | Sometimes                | Yes                 | Yes        | Weak contributing signal            |
| `screen.width/height/colorDepth`  | Often                    | Yes                 | Yes        | Reasonably stable                   |
| `Intl.DateTimeFormat().resolvedOptions().timeZone` | Often | Yes    | Yes        | Reasonably stable                   |
| Canvas / WebGL renderer hash      | Often                    | Yes                 | Yes        | Reasonably stable                   |
| Audio context hash                | Often                    | Yes                 | Yes        | Reasonably stable                   |
| Cookie or `localStorage` device id | No                      | Yes                 | N/A        | Trivially cleared, so treat as a hint |
| **IP address**                    | Yes                      | **No**              | Yes        | **Useless as identity. See below**  |

### Why IP is not an identity signal here

The rate limiter identifies callers by `req.ip`, with a fallback to
`x-forwarded-for` and then `req.socket.remoteAddress`
(`server/src/middlewares/rateLimit.middleware.js:30-38`).

`server/src/app.js` never calls `app.set("trust proxy", ...)`, so `req.ip` is
always populated — it is the socket address. **The `x-forwarded-for` branch can
therefore never execute.** Behind a load balancer or a reverse proxy it is dead
code, and `req.ip` is the *load balancer's* address for every single student in
the lecture. On campus Wi-Fi it is likewise one address for the whole hall.

Two consequences, and they matter for this design:

- Any control keyed on IP will either group the whole class or be trivially
  evaded by changing networks. Do not build the anti-proxy feature on it.
- That dead branch is a real latent bug worth fixing on its own. Set
  `app.set("trust proxy", 1)` (exactly one hop, so a client cannot forge the
  header) and simplify the limiter to use `req.ip` alone.

IP is still worth **recording** for the audit trail in section 8, where a
changing IP is itself a useful signal. Recording is not the same as trusting.

---

## 5. Mechanism A — server-issued device credentials (do this first)

Not a fingerprint. An actual secret the server hands out and can revoke.

**On sign-in**, if the request presents no recognised device secret, mint one
(a `crypto.randomBytes(32)` token, the same primitive already used for
`formToken` at `session.controller.js:51`), store only its hash against the
user, and return it in a long-lived `HttpOnly` cookie scoped to the API. **On
every mark**, the client sends a device id, and the server resolves it to a user.

What this buys:

- A student's account normally works on one or two devices. A third is visible,
  reviewable, and revocable.
- Copying cookies to a different browser does not carry the secret, so the new
  browser hits the "unrecognised device" path.
- You get a clean, revocable list to show a student: "your account was used on
  3 devices this week".

What it does not buy: it is not proof. Anyone who logs in on a new device gets a
new secret, and the whole thing depends on the login step being honest. It is
**account security**, not identity proof, and it is the right first layer because
it is simple and has few false positives.

A minimal shape:

```js
// server/src/models/Device.model.js
{
  userId:      { type: ObjectId, ref: "User", required: true, index: true },
  deviceId:    { type: String, required: true, unique: true, index: true }, // random, not a fingerprint
  secretHash:  { type: String, required: true },
  label:       { type: String },              // "Chrome on Windows", for the student to read
  lastUsedAt:  { type: Date },
  createdAt:   { type: Date, default: Date.now },
  revokedAt:   { type: Date, default: null },
}
```

Resolve `deviceId` → `userId` on each mark and confirm it matches `req.user._id`;
otherwise treat it as a new device. Cap it (three is a sensible default) and
make exceeding the cap an **alert**, not a lockout.

---

## 6. Mechanism B — WebAuthn passkeys (the only real identity proof)

If the requirement is genuinely "this attendance was recorded by this person on
this device", then the answer is a key the account registered and the server can
verify cryptographically. A passkey is bound to an account, so a borrowed phone
cannot produce a signature for somebody else's account — which is precisely the
failure mode in section 3, row D.

**How it works.** At registration, the browser creates a key pair and sends the
public key to the server. At mark time, the server sends a challenge, the browser
signs it with the private key, and the server verifies the signature against the
stored public key. Possession of the private key is the proof. The stored
credential also carries a signature counter, so a cloned authenticator shows up
as a counter that goes backwards.

**Recommended shape: step-up, not always-on.** Requiring a biometric or PIN
prompt on all 60 marks in a lecture is a serious usability cost, and students
will queue. Instead:

- Normal mark: cookie-authenticated, as today. Fast.
- **Flagged** mark: the server sees an anomaly (section 7) and responds `401` /
  `409` with `code: "STEP_UP_REQUIRED"`.
- The student page re-prompts, the server verifies the assertion, and the mark
  goes through — now with proof attached.

This gives you the cryptographic control exactly where you need it, and nowhere
else. Libraries: `@simplewebauthn/server` and `@simplewebauthn/browser` handle the
ceremony, the CBOR parsing and the counter check.

**Costs and constraints, stated plainly:**

- **The RP ID is a deployment constraint, and it may block you.** WebAuthn keys
  are bound to a *registrable domain suffix* of the page origin. This app
  supports a split deployment where the frontend and API are on unrelated hosts
  (`COOKIE_SAME_SITE=none` in `server/.env.example` is exactly that case). A
  frontend on `myapp.vercel.app` and an API on `api.onrender.com` have **no
  common registrable domain**, so a passkey registered on one will not work on
  the other. You need both under one parent domain, or you deploy together
  behind one origin — which the Docker setup in `docker-compose.yml` already does.
  Check this before designing anything else.
- First-time registration takes a minute per student and needs a recovery story,
  or a student who loses their phone is locked out mid-degree.
- Requires HTTPS.
- Not available on every device a college owns.

**This is why it is step-up and not the default.** It is the strongest tool
available and it has the highest cost, so spend it on the marks that need it.

---

## 7. Mechanism C — anomaly detection (best ratio of value to effort)

If you only build one thing from this document, build this. It is the only part
that reliably catches automation, and it has almost no false-positive risk,
because it only fires on patterns a real classroom does not produce.

Score a mark. Do not block on the score.

| # | Signal                                        | Looks like                                       | Suggests         |
| - | --------------------------------------------- | ------------------------------------------------ | ---------------- |
| 1 | **Distinct accounts per device per session**  | One `deviceId` marking 9 different students       | Automation — the big one |
| 2 | **Mark rate from one device**                  | 12 marks in 20 seconds                           | Scripting        |
| 3 | **Mark latency**                              | Gap between page load and submit consistently <300 ms | Scripting |
| 4 | **Same account, many devices, short window**  | One account, 4 devices, 6 minutes                 | Lending or theft |
| 5 | **Section-wide sweep**                        | All 24 section students marked within 10 seconds  | Automation       |
| 6 | **One account, several IPs, impossible travel** | Same session, 3 countries                        | Shared token     |
| 7 | **Device used before its owner signed in**     | Mark from a device never seen for that account    | Reused device    |

Signal 1 deserves emphasis: it is measured against a single session's roster, so
it does not care about IP, browser, or whether the student cleared their
cookies. A person walking around the hall with one phone and marking every
colleague produces exactly this, and nothing else does.

Signals 2, 3 and 5 are near-free because the data is already there —
`submittedAt` is written on every mark (`student.controller.js:59`).

**Where this data lives.** Anomaly detection needs history across sessions, so
in-memory `Map`s are not enough — the rate limiter keeps its counters in a
`Map` (`rateLimit.middleware.js:26`) and that is fine for a per-minute window
but useless for a per-session correlation. Use a small collection with a TTL,
and keep it out of the `Attendance` documents:

```js
// server/src/models/MarkAudit.model.js  — one row per mark, short retention
{
  sessionId:      { type: ObjectId, ref: "Attendance", index: true },
  userId:         { type: ObjectId, ref: "User", index: true },
  deviceId:       { type: String, index: true },
  fingerprintHash:{ type: String, index: true, default: null },
  ip:             { type: String },
  userAgent:      { type: String },
  submittedAt:    { type: Date, default: Date.now },
  riskScore:      { type: Number, default: 0 },
  flags:          { type: [String], default: [] },   // ["MULTI_ACCOUNT_DEVICE", "TOO_FAST"]
  needsReview:    { type: Boolean, default: false },
}
```

Store `fingerprintHash` and never the raw signals. A hash is enough to correlate
and far less invasive to hold.

---

## 8. The deployment reality that breaks naive device identity

Before writing a line of fingerprint code, picture the actual room.

**In a college lab, sixty students may share one machine.** If the mark happens
on a lab PC, one device identity covers the entire section. Fingerprint rules
written as "one device, one student" are then not merely wrong, they are exactly
inverted: the honest student and the cheat look identical, because they *are*
identical from the device's point of view.

The same applies to a shared Wi-Fi network, a single projector-side tablet that
students pass around, and phone browsers where the private relay rotates the IP
mid-lecture.

Practical consequences:

- **Never make "device already seen for another account" a hard block.** It will
  fire on every lab session and lock out the entire class.
- **Alert the teacher, not the student.** A blocked student in front of a class
  is a worse outcome than one missing mark, and it is far harder to recover from.
- **Collect the fingerprint on the student's own phone, not the shared machine.**
  Marking from a personal device is the norm; treat a first-time device as normal
  rather than suspicious.
- If you fingerprint at all, weight **personal-device, many-accounts** heavily
  and **shared-device, one-account** not at all.

---

## 9. Never block in class — flag, and let a human decide

This is the most important product judgement in the document.

The failure modes are not symmetric. One cheat who is not caught is one wrong
attendance entry. A legitimate student locked out at the door, in front of their
class, in the first week, is a complaint, a support ticket, and a permanent
first impression of your app.

So the recommended behaviour on a high-risk mark is:

1. **Record the attendance** — the student is not blocked.
2. **Set `needsReview: true`** with the flags that fired.
3. **Show the teacher a quiet marker** on that row, next to the existing roster
   (`client/src/pages/TeacherDashboard.jsx:502` already renders each student's
   roll number, so there is somewhere natural to put it).
4. **Tell the student nothing punitive**, at most "your attendance was recorded".

A teacher glancing at a highlighted name in real time is the highest-value,
lowest-cost control in the entire system, and it catches section 3 row D — the
in-room proxy — which no fingerprint catches. Build it before any fingerprint.

### The appeal problem

A student accused of proxy attendance will dispute it. If you cannot show
evidence, you do not have a defensible process, whatever the truth is. The audit
row in section 7 is that evidence: device, IP, user agent, timestamp, and the
flags that fired. Keep it long enough for an appeal to be heard (a semester is a
reasonable retention, then delete), and give the student a way to see and clear
their own record.

### Privacy

A stable identifier linked to a named student is personal data. Under the EU's
GDPR and India's DPDP Act 2023 that means a lawful basis, a stated purpose,
retention limits, and a way to erase. A hash of a fingerprint used to prove
attendance is a different use than one used for advertising; do not let it drift.
Publish a short notice in the app, do not retain raw signals, and never reuse
this data for anything a student did not agree to.

---

## 10. What not to build

- **Incognito or "is this a real browser" detection.** Pointless against a
  motivated student, trivial to defeat, and a reliable false-positive generator.
- **A hard block on a new device.** You will block shared lab machines, and you
  will block the honest majority.
- **IP-based identity.** Section 4. The signal is shared by the whole class and
  disappears on any network change.
- **Storing raw fingerprint signals.** Hash and correlate; do not build a dossier.
- **A separate "mark for a friend" feature.** Never let a request name a student
  other than `req.user`. That property (section 2) is the single most valuable
  thing in this codebase. Protect it.

---

## 11. Suggested order

| # | Step                                    | Cost | Catches                        |
| - | --------------------------------------- | ---- | ------------------------------ |
| 1 | Fix `trust proxy` and the limiter's dead branch | S | Correct IP attribution         |
| 2 | The `MarkAudit` row written on every mark | S   | Nothing yet — it is the data foundation |
| 3 | Teacher-facing anomaly markers on the live roster | S | **In-room proxy, automation** — best value in this list |
| 4 | `Device` records at sign-in, shown to the student | M | Credential lending, gives evidence |
| 5 | Alerting on the section 7 signals, emailed to the teacher | M | Automation, at scale |
| 6 | WebAuthn as **step-up** on flagged marks | L   | The in-room proxy, provably    |
| 7 | Fingerprint, as a correlation signal only | M   | Adds little on top of 1-6      |

Steps 1-3 are small, need no client library, and cover the majority of what is
realistic. Step 6 is the only item that changes the security property rather
than the detection, and it is deliberately last because of the domain
constraint in section 6 — check that first, because it can invalidate the
project's deployment model.

---

## 12. Testing

Everything here is testable without a real device farm; mock the signals.

| Check                                                       | Expected                                    |
| ----------------------------------------------------------- | ------------------------------------------- |
| One `deviceId` marks 6 accounts in one session               | flagged `MULTI_ACCOUNT_DEVICE`, attendance still recorded |
| One account marked from 4 different `deviceId`s in 6 minutes | flagged `DEVICE_SPRAWL`                     |
| Marks at 120 ms intervals                                    | flagged `TOO_FAST`                          |
| 24 students marked from one `deviceId`                       | flagged, teacher notified                   |
| 60 students mark from one lab PC, one account each           | **not flagged** — shared-device, one account |
| Student changes browser, same device secret                  | still one `Device` row, not two             |
| Student changes IP, same cookie                              | attendance still works, both IPs in the audit row |
| `x-forwarded-for` spoofed by the client                      | ignored — `trust proxy` is 1 hop            |
| Step-up required, assertion valid                            | mark succeeds, `stepUpVerified: true`       |
| Step-up required, assertion from the wrong authenticator     | mark recorded, flagged for review           |
