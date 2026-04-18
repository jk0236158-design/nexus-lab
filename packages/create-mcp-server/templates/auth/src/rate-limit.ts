import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** Env var name that overrides the max-per-window. */
  maxEnvVar?: string;
  /** Env var name that overrides the window duration in ms. */
  windowMsEnvVar?: string;
  /** Fallback if the env var is unset or invalid. */
  defaultMax?: number;
  /** Fallback if the env var is unset or invalid. */
  defaultWindowMs?: number;
  /**
   * Resolves the bucket key from a request. Pre-auth limiters should key by
   * IP; post-auth limiters should key by `req.user?.id`. Returning a fixed
   * prefix (e.g. `ip:`) avoids collisions between the two modes.
   */
  keyResolver?: (req: Request) => string;
}

function readIntEnv(name: string | undefined, fallback: number): number {
  if (!name) return fallback;
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function defaultKeyResolver(req: Request): string {
  return (
    req.user?.id ??
    `ip:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`
  );
}

/**
 * In-memory sliding-window rate limiter.
 *
 * Configuration defaults (overridable per middleware instance):
 * - RATE_LIMIT_MAX        — Maximum requests per window (default: 100)
 * - RATE_LIMIT_WINDOW_MS  — Window duration in milliseconds (default: 60000)
 *
 * Responds with 429 Too Many Requests when the limit is exceeded, and sets
 * X-RateLimit-* headers on every response.
 *
 * For multi-instance deployments, swap this for a Redis-backed limiter.
 */
export function rateLimitMiddleware(
  options: RateLimitOptions = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    maxEnvVar = "RATE_LIMIT_MAX",
    windowMsEnvVar = "RATE_LIMIT_WINDOW_MS",
    defaultMax = 100,
    defaultWindowMs = 60_000,
    keyResolver = defaultKeyResolver,
  } = options;

  const store = new Map<string, RateLimitEntry>();

  const CLEANUP_INTERVAL_MS = 60_000;
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const max = readIntEnv(maxEnvVar, defaultMax);
    const windowMs = readIntEnv(windowMsEnvVar, defaultWindowMs);

    const clientId = keyResolver(req);

    const now = Date.now();
    let entry = store.get(clientId);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(clientId, entry);
    }

    entry.count++;

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
