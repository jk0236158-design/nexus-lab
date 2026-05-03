import { describe, it, expect } from "vitest";
import { InMemorySessionStore } from "../src/bootstrap.js";

describe("InMemorySessionStore", () => {
  it("stores, retrieves, and deletes session transports", () => {
    const store = new InMemorySessionStore<{
      sessionId: string;
      handleRequest: () => Promise<void>;
    }>();
    const t = { sessionId: "s1", handleRequest: async () => undefined };
    store.set("s1", t);
    expect(store.has("s1")).toBe(true);
    expect(store.get("s1")).toBe(t);
    store.delete("s1");
    expect(store.has("s1")).toBe(false);
  });
});

// Note: runStdio() is exercised end-to-end via the template integration tests
// (full/database use it). We keep the unit-test surface here narrow because
// stubbing the whole MCP SDK transport is brittle and adds little signal.
