export interface ProxyConfig {
  baseUrl: string;
  bearerToken?: string;
  apiKey?: string;
  apiKeyHeader: string;
  timeoutMs: number;
  maxRetries: number;
  rateLimitMax: number;
  rateLimitWindowMs: number;
}

function parseIntEnv(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Loads proxy configuration from environment variables.
 *
 * Throws if UPSTREAM_BASE_URL is missing or malformed — the server cannot
 * usefully start without a concrete upstream. Error messages never include
 * the raw configured value, because operators sometimes embed tokens or
 * credentials in the URL (e.g. `https://user:pass@host/v1`).
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ProxyConfig {
  const baseUrl = env.UPSTREAM_BASE_URL;
  if (!baseUrl || baseUrl.trim().length === 0) {
    throw new Error(
      "UPSTREAM_BASE_URL is not configured. Set it in your .env file.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    // Never echo the offending value: it may contain secrets.
    throw new Error(
      "UPSTREAM_BASE_URL is not a valid URL. Check your .env configuration.",
    );
  }

  // Reject embedded userinfo — most APIs don't need it and it makes every
  // subsequent log line a potential leak. Operators who really need it can
  // remove this check, but the default template should be safe-by-default.
  if (parsed.username || parsed.password) {
    throw new Error(
      "UPSTREAM_BASE_URL must not contain embedded userinfo (user:pass@). " +
        "Move credentials into UPSTREAM_BEARER_TOKEN or UPSTREAM_API_KEY.",
    );
  }

  // Reject query string / fragment (Codex 9th-pass P1 closure).
  //
  // `proxy.ts` composes the outbound URL by string-concatenating
  // `baseUrl + prefixed` once the agent-supplied path is validated. If the
  // configured base already carries `?api_key=SECRET` or `#token=SECRET`,
  // three failure modes stack on top of each other:
  //   1. The agent's path gets appended to the query / fragment (e.g.
  //      `https://api.example.com/v1?api_key=SECRET/users`), so upstream
  //      never sees the intended resource.
  //   2. The secret in the query / fragment is NOT enrolled in
  //      `getSecretValues()`, which only covers bearer/api-key envs — so
  //      `redactString`, `sanitizePathForLog`, and `sanitizeBodySnippetForLog`
  //      all fail closed for it.
  //   3. Any `fetch` error / cause-chain throw would embed that raw URL in
  //      stack strings that are only redacted against the registered
  //      secrets, leaking the base-URL-embedded secret verbatim.
  //
  // We align the runtime with the README's documented shape
  // (`scheme://host[:port]/path`) and close the leak class pre-emptively,
  // rather than trying to retrofit redaction into every log site.
  if (parsed.search || parsed.hash) {
    throw new Error(
      "UPSTREAM_BASE_URL must not contain a query string or fragment. " +
        "Expected shape: scheme://host[:port]/path. Move any secrets into " +
        "UPSTREAM_BEARER_TOKEN or UPSTREAM_API_KEY.",
    );
  }

  const bearerToken = env.UPSTREAM_BEARER_TOKEN?.trim() || undefined;
  const apiKey = env.UPSTREAM_API_KEY?.trim() || undefined;
  const apiKeyHeader =
    env.UPSTREAM_API_KEY_HEADER?.trim() || "x-api-key";

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    bearerToken,
    apiKey,
    apiKeyHeader,
    timeoutMs: parseIntEnv(env.PROXY_TIMEOUT_MS, 10_000),
    maxRetries: parseIntEnv(env.PROXY_MAX_RETRIES, 1),
    rateLimitMax: parseIntEnv(env.PROXY_RATE_LIMIT_MAX, 60),
    rateLimitWindowMs: parseIntEnv(env.PROXY_RATE_LIMIT_WINDOW_MS, 60_000),
  };
}

/**
 * Returns the set of env-var names whose values must NEVER appear in any
 * response returned to the MCP client. Used by the sanitizer to detect
 * accidental reflection of secrets from upstream.
 */
export function getSecretValues(config: ProxyConfig): string[] {
  const secrets: string[] = [];
  if (config.bearerToken) secrets.push(config.bearerToken);
  if (config.apiKey) secrets.push(config.apiKey);
  return secrets;
}

/**
 * Returns a log-safe representation of the configured upstream. Strips
 * path, query, and any userinfo, keeping only `scheme://host[:port]` so
 * that startup logs can reference the upstream without risking secret
 * leakage if the operator embedded tokens in the URL.
 */
export function describeUpstreamForLog(config: ProxyConfig): string {
  try {
    const u = new URL(config.baseUrl);
    return u.origin;
  } catch {
    return "<invalid-upstream>";
  }
}
