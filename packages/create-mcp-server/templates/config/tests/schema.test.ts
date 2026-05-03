import { describe, it, expect } from "vitest";
import {
  defineConfig,
  secret,
  isSecretSchema,
  SECRET_MARKER,
  z,
} from "../src/config/index.js";

describe("schema", () => {
  describe("secret()", () => {
    it("attaches the @secret marker to the description", () => {
      const s = secret(z.string(), "API key");
      expect(s.description).toBe(`${SECRET_MARKER} API key`);
    });

    it("works without a note", () => {
      const s = secret(z.string());
      expect(s.description).toBe(SECRET_MARKER);
    });

    it("preserves the underlying schema's runtime behavior", () => {
      const s = secret(z.string().min(3));
      expect(() => s.parse("ab")).toThrow();
      expect(s.parse("abc")).toBe("abc");
    });
  });

  describe("isSecretSchema()", () => {
    it("returns true for tagged schemas", () => {
      expect(isSecretSchema(secret(z.string()))).toBe(true);
    });

    it("returns false for untagged schemas", () => {
      expect(isSecretSchema(z.string())).toBe(false);
      expect(isSecretSchema(z.string().describe("not a secret"))).toBe(false);
    });
  });

  describe("defineConfig()", () => {
    it("returns a Zod object schema with the given shape", () => {
      const schema = defineConfig({ name: z.string(), age: z.number() });
      const out = schema.parse({ name: "x", age: 1 });
      expect(out).toEqual({ name: "x", age: 1 });
    });

    it("rejects extra-typed values via Zod", () => {
      const schema = defineConfig({ name: z.string() });
      expect(() => schema.parse({ name: 1 })).toThrow();
    });
  });
});
