import { describe, it, expect } from "vitest";
import {
  ProxyClient,
  RateLimiter,
  buildUrl,
  sanitizePathForLog,
  type FetchLike,
} from "../src/proxy.js";
import {
  loadConfig,
  describeUpstreamForLog,
  type ProxyConfig,
} from "../src/config.js";

function baseConfig(overrides: Partial<ProxyConfig> = {}): ProxyConfig {
  return {
    baseUrl: "https://api.example.com/v1",
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("buildUrl path-traversal defence", () => {
  const base = "https://api.example.com/v1";

  it("accepts simple relative paths under the base prefix", () => {
    expect(buildUrl(base, "/users", undefined)).toBe(
      "https://api.example.com/v1/users",
    );
    expect(buildUrl(base, "users/42", undefined)).toBe(
      "https://api.example.com/v1/users/42",
    );
  });

  it("rejects literal `..` segments", () => {
    expect(() => buildUrl(base, "/../admin", undefined)).toThrow(
      /traversal|prefix|origin/i,
    );
    expect(() => buildUrl(base, "/users/../admin", undefined)).toThrow(
      /traversal|prefix|origin/i,
    );
  });

  it("rejects percent-encoded dot segments (%2e%2e and mixed case)", () => {
    expect(() => buildUrl(base, "/%2e%2e/admin", undefined)).toThrow(
      /traversal|prefix|origin/i,
    );
    expect(() => buildUrl(base, "/%2E%2E/admin", undefined)).toThrow(
      /traversal|prefix|origin/i,
    );
    expect(() => buildUrl(base, "/users/%2e%2e/admin", undefined)).toThrow(
      /traversal|prefix|origin/i,
    );
  });

  it("rejects backslash-separated dot segments", () => {
    expect(() => buildUrl(base, "\\..\\admin", undefined)).toThrow(
      /traversal|prefix|origin/i,
    );
  });

  it("rejects paths that would resolve to a different origin", () => {
    // Protocol-relative would escape origin — ensure caught.
    expect(() => buildUrl(base, "//evil.example.com/x", undefined)).toThrow();
  });

  it("rejects null bytes", () => {
    expect(() => buildUrl(base, "/users\0/admin", undefined)).toThrow();
  });

  it("rejects paths that stay same-origin but escape the base path prefix", () => {
    // Base = /v1, but resolved path becomes / (root) — outside the prefix.
    // With the current implementation, "/../users" normalizes to /users
    // without the /v1 prefix. Our check must catch that even though the
    // origin matches.
    expect(() => buildUrl("https://api.example.com/v1", "/../users", undefined)).toThrow(
      /traversal|prefix|origin/i,
    );
  });

  it("rejects `@` in the path (userinfo-separator confusion)", () => {
    expect(() => buildUrl(base, "/@evil.example.com/x", undefined)).toThrow(
      /@|userinfo/i,
    );
    expect(() => buildUrl(base, "/users@evil.com", undefined)).toThrow(
      /@|userinfo/i,
    );
  });

  it("rejects percent-encoded `@` in the path", () => {
    // `%40` decodes to `@`. Must be caught after the decode step, not just
    // the pre-decode check.
    expect(() => buildUrl(base, "/%40evil.example.com", undefined)).toThrow(
      /@|userinfo/i,
    );
  });

  it("rejects a leading `/..` the Kagami case explicitly", () => {
    // Exact variant Kagami called out — path=/../admin against a base
    // with a /v1 prefix.
    expect(() =>
      buildUrl("https://api.example.com/v1", "/../admin", undefined),
    ).toThrow(/traversal|prefix|origin/i);
  });

  it("rejects `\\..\\..\\admin` style Windows-traversal", () => {
    expect(() =>
      buildUrl("https://api.example.com/v1", "\\..\\..\\admin", undefined),
    ).toThrow(/traversal|prefix|origin|protocol|relative/i);
  });

  // N5 explicit contract documentation: prove `@` is caught at multiple
  // layers (pre-decode string check, post-decode string check, and — if
  // those ever regress — post-composition origin re-verification). Each
  // test locks one contract boundary.

  it("rejects `/@evil.com/admin` at the pre-decode layer", () => {
    // Canonical @ injection — must be stopped before URL composition.
    expect(() =>
      buildUrl("https://api.example.com/v1", "/@evil.com/admin", undefined),
    ).toThrow(/@|userinfo/i);
  });

  it("rejects `/users@evil.com` (segment-internal `@`) at the pre-decode layer", () => {
    // Even when `@` is not the first char, host-flip is possible if a
    // later concat drops the separator. Must be refused outright.
    expect(() =>
      buildUrl("https://api.example.com/v1", "/users@evil.com", undefined),
    ).toThrow(/@|userinfo/i);
  });

  it("rejects `%40evil.com` at the post-decode layer", () => {
    // Percent-encoded `@` must be caught after decodeURIComponent.
    expect(() =>
      buildUrl("https://api.example.com/v1", "/%40evil.com/admin", undefined),
    ).toThrow(/@|userinfo/i);
  });

  it("post-composition origin check still holds when base path is empty", () => {
    // Base without a path prefix: the only defence against host-flip is
    // the origin-re-check. Assert it is active by choosing a path that
    // would, absent the check, be composed into a different origin.
    // (Our pre-check on `//` already covers this; this test documents
    // that removing the pre-check must not silently re-open the hole.)
    expect(() =>
      buildUrl("https://api.example.com", "//evil.example.com/x", undefined),
    ).toThrow();
  });

  it("explicitly documents that leading `/..` and segment `..` are both refused", () => {
    // Kagami contract: both variants must be rejected. Mirror the two
    // canonical cases in one place so future refactors cannot drop one.
    expect(() =>
      buildUrl("https://api.example.com/v1", "/../admin", undefined),
    ).toThrow(/traversal|prefix|origin/i);
    expect(() =>
      buildUrl("https://api.example.com/v1", "/users/../admin", undefined),
    ).toThrow(/traversal|prefix|origin/i);
  });
});

describe("ProxyClient rate-limit consumption per attempt", () => {
  it("consumes a rate-limit token on every fetch attempt, not just once per request", async () => {
    // maxRetries=2 → up to 3 attempts. Bucket of size 1 means a
    // retry-eligible (5xx) first response must trigger PROXY_RATE_LIMITED
    // on the second attempt rather than silently continuing.
    const limiter = new RateLimiter(1, 60_000, () => 1_000);
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return jsonResponse({ err: "boom" }, 503);
    }) as FetchLike;

    const client = new ProxyClient(baseConfig({ maxRetries: 2 }), {
      fetchImpl,
      rateLimiter: limiter,
      logUpstreamErrors: false,
    });

    await expect(
      client.request({ method: "GET", path: "/x" }),
    ).rejects.toMatchObject({ code: "PROXY_RATE_LIMITED" });

    // Exactly ONE upstream call happened — the second attempt was blocked
    // by the limiter before reaching fetch.
    expect(calls).toBe(1);
  });

  it("does not allow maxRetries to multiply the effective outbound budget", async () => {
    // With the old behaviour (one limiter consumption per request),
    // maxRetries=4 and rateLimitMax=2 would allow 2*(4+1) = 10 outbound
    // requests inside one window. After fix, max must be bounded by the
    // limiter (2 total, regardless of retries).
    const limiter = new RateLimiter(2, 60_000, () => 1_000);
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return jsonResponse({ err: "boom" }, 503);
    }) as FetchLike;

    const client = new ProxyClient(baseConfig({ maxRetries: 4 }), {
      fetchImpl,
      rateLimiter: limiter,
      logUpstreamErrors: false,
    });

    await expect(
      client.request({ method: "GET", path: "/a" }),
    ).rejects.toMatchObject({ code: "PROXY_RATE_LIMITED" });

    expect(calls).toBeLessThanOrEqual(2);
  });
});

