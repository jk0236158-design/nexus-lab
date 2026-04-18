import { describe, it, expect, beforeEach } from "vitest";
import {
  ProxyClient,
  RateLimiter,
  sanitizeResponseBody,
  buildUrl,
  type FetchLike,
} from "../src/proxy.js";
import type { ProxyConfig } from "../src/config.js";

function baseConfig(overrides: Partial<ProxyConfig> = {}): ProxyConfig {
  return {
    baseUrl: "https://api.example.com",
    bearerToken: undefined,
    apiKey: undefined,
    apiKeyHeader: "x-api-key",
    timeoutMs: 5_000,
    maxRetries: 0,
    rateLimitMax: 100,
    rateLimitWindowMs: 60_000,
    ...overrides,
  };
}

function mockJsonResponse(
  body: unknown,
  status = 200,
  contentType = "application/json",
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": contentType },
  });
}

describe("sanitizeResponseBody", () => {
  it("redacts secret values nested in strings", () => {
    const secrets = ["super-secret-token"];
    const body = {
      ok: true,
      echo: "your token was super-secret-token, handle carefully",
      nested: { token: "super-secret-token" },
      list: ["a", "super-secret-token", 1],
    };

    const result = sanitizeResponseBody(body, secrets) as typeof body;

    expect(result.echo).toContain("[REDACTED]");
    expect(result.echo).not.toContain("super-secret-token");
    expect(result.nested.token).toBe("[REDACTED]");
    expect(result.list[1]).toBe("[REDACTED]");
  });

  it("leaves the body untouched when no secrets are configured", () => {
    const body = { hello: "world" };
    expect(sanitizeResponseBody(body, [])).toBe(body);
  });

  it("handles non-object values safely", () => {
    expect(sanitizeResponseBody("plain text", ["s"])).toBe("plain text");
    expect(sanitizeResponseBody(42, ["s"])).toBe(42);
    expect(sanitizeResponseBody(null, ["s"])).toBeNull();
  });
});

describe("RateLimiter", () => {
  it("allows requests up to the limit then blocks", () => {
    let now = 1_000;
    const limiter = new RateLimiter(2, 10_000, () => now);

    expect(limiter.check().allowed).toBe(true);
    expect(limiter.check().allowed).toBe(true);

    const blocked = limiter.check();
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets the window when the clock advances past resetAt", () => {
    let now = 1_000;
    const limiter = new RateLimiter(1, 500, () => now);

    expect(limiter.check().allowed).toBe(true);
    expect(limiter.check().allowed).toBe(false);

    now += 600;
    expect(limiter.check().allowed).toBe(true);
  });
});

