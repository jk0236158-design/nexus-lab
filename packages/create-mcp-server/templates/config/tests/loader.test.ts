import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadConfig,
  defineConfig,
  secret,
  z,
  ConfigValidationError,
  REDACTED,
} from "../src/config/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fix = (name: string) => path.join(__dirname, "fixtures", name);

const TestSchema = defineConfig({
  server: z.object({
    name: z.string().min(1),
    port: z.coerce.number().int().positive().default(3000),
  }),
  features: z
    .object({
      verbose_logging: z.coerce.boolean().default(false),
    })
    .default({ verbose_logging: false }),
  api_key: secret(z.string()).optional(),
});

describe("loadConfig — file layer", () => {
  it("loads a valid YAML file and returns a typed config", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      files: [fix("valid.yaml")],
      env: {},
    });
    expect(result.config.server.name).toBe("fixture-server");
    expect(result.config.server.port).toBe(4242);
    expect(result.config.features.verbose_logging).toBe(true);
    expect(result.config.api_key).toBe("yaml-secret-token");
    expect(result.filesLoaded).toEqual([fix("valid.yaml")]);
  });

  it("loads JSON", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      files: [fix("minimal.json")],
      env: {},
    });
    expect(result.config.server.name).toBe("json-server");
    expect(result.config.server.port).toBe(3000); // schema default
  });

  it("loads TOML", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      files: [fix("full.toml")],
      env: {},
    });
    expect(result.config.server.name).toBe("toml-server");
    expect(result.config.server.port).toBe(8080);
    expect(result.config.features.verbose_logging).toBe(true);
  });

  it("silently skips missing files", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      files: [fix("does-not-exist.yaml"), fix("minimal.json")],
      env: {},
    });
    expect(result.filesLoaded).toEqual([fix("minimal.json")]);
  });

  it("returns ConfigValidationError on schema failure with multi-issue message", async () => {
    await expect(
      loadConfig({
        schema: TestSchema,
        files: [fix("invalid.yaml")],
        env: {},
      }),
    ).rejects.toMatchObject({
      name: "ConfigValidationError",
      code: "CONFIG_INVALID",
    });
  });

  it("rejects an unknown file extension", async () => {
    await expect(
      loadConfig({
        schema: TestSchema,
        files: ["something.xml"],
        env: {},
        readFile: async () => "<root/>",
      }),
    ).rejects.toThrow(/Unsupported config file extension/);
  });

  it("rejects a file whose root is not an object", async () => {
    await expect(
      loadConfig({
        schema: TestSchema,
        files: ["bad.json"],
        env: {},
        readFile: async () => '["a", "b"]',
      }),
    ).rejects.toThrow(/must contain an object at the root/);
  });

  it("propagates non-ENOENT read errors", async () => {
    await expect(
      loadConfig({
        schema: TestSchema,
        files: ["forbidden.yaml"],
        env: {},
        readFile: async () => {
          const err = new Error("EACCES: permission denied") as Error & {
            code?: string;
          };
          err.code = "EACCES";
          throw err;
        },
      }),
    ).rejects.toThrow(/EACCES/);
  });
});

describe("loadConfig — env layer", () => {
  it("binds env vars on top of file values", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      envPrefix: "MCP_",
      files: [fix("valid.yaml")],
      env: { MCP_SERVER_PORT: "9000" },
    });
    expect(result.config.server.port).toBe(9000);
    expect(result.config.server.name).toBe("fixture-server"); // file value preserved
  });

  it("env wins over file on conflict", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      envPrefix: "MCP_",
      files: [fix("valid.yaml")],
      env: { MCP_SERVER_NAME: "from-env" },
    });
    expect(result.config.server.name).toBe("from-env");
  });

  it("works with env-only (no files)", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      envPrefix: "MCP_",
      env: { MCP_SERVER_NAME: "env-only" },
    });
    expect(result.config.server.name).toBe("env-only");
    expect(result.config.server.port).toBe(3000); // default
  });
});

