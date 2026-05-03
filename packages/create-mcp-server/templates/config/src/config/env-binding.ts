/**
 * Bind a flat env-var bag (e.g. `process.env`) into a nested config-shaped
 * object via a prefix + delimiter convention.
 *
 * Convention (delimiter = `_`):
 *   `MCP_SERVER_NAME`  → `{ server: { name: "..." } }`
 *   `MCP_DB_POOL_SIZE` → `{ db: { pool: { size: "..." } } }`
 *   `MCP_LOG__FILE`    → `{ log_file: "..." }`  (double = literal "_" in key)
 *
 * Each single delimiter introduces a nesting level. Two consecutive
 * delimiters mean "this is one literal underscore in the key name" — the
 * unambiguous escape hatch for leaf keys that contain `_`.
 *
 * Why string-only output: this layer is intentionally type-naive — we hand
 * the bag to Zod which has dedicated coercion (`z.coerce.number()` etc).
 * Doubling that work here would force every consumer's schema to anticipate
 * a half-typed bag.
 */

export type EnvBag = NodeJS.ProcessEnv | Record<string, string | undefined>;

export interface BindEnvOptions {
  /** Required: only env vars starting with this prefix are bound. */
  prefix: string;
  /** Source bag. Defaults to `process.env`. */
  env?: EnvBag;
  /**
   * Delimiter inside the env-var name that maps to a nested object level.
   * Defaults to `_`. Two consecutive delimiters mean "literal delimiter
   * character in the leaf key" (escape hatch for keys containing `_`).
   */
  delimiter?: string;
}

/**
 * Convert env vars matching `<prefix><name>` into a nested string-valued
 * object. The prefix is stripped, the remainder is split on the delimiter,
 * each segment becomes a nesting level, and segments are lowercased so
 * `MCP_SERVER_NAME` and `MCP_server_name` produce the same shape.
 *
 * Returns `{}` when no env vars match. Original env bag is never mutated.
 */
export function bindEnvToObject(
  options: BindEnvOptions,
): Record<string, unknown> {
  const env = options.env ?? process.env;
  const delimiter = options.delimiter ?? "_";
  const prefix = options.prefix;

  if (!prefix) {
    throw new Error("bindEnvToObject requires a non-empty `prefix`.");
  }

  const out: Record<string, unknown> = {};

  for (const [rawKey, rawValue] of Object.entries(env)) {
    if (rawValue === undefined) continue;
    if (!rawKey.startsWith(prefix)) continue;

    const tail = rawKey.slice(prefix.length);
    if (tail.length === 0) continue; // exactly the prefix, nothing to bind

    const segments = splitEnvKey(tail, delimiter);
    if (segments.length === 0) continue;

    setDeep(out, segments, rawValue);
  }

  return out;
}

/**
 * Split a stripped env key into nested segments. Each single delimiter
 * starts a new level; `__` is replaced by a literal `_` in the current
 * segment.
 *
 * Implementation: replace `__` with a sentinel U+0001 (a control char that
 * cannot appear in env-var names), split on the single delimiter, then
 * swap the sentinel back to `_` and lowercase. The sentinel approach avoids
 * a stateful character-by-character parser.
 */
function splitEnvKey(tail: string, delimiter: string): string[] {
  const SENTINEL = "";
  const escaped = tail.split(delimiter + delimiter).join(SENTINEL);
  return escaped
    .split(delimiter)
    .map((segment) => segment.split(SENTINEL).join("_").toLowerCase())
    .filter((segment) => segment.length > 0);
}

function setDeep(
  root: Record<string, unknown>,
  path: string[],
  value: string,
): void {
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const existing = cursor[key];
    if (existing === undefined || existing === null) {
      const next: Record<string, unknown> = {};
      cursor[key] = next;
      cursor = next;
    } else if (typeof existing === "object" && !Array.isArray(existing)) {
      cursor = existing as Record<string, unknown>;
    } else {
      // A leaf already lives at this path (e.g. caller defined both
      // `MCP_DB` and `MCP_DB_POOL`). Promote the leaf into a synthesized
      // `_self` key rather than throw — that way `loadConfig` still
      // surfaces the conflict to Zod (where it'll fail validation with a
      // clearer message), and a missing branch never silently wins.
      cursor[key] = { _self: existing };
      cursor = cursor[key] as Record<string, unknown>;
    }
  }
  cursor[path[path.length - 1]] = value;
}

/**
 * Recursively merge `override` into `base`. `override` wins on conflict;
 * arrays in `override` REPLACE the array in `base` (deep-merging arrays is
 * almost always wrong: it leaks dev-tier items into prod). Returns a new
 * object — neither argument is mutated.
 */
export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>,
): T {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const existing = out[key];
    if (
      existing !== null &&
      typeof existing === "object" &&
      !Array.isArray(existing) &&
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      out[key] = deepMerge(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      out[key] = value;
    }
  }
  return out as T;
}
