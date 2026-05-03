import type { z } from "zod";

/**
 * Wrap a Zod parse failure with a multi-issue, human-readable message and
 * a stable error `code` so callers can pattern-match programmatically
 * without parsing strings.
 *
 * The message lists every failed path so an operator sees the full
 * surface of "what config keys are wrong" in one go, not one-at-a-time.
 */
export class ConfigValidationError extends Error {
  override readonly name = "ConfigValidationError";
  readonly code = "CONFIG_INVALID";
  readonly issues: ReadonlyArray<{ path: string; message: string }>;

  constructor(zodError: z.ZodError) {
    const issues = zodError.issues.map((issue) => ({
      path: issue.path.length === 0 ? "<root>" : issue.path.join("."),
      message: issue.message,
    }));
    const summary = issues
      .map((i, idx) => `  ${idx + 1}. ${i.path}: ${i.message}`)
      .join("\n");
    super(
      `Config validation failed (${issues.length} issue${
        issues.length === 1 ? "" : "s"
      }):\n${summary}`,
    );
    this.issues = issues;
  }
}

/**
 * Run a Zod schema against a value and either return the parsed (typed)
 * result or throw `ConfigValidationError`. Used by `loader.ts` as the
 * fail-fast gate.
 *
 * The schema's `parse` could be called directly, but routing through this
 * helper means tests can substitute a non-throwing variant if they want
 * to assert on the issues array, and downstream code never has to know
 * the failure shape is "ZodError".
 */
export function validateConfig<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ConfigValidationError(result.error);
  }
  return result.data;
}
