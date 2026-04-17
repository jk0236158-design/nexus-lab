import type { ProxyConfig } from "./config.js";
import { getSecretValues } from "./config.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ProxyRequest {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface ProxyResponse {
  status: number;
  ok: boolean;
  body: unknown;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory token-bucket rate limiter. Template-minimal: a single process-wide
 * bucket, keyed by an identifier the caller supplies (default: "default"). For
 * production, swap for Redis or a shared store.
 */
export class RateLimiter {
  private readonly store = new Map<string, RateLimitEntry>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly clock: () => number = Date.now,
  ) {}

  check(key = "default"): { allowed: boolean; retryAfterMs: number } {
    const now = this.clock();
    let entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.store.set(key, entry);
    }

    entry.count++;

    if (entry.count > this.max) {
      return { allowed: false, retryAfterMs: Math.max(0, entry.resetAt - now) };
    }
    return { allowed: true, retryAfterMs: 0 };
  }
}

/**
 * Builds outbound headers. Auth headers are attached here and never exposed
 * to the MCP client via tool responses.
 */
function buildHeaders(
  config: ProxyConfig,
  extra: Record<string, string> | undefined,
): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/json",
    ...(extra ?? {}),
  };

  if (config.bearerToken) {
    headers.authorization = `Bearer ${config.bearerToken}`;
  }
  if (config.apiKey) {
    headers[config.apiKeyHeader.toLowerCase()] = config.apiKey;
  }
  return headers;
}

function buildUrl(
  baseUrl: string,
  rawPath: string,
  query: ProxyRequest["query"],
): string {
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const url = new URL(baseUrl + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Recursively walk a JSON-shaped value and redact any string that contains
 * a known secret. This is a last-line-of-defence: the upstream should never
 * echo credentials, but agents mis-wiring a proxy is a known failure mode.
 */
export function sanitizeResponseBody(
  body: unknown,
  secrets: string[],
): unknown {
  if (secrets.length === 0) return body;

  const walk = (value: unknown): unknown => {
    if (typeof value === "string") {
      let out = value;
      for (const secret of secrets) {
        if (secret && out.includes(secret)) {
          out = out.split(secret).join("[REDACTED]");
        }
      }
      return out;
    }
    if (Array.isArray(value)) {
      return value.map(walk);
    }
    if (value !== null && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = walk(v);
      }
      return result;
    }
    return value;
  };

  return walk(body);
}

export type FetchLike = typeof fetch;

export interface ProxyClientOptions {
  fetchImpl?: FetchLike;
  rateLimiter?: RateLimiter;
}

/**
 * Thin proxy client wrapping fetch with timeout, retry, rate limit, and
 * response sanitization. Stateless aside from the rate-limiter bucket.
 */
export class ProxyClient {
  private readonly fetchImpl: FetchLike;
  private readonly rateLimiter: RateLimiter;
  private readonly secrets: string[];

  constructor(
    private readonly config: ProxyConfig,
    options: ProxyClientOptions = {},
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.rateLimiter =
      options.rateLimiter ??
      new RateLimiter(config.rateLimitMax, config.rateLimitWindowMs);
    this.secrets = getSecretValues(config);
  }

  async request(req: ProxyRequest): Promise<ProxyResponse> {
    const limit = this.rateLimiter.check();
    if (!limit.allowed) {
      const err = new Error(
        `Rate limit exceeded. Retry after ${Math.ceil(limit.retryAfterMs / 1000)}s.`,
      );
      (err as Error & { code?: string }).code = "PROXY_RATE_LIMITED";
      throw err;
    }

    const url = buildUrl(this.config.baseUrl, req.path, req.query);
    const headers = buildHeaders(this.config, req.headers);

    const hasBody =
      req.body !== undefined && req.method !== "GET" && req.method !== "DELETE";
    if (hasBody) {
      headers["content-type"] = headers["content-type"] ?? "application/json";
    }

    const init: RequestInit = {
      method: req.method,
      headers,
      body: hasBody ? JSON.stringify(req.body) : undefined,
    };

    const maxAttempts = this.config.maxRetries + 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        this.config.timeoutMs,
      );

      try {
        const response = await this.fetchImpl(url, {
          ...init,
          signal: controller.signal,
        });
        clearTimeout(timer);

        const parsedBody = await parseBody(response);
        const sanitized = sanitizeResponseBody(parsedBody, this.secrets);

        // Retry only on 5xx / 429. 4xx other than 429 are considered
        // deterministic and surfaced immediately.
        if (
          !response.ok &&
          (response.status >= 500 || response.status === 429) &&
          attempt < maxAttempts - 1
        ) {
          lastError = new Error(`Upstream ${response.status}`);
          continue;
        }

        return {
          status: response.status,
          ok: response.ok,
          body: sanitized,
        };
      } catch (err) {
        clearTimeout(timer);
        lastError = err;
        // Abort / network error — retry if we have budget
        if (attempt < maxAttempts - 1) continue;
        throw err;
      }
    }

    // Unreachable, but keeps types happy
    throw lastError instanceof Error
      ? lastError
      : new Error("Proxy request failed");
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  // Non-JSON: return as text. We don't stream binary — this template is for
  // JSON-over-HTTP APIs. Users wrapping file-download APIs should extend.
  return await response.text();
}
