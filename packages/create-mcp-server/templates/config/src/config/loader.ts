import { promises as fs } from "node:fs";
import { extname } from "node:path";
import { parse as parseYaml } from "yaml";
import { parse as parseToml } from "smol-toml";
import type { z } from "zod";
import { bindEnvToObject, deepMerge } from "./env-binding.js";
import {
  pickProfileFile,
  resolveProfile,
  type Profile,
  type ProfileSelector,
} from "./profile.js";
import { validateConfig } from "./validate.js";
import { detectSecretPaths, redactSecrets } from "./secrets.js";

export interface LoadConfigOptions<TSchema extends z.ZodTypeAny> {
  /** Required: the validated shape the result must conform to. */
  schema: TSchema;
  /**
   * Env-var prefix (incl. trailing underscore). e.g. `MCP_` so
   * `MCP_SERVER_PORT` binds to `server.port`.
   */
  envPrefix?: string;
  /**
   * Files to read, in increasing precedence. The loader picks ONE entry
   * per resolved profile (see `pickProfileFile`); within that selection,
   * later files override earlier ones via deep merge. Missing files are
   * silently skipped so a buyer's repo can ship `config.example.yaml`
   * without forcing every dev to copy it.
   */
  files?: readonly string[];
  /** Profile selector. Defaults to `"auto"`. */
  profile?: ProfileSelector;
  /** Source env. Defaults to `process.env`. */
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  /** Override `fs.readFile` for tests / sandboxed runs. */
  readFile?: (path: string) => Promise<string>;
}

export interface LoadConfigResult<TSchema extends z.ZodTypeAny> {
  /** The parsed, typed config — your `z.infer<schema>`. */
  config: z.infer<TSchema>;
  /** The profile that was resolved (`dev` / `prod` / `test`). */
  profile: Profile;
  /** Files actually read (after profile + missing-file filtering). */
  filesLoaded: string[];
  /** Dotted paths flagged `@secret` by the schema. */
  secretPaths: string[];
  /**
   * Helper: returns a clone of `config` with secrets blanked. Use this
   * before any `console.log(...)` of the config.
   */
  toSafeJson: () => unknown;
}

/**
 * Load + validate the config from env + file(s) + profile, in that order
 * of precedence (env wins). Throws `ConfigValidationError` on schema
 * failure — the only legitimate startup-time response is to exit non-zero.
 *
 * Precedence (lowest → highest):
 *   1. Defaults declared in the Zod schema (`.default(...)`)
 *   2. Each loaded file (deep-merged in order)
 *   3. Environment variables (after prefix-binding)
 *
 * The env layer is intentionally last: deployment overrides should always
 * win over checked-in defaults, and a typo in a file shouldn't shadow a
 * deliberate `MCP_*` setting.
 */
export async function loadConfig<TSchema extends z.ZodTypeAny>(
  options: LoadConfigOptions<TSchema>,
): Promise<LoadConfigResult<TSchema>> {
  const {
    schema,
    envPrefix,
    files = [],
    profile: profileSelector = "auto",
    env = process.env,
    readFile = (path) => fs.readFile(path, "utf-8"),
  } = options;

  const profile = resolveProfile({ profile: profileSelector, env });

  // ── 1. File layer ────────────────────────────────────────────────────
  // Pick the profile-specific file if one exists; fall back to the
  // generic file. Multiple "candidates" with no profile suffix are all
  // loaded in order (deep-merged) so callers can layer base + overlay.
  const filesLoaded: string[] = [];
  let merged: Record<string, unknown> = {};

  const profileMatched = pickProfileFile(files, profile);
  const orderedFiles = profileMatched
    ? // If a profile-specific file matched, load every base file first
      // (no-profile candidates) then the profile file LAST so it wins.
      [
        ...files.filter(
          (f) => !hasAnyProfileSegment(f) && f !== profileMatched,
        ),
        profileMatched,
      ]
    : files.filter((f) => !hasAnyProfileSegment(f));

  for (const path of orderedFiles) {
    const fileObj = await tryReadAndParse(path, readFile);
    if (fileObj === null) continue; // missing file or parse error reported below
    filesLoaded.push(path);
    merged = deepMerge(merged, fileObj);
  }

  // ── 2. Env layer ─────────────────────────────────────────────────────
  if (envPrefix) {
    const envObj = bindEnvToObject({ prefix: envPrefix, env });
    merged = deepMerge(merged, envObj);
  }

  // ── 3. Validate ──────────────────────────────────────────────────────
  const config = validateConfig(schema, merged);
  const secretPaths = detectSecretPaths(schema);

  return {
    config,
    profile,
    filesLoaded,
    secretPaths,
    toSafeJson: () => redactSecrets(config, secretPaths),
  };
}

async function tryReadAndParse(
  path: string,
  readFile: (path: string) => Promise<string>,
): Promise<Record<string, unknown> | null> {
  let text: string;
  try {
    text = await readFile(path);
  } catch (err) {
    // ENOENT → silent skip (file is optional). Other errors bubble: a
    // permission error on a config file is something the operator must
    // see, not silently ignore.
    if (
      err !== null &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "ENOENT"
    ) {
      return null;
    }
    throw err;
  }

  try {
    return parseFileByExtension(path, text);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "unknown parse error";
    throw new Error(
      `Failed to parse config file "${path}": ${message}`,
    );
  }
}

function parseFileByExtension(
  path: string,
  text: string,
): Record<string, unknown> {
  const ext = extname(path).toLowerCase();
  let parsed: unknown;
  if (ext === ".yaml" || ext === ".yml") {
    parsed = parseYaml(text);
  } else if (ext === ".toml") {
    parsed = parseToml(text);
  } else if (ext === ".json") {
    parsed = JSON.parse(text);
  } else {
    throw new Error(
      `Unsupported config file extension: "${ext}". Use .yaml / .yml / .toml / .json.`,
    );
  }
  if (parsed === null || parsed === undefined) {
    return {};
  }
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(
      `Config file "${path}" must contain an object at the root, got ${typeof parsed}.`,
    );
  }
  return parsed as Record<string, unknown>;
}

function hasAnyProfileSegment(path: string): boolean {
  return /\.(dev|prod|test)\./.test(path);
}
