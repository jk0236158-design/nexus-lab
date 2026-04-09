import { describe, it, expect } from "vitest";
import { greet, calculate } from "../src/tools.js";

describe("greet", () => {
  it("returns a greeting with the given name", () => {
    const result = greet("Alice");
    expect(result).toBe("Hello, Alice! Welcome to the MCP server.");
  });

  it("handles empty string", () => {
    const result = greet("");
    expect(result).toBe("Hello, ! Welcome to the MCP server.");
  });
});

describe("calculate", () => {
  it("evaluates simple addition", () => {
    expect(calculate("2 + 3")).toBe("5");
  });

  it("evaluates multiplication with precedence", () => {
    expect(calculate("2 + 3 * 4")).toBe("14");
  });

  it("evaluates expressions with parentheses", () => {
    expect(calculate("(2 + 3) * 4")).toBe("20");
  });

  it("evaluates decimal numbers", () => {
    expect(calculate("1.5 + 2.5")).toBe("4");
  });

  it("rejects expressions with invalid characters", () => {
    expect(() => calculate("require('fs')")).toThrow("Invalid expression");
  });

  it("rejects alphabetic input", () => {
    expect(() => calculate("abc")).toThrow("Invalid expression");
  });

  it("rejects division by zero (Infinity)", () => {
    expect(() => calculate("1/0")).toThrow(
      "Expression did not evaluate to a finite number"
    );
  });
});