describe("Upstream error body is never forwarded verbatim", () => {
  it("replaces 4xx body with a safe error code and drops stack/host/SQL", async () => {
    const client = new ProxyClient(baseConfig(), {
      fetchImpl: (async () =>
        jsonResponse(
          {
            message: "DB exploded",
            stack: "at /srv/app/db.ts:42 (10.0.0.5:5432)",
            sql: "SELECT password FROM users WHERE id = 1",
          },
          500,
        )) as FetchLike,
      logUpstreamErrors: false,
    });

    const response = await client.request({ method: "GET", path: "/x" });
    expect(response.ok).toBe(false);
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain("DB exploded");
    expect(serialized).not.toContain("10.0.0.5");
    expect(serialized).not.toContain("SELECT");
    expect((response.body as { error: string }).error).toMatch(/^UPSTREAM_/);
  });

  it("still returns upstream JSON on 2xx (happy path untouched)", async () => {
    const client = new ProxyClient(baseConfig(), {
      fetchImpl: (async () => jsonResponse({ id: 1, name: "ok" })) as FetchLike,
    });
    const response = await client.request({ method: "GET", path: "/x" });
    expect(response.ok).toBe(true);
    expect(response.body).toEqual({ id: 1, name: "ok" });
  });
});

describe("Config startup-log masking", () => {
  it("describeUpstreamForLog returns only origin, never path/query/userinfo", () => {
    const config: ProxyConfig = {
      baseUrl: "https://api.example.com:8443/v1/secret-path",
      bearerToken: undefined,
      apiKey: undefined,
      apiKeyHeader: "x-api-key",
      timeoutMs: 1000,
      maxRetries: 0,
      rateLimitMax: 10,
      rateLimitWindowMs: 1000,
    };
    const out = describeUpstreamForLog(config);
    expect(out).toBe("https://api.example.com:8443");
    expect(out).not.toContain("secret-path");
  });

  it("loadConfig rejects userinfo in UPSTREAM_BASE_URL to avoid log leaks", () => {
    expect(() =>
      loadConfig({
        UPSTREAM_BASE_URL: "https://alice:s3cret@api.example.com/v1",
      } as NodeJS.ProcessEnv),
    ).toThrow(/userinfo/i);
  });

  it("loadConfig invalid-URL error does NOT echo the offending value (secret-safe)", () => {
    const secretLookingUrl = "not-a-url-with-super-secret-token-xyz";
    try {
      loadConfig({ UPSTREAM_BASE_URL: secretLookingUrl } as NodeJS.ProcessEnv);
      throw new Error("expected loadConfig to throw");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      expect(message).not.toContain(secretLookingUrl);
    }
  });
});

