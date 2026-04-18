# Changelog

All notable changes to the `auth` premium template are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this template adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-17

### Security (Kagami QA additional findings, same cycle)
- **JWT algorithm pinning (alg-confusion defence)**: `jwt.verify(token,
  secret)` now passes `algorithms: ["HS256"]` so a forged token with
  `alg: "none"` (unsigned) or a different HMAC size (e.g. HS512) cannot
  pass verification. `generateToken` also pins `algorithm: "HS256"` on
  signing so issued tokens match the verifier exactly.
- **Timing-safe API-key compare**: `validateApiKey` now SHA-256s both
  the input and every stored key before calling `timingSafeEqual`, so
  the total comparison time is independent of the input length and of
  where (or whether) a match occurs. The previous early-return on
  length mismatch leaked the length of valid keys; the hash step closes
  that side-channel.
- **JSON body size cap**: `express.json()` now accepts a `limit` (1MB by
  default, overridable via `BODY_LIMIT`). Without it, an unauthenticated
  POST with a gigantic body could exhaust process memory before the
  router reached the auth middleware.

### Security (Codex cross-review fixes)
- **Per-request user isolation**: removed the module-level `currentUser` in
  `tools.ts`. `registerTools` now takes the authenticated `AuthUser` as its
  second argument and binds it into each tool handler via closure, so
  concurrent requests cannot observe one another's identity or role. This
  closes a role-mixing bug where `setCurrentUser(req.user)` on one request
  could race with `handleRequest` on another.
- **Pre-auth rate limiter**: a second `rateLimitMiddleware` is now installed
  *before* `authMiddleware`, keyed by client IP. Invalid API keys, invalid
  JWTs, and missing-credential attempts consume this bucket, so brute-force
  and unauthenticated DoS cannot reach the auth layer at full throttle.
  Configured via `PREAUTH_RATE_LIMIT_MAX` (default 30) and
  `PREAUTH_RATE_LIMIT_WINDOW_MS` (default 60000).
- **CORS allowlist-only**: the default `cors()` (which echoed all origins)
  has been replaced with an explicit allowlist from `CORS_ORIGINS`. Leaving
  it unset disables CORS entirely (the recommended default for servers
  accessed only via MCP clients, since Authorization / x-api-key headers
  must not be replayable from arbitrary browser origins).

### Changed
- `rateLimitMiddleware()` now accepts an options object
  (`maxEnvVar` / `windowMsEnvVar` / `defaultMax` / `defaultWindowMs` /
  `keyResolver`) so both the pre-auth and post-auth layers can share one
  implementation with different bucket keys and env-var overrides.
- `registerTools(server)` → `registerTools(server, user)`. **Breaking**
  for anyone who imported `registerTools` directly or called the removed
  `setCurrentUser()`.

### Added
- New tests in `tests/tools.test.ts` covering per-request user isolation,
  admin-only `generate-token` gating under concurrent sessions, and
  cross-contamination under parallel whoami calls.
- New tests in `tests/rate-limit.test.ts` covering pre-auth IP bucketing,
  per-IP isolation, and the `ip:` / `user:` key namespacing.
- New tests in `tests/auth.test.ts` covering JWT alg-confusion defence
  (alg:none rejection, HS512-with-same-secret rejection, HS256 roundtrip)
  and API-key validation on unusual-length inputs.

## [1.0.0] - 2026-04-17

### Added
- Initial release of the `auth` premium MCP server template
- JWT-based authentication with configurable secret and expiry
- API key authentication as a simpler alternative
- Express HTTP transport with CORS support
- Role-based access control (admin / user roles)
- `whoami` tool for inspecting the authenticated user context
- `generate-token` tool for admin-only JWT issuance
- Rate limiting middleware to prevent abuse
- Zod-based input validation on all tool parameters
- Vitest test suite covering auth flows and tool behavior
- `.env.example` for `JWT_SECRET` and `API_KEYS` configuration

### Security
- Passwords and secrets never appear in MCP responses
- Error messages sanitized via `formatAuthError()` to avoid leaking internal state
- Rate limiting enabled by default on all endpoints
- Input validation via Zod schemas with explicit descriptions
