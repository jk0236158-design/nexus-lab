import { describe, it, expect, vi } from "vitest";
import { rateLimitMiddleware } from "../src/rate-limit.js";

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    ip: "1.2.3.4",
    socket: { remoteAddress: "1.2.3.4" },
    user: undefined,
    ...overrides,
  } as any;
}

function mockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    headers: {} as Record<string, string | number>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
    setHeader(key: string, value: string | number) {
      res.headers[key] = value;
      return res;
    },
  };
  return res;
}

describe("rateLimitMiddleware (pre-auth IP bucket)", () => {
  it("blocks unauthenticated floods keyed by IP before reaching auth layer", () => {
    process.env.PREAUTH_TEST_MAX = "2";
    process.env.PREAUTH_TEST_WINDOW = "60000";

    const limiter = rateLimitMiddleware({
      maxEnvVar: "PREAUTH_TEST_MAX",
      windowMsEnvVar: "PREAUTH_TEST_WINDOW",
      defaultMax: 2,
      defaultWindowMs: 60_000,
      keyResolver: (req) => `ip:${req.ip}`,
    });

    const req = mockReq();
    const res1 = mockRes();
    const res2 = mockRes();
    const res3 = mockRes();
    const next = vi.fn();

    limiter(req, res1, next);
    limiter(req, res2, next);
    limiter(req, res3, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res3.statusCode).toBe(429);
    expect(res3.body.error).toBe("Too many requests");
  });

  it("buckets are independent per IP", () => {
    const limiter = rateLimitMiddleware({
      defaultMax: 1,
      defaultWindowMs: 60_000,
      keyResolver: (req) => `ip:${req.ip}`,
      maxEnvVar: undefined,
      windowMsEnvVar: undefined,
    });

    const a = mockReq({ ip: "10.0.0.1" });
    const b = mockReq({ ip: "10.0.0.2" });

    const resA1 = mockRes();
    const resA2 = mockRes();
    const resB1 = mockRes();
    const next = vi.fn();

    limiter(a, resA1, next);
    limiter(a, resA2, next);
    limiter(b, resB1, next);

    // next called for a-first and b-first (2 total); a-second blocked.
    expect(next).toHaveBeenCalledTimes(2);
    expect(resA2.statusCode).toBe(429);
    expect(resB1.statusCode).toBe(200);
  });

  it("distinguishes ip: and user: keyed buckets so pre-auth and post-auth do not share tokens", () => {
    // Same IP, same fake user-id — but the keyResolver namespaces them
    // so exhausting the IP bucket does not also exhaust the user bucket.
    const ipLimiter = rateLimitMiddleware({
      defaultMax: 1,
      defaultWindowMs: 60_000,
      keyResolver: (req) => `ip:${req.ip}`,
    });
    const userLimiter = rateLimitMiddleware({
      defaultMax: 1,
      defaultWindowMs: 60_000,
      keyResolver: (req) => req.user?.id ?? "anon",
    });

    const req = mockReq({ user: { id: "alice" } });
    const next = vi.fn();

    const r1 = mockRes();
    ipLimiter(req, r1, next);
    expect(r1.statusCode).toBe(200);

    const r2 = mockRes();
    ipLimiter(req, r2, next);
    expect(r2.statusCode).toBe(429);

    // But the user-keyed limiter has not yet seen alice.
    const r3 = mockRes();
    userLimiter(req, r3, next);
    expect(r3.statusCode).toBe(200);
  });
});
