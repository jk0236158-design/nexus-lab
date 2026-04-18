# Changelog

All notable changes to the `api-proxy` premium template are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this template adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-17

### Security (Codex 6th-pass re-review, same cycle — 1 P1)
- **Pathname-level URL-encoded secrets now caught**: the 5th-pass fix
  blanked the query string and fragment, but a configured secret
  embedded as an encoded segment of the pathname itself (e.g.
  `/resource/tok%2Fabc` for a configured secret `tok/abc`) still
  logged verbatim because `redactString` is a literal-match.
  `sanitizePathForLog` now decodes the pathname (in an exception-safe
  try/catch) and, if the decoded form contains a configured secret,
  replaces the entire pathname with `[REDACTED-PATH]`. Malformed
  percent-encoding (`%GG`) yields `[REDACTED-MALFORMED-PATH]` rather
  than throwing out of the log path.
- **Design note — no round-trip (decode → redact → encode)**: rewriting
  the encoded location precisely invites double-decode and
  encoding-shape regressions. Coarse drop-pathname is simpler,
  verifiable, and closes the leak class rather than any one instance.

### Added (Codex 6th-pass re-review)
- Regression tests: encoded secret in pathname wholesale-redacted to
  `[REDACTED-PATH]`; malformed `%GG` pathname → helper returns
  `[REDACTED-MALFORMED-PATH]` rather than throwing; ordinary
  `/users/42` pathname untouched (no false-positive from the decode
  check).