describe("Redirect handling (never follow — credential-leak defence)", () => {
  it("passes `redirect: manual` to fetch so auth headers cannot follow a 3xx to another host", async () => {
    let capturedInit: RequestInit | null = null;
    const fetchImpl = (async (_url: unknown, init?: RequestInit) => {
      capturedInit = init ?? null;
      return jsonResponse({ ok: true });
    }) as FetchLike;

    const client = new ProxyClient(
      baseConfig({ bearerToken: "tok-xyz" }),
      { fetchImpl, logUpstreamErrors: false },
    );

    await client.request({ method: "GET", path: "/x" });

    expect(capturedInit).not.toBeNull();
    expect((capturedInit as RequestInit).redirect).toBe("manual");
  });

  it("refuses a 302 and returns UPSTREAM_REDIRECT_BLOCKED instead of following", async () => {
    // Simulate what undici/node-fetch does with redirect:manual + 3xx:
    // the Response is returned with the 3xx status intact.
    const redirectResponse = new Response("", {
      status: 302,
      headers: { location: "https://evil.example.com/steal" },
    });
    const client = new ProxyClient(baseConfig({ bearerToken: "tok-xyz" }), {
      fetchImpl: (async () => redirectResponse) as FetchLike,
      logUpstreamErrors: false,
    });

    const response = await client.request({ method: "GET", path: "/x" });

    expect(response.ok).toBe(false);
    expect((response.body as { error: string }).error).toBe(
      "UPSTREAM_REDIRECT_BLOCKED",
    );
    // Must not leak the target host back to the agent
    expect(JSON.stringify(response.body)).not.toContain("evil.example.com");
  });

  // Exhaustive: every 3xx status the HTTP spec defines must be refused,
  // not just 302. 307/308 in particular preserve method + body + headers
  // on follow, which would leak Authorization even more silently than a
  // 302 does.
  const REDIRECT_STATUSES = [301, 302, 303, 307, 308] as const;
  for (const status of REDIRECT_STATUSES) {
    it(`refuses a ${status} redirect with UPSTREAM_REDIRECT_BLOCKED`, async () => {
      const redirectResponse = new Response("", {
        status,
        headers: { location: "https://evil.example.com/steal" },
      });
      const client = new ProxyClient(baseConfig({ bearerToken: "tok-xyz" }), {
        fetchImpl: (async () => redirectResponse) as FetchLike,
        logUpstreamErrors: false,
      });

      const response = await client.request({ method: "GET", path: "/x" });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(status);
      expect((response.body as { error: string }).error).toBe(
        "UPSTREAM_REDIRECT_BLOCKED",
      );
      expect(JSON.stringify(response.body)).not.toContain("evil.example.com");
    });
  }

  it("refuses an opaqueredirect (spec-mode fetch response) the same way", async () => {
    // Some fetch engines surface manual redirects as status 0 with
    // `type: 'opaqueredirect'`. We must treat that as a refused redirect
    // identically, not as a success.
    const opaque = {
      status: 0,
      ok: false,
      type: "opaqueredirect" as const,
      headers: new Headers(),
      json: async () => null,
      text: async () => "",
    } as unknown as Response;

    const client = new ProxyClient(baseConfig(), {
      fetchImpl: (async () => opaque) as FetchLike,
      logUpstreamErrors: false,
    });

    const response = await client.request({ method: "GET", path: "/x" });
    expect(response.ok).toBe(false);
    expect((response.body as { error: string }).error).toBe(
      "UPSTREAM_REDIRECT_BLOCKED",
    );
  });
});

