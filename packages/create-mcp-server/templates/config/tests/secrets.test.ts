import { describe, it, expect } from "vitest";
import {
  detectSecretPaths,
  redactSecrets,
  safeStringify,
  REDACTED,
  defineConfig,
  secret,
  z,
} from "../src/config/index.js";

describe("detectSecretPaths", () => {
  it("returns dotted paths for every @secret-marked leaf", () => {
    const schema = defineConfig({
      api_key: secret(z.string()),
      database: z.object({
        password: secret(z.string()),
        host: z.string(),
      }),
      port: z.number(),
    });
    expect(detectSecretPaths(schema).sort()).toEqual([
      "api_key",
      "database.password",
    ]);
  });

  it("descends into ZodOptional / ZodNullable / ZodDefault wrappers", () => {
    const schema = defineConfig({
      a: secret(z.string()).optional(),
      b: secret(z.string()).nullable(),
      c: secret(z.string()).default("x"),
      d: z
        .object({ inner: secret(z.string()) })
        .optional(),
    });
    expect(detectSecretPaths(schema).sort()).toEqual([
      "a",
      "b",
      "c",
      "d.inner",
    ]);
  });

  it("returns [] for a schema with no secrets", () => {
    const schema = defineConfig({ port: z.number(), name: z.string() });
    expect(detectSecretPaths(schema)).toEqual([]);
  });

  it("does not throw on deeply wrapped schemas", () => {
    const schema = defineConfig({
      a: secret(z.string()).optional().nullable().default(null),
    });
    expect(detectSecretPaths(schema)).toContain("a");
  });
});

describe("redactSecrets", () => {
  it("replaces each path with [REDACTED] without mutating the source", () => {
    const original = {
      api_key: "secret-1",
      database: { password: "secret-2", host: "localhost" },
    };
    const result = redactSecrets(original, [
      "api_key",
      "database.password",
    ]);
    expect(result).toEqual({
      api_key: REDACTED,
      database: { password: REDACTED, host: "localhost" },
    });
    // Source untouched
    expect(original.api_key).toBe("secret-1");
    expect(original.database.password).toBe("secret-2");
  });

  it("silently skips missing paths", () => {
    const result = redactSecrets({ a: 1 }, ["b.c.d"]);
    expect(result).toEqual({ a: 1 });
  });

  it("returns a clone even when secretPaths is empty", () => {
    const original = { a: { b: 1 } };
    const result = redactSecrets(original, []);
    expect(result).toEqual(original);
    expect(result).not.toBe(original);
  });

  it("does not throw when traversing through a primitive", () => {
    const result = redactSecrets({ a: "hi" }, ["a.b.c"]);
    expect(result).toEqual({ a: "hi" });
  });
});

describe("safeStringify", () => {
  it("redacts via the schema in one call", () => {
    const schema = defineConfig({
      api_key: secret(z.string()),
      port: z.number(),
    });
    const text = safeStringify({ api_key: "leaky", port: 80 }, schema);
    const parsed = JSON.parse(text);
    expect(parsed.api_key).toBe(REDACTED);
    expect(parsed.port).toBe(80);
  });

  it("supports compact (non-pretty) mode", () => {
    const schema = defineConfig({ port: z.number() });
    expect(safeStringify({ port: 1 }, schema, false)).toBe('{"port":1}');
  });
});
