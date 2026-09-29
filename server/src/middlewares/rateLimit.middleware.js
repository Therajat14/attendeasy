// Stops one student from hammering the "mark attendance" button.
//
// How it works: every time a request comes in we look up the visitor's IP
// address in `requestsSoFar`. The first request starts a one minute timer and
// counts as 1. Once the count reaches the limit, every further request inside
// that minute is refused with 429. When the minute is up the entry is treated as
// new, so the student can try again.

const REQUESTS_ALLOWED_PER_MINUTE = 5;
const ONE_MINUTE_IN_MS = 60 * 1000;
const REFUSAL_MESSAGE = "Too many form submissions. Please try again in a minute.";

// The counts live in this process's memory, so a cluster would otherwise give
// every worker its own copy and a visitor could get REQUESTS_ALLOWED per worker.
// We divide the limit by the number of workers instead, which keeps the limit
// for the whole cluster the same as the limit for a single process.
// The primary process tells each worker how many there are; with one process it
// is simply 1.
const workerCount = Math.max(1, Number(process.env.WORKER_COUNT) || 1);
const allowedPerWorker = Math.max(
  1,
  Math.ceil(REQUESTS_ALLOWED_PER_MINUTE / workerCount),
);

// IP address -> { count, expiresAt }
const requestsSoFar = new Map();

export function formSubmissionRateLimiter(req, res, next) {
  // Works out who is making the request.
  let visitor = req.ip;

  if (!visitor) {
    visitor = req.headers["x-forwarded-for"];
  }

  if (!visitor) {
    visitor = req.socket.remoteAddress;
  }

  const now = Date.now();
  const record = requestsSoFar.get(visitor);

  // No entry, or the entry belongs to a minute that has already passed. Either
  // way we start a fresh minute for this visitor.
  if (!record || record.expiresAt <= now) {
    // Old entries are only removed when the same IP comes back, so this Map
    // would grow forever. Once it gets big we drop every entry whose minute has
    // finished.
    if (requestsSoFar.size > 5000) {
      for (const [oldVisitor, oldRecord] of requestsSoFar) {
        if (oldRecord.expiresAt <= now) {
          requestsSoFar.delete(oldVisitor);
        }
      }
    }

    requestsSoFar.set(visitor, {
      count: 1,
      expiresAt: now + ONE_MINUTE_IN_MS,
    });

    return next();
  }

  // The visitor is inside their minute and has already used up the allowance.
  if (record.count >= allowedPerWorker) {
    return res.status(429).json({ message: REFUSAL_MESSAGE });
  }

  record.count += 1;
  requestsSoFar.set(visitor, record);

  return next();
}
