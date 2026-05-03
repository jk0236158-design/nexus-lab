import type { Request, Response, NextFunction } from "express";
import {
  RateLimiter,
  resolveRateLimitFromEnv,
} from "@nexus-lab/mcp-toolkit/rate-limit";

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

function defaultKeyResolver(req: Request): string {
  return (
    req.user?.id ?? `ip:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`
  );
}

/**
 * Express adapter around `@nexus-lab/mcp-toolkit/rate-limit`'s `RateLimiter`.
 *
 * The toolkit ships the storage / sliding-window logic; this adapter binds
 * it to express semantics (X-RateLimit-* headers, 429 + Retry-After body
 * shape, post-auth `req.user.id` keying). We re-resolve `max` / `windowMs`
 * on every request so test suites that toggle the env var mid-run see the
 * change immediately, matching the previous in-template implementation.
 *
 * Configuration defaults (overridable per middleware instance):
 * - RATE_LIMIT_MAX        — Maximum requests per window (default: 100)
 * - RATE_LIMIT_WINDOW_MS  — Window duration in milliseconds (default: 60000)
 *
 * For multi-instance deployments, swap the toolkit's `MemoryRateLimitStore`
 * for a shared (e.g. Redis-backed) implementation by injecting it via the
 * RateLimiter constructor and replacing this adapter accordingly.
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

  // Cache the limiter instance per (max, windowMs) pair to keep the
  // sliding-window store coherent. Re-creating the limiter on every
  // request would reset the bucket to zero each call.
  const limiterCache = new Map<string, RateLimiter>();

  const getLimiter = (): RateLimiter => {
    const { max, windowMs } = resolveRateLimitFromEnv({
      maxEnvVar,
      windowMsEnvVar,
      defaultMax,
      defaultWindowMs,
    });
    const key = `${max}:${windowMs}`;
    let limiter = limiterCache.get(key);
    if (!limiter) {
      limiter = new RateLimiter({ max, windowMs });
      limiterCache.set(key, limiter);
    }
    return limiter;
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    const limiter = getLimiter();
    const clientId = keyResolver(req);
    const decision = limiter.consume(clientId);

    res.setHeader("X-RateLimit-Limit", decision.limit);
    res.setHeader("X-RateLimit-Remaining", decision.remaining);
    res.setHeader("X-RateLimit-Reset", decision.resetSeconds);

    if (!decision.allowed) {
      res.setHeader("Retry-After", decision.resetSeconds);
      res.status(429).json({
        error: "Too many requests",
        retryAfter: decision.resetSeconds,
      });
      return;
    }

    next();
  };
}
