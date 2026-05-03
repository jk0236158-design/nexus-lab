# Changelog

## 0.1.0 — 2026-04-22

Initial release. Extracted shared helpers from the existing
`@nexus-lab/create-mcp-server` template family.

### Added

- `bootstrap` — `runStdio()` to collapse stdio transport boilerplate, plus
  `InMemorySessionStore` for HTTP-transport templates that need per-session
  transport routing.
- `env` — `parseIntEnv`, `readIntEnv`, `requireEnv`, `readCsvEnv`,
  `readOptionalStringEnv`. Replaces ad-hoc parsers in api-proxy / auth /
  database templates.
- `response` — `jsonResponse`, `textResponse`, `errorResponse`,
  `statusResponse`, `safeErrorMessage`. Centralises the MCP content shape.
- `rate-limit` — `RateLimiter` (sliding window, in-memory),
  `MemoryRateLimitStore`, `resolveRateLimitFromEnv`. Hoisted from the auth
  template's hardened limiter and made transport-agnostic so api-proxy can
  drop its own copy.

### Notes

- This package is published under `@nexus-lab/mcp-toolkit` but as of 0.1.0
  the templates' `package.json` files still reference workspace builds.
  Switching the published templates to depend on the npm tarball happens
  in a follow-up release after Zen confirms the toolkit is stable.
- All previously-published premium template behaviour (database / auth /
  api-proxy v1.x security guarantees) is preserved verbatim — the toolkit
  swap is internal and does not alter public API surface.
