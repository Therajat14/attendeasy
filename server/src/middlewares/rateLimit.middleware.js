// Every worker process keeps its own copy of this Map, so without help a
// client could send WORKER_COUNT * maxRequests before the cluster as a whole
// blocked it. We divide the limit by the number of workers, which keeps the
// limit across the whole cluster the same as the limit for a single process.
// A shared store such as Redis would be exact, but this needs no dependency.
// The primary passes the count to each worker; in a single process it is 1.
const workerCount = Math.max(1, Number(process.env.WORKER_COUNT) || 1);

const rateLimitStore = new Map();

export function createRateLimiter({
  windowMs = 60 * 1000,
  maxRequests = 10,
  message = "Too many requests. Please try again later.",
} = {}) {
  const limitPerWorker = Math.max(1, Math.ceil(maxRequests / workerCount));

  return (req, res, next) => {
    const key = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || record.expiresAt <= now) {
      // Expired entries are only ever replaced when the same key comes back,
      // so the Map would grow forever. Drop the old ones once it gets big.
      if (rateLimitStore.size > 5000) {
        for (const [oldKey, old] of rateLimitStore) {
          if (old.expiresAt <= now) rateLimitStore.delete(oldKey);
        }
      }

      rateLimitStore.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      return next();
    }

    if (record.count >= limitPerWorker) {
      return res.status(429).json({ message });
    }

    record.count += 1;
    rateLimitStore.set(key, record);
    return next();
  };
}

export const formSubmissionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  message: "Too many form submissions. Please try again in a minute.",
});
