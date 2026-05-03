const rateLimitStore = new Map();

export function createRateLimiter({
  windowMs = 60 * 1000,
  maxRequests = 10,
  message = "Too many requests. Please try again later.",
} = {}) {
  return (req, res, next) => {
    const key = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || record.expiresAt <= now) {
      rateLimitStore.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxRequests) {
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
