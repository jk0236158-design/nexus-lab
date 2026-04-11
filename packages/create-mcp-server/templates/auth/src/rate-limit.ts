import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Configuration via environment variables:
 * - RATE_LIMIT_MAX        — Maximum requests per window (default: 100)
 * - RATE_LIMIT_WINDOW_MS  — Window duration in milliseconds (default: 60000)
 *
 * Responds with 429 Too Many Requests when the limit is exceeded,
 * and sets standard rate-limit headers on every response.
 */
export function rateLimitMiddleware(): (
  req: Request,
  res: Response,
  next: NextFunction,
) => void {
  const store = new Map<string, RateLimitEntry>();

  // Periodically clean up expired entries to prevent memory leaks
  const CLEANUP_INTERVAL_MS = 60_000;
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Allow the process to exit even if the timer is active
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const max = parseInt(process.env.RATE_LIMIT_MAX ?? "100", 10);
    const windowMs = parseInt(
      process.env.RATE_LIMIT_WINDOW_MS ?? "60000",
      10,
    );

    // Identify client by authenticated user or IP address
    const clientId =
      req.user?.id ?? req.ip ?? req.socket.remoteAddress ?? "unknown";

    const now = Date.now();
    let entry = store.get(clientId);

    // Reset window if expired or no entry exists
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(clientId, entry);
    }

    entry.count++;

    // Set rate-limit headers
    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetSeconds);

    if (entry.count > max) {
      res.setHeader("Retry-After", resetSeconds);
      res.status(429).json({
        error: "Too many requests",
        retryAfter: resetSeconds,
      });
      return;
    }

    next();
  };
}
