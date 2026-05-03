import { describe, it, expect } from "vitest";
import { resolveProfile, pickProfileFile } from "../src/config/index.js";

describe("resolveProfile", () => {
  it("returns explicit profile when given one (not auto)", () => {
    expect(resolveProfile({ profile: "prod", env: {} })).toBe("prod");
  });

  it("ignores invalid explicit profiles and falls through", () => {
    // ProfileSelector excludes invalid values at the type level; cast to
    // simulate runtime garbage (bad CLI flag, JSON config, etc).
    expect(
      resolveProfile({
        profile: "staging" as unknown as "auto",
        env: { NODE_ENV: "production" },
      }),
    ).toBe("prod");
  });

  it("reads MCP_CONFIG_PROFILE before NODE_ENV", () => {
    expect(
      resolveProfile({
        env: { MCP_CONFIG_PROFILE: "test", NODE_ENV: "production" },
      }),
    ).toBe("test");
  });

  it("falls back to NODE_ENV when MCP_CONFIG_PROFILE is missing/invalid", () => {
    expect(
      resolveProfile({ env: { NODE_ENV: "production" } }),
    ).toBe("prod");
    expect(
      resolveProfile({
        env: { MCP_CONFIG_PROFILE: "garbage", NODE_ENV: "test" },
      }),
    ).toBe("test");
  });

  it("maps NODE_ENV synonyms (development -> dev, production -> prod)", () => {
    expect(resolveProfile({ env: { NODE_ENV: "development" } })).toBe("dev");
    expect(resolveProfile({ env: { NODE_ENV: "production" } })).toBe("prod");
    expect(resolveProfile({ env: { NODE_ENV: "test" } })).toBe("test");
  });

  it("accepts already-canonical NODE_ENV values", () => {
    expect(resolveProfile({ env: { NODE_ENV: "dev" } })).toBe("dev");
    expect(resolveProfile({ env: { NODE_ENV: "prod" } })).toBe("prod");
  });

  it("defaults to dev when nothing is set", () => {
    expect(resolveProfile({ env: {} })).toBe("dev");
  });

  it("is case-insensitive on env-var values", () => {
    expect(
      resolveProfile({ env: { MCP_CONFIG_PROFILE: "PROD" } }),
    ).toBe("prod");
  });
});

describe("pickProfileFile", () => {
  it("prefers a profile-specific file over a generic one", () => {
    expect(
      pickProfileFile(["config.yaml", "config.prod.yaml"], "prod"),
    ).toBe("config.prod.yaml");
  });

  it("falls back to a generic file when no profile match exists", () => {
    expect(pickProfileFile(["config.yaml"], "prod")).toBe("config.yaml");
  });

  it("does not pick a wrong-profile file when no generic exists", () => {
    expect(pickProfileFile(["config.test.yaml"], "prod")).toBeUndefined();
  });

  it("returns undefined for an empty candidate list", () => {
    expect(pickProfileFile([], "dev")).toBeUndefined();
  });

  it("does not collide with substrings (e.g. production-keys.yaml)", () => {
    expect(
      pickProfileFile(["production-keys.yaml"], "prod"),
    ).toBe("production-keys.yaml");
    // A literal `.prod.` segment is required to count as profile-specific.
    expect(
      pickProfileFile(["production-keys.yaml", "config.prod.yaml"], "prod"),
    ).toBe("config.prod.yaml");
  });
});