describe("Error scrubbing (cause chain redaction)", () => {
  it("redacts configured secrets from the thrown Error message", async () => {
    const secret = "tok-super-secret";
    const fetchImpl = (async () => {
      throw new Error(
        `connect ECONNREFUSED 10.0.0.5 for Bearer ${secret} at /internal`,
      );
    }) as FetchLike;

    const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
      fetchImpl,
      logUpstreamErrors: false,
    });

    await expect(
      client.request({ method: "GET", path: "/x" }),
    ).rejects.toMatchObject({
      message: expect.not.stringContaining(secret),
    });
  });

  it("walks the cause chain and redacts secrets at every level", async () => {
    const secret = "tok-nested";
    const fetchImpl = (async () => {
      const inner = new Error(`raw leak: ${secret}`);
      const outer = new Error(`fetch failed (${secret})`, { cause: inner });
      throw outer;
    }) as FetchLike;

    const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
      fetchImpl,
      logUpstreamErrors: false,
    });

    try {
      await client.request({ method: "GET", path: "/x" });
      throw new Error("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      const e = err as Error & { cause?: unknown };
      expect(e.message).not.toContain(secret);
      const cause = e.cause as Error | undefined;
      expect(cause?.message).not.toContain(secret);
    }
  });

  it("terminates on a self-referential cause (err.cause === err)", async () => {
    // Catastrophic regression case: before the WeakSet guard, a cycle
    // here would recurse until the stack blew. Must complete promptly
    // and still redact the top-level message.
    const secret = "tok-cycle-self";
    const fetchImpl = (async () => {
      const e: Error & { cause?: unknown } = new Error(
        `boom with ${secret} in it`,
      );
      e.cause = e;
      throw e;
    }) as FetchLike;

    const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
      fetchImpl,
      logUpstreamErrors: false,
    });

    try {
      await client.request({ method: "GET", path: "/x" });
      throw new Error("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).not.toContain(secret);
    }
  });

  it("terminates on a two-node cycle (a.cause=b; b.cause=a)", async () => {
    const secret = "tok-cycle-ab";
    const fetchImpl = (async () => {
      const a: Error & { cause?: unknown } = new Error(`a carries ${secret}`);
      const b: Error & { cause?: unknown } = new Error(`b carries ${secret}`);
      a.cause = b;
      b.cause = a;
      throw a;
    }) as FetchLike;

    const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
      fetchImpl,
      logUpstreamErrors: false,
    });

    try {
      await client.request({ method: "GET", path: "/x" });
      throw new Error("expected to throw");
    } catch (err) {
      const top = err as Error & { cause?: Error };
      expect(top.message).not.toContain(secret);
      expect(top.cause?.message).not.toContain(secret);
      // Cycle structure preserved; we just broke the walk.
      expect(top.cause?.cause).toBe(top);
    }
  });
});

