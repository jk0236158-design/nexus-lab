# @nexus-lab/mcp-toolkit

Shared building blocks for MCP servers built with `@nexus-lab/create-mcp-server` templates.

## Why

Every template (minimal / full / http / database / auth / api-proxy) repeats the same scaffolding:

- stdio / HTTP transport bootstrap
- env-var parsing with safe fallbacks
- `toolResponse` / error formatter wrappers
- in-memory rate limiter

This package extracts those helpers so each template only declares **what is unique to its domain** (db schema, proxy logic, auth strategy, etc).

## Install

```bash
npm install @nexus-lab/mcp-toolkit
```

`@modelcontextprotocol/sdk` is a peer dependency — install it alongside.

## Usage

### Bootstrap a stdio server

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runStdio } from "@nexus-lab/mcp-toolkit/bootstrap";

const server = new McpServer({ name: "my-server", version: "0.1.0" });
// ... register tools/resources/prompts ...
await runStdio(server);
```

### Read env vars safely

```ts
import {
  parseIntEnv,
  requireEnv,
  readCsvEnv,
  readOptionalStringEnv,
} from "@nexus-lab/mcp-toolkit/env";

const port = parseIntEnv(process.env.PORT, 3000);
const dbUrl = requireEnv("DATABASE_URL");           // throws if missing
const origins = readCsvEnv("CORS_ORIGINS");         // -> Set<string>
const token = readOptionalStringEnv("BEARER_TOKEN"); // -> string | undefined
```

### Format tool responses

```ts
import {
  jsonResponse,
  textResponse,
  errorResponse,
  statusResponse,
} from "@nexus-lab/mcp-toolkit/response";

server.tool("hello", "say hi", { name: z.string() }, async ({ name }) => {
  return textResponse(`Hello, ${name}!`);
});
```

### Rate-limit per key

```ts
import { RateLimiter, resolveRateLimitFromEnv } from "@nexus-lab/mcp-toolkit/rate-limit";

const { max, windowMs } = resolveRateLimitFromEnv({
  maxEnvVar: "RATE_LIMIT_MAX",
  windowMsEnvVar: "RATE_LIMIT_WINDOW_MS",
  defaultMax: 100,
  defaultWindowMs: 60_000,
});
const limiter = new RateLimiter({ max, windowMs });

const decision = limiter.consume("user:42");
if (!decision.allowed) {
  // respond 429, set Retry-After: decision.resetSeconds
}
```

## Module map

| Subpath                                        | Exports                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `@nexus-lab/mcp-toolkit/bootstrap`             | `runStdio`, `InMemorySessionStore`, `SessionStore`, `HttpTransportLike`       |
| `@nexus-lab/mcp-toolkit/env`                   | `parseIntEnv`, `readIntEnv`, `requireEnv`, `readCsvEnv`, `readOptionalStringEnv` |
| `@nexus-lab/mcp-toolkit/response`              | `jsonResponse`, `textResponse`, `errorResponse`, `statusResponse`, `safeErrorMessage` |
| `@nexus-lab/mcp-toolkit/rate-limit`            | `RateLimiter`, `MemoryRateLimitStore`, `resolveRateLimitFromEnv`              |

The root entry (`@nexus-lab/mcp-toolkit`) re-exports all of the above.

## Stability

- v0.1.x — internal use by Nexus Lab templates. API may shift before v0.2.
- All public functions covered by unit tests (`npm test`).

## License

MIT — see [LICENSE](./LICENSE).
