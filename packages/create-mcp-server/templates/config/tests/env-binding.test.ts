import { describe, it, expect } from "vitest";
import { bindEnvToObject, deepMerge } from "../src/config/index.js";

describe("bindEnvToObject", () => {
  it("strips the prefix and nests on single-underscore boundaries", () => {
    const out = bindEnvToObject({
      prefix: "MCP_",
      env: {
        MCP_SERVER_NAME: "x",
        MCP_SERVER_PORT: "3000",
      },
    });
    expect(out).toEqual({ server: { name: "x", port: "3000" } });
  });

  it("treats every single delimiter as a nesting level", () => {
    const out = bindEnvToObject({
      prefix: "MCP_",
      env: { MCP_DB_POOL_SIZE: "10" },
    });
    expect(out).toEqual({ db: { pool: { size: "10" } } });
  });

  it("treats `__` as an escape for a literal underscore in the segment", () => {
    const out = bindEnvToObject({
      prefix: "MCP_",
      env: { MCP_LOG__FILE: "/tmp/a.log" },
    });
    expect(out).toEqual({ log_file: "/tmp/a.log" });
  });

  it("supports `__` mid-name combined with regular nesting", () => {
    const out = bindEnvToObject({
      prefix: "MCP_",
      env: { MCP_LOG_FILE__PATH: "/tmp/a.log" },
    });
    expect(out).toEqual({ log: { file_path: "/tmp/a.log" } });
  });

  it("ignores env vars that don't match the prefix", () => {
    const out = bindEnvToObject({
      prefix: "MCP_",
      env: {
        OTHER_VAR: "x",
        MCP_OK: "1",
      },
    });
    expect(out).toEqual({ ok: "1" });
  });

  it("ignores undefined env values", () => {
    const out = bindEnvToObject({
      prefix: "MCP_",
      env: { MCP_A: undefined, MCP_B: "y" },
    });
    expect(out).toEqual({ b: "y" });
  });

  it("returns {} when nothing matches", () => {
    expect(bindEnvToObject({ prefix: "MCP_", env: {} })).toEqual({});
  });

  it("throws when prefix is empty (defensive)", () => {
    expect(() => bindEnvToObject({ prefix: "", env: {} })).toThrow();
  });

  it("supports a custom delimiter", () => {
    const out = bindEnvToObject({
      prefix: "MCP.",
      delimiter: ".",
      env: { "MCP.server.port": "3000" },
    });
    expect(out).toEqual({ server: { port: "3000" } });
  });

  it("lowercases segments so `MCP_FOO` and `MCP_foo` produce the same shape", () => {
    expect(
      bindEnvToObject({ prefix: "MCP_", env: { MCP_FOO: "1" } }),
    ).toEqual({ foo: "1" });
    expect(
      bindEnvToObject({ prefix: "MCP_", env: { MCP_foo: "2" } }),
    ).toEqual({ foo: "2" });
  });

  it("preserves string-only typing (no auto-coerce)", () => {
    const out = bindEnvToObject({
      prefix: "MCP_",
      env: { MCP_PORT: "3000", MCP_FLAG: "true" },
    });
    expect(out).toEqual({ port: "3000", flag: "true" });
  });

  it("does not crash when env-only entry is exactly the prefix", () => {
    const out = bindEnvToObject({
      prefix: "MCP_",
      env: { MCP_: "noop", MCP_OK: "y" },
    });
    expect(out).toEqual({ ok: "y" });
  });
});

describe("deepMerge", () => {
  it("merges nested objects, override winning on conflict", () => {
    const base = { a: 1, b: { c: 2, d: 3 } };
    const out = deepMerge(base, { b: { c: 99 } } as Partial<typeof base>);
    expect(out).toEqual({ a: 1, b: { c: 99, d: 3 } });
  });

  it("does not mutate either argument", () => {
    const base = { a: { b: 1 } };
    const override = { a: { b: 2 } };
    deepMerge(base, override);
    expect(base.a.b).toBe(1);
    expect(override.a.b).toBe(2);
  });

  it("REPLACES arrays in override (no element-level merge)", () => {
    const out = deepMerge(
      { list: [1, 2, 3] },
      { list: [9] } as Partial<{ list: number[] }>,
    );
    expect(out.list).toEqual([9]);
  });

  it("ignores undefined override values", () => {
    const out = deepMerge({ a: 1 }, { a: undefined } as Partial<{ a: number }>);
    expect(out).toEqual({ a: 1 });
  });
});
