/**
 * Environment-variable helpers shared by every MCP template.
 *
 * Extracted from the repeated `parseIntEnv` / `getValidApiKeys` /
 * `requireEnv` patterns that appeared verbatim in the api-proxy, auth, and
 * database templates. Each helper has a single, narrow contract — they do
 * not throw on missing values unless explicitly requested via `requireEnv`.
 */

export type EnvSource = NodeJS.ProcessEnv | Record<string, string | undefined>;

/**
 * Parse a non-negative integer from an env var. Returns `fallback` when the
 * variable is unset, empty, or not a finite non-negative integer.
 *
 * Mirrors the contract used inside `api-proxy/src/config.ts` so existing
 * security defaults (timeoutMs / rateLimitMax) carry over verbatim.
 */
export function parseIntEnv(
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value === "") return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Read a positive (>0) integer env var by name, falling back when unset or
 * invalid. Used by the rate-limit middleware to read max / window overrides.
 */
export function readIntEnv(
  name: string | undefined,
  fallback: number,
  env: EnvSource = process.env,
): number {
  if (!name) return fallback;
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Read an env var that MUST be configured. Throws a stable Error with a
 * fixed message — never embeds the offending value (operators sometimes
 * paste secrets into env vars and the error text would otherwise leak).
 */
export function requireEnv(
  name: string,
  env: EnvSource = process.env,
): string {
  const raw = env[name];
  if (raw === undefined || raw.trim().length === 0) {
    throw new Error(
      `${name} is not configured. Set it in your .env file.`,
    );
  }
  return raw;
}

/**
 * Read a comma-separated env var as a Set of trimmed non-empty values.
 * Replaces the bespoke `getValidApiKeys` / `CORS_ORIGINS` parsers that
 * appeared in `auth/src/auth.ts` and `auth/src/index.ts`.
 */
export function readCsvEnv(
  name: string,
  env: EnvSource = process.env,
): Set<string> {
  const raw = env[name] ?? "";
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

/**
 * Read a string env var, trimming whitespace. Returns `undefined` when the
 * variable is unset or trims to empty — matching the `optional secret`
 * pattern (`bearerToken` / `apiKey`) in api-proxy/config.ts.
 */
export function readOptionalStringEnv(
  name: string,
  env: EnvSource = process.env,
): string | undefined {
  const raw = env[name];
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
