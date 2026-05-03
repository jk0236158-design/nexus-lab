import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runStdio } from "@nexus-lab/mcp-toolkit/bootstrap";
import { jsonResponse, textResponse } from "@nexus-lab/mcp-toolkit/response";
import {
  defineConfig,
  loadConfig,
  secret,
  z,
  ConfigValidationError,
} from "./config/index.js";

// ── 1. Define the config schema ─────────────────────────────────────────
//
// This is YOUR contract. Edit the shape, add fields, mark secrets — the
// rest of the file is wiring you can leave alone.
const ConfigSchema = defineConfig({
  server: z.object({
    name: z.string().min(1).default("my-mcp-server"),
    version: z.string().default("0.1.0"),
    port: z.coerce.number().int().positive().default(3000),
  }),
  features: z
    .object({
      // Snake_case key so the env-binding layer (`MCP_FEATURES_VERBOSE_LOGGING`)
      // round-trips cleanly. The convention: lowercase + `_` = nesting,
      // `__` = literal `_` in a leaf. See README for details.
      verbose_logging: z.coerce.boolean().default(false),
    })
    .default({ verbose_logging: false }),
  // `secret(...)` flags this field for log redaction. The value is still
  // available to your server code — only `console.log` / `safeStringify`
  // ever sees the placeholder. Snake_case for env-binding round-trip.
  api_key: secret(z.string().min(1), "Upstream API key").optional(),
});

// ── 2. Load + validate at startup (fail-fast) ───────────────────────────
let loaded;
try {
  loaded = await loadConfig({
    schema: ConfigSchema,
    envPrefix: "MCP_",
    files: [
      "config.yaml",
      "config.dev.yaml",
      "config.prod.yaml",
      "config.test.yaml",
    ],
    profile: "auto",
  });
} catch (err) {
  if (err instanceof ConfigValidationError) {
    console.error(err.message);
  } else {
    console.error(
      `Fatal: failed to load config: ${err instanceof Error ? err.message : err}`,
    );
  }
  process.exit(1);
}

const { config, profile } = loaded;

// ── 3. Build the MCP server ─────────────────────────────────────────────
const server = new McpServer({
  name: config.server.name,
  version: config.server.version,
});

// Tool: report the active profile.
server.tool(
  "config-profile",
  "Returns the active config profile (dev / prod / test).",
  {},
  async () => textResponse(profile),
);

// Tool: dump a redacted view of the loaded config (safe for log echo).
server.tool(
  "config-dump",
  "Returns a JSON dump of the active config with all @secret fields redacted.",
  {},
  async () => jsonResponse(loaded.toSafeJson()),
);

// Tool: tell us whether a given config key was supplied (without revealing
// the value, even for non-secrets — handy for "is this feature enabled").
server.tool(
  "config-has",
  "Returns true / false for whether a dotted config path resolves to a non-undefined value.",
  {
    path: z
      .string()
      .min(1)
      .describe('Dotted path, e.g. "features.verbose_logging" or "api_key".'),
  },
  async ({ path }) => textResponse(String(resolvePath(config, path) !== undefined)),
);

function resolvePath(value: unknown, path: string): unknown {
  let cursor: unknown = value;
  for (const segment of path.split(".")) {
    if (cursor === null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}

// ── 4. Boot ─────────────────────────────────────────────────────────────
await runStdio(server, {
  readyMessage: `MCP server "${config.server.name}" running on stdio (profile=${profile})`,
});