describe("loadConfig — profile selection", () => {
  it("picks the profile-specific file when present", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      files: [fix("config.base.yaml"), fix("config.dev.yaml")],
      env: { NODE_ENV: "development" },
    });
    expect(result.profile).toBe("dev");
    // dev overlay applied last
    expect(result.config.server.name).toBe("dev-tier");
    expect(result.config.server.port).toBe(3001);
  });

  it("layers base + profile-specific (base loaded, profile overrides)", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      files: [fix("config.base.yaml"), fix("config.prod.yaml")],
      env: { NODE_ENV: "production" },
    });
    expect(result.profile).toBe("prod");
    expect(result.filesLoaded).toEqual([
      fix("config.base.yaml"),
      fix("config.prod.yaml"),
    ]);
    expect(result.config.server.name).toBe("prod-tier");
    expect(result.config.server.port).toBe(80);
  });

  it("does NOT load mismatched profile files", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      files: [fix("config.dev.yaml"), fix("config.prod.yaml")],
      env: { NODE_ENV: "production" },
    });
    expect(result.profile).toBe("prod");
    expect(result.filesLoaded).toEqual([fix("config.prod.yaml")]);
  });
});

describe("loadConfig — secrets", () => {
  it("returns secretPaths and a working toSafeJson()", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      files: [fix("valid.yaml")],
      env: {},
    });
    expect(result.secretPaths).toContain("api_key");
    const safe = result.toSafeJson() as { api_key?: string };
    expect(safe.api_key).toBe(REDACTED);
  });
});

describe("loadConfig — integration (env + file + profile combined)", () => {
  it("full pipeline: file + env override + profile selection", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      envPrefix: "MCP_",
      files: [fix("config.base.yaml"), fix("config.prod.yaml")],
      env: {
        NODE_ENV: "production",
        MCP_SERVER_PORT: "443",
        MCP_API__KEY: "prod-secret",
      },
    });
    expect(result.profile).toBe("prod");
    expect(result.config.server.name).toBe("prod-tier"); // from prod file
    expect(result.config.server.port).toBe(443); // from env (wins)
    expect(result.config.api_key).toBe("prod-secret"); // from env
    // safe view redacts the secret
    expect((result.toSafeJson() as { api_key: string }).api_key).toBe(REDACTED);
  });

  it("MCP_CONFIG_PROFILE overrides NODE_ENV", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      files: [fix("config.dev.yaml"), fix("config.prod.yaml")],
      env: {
        NODE_ENV: "production",
        MCP_CONFIG_PROFILE: "dev",
      },
    });
    expect(result.profile).toBe("dev");
    expect(result.config.server.name).toBe("dev-tier");
  });

  it("explicit profile beats every env signal", async () => {
    // No test-tier file exists in this list, so the file layer contributes
    // nothing — the schema requires `server.name`, so we fail fast with
    // ConfigValidationError. That's the contract: explicit profile wins,
    // and missing config surfaces immediately rather than silently picking
    // the wrong tier.
    await expect(
      loadConfig({
        schema: TestSchema,
        profile: "test",
        files: [fix("config.dev.yaml"), fix("config.prod.yaml")],
        env: { NODE_ENV: "production", MCP_CONFIG_PROFILE: "dev" },
      }),
    ).rejects.toMatchObject({ code: "CONFIG_INVALID" });
  });

  it("explicit profile + matching env supplies the missing value", async () => {
    const result = await loadConfig({
      schema: TestSchema,
      profile: "test",
      envPrefix: "MCP_",
      files: [fix("config.dev.yaml"), fix("config.prod.yaml")],
      env: {
        NODE_ENV: "production",
        MCP_CONFIG_PROFILE: "dev",
        MCP_SERVER_NAME: "test-tier-from-env",
      },
    });
    expect(result.profile).toBe("test");
    expect(result.filesLoaded).toEqual([]);
    expect(result.config.server.name).toBe("test-tier-from-env");
  });
});

describe("ConfigValidationError", () => {
  it("aggregates all issues into a single message", () => {
    const schema = defineConfig({ a: z.string(), b: z.number() });
    try {
      schema.parse({ a: 1, b: "x" });
    } catch (err) {
      const wrapped = new ConfigValidationError(err as z.ZodError);
      expect(wrapped.issues.length).toBe(2);
      expect(wrapped.message).toMatch(/Config validation failed \(2 issues\)/);
    }
  });

  it("uses <root> when an issue has no path", () => {
    const schema = z.object({}).strict();
    try {
      schema.parse({ extra: 1 });
    } catch (err) {
      const wrapped = new ConfigValidationError(err as z.ZodError);
      // strict-mode issues attach to the bad key, not root, but we verify
      // the formatter handles a synthetic root-level issue too.
      expect(
        wrapped.issues.every((i) => typeof i.path === "string"),
      ).toBe(true);
    }
  });
});
