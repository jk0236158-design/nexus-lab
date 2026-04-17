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
 * Throws if UPSTREAM_BASE_URL is missing or malformed — the server cannot
 * usefully start without a concrete upstream.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ProxyConfig {
  const baseUrl = env.UPSTREAM_BASE_URL;
  if (!baseUrl || baseUrl.trim().length === 0) {
    throw new Error(
      "UPSTREAM_BASE_URL is not configured. Set it in your .env file.",
    );
  }

  try {
    // Validate shape; we don't keep the URL object because fetch accepts strings.
    new URL(baseUrl);
  } catch {
    throw new Error(`UPSTREAM_BASE_URL is not a valid URL: ${baseUrl}`);
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
