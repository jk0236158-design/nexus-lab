import { describe, it, expect } from "vitest";
import {
  jsonResponse,
  textResponse,
  errorResponse,
  statusResponse,
  safeErrorMessage,
} from "../src/response.js";

describe("jsonResponse", () => {
  it("stringifies non-string payloads with 2-space indent by default", () => {
    const r = jsonResponse({ a: 1 });
    expect(r.content[0]).toEqual({
      type: "text",
      text: '{\n  "a": 1\n}',
    });
    expect(r.isError).toBeUndefined();
  });
  it("passes string payloads through unchanged", () => {
    expect(jsonResponse("hi").content[0].text).toBe("hi");
  });
  it("supports compact (non-pretty) mode", () => {
    expect(jsonResponse({ a: 1 }, false).content[0].text).toBe('{"a":1}');
  });
});

describe("textResponse", () => {
  it("wraps text payload", () => {
    expect(textResponse("hi")).toEqual({
      content: [{ type: "text", text: "hi" }],
    });
  });
});

describe("errorResponse", () => {
  it("marks isError true", () => {
    const r = errorResponse("nope");
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toBe("nope");
  });
});

describe("statusResponse", () => {
  it("emits status/ok/body envelope and flips isError on non-ok", () => {
    const ok = statusResponse(200, { id: 1 }, true);
    expect(JSON.parse(ok.content[0].text)).toEqual({
      status: 200,
      ok: true,
      body: { id: 1 },
    });
    expect(ok.isError).toBe(false);

    const bad = statusResponse(500, { error: "boom" }, false);
    expect(bad.isError).toBe(true);
  });
});

describe("safeErrorMessage", () => {
  it("includes the error message when an Error is thrown", () => {
    expect(safeErrorMessage(new Error("nope"), "fetch")).toBe(
      "Failed to fetch: nope",
    );
  });
  it("falls back to a stable message on non-Error", () => {
    expect(safeErrorMessage("oops", "fetch")).toMatch(/Failed to fetch/);
    expect(safeErrorMessage(undefined, "fetch")).toMatch(/Failed to fetch/);
  });
});
