import { describe, it, expect } from "vitest";
import {
  parseIntEnv,
  readIntEnv,
  requireEnv,
  readCsvEnv,
  readOptionalStringEnv,
} from "../src/env.js";

describe("parseIntEnv", () => {
  it("returns fallback when value is undefined or empty", () => {
    expect(parseIntEnv(undefined, 10)).toBe(10);
    expect(parseIntEnv("", 10)).toBe(10);
  });
  it("parses valid integers", () => {
    expect(parseIntEnv("42", 0)).toBe(42);
    expect(parseIntEnv("0", 99)).toBe(0);
  });
  it("returns fallback when value is non-numeric or negative", () => {
    expect(parseIntEnv("nope", 5)).toBe(5);
    expect(parseIntEnv("-1", 5)).toBe(5);
  });
});

describe("readIntEnv", () => {
  it("returns fallback when name is undefined or env var missing", () => {
    expect(readIntEnv(undefined, 7, {})).toBe(7);
    expect(readIntEnv("MISSING", 7, {})).toBe(7);
    expect(readIntEnv("EMPTY", 7, { EMPTY: "" })).toBe(7);
  });
  it("requires strictly positive integers", () => {
    expect(readIntEnv("X", 5, { X: "0" })).toBe(5);
    expect(readIntEnv("X", 5, { X: "10" })).toBe(10);
    expect(readIntEnv("X", 5, { X: "-3" })).toBe(5);
  });
});

describe("requireEnv", () => {
  it("returns the value when set", () => {
    expect(requireEnv("FOO", { FOO: "bar" })).toBe("bar");
  });
  it("throws on missing or empty values", () => {
    expect(() => requireEnv("FOO", {})).toThrow(/FOO is not configured/);
    expect(() => requireEnv("FOO", { FOO: "   " })).toThrow(
      /FOO is not configured/,
    );
  });
  it("never embeds the offending value in the error message", () => {
    try {
      requireEnv("SECRET_KEY", {});
    } catch (e) {
      expect((e as Error).message).not.toMatch(/=/);
    }
  });
});

describe("readCsvEnv", () => {
  it("returns empty set for missing env", () => {
    expect(readCsvEnv("X", {}).size).toBe(0);
  });
  it("trims and dedupes entries", () => {
    const set = readCsvEnv("X", { X: "a, b ,a,  c " });
    expect([...set].sort()).toEqual(["a", "b", "c"]);
  });
  it("ignores empty entries", () => {
    expect([...readCsvEnv("X", { X: ",a,," })]).toEqual(["a"]);
  });
});

describe("readOptionalStringEnv", () => {
  it("returns undefined for missing or whitespace-only", () => {
    expect(readOptionalStringEnv("X", {})).toBeUndefined();
    expect(readOptionalStringEnv("X", { X: "   " })).toBeUndefined();
  });
  it("trims surrounding whitespace", () => {
    expect(readOptionalStringEnv("X", { X: "  hi  " })).toBe("hi");
  });
});
