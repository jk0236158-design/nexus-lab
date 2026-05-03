import { z } from "zod";
import { isSecretSchema } from "./schema.js";

/**
 * Marker subbed in for any secret value when redacted. Kept short and
 * obvious — buyers should not need to grep for an ambiguous placeholder.
 */
export const REDACTED = "[REDACTED]";

/**
 * Walk a Zod schema tree and return every dotted path that ends in a
 * `@secret`-marked node. e.g. for
 *
 *   z.object({ database: z.object({ password: secret(z.string()) }) })
 *
 * this returns `["database.password"]`. Used by `redactSecrets` to scrub
 * a parsed config before it's logged or echoed.
 *
 * The walker handles `ZodObject`, `ZodOptional`, `ZodNullable`, and
 * `ZodDefault`. Nested arrays / unions are intentionally NOT traversed:
 * marking a field secret should be a deliberate leaf-level act, and a
 * union of "secret-or-not" types is almost always a smell.
 */
export function detectSecretPaths(
  schema: z.ZodTypeAny,
  prefix = "",
): string[] {
  const out: string[] = [];

  // Unwrap optional / nullable / default to reach the inner shape. We
  // check the WRAPPED schema for the secret marker first, because callers
  // may write `secret(z.string()).optional()`.
  const inner = unwrapSchema(schema);

  if (isSecretSchema(schema) || isSecretSchema(inner)) {
    if (prefix) out.push(prefix);
  }

  if (inner instanceof z.ZodObject) {
    const shape = inner.shape as Record<string, z.ZodTypeAny>;
    for (const [key, child] of Object.entries(shape)) {
      const path = prefix ? `${prefix}.${key}` : key;
      out.push(...detectSecretPaths(child, path));
    }
  }

  return out;
}

function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current: z.ZodTypeAny = schema;
  // Bound the unwrap depth so a pathological schema (`.optional().nullable()
  // .default()…` 100 deep) cannot stall the walker.
  for (let depth = 0; depth < 16; depth++) {
    if (
      current instanceof z.ZodOptional ||
      current instanceof z.ZodNullable ||
      current instanceof z.ZodDefault
    ) {
      current = (current as z.ZodOptional<z.ZodTypeAny>).unwrap
        ? (current as z.ZodOptional<z.ZodTypeAny>).unwrap()
        : (current as unknown as { _def: { innerType: z.ZodTypeAny } })._def
            .innerType;
      continue;
    }
    break;
  }
  return current;
}

/**
 * Return a deep clone of `value` with every path in `secretPaths` replaced
 * by `[REDACTED]`. Non-string secrets (number / boolean / object) are
 * blanked too — the goal is "this slot leaked nothing", not "this slot
 * preserved its type". The original object is never mutated.
 *
 * Paths use dot notation: `database.password` reaches into nested objects.
 * Missing paths are silently skipped (no throw): the schema may declare a
 * secret field that's optional and absent in this particular config.
 */
export function redactSecrets<T>(value: T, secretPaths: string[]): T {
  if (secretPaths.length === 0) return structuredClone(value);
  const cloned = structuredClone(value);
  for (const path of secretPaths) {
    redactAtPath(cloned as unknown as Record<string, unknown>, path);
  }
  return cloned;
}

function redactAtPath(
  root: Record<string, unknown>,
  path: string,
): void {
  const segments = path.split(".");
  let cursor: unknown = root;
  for (let i = 0; i < segments.length - 1; i++) {
    if (cursor === null || typeof cursor !== "object") return;
    cursor = (cursor as Record<string, unknown>)[segments[i]];
  }
  if (cursor === null || typeof cursor !== "object") return;
  const last = segments[segments.length - 1];
  if (last in (cursor as Record<string, unknown>)) {
    (cursor as Record<string, unknown>)[last] = REDACTED;
  }
}

/**
 * Compose a console-safe stringification of a config. Combines schema-driven
 * redaction with `JSON.stringify` so a single line — `console.log(safeStringify
 * (config, schema))` — is leak-proof.
 */
export function safeStringify(
  value: unknown,
  schema: z.ZodTypeAny,
  pretty = true,
): string {
  const paths = detectSecretPaths(schema);
  const redacted = redactSecrets(value, paths);
  return JSON.stringify(redacted, null, pretty ? 2 : 0);
}