describe("ProxyClient.request", () => {
  let lastRequest: { url: string; init: RequestInit } | null;

  beforeEach(() => {
    lastRequest = null;
  });

  function makeFetch(response: Response | (() => Response)): FetchLike {
    return (async (url: string | URL | Request, init?: RequestInit) => {
      lastRequest = {
        url: typeof url === "string" ? url : url.toString(),
        init: init ?? {},
      };
      return typeof response === "function" ? response() : response;
    }) as FetchLike;
  }

  it("builds the URL with base + path + query", async () => {
    const client = new ProxyClient(baseConfig(), {
      fetchImpl: makeFetch(mockJsonResponse({ ok: true })),
    });

    await client.request({
      method: "GET",
      path: "/users",
      query: { page: 2, active: true },
    });

    expect(lastRequest).not.toBeNull();
    expect(lastRequest!.url).toBe(
      "https://api.example.com/users?page=2&active=true",
    );
  });

  it("attaches the Bearer token header but never leaks it in the response", async () => {
    const client = new ProxyClient(
      baseConfig({ bearerToken: "tok-abc-xyz" }),
      {
        fetchImpl: makeFetch(
          mockJsonResponse({ youSent: "tok-abc-xyz", other: 1 }),
        ),
      },
    );

    const response = await client.request({ method: "GET", path: "/me" });

    const headers = lastRequest!.init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer tok-abc-xyz");

    const body = response.body as { youSent: string };
    expect(body.youSent).toBe("[REDACTED]");
  });

  it("attaches the configured API key header", async () => {
    const client = new ProxyClient(
      baseConfig({ apiKey: "key-123", apiKeyHeader: "X-My-Key" }),
      { fetchImpl: makeFetch(mockJsonResponse({ ok: true })) },
    );

    await client.request({ method: "GET", path: "/x" });

    const headers = lastRequest!.init.headers as Record<string, string>;
    expect(headers["x-my-key"]).toBe("key-123");
  });

  it("serializes a JSON body on POST and sets content-type", async () => {
    const client = new ProxyClient(baseConfig(), {
      fetchImpl: makeFetch(mockJsonResponse({ created: true }, 201)),
    });

    await client.request({
      method: "POST",
      path: "/items",
      body: { name: "widget" },
    });

    const headers = lastRequest!.init.headers as Record<string, string>;
    expect(headers["content-type"]).toBe("application/json");
    expect(lastRequest!.init.body).toBe(JSON.stringify({ name: "widget" }));
  });

  it("does not send a body on GET even if one is passed", async () => {
    const client = new ProxyClient(baseConfig(), {
      fetchImpl: makeFetch(mockJsonResponse({ ok: true })),
    });

    await client.request({
      method: "GET",
      path: "/x",
      body: { nope: true },
    });

    expect(lastRequest!.init.body).toBeUndefined();
  });

  it("throws a rate-limit error when the bucket is exhausted", async () => {
    const limiter = new RateLimiter(1, 60_000, () => 1_000);
    const client = new ProxyClient(baseConfig(), {
      fetchImpl: makeFetch(mockJsonResponse({ ok: true })),
      rateLimiter: limiter,
    });

    await client.request({ method: "GET", path: "/x" });

    await expect(
      client.request({ method: "GET", path: "/x" }),
    ).rejects.toMatchObject({ code: "PROXY_RATE_LIMITED" });
  });

  it("returns ok=false and a safe error payload on a 4xx, not the upstream body", async () => {
    // v1.1.0: the upstream error body (which may carry stack traces,
    // internal hosts, SQL errors, echoed credentials) must NOT be forwarded
    // to the MCP client. Only a stable error code/message is returned.
    const client = new ProxyClient(baseConfig(), {
      fetchImpl: makeFetch(
        mockJsonResponse(
          {
            error: "not found",
            stack: "at /srv/app/handlers/users.js:42\n  at db:10.0.0.5",
            sql: "SELECT * FROM internal_users WHERE id=?",
          },
          404,
        ),
      ),
      logUpstreamErrors: false,
    });

    const response = await client.request({ method: "GET", path: "/x" });
    expect(response.status).toBe(404);
    expect(response.ok).toBe(false);
    const body = response.body as Record<string, unknown>;
    expect(body.error).toBe("UPSTREAM_NOT_FOUND");
    expect(JSON.stringify(body)).not.toContain("stack");
    expect(JSON.stringify(body)).not.toContain("10.0.0.5");
    expect(JSON.stringify(body)).not.toContain("SELECT");
  });

  it("retries once on a 5xx when maxRetries=1 and returns the second response", async () => {
    let calls = 0;
    const client = new ProxyClient(baseConfig({ maxRetries: 1 }), {
      fetchImpl: makeFetch(() => {
        calls++;
        return calls === 1
          ? mockJsonResponse({ err: "boom" }, 503)
          : mockJsonResponse({ ok: true }, 200);
      }),
    });

    const response = await client.request({ method: "GET", path: "/x" });
    expect(calls).toBe(2);
    expect(response.ok).toBe(true);
  });

  it("handles non-JSON responses by returning text", async () => {
    const textResponse = new Response("plain body", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
    const client = new ProxyClient(baseConfig(), {
      fetchImpl: makeFetch(textResponse),
    });

    const response = await client.request({ method: "GET", path: "/x" });
    expect(response.body).toBe("plain body");
  });
});
