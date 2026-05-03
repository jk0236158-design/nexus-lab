import { describe, it, expect, afterEach } from "vitest";
import {
  RateLimiter,
  MemoryRateLimitStore,
  resolveRateLimitFromEnv,
} from "../src/rate-limit.js";

describe("RateLimiter.consume", () => {
  let limiter: RateLimiter;
  afterEach(() => limiter?.dispose());

  it("allows up to `max` calls within the window then blocks", () => {
    let now = 1_000;
    limiter = new RateLimiter({
      max: 3,
      windowMs: 1_000,
      clock: () => now,
      cleanupIntervalMs: 0,
    });
    expect(limiter.consume("k").allowed).toBe(true);
    expect(limiter.consume("k").allowed).toBe(true);
    expect(limiter.consume("k").allowed).toBe(true);
    const blocked = limiter.consume("k");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets the counter after the window expires", () => {
    let now = 1_000;
    limiter = new RateLimiter({
      max: 1,
      windowMs: 500,
      clock: () => now,
      cleanupIntervalMs: 0,
    });
    expect(limiter.consume("k").allowed).toBe(true);
    expect(limiter.consume("k").allowed).toBe(false);
    now += 600;
    expect(limiter.consume("k").allowed).toBe(true);
  });

  it("scopes counters per key", () => {
    let now = 1_000;
    limiter = new RateLimiter({
      max: 1,
      windowMs: 1_000,
      clock: () => now,
      cleanupIntervalMs: 0,
    });
    expect(limiter.consume("a").allowed).toBe(true);
    expect(limiter.consume("b").allowed).toBe(true);
    expect(limiter.consume("a").allowed).toBe(false);
  });

  it("reports limit / remaining / resetSeconds for HTTP-header use", () => {
    let now = 1_000;
    limiter = new RateLimiter({
      max: 5,
      windowMs: 2_000,
      clock: () => now,
      cleanupIntervalMs: 0,
    });
    const d = limiter.consume("k");
    expect(d.limit).toBe(5);
    expect(d.remaining).toBe(4);
    expect(d.resetSeconds).toBeGreaterThanOrEqual(1);
  });
});

describe("RateLimiter.cleanup", () => {
  it("removes expired entries", () => {
    let now = 1_000;
    const store = new MemoryRateLimitStore();
    const limiter = new RateLimiter({
      max: 1,
      windowMs: 100,
      clock: () => now,
      store,
      cleanupIntervalMs: 0,
    });
    limiter.consume("a");
    expect(store.get("a")).toBeDefined();
    now += 500;
    limiter.cleanup();
    expect(store.get("a")).toBeUndefined();
    limiter.dispose();
  });
});

describe("resolveRateLimitFromEnv", () => {
  it("falls back when env vars are missing", () => {
    const r = resolveRateLimitFromEnv({
      defaultMax: 10,
      defaultWindowMs: 1_000,
      env: {},
    });
    expect(r).toEqual({ max: 10, windowMs: 1_000 });
  });
  it("reads named env vars when provided", () => {
    const r = resolveRateLimitFromEnv({
      maxEnvVar: "MAX",
      windowMsEnvVar: "WIN",
      defaultMax: 10,
      defaultWindowMs: 1_000,
      env: { MAX: "50", WIN: "5000" },
    });
    expect(r).toEqual({ max: 50, windowMs: 5_000 });
  });
});
