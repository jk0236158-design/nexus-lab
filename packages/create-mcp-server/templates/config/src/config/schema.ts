import { z } from "zod";

/**
 * `@secret` description marker — applied to a Zod string schema, this hint is
 * picked up by `secrets.ts#detectSecretPaths` to drive redaction. Keeping the
 * marker in the schema (rather than as a separate keyword list) means the
 * secret surface lives next to the field that owns it: rename, move, or
 * delete the field and the marker travels with it.
 *
 * Convention: prepend `@secret` (optionally followed by ` ` + human prose)
 * to any Zod schema's `.describe(...)` you want redacted in logs.
 */
export const SECRET_MARKER = "@secret";

/**
 * Tag a Zod schema as carrying a secret value. Equivalent to
 * `.describe("@secret …")`, but typo-proof and self-documenting.
 *
 * @example
 *   api_key: secret(z.string().min(20), "Upstream API key")
 *   // -> z.string().min(20).describe("@secret Upstream API key")
 */
export function secret<T extends z.ZodTypeAny>(schema: T, note?: string): T {
  const suffix = note ? ` ${note}` : "";
  return schema.describe(`${SECRET_MARKER}${suffix}`) as T;
}

/**
 * Returns true when the given schema's description carries the @secret
 * marker. Used by `secrets.ts` to walk a parsed config and build the set of
 * secret-bearing paths for redaction.
 */
export function isSecretSchema(schema: z.ZodTypeAny): boolean {
  const desc = schema.description;
  return typeof desc === "string" && desc.startsWith(SECRET_MARKER);
}

/**
 * Re-export `z` so consumers don't have to add a separate `import { z }`.
 * Keeps the README minimal: `import { z, secret, defineConfig } from
 * './config/schema'` is the entire surface a buyer needs to learn.
 */
export { z };

/**
 * Light wrapper around `z.object(...)` that brands the result for use with
 * `loadConfig`. Today this is just `z.object(shape)` — the wrapper exists so
 * a future toolkit upgrade (richer marker tracking, OpenAPI export, etc.)
 * can hook in without breaking buyer code.
 */
export function defineConfig<TShape extends z.ZodRawShape>(
  shape: TShape,
): z.ZodObject<TShape> {
  return z.object(shape);
}

export type ConfigSchema = z.ZodObject<z.ZodRawShape>;
export type InferConfig<T extends ConfigSchema> = z.infer<T>;