describe("Non-ok body is bounded and redacted before logging (P1 DoS + leak)", () => {
  it("cancels a huge non-ok body instead of reading it fully into memory", async () => {
    // Emit a never-ending body; the proxy must cap reads and cancel,
    // not buffer forever.
    let chunksEmitted = 0;
    let cancelled = false;
    const bigChunk = new Uint8Array(4096).fill(0x41); // 'A' × 4KB

    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        // Keep filling until someone cancels us. If the proxy reads the
        // full body, this test will time out instead of passing.
        if (chunksEmitted < 10_000 && !cancelled) {
          chunksEmitted++;
          controller.enqueue(bigChunk);
        } else {
          controller.close();
        }
      },
      cancel() {
        cancelled = true;
      },
    });

    const hugeResponse = new Response(stream, {
      status: 500,
      headers: { "content-type": "text/plain" },
    });

    const client = new ProxyClient(baseConfig(), {
      fetchImpl: (async () => hugeResponse) as FetchLike,
      logUpstreamErrors: true, // exercise the log path
    });

    // Silence the expected console.error so test output stays clean.
    const originalError = console.error;
    console.error = () => {};
    try {
      const response = await client.request({ method: "GET", path: "/x" });
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      // Proof of the cap: we should have emitted only a small number of
      // 4KB chunks before the proxy cancelled (ERROR_LOG_BYTE_CAP=2048
      // means one partial chunk). A pathological read-everything would
      // either time out or push chunksEmitted to the full 10000.
      expect(chunksEmitted).toBeLessThan(10);
      expect(cancelled).toBe(true);
    } finally {
      console.error = originalError;
    }
  });

  it("redacts configured secrets BEFORE handing the body snippet to console.error", async () => {
    const secret = "tok-echoed-in-error-page";
    const errorBody = `{"error":"db exploded","debug":"Bearer ${secret} at 10.0.0.5"}`;
    const response = new Response(errorBody, {
      status: 500,
      headers: { "content-type": "application/json" },
    });

    const logged: unknown[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(...args);
    };

    try {
      const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
        fetchImpl: (async () => response) as FetchLike,
        logUpstreamErrors: true,
      });
      const result = await client.request({ method: "GET", path: "/x" });
      expect(result.ok).toBe(false);

      // The raw bearer token must never appear in any console.error arg.
      const serialized = logged.map((a) => String(a)).join(" ");
      expect(serialized).not.toContain(secret);
      expect(serialized).toContain("[REDACTED]");
    } finally {
      console.error = originalError;
    }
  });

  it("redacts secrets in req.path before logging (non-ok branch)", async () => {
    // Codex 4th-pass #1: req.path is agent-controlled. Query strings
    // can carry tokens. The non-ok log line must redact it.
    const secret = "tok-in-path";
    const response = new Response('{"error":"nope"}', {
      status: 500,
      headers: { "content-type": "application/json" },
    });

    const logged: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(args.map((a) => String(a)).join(" "));
    };

    try {
      const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
        fetchImpl: (async () => response) as FetchLike,
        logUpstreamErrors: true,
      });
      await client.request({
        method: "GET",
        path: `/callback?state=abc&token=${secret}`,
      });

      const joined = logged.join("\n");
      expect(joined).not.toContain(secret);
      expect(joined).toContain("[REDACTED]");
    } finally {
      console.error = originalError;
    }
  });

  it("strips dynamic (unconfigured) query tokens from the log line", async () => {
    // Codex 5th-pass: `redactString` only knows about configured
    // secrets. An agent calling `/oauth/callback?access_token=UNKNOWN`
    // where UNKNOWN was never registered used to leak to stderr
    // verbatim. Now the whole query is `[REDACTED]`.
    const response = new Response('{"error":"nope"}', {
      status: 500,
      headers: { "content-type": "application/json" },
    });

    const logged: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(args.map((a) => String(a)).join(" "));
    };

    try {
      const client = new ProxyClient(baseConfig(), {
        fetchImpl: (async () => response) as FetchLike,
        logUpstreamErrors: true,
      });
      await client.request({
        method: "GET",
        path: "/oauth/callback?access_token=UNKNOWN_DYN_TOKEN&state=xyz",
      });

      const firstLine = logged[0] ?? "";
      expect(firstLine).not.toContain("UNKNOWN_DYN_TOKEN");
      expect(firstLine).not.toContain("state=xyz");
      expect(firstLine).toContain("/oauth/callback?[REDACTED]");
    } finally {
      console.error = originalError;
    }
  });

  it("strips URL-encoded secrets that literal match would miss", async () => {
    // Codex 5th-pass: a configured secret `tok/abc` would NOT match
    // `tok%2Fabc` via `redactString` (literal `.includes`). Since the
    // whole query is blanked, encoding no longer matters.
    const secret = "tok/abc";
    const response = new Response('{"error":"nope"}', { status: 500 });

    const logged: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(args.map((a) => String(a)).join(" "));
    };

    try {
      const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
        fetchImpl: (async () => response) as FetchLike,
        logUpstreamErrors: true,
      });
      await client.request({
        method: "GET",
        path: "/resource?key=tok%2Fabc",
      });

      const firstLine = logged[0] ?? "";
      // Neither the raw nor the encoded form should appear.
      expect(firstLine).not.toContain("tok/abc");
      expect(firstLine).not.toContain("tok%2Fabc");
      expect(firstLine).toContain("/resource?[REDACTED]");
    } finally {
      console.error = originalError;
    }
  });

  it("strips fragments (hash) from the log line too", async () => {
    // Fragments never reach the server in practice, but the proxy
    // doesn't parse the path — if someone crafts one, we must not
    // log it verbatim. `#[REDACTED]` placeholder confirms we handle
    // hash as aggressively as query.
    const response = new Response("", { status: 500 });

    const logged: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(args.map((a) => String(a)).join(" "));
    };

    try {
      const client = new ProxyClient(baseConfig(), {
        fetchImpl: (async () => response) as FetchLike,
        logUpstreamErrors: true,
      });
      await client.request({
        method: "GET",
        path: "/page#token=embedded-fragment-secret",
      });

      const firstLine = logged[0] ?? "";
      expect(firstLine).not.toContain("embedded-fragment-secret");
      expect(firstLine).toContain("/page#[REDACTED]");
    } finally {
      console.error = originalError;
    }
  });

  it("strips URL-encoded secrets that appear in the pathname itself", async () => {
    // Codex 6th-pass: the 5th-pass fix blanked query/hash but
    // pathname-level encoded secrets slipped through. A configured
    // secret `tok/abc` appearing as `/resource/tok%2Fabc` used to log
    // verbatim. Now the whole pathname is replaced with
    // `[REDACTED-PATH]` when the decoded form matches a secret.
    const secret = "tok/abc";
    const response = new Response('{"error":"nope"}', { status: 500 });

    const logged: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(args.map((a) => String(a)).join(" "));
    };

    try {
      const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
        fetchImpl: (async () => response) as FetchLike,
        logUpstreamErrors: true,
      });
      await client.request({
        method: "GET",
        path: "/resource/tok%2Fabc",
      });

      const firstLine = logged[0] ?? "";
      // Neither encoded nor decoded form should be visible.
      expect(firstLine).not.toContain("tok/abc");
      expect(firstLine).not.toContain("tok%2Fabc");
      expect(firstLine).toContain("[REDACTED-PATH]");
    } finally {
      console.error = originalError;
    }
  });

  it("handles malformed percent-encoding in the pathname without throwing", () => {
    // Codex 6th-pass — decodeURIComponent throws on `%GG`. The helper
    // itself must treat that as hostile input and return a placeholder
    // rather than propagate the exception.
    //
    // (We exercise `sanitizePathForLog` directly here rather than via
    // `ProxyClient.request`, because `buildUrl`'s own path-traversal
    // defence rejects `%GG` before the request ever reaches the log
    // line. The helper's defensive branch is still load-bearing for
    // anyone who extends the proxy with looser path validation.)
    const out = sanitizePathForLog("/resource/%GG", ["secret"]);
    expect(out).toBe("[REDACTED-MALFORMED-PATH]");
  });

  it("leaves normal pathnames unchanged (no round-trip double-decode regression)", async () => {
    // Make sure the decode check doesn't false-trigger on ordinary
    // paths. `/users/42` has no encoded sequences, so the redacted
    // pathname should equal the literal.
    const response = new Response('{"error":"nope"}', { status: 500 });
    const logged: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(args.map((a) => String(a)).join(" "));
    };

    try {
      const client = new ProxyClient(baseConfig({ bearerToken: "unrelated" }), {
        fetchImpl: (async () => response) as FetchLike,
        logUpstreamErrors: true,
      });
      await client.request({ method: "GET", path: "/users/42" });

      const firstLine = logged[0] ?? "";
      expect(firstLine).toContain("/users/42");
      // Must NOT have gotten wholesale-redacted.
      expect(firstLine).not.toContain("[REDACTED-PATH]");
      expect(firstLine).not.toContain("[REDACTED-MALFORMED-PATH]");
    } finally {
      console.error = originalError;
    }
  });

  it("redacts secrets in req.path before logging (redirect branch)", async () => {
    // Codex 4th-pass #1: same for the redirect branch's log line.
    const secret = "tok-in-redirect-path";
    const redirectResponse = new Response("", {
      status: 302,
      headers: { location: "https://evil.example.com/x" },
    });

    const logged: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(args.map((a) => String(a)).join(" "));
    };

    try {
      const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
        fetchImpl: (async () => redirectResponse) as FetchLike,
        logUpstreamErrors: true,
      });
      await client.request({
        method: "GET",
        path: `/oauth/callback?access_token=${secret}`,
      });

      const joined = logged.join("\n");
      expect(joined).not.toContain(secret);
      expect(joined).toContain("[REDACTED]");
    } finally {
      console.error = originalError;
    }
  });

  it("does not read the body on a retry-eligible 5xx that will be retried", async () => {
    // Before the fix, every attempt parsed the full body. Now a
    // retriable status should `cancel()` the body and go straight back
    // into the retry loop — faster and without buffering.
    let bodyStartedReading = false;
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        bodyStartedReading = true;
        controller.enqueue(new Uint8Array(1024));
        controller.close();
      },
      cancel() {
        cancelled = true;
      },
    });
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      if (calls === 1) {
        return new Response(stream, { status: 503 });
      }
      return jsonResponse({ ok: true });
    }) as FetchLike;

    const client = new ProxyClient(baseConfig({ maxRetries: 1 }), {
      fetchImpl,
      logUpstreamErrors: false,
    });

    const response = await client.request({ method: "GET", path: "/x" });
    expect(response.ok).toBe(true);
    expect(calls).toBe(2);
    // Either the body never started, or it was cancelled. Both are OK
    // — what matters is it wasn't buffered into memory.
    expect(cancelled || !bodyStartedReading).toBe(true);
  });

  it("caps memory even when a single chunk is larger than ERROR_LOG_BYTE_CAP", async () => {
    // Codex re-review #1: the previous implementation allocated
    // Uint8Array(total) where `total` grew by full chunk sizes, so a
    // single 10MB chunk bypassed the 2KB cap. This test proves the
    // cap now bounds the buffer regardless of chunk size.
    const giantChunk = new Uint8Array(10 * 1024 * 1024).fill(0x42); // 10MB "B"s
    let cancelled = false;
    // Keep the stream OPEN after emitting the giant chunk. A
    // controller.close() after enqueue would drain the queue first and
    // deliver `done` without ever invoking the cancel() callback — not
    // representative of a real upstream that keeps the socket alive.
    // Here we enqueue once and then wait: the proxy must slice to cap,
    // break, and cancel() the reader (which fires this stream's cancel).
    let delivered = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (!delivered) {
          delivered = true;
          controller.enqueue(giantChunk);
        }
        // Intentionally no close() — simulate a live socket.
      },
      cancel() {
        cancelled = true;
      },
    });

    const logged: unknown[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(...args);
    };

    try {
      const client = new ProxyClient(baseConfig(), {
        fetchImpl: (async () =>
          new Response(stream, { status: 500 })) as FetchLike,
        logUpstreamErrors: true,
      });

      const response = await client.request({ method: "GET", path: "/x" });
      expect(response.ok).toBe(false);

      // The logged snippet string must be bounded by the cap (plus the
      // truncation suffix), NOT by the 10MB chunk size.
      const logEntries = logged.filter(
        (a): a is string => typeof a === "string",
      );
      const snippet = logEntries.find((s) => s.includes("[truncated]"));
      expect(snippet).toBeDefined();
      // Cap 2048 + decorative suffix "…[truncated]" — generous upper
      // bound of a few hundred extra chars for UTF-8 / suffix / slack.
      expect(snippet!.length).toBeLessThan(4096);
      // The stream was left open, so the cap-break must have triggered
      // reader.cancel(), which fires this callback.
      expect(cancelled).toBe(true);
    } finally {
      console.error = originalError;
    }
  });

  it("returns a placeholder rather than hanging on a read() that never resolves", async () => {
    // Codex re-review #1: each reader.read() is now raced against a
    // timeout. A never-resolving stream must not block the request.
    const stream = new ReadableStream<Uint8Array>({
      start() {
        // Never enqueue, never close — reads will hang forever without
        // the timeout guard.
      },
    });

    const originalError = console.error;
    console.error = () => {};
    try {
      const client = new ProxyClient(baseConfig(), {
        fetchImpl: (async () =>
          new Response(stream, { status: 500 })) as FetchLike,
        logUpstreamErrors: true,
      });

      // If the read-timeout isn't wired up, this promise never resolves
      // and vitest kills the test — which would fail. With the timeout,
      // request() returns cleanly with the safe error payload.
      const started = Date.now();
      const response = await client.request({ method: "GET", path: "/x" });
      const elapsed = Date.now() - started;

      expect(response.ok).toBe(false);
      expect((response.body as { error: string }).error).toBe(
        "UPSTREAM_SERVER_ERROR",
      );
      // Should complete well under the proxy's main timeout (5s in
      // baseConfig) because the read-timeout is 500ms.
      expect(elapsed).toBeLessThan(3000);
    } finally {
      console.error = originalError;
    }
  });
});

