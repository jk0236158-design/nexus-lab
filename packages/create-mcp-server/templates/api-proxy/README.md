# MCP Server: Agent-safe API Proxy

A production-ready [Model Context Protocol](https://modelcontextprotocol.io/)
server that wraps a REST API with secure defaults: request validation, path
pivot protection, rate limiting, timeout, retry, response sanitization, and
secret-leak protection.

This template is **not** a generic OpenAPI-to-MCP generator. It is a small,
opinionated wrapper you own, with the agent-facing surface kept deliberately
narrow so a confused or adversarial agent cannot pivot the proxy to arbitrary
hosts or leak credentials.

## Who this is for

- **You're building:** an MCP server that lets an agent call a REST API you don't fully trust the agent to reason about — internal microservice, third-party SaaS, or any upstream where an agent sending the wrong URL would be expensive.
- **What it saves you:** the iteration where your agent pivots `path` to `https://evil.example.com` and leaks your bearer token, the one where an upstream error leaks `ECONNREFUSED 10.0.0.5:443` into the agent's context, and the runaway retry loop that DOS'es your upstream. All three are closed at the edges before you ship.
- **What's in the zip:** full scaffolded project — `src/` (index, proxy client with timeout / retry / rate limit, tools, error formatter, response sanitizer), `tests/` covering path pivot + secret redaction + rate-limit exhaustion + end-to-end MCP calls, `.env.example`, TS config, and this README.
- **Not a fit if:** you want auto-generated tools from an OpenAPI spec (use `@orval/mcp`), you need streaming responses, or you're proxying binary / non-JSON payloads. Also not a fit as-is for multi-process deploys — the rate limiter is in-memory.
- **Run it in 4 steps:** `npm install` → `cp .env.example .env` (set `UPSTREAM_BASE_URL`) → `npm run build` → register in your MCP client (`.mcp.json` or Claude Desktop config). Runs over stdio — no port exposed.
- **Next:** [get it on Gumroad](https://nexuslabzen.gumroad.com/l/bktllv) · scaffold via `npx @nexus-lab/create-mcp-server my-server --template api-proxy` (CLI shows purchase link) · source ships in the Gumroad zip.

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env — at minimum, set UPSTREAM_BASE_URL

# Build and start
npm run build
npm start
```

The server runs over **stdio** — it is intended to be launched by an MCP
client (Claude Desktop, Claude Code, etc.), not exposed on a port.

## Example: proxying JSON Placeholder

Drop this into `.env`:

```
UPSTREAM_BASE_URL=https://jsonplaceholder.typicode.com
```

Register the server in your MCP client (e.g., `.mcp.json` for Claude Code):

```json
{
  "mcpServers": {
    "json-placeholder": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": { "UPSTREAM_BASE_URL": "https://jsonplaceholder.typicode.com" }
    }
  }
}
```

An agent can then call:

```json
{ "name": "proxy-get", "arguments": { "path": "/users/1" } }
```

and receive:

```json
{
  "status": 200,
  "ok": true,
  "body": { "id": 1, "name": "Leanne Graham", "...": "..." }
}
```

POST / PUT / DELETE work the same way, with an optional JSON `body`:

```json
{
  "name": "proxy-post",
  "arguments": {
    "path": "/posts",
    "body": { "title": "hello", "body": "from agent", "userId": 1 }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `proxy-get` | GET against the configured upstream |
| `proxy-post` | POST with an optional JSON body |
| `proxy-put` | PUT with an optional JSON body |
| `proxy-delete` | DELETE against the configured upstream |

Every tool accepts `path` (required, relative) and `query` (optional
`Record<string, string \| number \| boolean>`). `proxy-post` and `proxy-put`
additionally accept `body` (any JSON-serializable value).

## Security Notes

The safety properties below are the reason this template exists. Each
corresponds to a real agent failure mode observed in the wild.

### Path pivot prevention

The agent cannot escape the configured upstream. Before composition, the
`path` input is validated along three axes:

1. **Zod schema rejects** any value matching `scheme://...` or starting with
   `//` (protocol-relative).
2. **`assertSafeRelativePath`** decodes the path and rejects `.`, `..`, and
   percent-encoded dot segments (`%2e%2e`, `%2E%2E`), null bytes, and
   backslash traversal (`\..\admin`).
3. **Post-composition origin + prefix check** — after resolving
   `UPSTREAM_BASE_URL + path` through `URL`, the proxy asserts the composed
   URL's origin matches the base origin AND its pathname starts with the
   base path prefix. Any path that normalizes above the base (e.g. `/../x`
   against `https://api.example.com/v1`) is refused.

This means a compromised agent cannot convince the proxy to forward credentials
to `evil.example.com`, nor pivot above the configured path prefix (a common
way to reach admin endpoints on APIs that share a host with their public API).

### Upstream error body is never forwarded verbatim

On a non-2xx response, the proxy **does not** return the raw upstream body —
it would risk leaking stack traces, internal hostnames, SQL errors, or echoed
credentials into the agent's context. Instead:

1. The raw body is logged server-side only (stderr), redacted if needed.
2. The agent receives a stable, safe shape with a `UPSTREAM_*` error code:

```json
{ "status": 404, "ok": false, "body": { "error": "UPSTREAM_NOT_FOUND", "message": "Upstream resource was not found." } }
```

| Code | Meaning |
|------|---------|
| `UPSTREAM_BAD_REQUEST` | 400 |
| `UPSTREAM_UNAUTHORIZED` | 401 |
| `UPSTREAM_FORBIDDEN` | 403 |
| `UPSTREAM_NOT_FOUND` | 404 |
| `UPSTREAM_CONFLICT` | 409 |
| `UPSTREAM_UNPROCESSABLE` | 422 |
| `UPSTREAM_RATE_LIMITED` | 429 |
| `UPSTREAM_SERVER_ERROR` | 5xx |
| `UPSTREAM_REDIRECT_BLOCKED` | 3xx (refused — see below) |
| `UPSTREAM_ERROR` | other non-ok |

If you need specific upstream error shapes visible to the agent (and you've
audited that upstream for leak risk), wrap a specific tool that transforms
the response yourself — don't relax the generic proxy.

### Redirects are refused, never followed

`fetch` is called with `redirect: "manual"`. A 3xx response from the
upstream — or any response with `type: "opaqueredirect"` — is mapped to
`UPSTREAM_REDIRECT_BLOCKED` and the `Location` header is logged
server-side only, never echoed to the agent. This exists because a default
`redirect: "follow"` would drag `Authorization` / `x-api-key` headers to
whatever host the upstream redirected to, **including an attacker-controlled
one**. If your upstream legitimately returns redirects (e.g. a CDN with
signed URLs), configure `UPSTREAM_BASE_URL` to the redirect target directly
rather than relying on the proxy to chase redirects.

### Secret redaction

Auth headers are attached by the proxy and never echoed in tool responses. If
the upstream itself echoes a secret in its response body, `sanitizeResponseBody`
walks the JSON recursively and replaces any occurrence of a configured secret
(`UPSTREAM_BEARER_TOKEN`, `UPSTREAM_API_KEY`) with `[REDACTED]` before it
reaches the agent's context. This is a last-line-of-defence against upstream
misconfiguration.

### Rate limiting (per attempt, not per request)

An in-memory token bucket limits **outbound fetch attempts** per process —
not logical requests. That distinction matters: a retry-eligible 5xx
response consumes a second token before the retry goes out, so
`PROXY_MAX_RETRIES` cannot multiply the effective outbound budget. When
the bucket is exhausted, the tool returns a `PROXY_RATE_LIMITED` error
with a retry hint. This protects upstream APIs from runaway agent loops.

```
PROXY_RATE_LIMITED: Too many requests while trying to fetch resource. Please wait and retry.
```

For multi-instance deployments, replace `RateLimiter` with a shared store
(Redis, etc.).

### Safe error messages via `formatProxyError()`

Raw upstream errors like `ECONNREFUSED 10.0.0.5:443` are not returned to the
agent. Instead, `formatProxyError()` classifies the failure and returns a
stable, user-safe message:

| Code | Message shape |
|------|---------------|
| `PROXY_RATE_LIMITED` | `Too many requests while trying to <action>.` |
| `PROXY_TIMEOUT` | `The upstream request timed out during <action>.` |
| Other | `Failed to <action>. The upstream request did not complete successfully.` |

No URLs, no tokens, no stack traces in agent-visible text.

### Timeout and retry

Every request runs under `AbortController` with `PROXY_TIMEOUT_MS`. Retries
are attempted on 5xx / 429 / network abort up to `PROXY_MAX_RETRIES`. 4xx
other than 429 are considered deterministic and surfaced immediately.

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `UPSTREAM_BASE_URL` | Yes | — | Base URL of the API to wrap |
| `UPSTREAM_BEARER_TOKEN` | No | — | Sent as `Authorization: Bearer <token>` |
| `UPSTREAM_API_KEY` | No | — | Sent as `<UPSTREAM_API_KEY_HEADER>: <key>` |
| `UPSTREAM_API_KEY_HEADER` | No | `x-api-key` | Header name for API-key auth |
| `PROXY_TIMEOUT_MS` | No | `10000` | Per-request timeout in ms |
| `PROXY_MAX_RETRIES` | No | `1` | Retries on 5xx / 429 / abort |
| `PROXY_RATE_LIMIT_MAX` | No | `60` | Max requests per window |
| `PROXY_RATE_LIMIT_WINDOW_MS` | No | `60000` | Window duration in ms |
| `PROXY_DEBUG` | No | — | Set to `1` to include stack traces in startup errors (off by default to avoid secret leakage through error text) |

### `UPSTREAM_BASE_URL` must not embed userinfo (breaking vs. v1.0.0)

The server refuses to start if `UPSTREAM_BASE_URL` contains `user:pass@` —
for example `https://alice:s3cret@api.example.com/v1`. Reason: that URL
ends up in startup logs, config objects, and error chains; embedded
credentials are a recurring real-world leak vector. Move the credentials
to `UPSTREAM_BEARER_TOKEN` or `UPSTREAM_API_KEY` and keep
`UPSTREAM_BASE_URL` limited to `scheme://host[:port]/path`.

### Upstream redirects are refused (not followed)

`fetch` is invoked with `redirect: "manual"`. Any 3xx response
(301/302/303/307/308) — or any response with `type: "opaqueredirect"` —
is mapped to `UPSTREAM_REDIRECT_BLOCKED` and the `Location` header is
logged server-side only, never echoed to the agent. This is a hard
requirement for the "secret-leak protection" property advertised above:
a default `redirect: "follow"` would silently drag `Authorization` and
`x-api-key` headers to whatever host the upstream redirected to,
including an attacker-controlled one. If your upstream legitimately
relies on redirects (e.g. a CDN returning signed URLs), point
`UPSTREAM_BASE_URL` directly at the redirect target rather than asking
the proxy to chase the 3xx.

## Testing

```bash
npm test
```

The suite covers:

- URL building with and without query parameters
- Header attachment (Bearer / API key)
- JSON body serialization
- Timeout + retry under abort
- Rate-limit exhaustion and reset
- Recursive secret redaction in response bodies
- End-to-end MCP tool calls via `InMemoryTransport`

## Troubleshooting

### `UPSTREAM_BASE_URL is not configured`

Set `UPSTREAM_BASE_URL` in `.env`. The server refuses to start without it —
there is no useful default.

### `Fatal error starting server: …` with no detail

Startup errors (invalid URL, missing env) print a fixed, sanitized
message by default to avoid leaking the offending value into logs. To
see the full error including stack traces, set `PROXY_DEBUG=1` in the
environment. Only do this in a trusted local shell — stack traces can
contain internal hostnames, and a mistyped `UPSTREAM_BASE_URL` with an
embedded token would appear verbatim.

### `UPSTREAM_BASE_URL must not contain embedded userinfo`

Upgrading from v1.0.0? `https://user:pass@host/v1` is no longer accepted
(v1.1.0 breaking change). Move the credentials to `UPSTREAM_BEARER_TOKEN`
or `UPSTREAM_API_KEY` and point `UPSTREAM_BASE_URL` at the plain
`scheme://host[:port]/path`.

### `UPSTREAM_REDIRECT_BLOCKED: Upstream attempted a redirect`

The upstream returned a 3xx status. The proxy refuses to follow
redirects on purpose (see "Upstream redirects are refused" above). If
the upstream is supposed to return a signed URL or a different region,
configure `UPSTREAM_BASE_URL` to the final destination directly.

### `path must be relative (no scheme/host)`

The agent passed an absolute URL to a proxy tool. This is intentional — the
proxy always forwards to `UPSTREAM_BASE_URL`. Change the agent prompt to pass
a path like `/users/1`, not `https://api.example.com/users/1`.

### `PROXY_TIMEOUT: The upstream request timed out`

The upstream did not respond within `PROXY_TIMEOUT_MS`. Either the upstream
is slow or unreachable. Increase `PROXY_TIMEOUT_MS`, or investigate the
upstream directly with `curl`.

### `PROXY_RATE_LIMITED: Too many requests`

The agent exhausted the local rate-limiter budget. Either raise
`PROXY_RATE_LIMIT_MAX` / `PROXY_RATE_LIMIT_WINDOW_MS`, or add a retry step in
the agent with backoff.

### Upstream returns 401 / 403

Auth isn't reaching the upstream. Check:

1. `UPSTREAM_BEARER_TOKEN` or `UPSTREAM_API_KEY` is set
2. `UPSTREAM_API_KEY_HEADER` matches what the upstream expects
3. The token is still valid (not expired / rotated)

The proxy does not surface upstream error bodies verbatim when the upstream
format is opaque — inspect the upstream directly if needed.

## Extending: restrict the surface in production

The template exposes 4 generic verbs so you can explore quickly. In
production, **do not ship this shape** — register specific tools per endpoint
so the agent cannot reach unintended upstream paths.

Open `src/tools.ts` and replace `registerTools` with endpoint-scoped
registrations. For example, to expose only "list users" and "create user":

```typescript
export function registerTools(server: McpServer, client: ProxyClient): void {
  server.tool(
    "list-users",
    "List users from the upstream API.",
    {
      page: z.number().int().min(1).max(1000).optional(),
      perPage: z.number().int().min(1).max(100).optional(),
    },
    async ({ page, perPage }) => {
      try {
        const res = await client.request({
          method: "GET",
          path: "/users",
          query: { page, perPage },
        });
        return {
          content: [
            { type: "text", text: JSON.stringify(res.body, null, 2) },
          ],
          isError: !res.ok,
        };
      } catch (err) {
        return {
          content: [
            { type: "text", text: formatProxyError(err, "list users") },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "create-user",
    "Create a new user in the upstream API.",
    {
      name: z.string().min(1).max(200),
      email: z.string().email(),
    },
    async ({ name, email }) => {
      try {
        const res = await client.request({
          method: "POST",
          path: "/users",
          body: { name, email },
        });
        return {
          content: [
            { type: "text", text: JSON.stringify(res.body, null, 2) },
          ],
          isError: !res.ok,
        };
      } catch (err) {
        return {
          content: [
            { type: "text", text: formatProxyError(err, "create user") },
          ],
          isError: true,
        };
      }
    },
  );
}
```

Endpoint-scoped tools give you:

- A smaller, well-named surface for the agent to reason about
- Per-tool Zod schemas (richer than a generic `path` string)
- No way for the agent to hit unintended upstream paths

The 4 generic verbs remain available in git history — delete them once your
endpoint-specific tools cover your real use cases.

## Deployment

1. Store `UPSTREAM_BEARER_TOKEN` / `UPSTREAM_API_KEY` in a secrets manager,
   not a committed `.env`
2. For multi-process deployments, replace `RateLimiter` with a shared store
3. Restrict the tool surface (see above) before shipping
4. Set `NODE_ENV=production`

## License

MIT
