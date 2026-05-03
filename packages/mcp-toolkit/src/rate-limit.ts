import { readIntEnv } from "./env.js";

/**
 * In-memory sliding-window rate limiter. Hoisted from the auth template's
 * `rate-limit.ts` (which itself was the canonical hardened version) and
 * re-shaped to be transport-agnostic — express middleware adapters live in
 * the templates themselves so this module has no express dependency.
 *
 * For multi-instance deployments, swap the in-memory store for a shared
 * implementation (Redis, etc.) by reusing the `RateLimitStore` interface.
 */

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, entry: RateLimitEntry): void;
  delete(key: string): void;
  entries(): IterableIterator<[string, RateLimitEntry]>;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly map = new Map<string, RateLimitEntry>();
  get(key: string): RateLimitEntry | undefined {
    return this.map.get(key);
  }
  set(key: string, entry: RateLimitEntry): void {
    this.map.set(key, entry);
  }
  delete(key: string): void {
    this.map.delete(key);
  }
  entries(): IterableIterator<[string, RateLimitEntry]> {
    return this.map.entries();
  }
}

export interface RateLimiterOptions {
  /** Maximum requests per window. */
  max: number;
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Optional injected clock for tests. Defaults to `Date.now`. */
  clock?: () => number;
  /** Optional injected store. Defaults to in-memory. */
  store?: RateLimitStore;
  /**
   * Cleanup interval for stale entries, in milliseconds. Defaults to 60s.
   * Pass 0 to disable the cleanup timer (useful in test contexts).
   */
  cleanupIntervalMs?: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  /** Total budget for the current window. */
  limit: number;
  /** Tokens left in the current window after this call. */
  remaining: number;
  /** ms until the window resets. */
  retryAfterMs: number;
  /** ms until the window resets, rounded up to seconds (for HTTP headers). */
  resetSeconds: number;
}

export class RateLimiter {
  private readonly store: RateLimitStore;
  private readonly clock: () => number;
  private readonly cleanupTimer: NodeJS.Timeout | null;

  constructor(private readonly options: RateLimiterOptions) {
    this.store = options.store ?? new MemoryRateLimitStore();
    this.clock = options.clock ?? Date.now;
    const cleanupMs = options.cleanupIntervalMs ?? 60_000;
    if (cleanupMs > 0) {
      this.cleanupTimer = setInterval(() => this.cleanup(), cleanupMs);
      // Allow the process to exit even if a cleanup tick is pending.
      if (typeof this.cleanupTimer.unref === "function") {
        this.cleanupTimer.unref();
      }
    } else {
      this.cleanupTimer = null;
    }
  }

  /**
   * Consume one token for the given key and return the resulting decision.
   * Always increments the counter — call sites that want a peek-without-consume
   * semantic should add their own gate before calling.
   */
  consume(key = "default"): RateLimitDecision {
    const now = this.clock();
    let entry = this.store.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + this.options.windowMs };
      this.store.set(key, entry);
    }
    entry.count++;
    const remaining = Math.max(0, this.options.max - entry.count);
    const retryAfterMs = Math.max(0, entry.resetAt - now);
    const resetSeconds = Math.ceil(retryAfterMs / 1000);
    const allowed = entry.count <= this.options.max;
    return {
      allowed,
      limit: this.options.max,
      remaining,
      retryAfterMs,
      resetSeconds,
    };
  }

  /** Drop entries whose window has already expired. */
  cleanup(): void {
    const now = this.clock();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  /** Stop the background cleanup timer. Idempotent. */
  dispose(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }
}

/**
 * Resolve `max` / `windowMs` from env vars with safe fallbacks. Mirrors the
 * (auth template) convention: `RATE_LIMIT_MAX` + `RATE_LIMIT_WINDOW_MS`,
 * but the env var names are configurable so a single process can host
 * multiple limiters with disjoint quotas (pre-auth vs post-auth).
 */
export interface ResolveRateLimitOptions {
  maxEnvVar?: string;
  windowMsEnvVar?: string;
  defaultMax: number;
  defaultWindowMs: number;
  env?: NodeJS.ProcessEnv;
}

export function resolveRateLimitFromEnv(
  options: ResolveRateLimitOptions,
): { max: number; windowMs: number } {
  const env = options.env ?? process.env;
  return {
    max: readIntEnv(options.maxEnvVar, options.defaultMax, env),
    windowMs: readIntEnv(
      options.windowMsEnvVar,
      options.defaultWindowMs,
      env,
    ),
  };
}
