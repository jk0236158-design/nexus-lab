# Gumroad販売ページ — MCP Server API Proxy Template

## 商品名
MCP Server API Proxy Template — Agent-Safe REST Wrapper

## 価格
¥1,000

## 概要（Short Description）
Agent-safe MCP proxy for any REST API. Path pivot prevention, recursive secret redaction, rate limiting, and safe error handling — the agent-specific failure modes, solved once so you don't have to.

## 詳細（Description）

### What's Included

A production-ready MCP server template that wraps a REST API with **agent-specific safety** baked in:

**🛡️ Path Pivot Prevention**
- `path` inputs are validated by Zod — absolute URLs (`https://...`) and protocol-relative URLs (`//...`) are rejected
- A confused or adversarial agent cannot redirect the proxy to an arbitrary host
- Upstream credentials stay bound to the configured `UPSTREAM_BASE_URL`

**🔐 Recursive Secret Redaction**
- Auth headers are attached by the proxy and never echoed in tool responses
- `sanitizeResponseBody` walks JSON responses recursively and replaces any occurrence of a configured secret with `[REDACTED]`
- Last-line-of-defence against upstream misconfiguration that echoes credentials

**⚡ Rate Limiting & Retries**
- Per-process token-bucket rate limiter (`PROXY_RATE_LIMIT_MAX` / `PROXY_RATE_LIMIT_WINDOW_MS`)
- Configurable timeout (`PROXY_TIMEOUT_MS`) and retry count (`PROXY_MAX_RETRIES`)
- Retries on 5xx / 429 / abort; deterministic 4xx surfaced immediately
- Stable `PROXY_RATE_LIMITED` / `PROXY_TIMEOUT` error codes

**🔧 4 Pre-built Tools**
- `proxy-get` — GET against the configured upstream
- `proxy-post` — POST with optional JSON body
- `proxy-put` — PUT with optional JSON body
- `proxy-delete` — DELETE against the configured upstream

**🛑 `formatProxyError()` — Internal Info Never Leaks**
- Raw errors like `ECONNREFUSED 10.0.0.5:443` are classified and replaced with user-safe messages
- No URLs, no tokens, no stack traces in agent-visible text
- Same pattern as the `database` and `auth` templates — consistent across the Nexus Lab stack

**📦 Stdio Transport**
- Designed to be launched by an MCP client (Claude Desktop, Claude Code, etc.)
- Drop-in `.mcp.json` registration with a single env var
- No open ports, no exposed HTTP surface

**✅ Quality**
- Full TypeScript with strict mode
- Zod validation on every tool input
- Vitest suite covering URL building, header attachment, timeout/retry, rate-limit exhaustion, recursive secret redaction, and end-to-end MCP tool calls via `InMemoryTransport`
- Dependency injection for easy test swapping

### How to Use

1. Unzip the template
2. Run `npm install`
3. Copy `.env.example` to `.env` and set `UPSTREAM_BASE_URL` (plus any `UPSTREAM_BEARER_TOKEN` / `UPSTREAM_API_KEY` the upstream needs)
4. Run `npm run build`
5. Register the server in your MCP client's config (e.g., `.mcp.json` for Claude Code)

Your agent-safe MCP proxy is live. Point Claude Code or any MCP-capable agent at it.

### Customize

- Edit `src/tools.ts` to swap the 4 generic verbs for endpoint-scoped tools (recommended for production)
- Adjust rate limits, timeout, and retries via env vars — no code changes
- `getSecretValues()` in `config.ts` is the hook for adding project-specific secrets to the redaction list

### Why This Exists (Not Just Another OpenAPI Wrapper)

Automatic OpenAPI-to-MCP generators (like `@orval/mcp`) convert every endpoint into a tool. That is useful — and very different from what this template does.

This template is for when you want to wrap **only the endpoints an agent should see**, with **agent-specific safety** baked in:

- Upstream tokens must never reach the agent's context (recursive redaction)
- The agent must not be able to redirect the proxy to another host (path pivot prevention)
- The agent must not be able to trigger unbounded upstream load (rate limit)
- Errors must be explainable without leaking internals (`formatProxyError()`)

These are *agent-specific* concerns, and they are not solved by generic OpenAPI wrappers.

### Requirements
- Node.js 20+
- TypeScript 5+

### Why Pay?

The free templates (`npx @nexus-lab/create-mcp-server`) give you a solid starting point. This premium template saves you hours — and prevents the kind of mistakes that are easy to ship and expensive to find later:

- Designing path validation that actually stops pivot attacks
- Writing recursive secret redaction that survives nested JSON
- Building rate limiting and retry behavior tuned for agent workloads
- Writing tests that exercise the safety properties, not just the happy path
- Configuring `.env` for a secrets-first workflow

You are paying for **decisions**, not code. Every design choice is documented in the README so you can audit and extend it.

Made by [Nexus Lab](https://github.com/jk0236158-design/nexus-lab) — tools for the Claude Code ecosystem.

## タグ
mcp, claude, typescript, proxy, api, rate-limiting, security, agent-safe, path-pivot, secret-redaction, template

## ファイル
mcp-server-api-proxy-template.zip
