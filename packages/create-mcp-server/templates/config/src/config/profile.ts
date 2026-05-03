/**
 * Profile selection — answers the question "which config tier should this
 * process load?". The 3 supported profiles are `dev`, `prod`, `test`.
 *
 * Resolution order (first match wins):
 *   1. Explicit `profile` argument (caller passes "auto" to defer)
 *   2. `MCP_CONFIG_PROFILE` env var (toolkit-specific override)
 *   3. `NODE_ENV` env var, mapped: development -> dev, production -> prod,
 *      test -> test
 *   4. Fallback: `dev`
 *
 * The two-env-var design is intentional: `NODE_ENV` is an established
 * ecosystem signal but it's also overloaded (build tools, npm, frameworks
 * all read it for unrelated decisions). `MCP_CONFIG_PROFILE` lets a
 * deployment override profile selection without disturbing those other
 * consumers — e.g. running a production server in `NODE_ENV=production`
 * but pointing it at the `test` config tier for a chaos drill.
 */

export type Profile = "dev" | "prod" | "test";
export type ProfileSelector = Profile | "auto";

const VALID_PROFILES: Profile[] = ["dev", "prod", "test"];

export interface ResolveProfileOptions {
  /** Explicit profile or "auto". Defaults to "auto". */
  profile?: ProfileSelector;
  /** Source of env vars. Defaults to `process.env`. */
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
}

/**
 * Resolve the active profile. Returns one of `dev` / `prod` / `test`.
 * Never throws on bad input — invalid profile names fall through to the
 * next selector tier so a typo in `MCP_CONFIG_PROFILE` doesn't crash a
 * production server (it just falls back to `NODE_ENV` / `dev`).
 */
export function resolveProfile(options: ResolveProfileOptions = {}): Profile {
  const env = options.env ?? process.env;
  const explicit = options.profile ?? "auto";

  if (explicit !== "auto" && isValidProfile(explicit)) {
    return explicit;
  }

  const fromOverride = env.MCP_CONFIG_PROFILE?.trim().toLowerCase();
  if (fromOverride && isValidProfile(fromOverride)) {
    return fromOverride;
  }

  const fromNodeEnv = mapNodeEnv(env.NODE_ENV);
  if (fromNodeEnv) return fromNodeEnv;

  return "dev";
}

function isValidProfile(value: string): value is Profile {
  return (VALID_PROFILES as string[]).includes(value);
}

function mapNodeEnv(
  raw: string | undefined,
): Profile | undefined {
  const v = raw?.trim().toLowerCase();
  if (!v) return undefined;
  if (v === "production") return "prod";
  if (v === "development") return "dev";
  if (v === "test") return "test";
  // Pass through if it already matches a profile literally
  if (isValidProfile(v)) return v;
  return undefined;
}

/**
 * Pick a profile-specific config file from a list of candidates. Used by
 * `loader.ts` to decide which file to load when callers pass several. The
 * search prefers `<base>.<profile>.<ext>` over `<base>.<ext>`.
 *
 * @example
 *   pickProfileFile(["config.yaml", "config.prod.yaml"], "prod")
 *   // -> "config.prod.yaml"
 *
 *   pickProfileFile(["config.yaml"], "prod")
 *   // -> "config.yaml" (no profile-specific variant)
 */
export function pickProfileFile(
  candidates: readonly string[],
  profile: Profile,
): string | undefined {
  // First pass: any path whose filename includes `.<profile>.` before the
  // extension wins. We match on the dotted segment to avoid a substring
  // collision with `production-keys.yaml` etc.
  for (const candidate of candidates) {
    if (matchesProfileSegment(candidate, profile)) {
      return candidate;
    }
  }
  // Fallback: first candidate that does NOT contain a competing profile
  // segment (e.g. when looking for `prod` we don't want to pick
  // `config.test.yaml`).
  for (const candidate of candidates) {
    if (!hasAnyProfileSegment(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function matchesProfileSegment(path: string, profile: Profile): boolean {
  return new RegExp(`\\.${profile}\\.`).test(path);
}

function hasAnyProfileSegment(path: string): boolean {
  return VALID_PROFILES.some((p) => matchesProfileSegment(path, p));
}