describe("Redirect branch also drains the body (P1 #2)", () => {
  it("cancels the body of a 3xx redirect so the socket is released", async () => {
    // Codex re-review #2: the redirect branch returned BEFORE
    // discarding the body, leaving the stream pinned. A redirect
    // response can legitimately carry a body (HTML fallback,
    // attacker-controlled content); we must cancel it unconditionally.
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(1024).fill(0x44));
        // Don't close — simulate a socket that keeps the response open.
      },
      cancel() {
        cancelled = true;
      },
    });

    const redirectResponse = new Response(stream, {
      status: 302,
      headers: { location: "https://evil.example.com/steal" },
    });

    const client = new ProxyClient(baseConfig({ bearerToken: "tok-abc" }), {
      fetchImpl: (async () => redirectResponse) as FetchLike,
      logUpstreamErrors: false,
    });

    const response = await client.request({ method: "GET", path: "/x" });
    expect(response.ok).toBe(false);
    expect((response.body as { error: string }).error).toBe(
      "UPSTREAM_REDIRECT_BLOCKED",
    );
    expect(cancelled).toBe(true);
  });
});

describe("scrubError: deep chains and stack redaction (P1 #3)", () => {
  it("redacts secrets from a depth-11 (non-cyclic) cause chain, including at the cap boundary", async () => {
    // Codex re-review #3: Codex executed depth=12 and found the
    // secret. We rebuild that scenario: top Error plus 11 nested
    // non-cyclic causes, each carrying the secret. The previous
    // `depth >= SCRUB_MAX_DEPTH` early-return left the cap-boundary
    // Error un-redacted; the new contract is "always redact this
    // node's own strings, even when the cap truncates the rest".
    const secret = "tok-depth-11-probe";

    const build = (depth: number): Error & { cause?: unknown } => {
      const e: Error & { cause?: unknown } = new Error(
        `level ${depth} carrying ${secret}`,
      );
      if (depth < 12) e.cause = build(depth + 1);
      return e;
    };

    const fetchImpl = (async () => {
      throw build(0);
    }) as FetchLike;

    const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
      fetchImpl,
      logUpstreamErrors: false,
    });

    try {
      await client.request({ method: "GET", path: "/x" });
      throw new Error("expected to throw");
    } catch (err) {
      // Walk the full chain and assert the secret appears nowhere.
      // We also walk past the depth cap to make sure no node beyond
      // it leaks (the cap trims the chain; it must not keep a
      // tail of un-redacted Errors).
      let node: (Error & { cause?: unknown }) | undefined = err as Error & {
        cause?: unknown;
      };
      let walked = 0;
      while (node instanceof Error && walked < 20) {
        expect(node.message, `level ${walked}`).not.toContain(secret);
        const next = (node as Error & { cause?: unknown }).cause;
        node = next instanceof Error ? next : undefined;
        walked++;
      }
      // Chain beyond the cap should be truncated (cause === undefined).
      // The exact level at which it gets cut depends on SCRUB_MAX_DEPTH,
      // but `walked` should be <= cap + 1 and strictly less than 12.
      expect(walked).toBeLessThanOrEqual(11);
    }
  });

  it("redacts string-typed cause values (non-Error leak path)", async () => {
    // Codex 4th-pass: `new Error("x", { cause: "raw-secret" })` used to
    // round-trip the cause unchanged. Must now be redacted.
    const secret = "tok-string-cause";
    const fetchImpl = (async () => {
      const err: Error & { cause?: unknown } = new Error("boom");
      err.cause = `connect failed to ${secret}`;
      throw err;
    }) as FetchLike;

    const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
      fetchImpl,
      logUpstreamErrors: false,
    });

    try {
      await client.request({ method: "GET", path: "/x" });
      throw new Error("expected to throw");
    } catch (err) {
      const e = err as Error & { cause?: unknown };
      expect(typeof e.cause).toBe("string");
      expect(e.cause).not.toContain(secret);
      expect(e.cause).toContain("[REDACTED]");
    }
  });

  it("redacts plain-object cause values without materializing nested graphs", async () => {
    // Codex 4th-pass: `cause: { message: "...secret...", ... }` leaked
    // through unmodified. Must redact own-enumerable string properties
    // and drop nested non-primitives.
    const secret = "tok-object-cause";
    const fetchImpl = (async () => {
      const err: Error & { cause?: unknown } = new Error("boom");
      err.cause = {
        message: `pg error carrying ${secret}`,
        code: "ECONNREFUSED",
        // Nested object must be dropped, not walked.
        inner: { hidden: secret },
        // Array contents must have strings redacted.
        hints: [`also ${secret}`, 42, null],
      };
      throw err;
    }) as FetchLike;

    const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
      fetchImpl,
      logUpstreamErrors: false,
    });

    try {
      await client.request({ method: "GET", path: "/x" });
      throw new Error("expected to throw");
    } catch (err) {
      const e = err as Error & { cause?: Record<string, unknown> };
      expect(e.cause).toBeDefined();
      expect(typeof e.cause).toBe("object");
      // Top-level strings redacted.
      expect(e.cause!.message).not.toContain(secret);
      expect(e.cause!.message).toContain("[REDACTED]");
      // Non-string primitives preserved.
      expect(e.cause!.code).toBe("ECONNREFUSED");
      // Nested object dropped (not materialized).
      expect(e.cause!.inner).toBeUndefined();
      // Array strings redacted, non-string primitives preserved.
      const hints = e.cause!.hints as unknown[];
      expect(Array.isArray(hints)).toBe(true);
      expect(hints[0]).not.toContain(secret);
      expect(hints[1]).toBe(42);
      expect(hints[2]).toBeNull();
    }
  });

  it("drops cause values with non-Object prototypes to avoid accessor traps", async () => {
    // If someone throws `{ cause: new Map([...]) }` or a class instance
    // we don't recognize, don't walk it — it may have getters that
    // throw or side-effect. Replace with undefined.
    const fetchImpl = (async () => {
      const err: Error & { cause?: unknown } = new Error("boom");
      err.cause = new Map([["token", "tok-map-cause"]]);
      throw err;
    }) as FetchLike;

    const client = new ProxyClient(
      baseConfig({ bearerToken: "tok-map-cause" }),
      { fetchImpl, logUpstreamErrors: false },
    );

    try {
      await client.request({ method: "GET", path: "/x" });
      throw new Error("expected to throw");
    } catch (err) {
      const e = err as Error & { cause?: unknown };
      expect(e.cause).toBeUndefined();
    }
  });

  it("redacts secrets from Error.stack even after it has been materialized", async () => {
    // Codex re-review #3: `stack` is lazily materialized but cached on
    // first access. Node's fetch embeds the failing URL / args in the
    // stack string. If we only touched `message`, anyone who did
    // `logger.error(err)` or `err.stack` would see the raw secret.
    const secret = "tok-stack-leak";

    const fetchImpl = (async () => {
      const err: Error & { cause?: unknown } = new Error("boom");
      // Force-materialize a stack containing the secret. In Node
      // fetch, this happens naturally via the URL embedded in the
      // TypeError message; we simulate it directly for the test.
      (err as Error & { stack?: string }).stack =
        `Error: boom\n    at fetch (/app/node_modules/undici/index.js:42)\n    token=${secret}`;
      throw err;
    }) as FetchLike;

    const client = new ProxyClient(baseConfig({ bearerToken: secret }), {
      fetchImpl,
      logUpstreamErrors: false,
    });

    try {
      await client.request({ method: "GET", path: "/x" });
      throw new Error("expected to throw");
    } catch (err) {
      const e = err as Error;
      expect(e.stack, "pre-materialized stack must be redacted").not.toContain(
        secret,
      );
      expect(e.message).not.toContain(secret);
    }
  });
});
