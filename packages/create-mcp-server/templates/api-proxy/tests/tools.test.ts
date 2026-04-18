import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  ProxyClient,
  RateLimiter,
  type FetchLike,
} from "../src/proxy.js";
import { registerTools } from "../src/tools.js";
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function textOf(result: {
  content: Array<{ type: string; text?: string }>;
}): string {
  const first = result.content[0];
  if (first.type !== "text" || typeof first.text !== "string") {
    throw new Error("Expected text content in tool response");
  }
  return first.text;
}

describe("registerTools (MCP end-to-end)", () => {
  let server: McpServer;
  let client: Client;
  let fetchCalls: Array<{ url: string; init: RequestInit }>;

  function setup(options: {
    config?: Partial<ProxyConfig>;
    fetchImpl?: FetchLike;
    rateLimiter?: RateLimiter;
  } = {}) {
    const proxyClient = new ProxyClient(baseConfig(options.config), {
      fetchImpl: options.fetchImpl,
      rateLimiter: options.rateLimiter,
    });
    server = new McpServer({ name: "test-server", version: "0.0.0" });
    registerTools(server, proxyClient);
  }

  beforeEach(async () => {
    fetchCalls = [];
  });

  async function connectPair() {
    client = new Client(
      { name: "test-client", version: "0.0.0" },
      { capabilities: {} },
    );
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
  }

  afterEach(async () => {
    if (client) await client.close();
    if (server) await server.close();
  });

  function recordingFetch(response: Response | (() => Response)): FetchLike {
    return (async (url: string | URL | Request, init?: RequestInit) => {
      fetchCalls.push({
        url: typeof url === "string" ? url : url.toString(),
        init: init ?? {},
      });
      return typeof response === "function" ? response() : response;
    }) as FetchLike;
  }

  it("proxy-get returns the upstream JSON wrapped with status/ok", async () => {
    setup({ fetchImpl: recordingFetch(jsonResponse({ id: 1, name: "Ada" })) });
    await connectPair();

    const result = (await client.callTool({
      name: "proxy-get",
      arguments: { path: "/users/1" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(textOf(result));
    expect(parsed.status).toBe(200);
    expect(parsed.ok).toBe(true);
    expect(parsed.body).toEqual({ id: 1, name: "Ada" });
  });

  it("proxy-post serializes the body and surfaces 201", async () => {
    setup({ fetchImpl: recordingFetch(jsonResponse({ id: 42 }, 201)) });
    await connectPair();

    const result = (await client.callTool({
      name: "proxy-post",
      arguments: { path: "/items", body: { name: "widget" } },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(textOf(result));
    expect(parsed.status).toBe(201);
    expect(parsed.body).toEqual({ id: 42 });

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].init.body).toBe(JSON.stringify({ name: "widget" }));
  });

  it("rejects an absolute URL in path via Zod validation", async () => {
    setup({ fetchImpl: recordingFetch(jsonResponse({ ok: true })) });
    await connectPair();

    const result = (await client.callTool({
      name: "proxy-get",
      arguments: { path: "https://evil.example.com/steal" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it("returns ok=false on upstream 4xx but is not a transport error", async () => {
    setup({
      fetchImpl: recordingFetch(jsonResponse({ error: "not found" }, 404)),
    });
    await connectPair();

    const result = (await client.callTool({
      name: "proxy-get",
      arguments: { path: "/missing" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBe(true);
    const parsed = JSON.parse(textOf(result));
    expect(parsed.status).toBe(404);
    expect(parsed.ok).toBe(false);
    // v1.1.0: upstream body is replaced with a safe error shape. The
    // original body's `error: "not found"` is dropped; only the stable
    // UPSTREAM_NOT_FOUND code remains.
    expect(parsed.body.error).toBe("UPSTREAM_NOT_FOUND");
    expect(parsed.body).not.toHaveProperty("stack");
    expect(parsed.body).not.toHaveProperty("sql");
  });

  it("returns PROXY_RATE_LIMITED once the bucket is exhausted", async () => {
    const limiter = new RateLimiter(1, 60_000, () => 1_000);
    setup({
      fetchImpl: recordingFetch(jsonResponse({ ok: true })),
      rateLimiter: limiter,
    });
    await connectPair();

    await client.callTool({ name: "proxy-get", arguments: { path: "/a" } });

    const result = (await client.callTool({
      name: "proxy-get",
      arguments: { path: "/a" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("PROXY_RATE_LIMITED");
  });

  it("redacts configured secrets if the upstream echoes them", async () => {
    setup({
      config: { bearerToken: "tok-xyz" },
      fetchImpl: recordingFetch(
        jsonResponse({ echoed: "we saw tok-xyz in your header" }),
      ),
    });
    await connectPair();

    const result = (await client.callTool({
      name: "proxy-get",
      arguments: { path: "/debug" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    const text = textOf(result);
    expect(text).not.toContain("tok-xyz");
    expect(text).toContain("[REDACTED]");
  });

  it("does not leak upstream URL on transport errors", async () => {
    const failingFetch: FetchLike = (async () => {
      throw new Error(
        "connect ECONNREFUSED 10.0.0.5:443 for https://api.example.com/internal",
      );
    }) as FetchLike;

    setup({ fetchImpl: failingFetch });
    await connectPair();

    const result = (await client.callTool({
      name: "proxy-get",
      arguments: { path: "/whatever" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBe(true);
    const text = textOf(result);
    expect(text).not.toContain("ECONNREFUSED");
    expect(text).not.toContain("10.0.0.5");
    expect(text).toMatch(/Failed to fetch resource/);
  });
});
