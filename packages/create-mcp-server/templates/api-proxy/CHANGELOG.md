# Changelog

All notable changes to the `api-proxy` premium template are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this template adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-17

### Added
- Initial release of the `api-proxy` premium MCP server template
- Generic `proxy-get`, `proxy-post`, `proxy-put`, `proxy-delete` tools for
  wrapping a REST API as MCP
- Stdio transport by default; upstream base URL configured via env
- Bearer token and API-key authentication forwarded to the upstream
- In-memory rate limiting per server process
- Timeout + single retry on 5xx / 429 / abort (configurable)
- Response-body sanitizer that redacts configured secrets before they reach
  the MCP client
- `formatProxyError()` for user-safe error messages that never leak upstream
  URLs, credentials, or stack traces
- Zod validation on all tool inputs: relative path only, bounded query keys,
  structured JSON body
- Vitest suite covering proxy internals and MCP end-to-end flows
  (`InMemoryTransport`)

### Security
- Agent cannot supply absolute URLs; paths are constrained to the configured
  upstream
- Auth headers are attached by the proxy and never surfaced in tool responses
- Transport errors from the upstream are wrapped before being returned, so raw
  error strings with IPs or internal hostnames are not exposed
- Rate-limit bucket is process-local by default; swap for a shared store
  (Redis, Durable Object) for multi-instance deployments