- `sanitizePathForLog` is now exported from `src/proxy.ts` for direct
  unit testing (the full `request()` path cannot exercise malformed
  encoding because `buildUrl`'s own validation rejects it earlier).

### Security (Codex 5th-pass re-review, same cycle — 1 P1)
- **`req.path` logging switched from literal-match redaction to
  pathname-only + placeholder query/hash**: the 4th-pass fix piped
  `req.path` through `redactString`, but that only catches configured
  secrets as literals. Dynamic tokens (`?access_token=…` the agent
  generated on its own) and URL-encoded forms (`tok%2Fabc` vs
  configured `tok/abc`) would still leak. `sanitizePathForLog` now
  keeps the pathname for debugging and replaces the whole query
  string and fragment with a fixed `[REDACTED]` marker, then still
  runs the pathname itself through `redactString` as a second pass.
- **Design note**: we explicitly chose "blank the query" over "parse
  and redact per-parameter". Per-param would keep parameter names
  visible, which is mild information disclosure and creates a sharp
  edge where names we consider benign today (`?debug=true`) can
  later host secrets (`?debug=$TOKEN`). Blanking is coarser but
  closes the class rather than the instance.

### Added (Codex 5th-pass re-review)
- `sanitizePathForLog(rawPath, secrets)` helper.
- Regression tests: dynamic (unconfigured) query tokens blanked;
  URL-encoded form of a configured secret still not leaked because
  the whole query is `[REDACTED]`; fragment (hash) blanked to match
  query behaviour.

### Security (Codex 4th-pass re-review, same cycle — 2 P1)
- **`req.path` redacted before it reaches stderr (P1 #1)**: the two
  non-ok / redirect log lines embedded `req.path` verbatim. An agent
  calling `proxy-get /callback?token=abc123` would see that token in
  the server log. Both log statements now run `req.path` through
  `redactString(path, secrets)` first, matching the treatment the
  body snippet already gets.
- **`scrubErrorInner` handles non-Error causes (P1 #2)**: string,
  number, plain-object and array `cause` values previously slipped
  through unchanged. New `scrubNonErrorValue(value, depth)` dispatches:
  strings go through `redactString`; primitives pass through;
  plain objects (only `Object.prototype` / `null` prototypes accepted)
  shallow-walk own-enumerable keys, redacting string values and
  flattening arrays one level; everything else (Map / Set / class
  instances / functions / symbols) is replaced with `undefined`.
  `__proto__` / `constructor` / `prototype` keys are skipped to avoid
  prototype-pollution surface.

### Design note on `scrubNonErrorValue`

We explicitly chose **redact-known-types + drop-everything-else** over a
general recursive walker. The reasoning, for future reviewers:

- A general walker would need cycle detection for object graphs, which
  adds complexity and a second attack surface.
- Attacker-controlled `cause` objects can embed getters that throw or
  side-effect; we shouldn't trigger arbitrary JS by logging.
- Dropping nested values is safe: the thrown Error's own message and
  stack are already redacted, so the user gets a useful error; they
  just don't get to walk an arbitrary upstream graph.

### Added (Codex 4th-pass re-review)
- `scrubNonErrorValue(value, depth)` helper with prototype-guarded
  plain-object shallow walk.
- Regression tests: `req.path` redaction in both non-ok and redirect
  log lines (with `?token=...` in the path); string-typed `cause`
  redacted; plain-object `cause` with nested / array / prototype
  pollution patterns sanitized correctly; non-plain-object `cause`
  (e.g. `Map`) replaced with `undefined`.

### Security (Codex 3rd-pass re-review, same cycle — 3 P1)
- **`readBodySnippetForLog` truly enforces `ERROR_LOG_BYTE_CAP` (P1 #1)**:
  the previous implementation allocated `Uint8Array(total)` where `total`
  grew by full chunk sizes, so a single 10MB chunk bypassed the 2KB cap.
  The read loop now slices each incoming chunk to `remaining = maxBytes -
  kept` and writes into a pre-sized `Uint8Array(maxBytes)`. In addition,
  each `reader.read()` is raced against `ERROR_LOG_READ_TIMEOUT_MS` (500ms)
  so a slow / never-resolving body cannot block the request path.
- **Redirect branch now drains the body (P1 #2)**: the 3xx / opaqueredirect
  branch returned `UPSTREAM_REDIRECT_BLOCKED` but did so before cancelling
  the response body, leaving the socket pinned and bypassing the earlier
  non-ok body hardening. `await discardBody(response)` is now called
  unconditionally before the redirect return.
- **`scrubError` redacts at the cap boundary and covers `stack` (P1 #3)**:
  Codex executed `depth=12` and found the secret intact. Root cause: the
  old `depth >= SCRUB_MAX_DEPTH` branch returned the Error unchanged,
  leaving its own `message` and `stack` un-redacted at the cap. The new
  implementation redacts the current node's `message` + `stack` first
  (always), then decides whether to descend; if the cap is hit, the
  remainder of the chain is detached via `cause = undefined` rather than
  left dangling with un-walked secrets. `stack` redaction also closes a
  separate leak: Node's `fetch` embeds the failing URL in the stack
  string, and raw `logger.error(err)` or `err.stack` readers would
  otherwise see the bearer token verbatim.

### Added (Codex 3rd-pass re-review)
- `ERROR_LOG_READ_TIMEOUT_MS` (500ms) + `raceReadWithTimeout()` helper.
- Regression tests: single 10MB chunk capped within the 2KB window with
  `[truncated]` suffix; never-resolving stream returns within the read
  timeout (not the 5s request timeout); 302 with an open body triggers
  the stream's `cancel()` callback; depth-11 non-cyclic cause chain
  fully redacted; pre-materialized `Error.stack` redacted.

### Security (Codex re-review, same cycle — P1 + P2)
- **Non-ok body no longer unconditionally buffered (P1)**: the read of
  `parseBody(response)` was moved **after** the `!response.ok` branch so
  huge or slow error bodies no longer pin memory and request time.
  Retry-eligible 5xx/429 responses now drain and drop the body via
  `response.body.cancel()` without reading it; terminal non-ok responses
  read at most `ERROR_LOG_BYTE_CAP` (2048) bytes, redact configured
  secrets via `redactString` before logging, and cancel the rest. This
  closes a DoS vector (memory/time exhaustion on huge error pages) and
  a residual secret-leak vector (upstream echoing `Authorization` into
  an HTML error page that we then `console.error`-d verbatim).
- **`scrubError` cycle-safe (P2)**: `WeakSet<Error>`-based visited
  tracking plus a hard depth cap (`SCRUB_MAX_DEPTH = 10`) stops
  `err.cause === err` and `a.cause=b; b.cause=a` patterns from
  recursing indefinitely. The previous implementation was practically
  safe (Codex measured ~3ms on a self-cycle) but unprincipled.

### Added (Codex re-review)
- `ERROR_LOG_BYTE_CAP` constant (2048 bytes) + `readBodySnippetForLog`
  helper that streams up to the cap, redacts secrets, and cancels the
  reader. `discardBody(response)` helper for the drain-and-drop path.
- Cycle-detection regression tests (`err.cause = err` and
  `a.cause=b; b.cause=a`), huge-body DoS regression using a
  never-closing `ReadableStream`, and a sanitize-before-log test that
  asserts `console.error` never receives a raw bearer token even when
  the upstream echoes it in an error page.

### Security (Kagami QA additional findings, same cycle)
- **Redirect never followed** (`redirect: "manual"`): `fetch` is now
  called with `redirect: "manual"` so a 3xx from the upstream cannot
  transparently drag `Authorization` / `x-api-key` headers to an
  attacker-controlled host. Any 3xx (or `opaqueredirect` response type)
  is mapped to a safe `UPSTREAM_REDIRECT_BLOCKED` error and the target
  `Location` is logged server-side only, never returned to the agent.
- **Path validation strengthened (N5)**: `@` (userinfo separator) is now
  rejected both before and after percent-decoding, closing the
  `/@evil.com` and `/%40evil.com` confusions. The Kagami case —
  `path=/../admin` against `https://api.example.com/v1` — now has an
  explicit regression test. The existing post-composition origin +
  prefix check catches escapes that stay same-origin.
- **Error cause-chain redaction (N6)**: when `ProxyClient.request` has
  to rethrow, it walks the `cause` chain and redacts every configured
  secret (bearer token / API key) from every `Error.message` along the
  way. Previously the raw `TypeError: fetch failed` / `ECONNREFUSED …`
  cause could embed the outbound URL or header string literals.

### Security (Codex cross-review fixes)
- **Path pivot properly enforced**: `buildUrl` now decodes the requested
  path, rejects `.` / `..` segments (including `%2e%2e` and backslash
  variants), null bytes, scheme-prefixes, and protocol-relative paths,
  and then re-verifies post-composition that the resolved URL shares the
  base origin AND starts with the base path prefix. The README's "path
  pivot prevention" claim now matches the implementation (an agent
  supplying `/../admin` against `https://api.example.com/v1` is rejected,
  whereas v1.0.0 silently forwarded to `https://api.example.com/admin`).
  `buildUrl` is now exported for unit testing.
- **Upstream error body no longer forwarded verbatim**: on a non-ok
  response, the raw upstream body is logged server-side only and the
  agent receives a stable `{ error: "UPSTREAM_*", message: "..." }`
  shape. This closes the leak path for stack traces, internal hostnames,
  SQL errors, and echoed credentials in 4xx/5xx payloads. Matches the
  existing "No URLs, no tokens, no stack traces" README claim.
- **Rate limit consumed per fetch attempt**: `this.rateLimiter.check()`
  now runs at the start of every attempt inside the retry loop, not once
  at the top of `request()`. Previously `PROXY_MAX_RETRIES` could
  multiply the effective outbound budget by `(maxRetries + 1)`; now the
  limiter bounds total outbound calls regardless of retries.
- **Startup-log secret masking**: `describeUpstreamForLog()` logs only
  `scheme://host[:port]`, never the path, query, or userinfo. `loadConfig`
  now rejects `UPSTREAM_BASE_URL` with embedded userinfo and no longer
  echoes the offending value in error messages. `main().catch` returns
  a stable message and only includes stack traces when `PROXY_DEBUG=1`.

### Added
- `ProxyClientOptions.logUpstreamErrors` (default `true`) so tests can
  silence the server-side error-body log.
- `describeUpstreamForLog(config)` helper for safe startup logging.
- New `tests/security.test.ts` with 23 tests covering path-traversal
  defence (including `@`, `%40`, leading `/..`, backslash variants),
  rate-limit-per-attempt, error-body redaction, startup-log masking,
  redirect refusal (manual mode + opaqueredirect), and cause-chain
  secret scrubbing. Existing `tests/proxy.test.ts` updated: the 4xx
  test now asserts the safe error shape instead of the upstream body.
- `UPSTREAM_REDIRECT_BLOCKED` status code (302) in the error code table.

### Changed — breaking
- On non-ok responses, `ProxyResponse.body` is now `{ error, message }`
  instead of the raw upstream body. Callers that parsed the upstream
  error shape must switch to the `UPSTREAM_*` codes.
- `config.ts` now rejects `UPSTREAM_BASE_URL` containing `user:pass@`.
  Move those credentials to `UPSTREAM_BEARER_TOKEN` /
  `UPSTREAM_API_KEY` before upgrading.

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
