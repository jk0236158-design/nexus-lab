# Changelog

All notable changes to the `api-proxy` premium template are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this template adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-04-18

### Security (v1.1.0 carryover — 1 P1, symmetric to the 6th-pass pathname fix)
- **Body-snippet URL-encoded secrets now caught**: the non-ok branch
  logs a bounded snippet of the upstream body server-side via
  `readBodySnippetForLog`, which until now ran the text through
  `redactString` — a literal `.includes` match. A configured secret
  echoed into the error body in URL-encoded form (`tok%2Fabc` for
  configured `tok/abc`) or byte-by-byte percent-encoded
  (`%74%6F%6B…`) slipped past unredacted and reached `console.error`.
  This is the same leak class v1.1.0 closed on the pathname side, and
  was explicitly tracked as a v1.1.1 residual after the Codex 6th /
  7th-pass re-review. The snippet now flows through a new
  `sanitizeBodySnippetForLog(text, secrets)` helper — see the design
  history note below for the exact detection strategy, which was
  revised after Codex 8th-pass P1.

### Security (Codex 8th-pass re-review, same cycle — 1 P1)
- **`sanitizeBodySnippetForLog` no longer gated by malformed `%`**:
  the initial v1.1.1 design ran `redactString` first, then
  `decodeURIComponent(literalRedacted)` and, on throw, silently fell
  back to the literal-redacted form. Codex 8th-pass broke this with
  `sanitizeBodySnippetForLog("%GG token=tok%2Fabc", ["tok/abc"])`:
  the single malformed `%GG` threw decode, the encoded-secret branch
  never ran, and `tok%2Fabc` was logged verbatim. Because the
  malformed `%` is upstream-controlled (an adversarial server, or
  simply a binary-ish error body next to an echoed credential), the
  "URL-encoded secrets now caught" guarantee was effectively
  conditional on malformed-% absence.
- **Redesign — Approach B (literal variant search) + lenient decode
  fallback**: detection no longer depends on `decodeURIComponent`
  ever succeeding on the whole body. For each configured secret the
  helper now searches the literal-redacted text for
    1. the literal secret (already handled by `redactString`);
    2. `encodeURIComponent(secret)` — standard URL encoding;
    3. the byte-by-byte percent-encoded form
       (`%74%6F%6B%2F%61%62%63` for `tok/abc`),
  all case-insensitive on the hex digits so `%2f` vs `%2F` cannot
  evade. Any hit coarse-drops the whole snippet to
  `[REDACTED-BODY encoded-secret]`.
- **Lenient percent-decoder as defence-in-depth**: a new
  `lenientPercentDecode(text)` helper decodes every well-formed
  `%HH` triplet and leaves malformed `%` sequences untouched. It
  never throws (malformed sequences pass through; non-UTF-8 byte
  sequences become U+FFFD via `TextDecoder("utf-8", { fatal: false })`).
  If the leniently-decoded form contains any configured secret,
  the snippet also coarse-drops. This catches mixed-encoding shapes
  (e.g. `tok%2F%61bc` decoding to `tok/abc`) that neither precomputed
  variant covers, without giving attacker-controlled malformed `%`
  the power to gate the check.
- **Design trade-off**: ASCII-only case folding for the hex-digit
  comparison is safe for the expected secret shape (bearer tokens,
  API keys). Non-ASCII secrets remain covered by passes 1, 3
  (byte-by-byte uppercase), and the lenient decoder. The helper
  stays debuggability-preserving on benign bodies with `%` noise
  (verified by the "benign malformed `%` with no encoded secret"
  regression test — such bodies pass through literal-redaction
  only, no coarse-drop).

### Design note — body helper tuned differently from path helper
- **No round-trip (decode → redact → encode)**: same reasoning as
  v1.1.0. Rewriting an encoded location precisely invites
  double-decode and shape regressions.
- **Malformed percent-encoding is NOT hostile in bodies — but must
  not gate secret detection either**: the pathname helper returns
  `[REDACTED-MALFORMED-PATH]` on `%GG` because real REST paths
  never contain raw `%` characters. Error bodies routinely do
  (binary-ish payloads, orphan `%`, non-UTF-8 fragments from a
  truncated upstream), so coarse-dropping on malformed `%` alone
  would wipe legitimate debug info on most binary 500 pages. The
  revised v1.1.1 body helper therefore still tolerates malformed
  `%` (no coarse-drop on its mere presence), but — and this is the
  Codex 8th-pass correction — malformed `%` no longer prevents
  the encoded-secret variants from being detected.
- **Debuggability trade-off**: when the encoded-secret branch
  fires, the operator loses the body snippet but keeps the status
  code and method/path prefix in the same log line. The alternative
  — leaking a credential in literal, URL-encoded, or byte-encoded
  form — is strictly worse. Operators who need raw upstream bodies
  for debugging can set `logUpstreamErrors: false` and instrument
  their own sink with explicit secret handling.

### Added (v1.1.1)
- `sanitizeBodySnippetForLog(text, secrets)` helper exported from
  `src/proxy.ts` for direct unit testing. Symmetric with
  `sanitizePathForLog` in the public surface.
- Internal-only helpers `lenientPercentDecode(text)` and
  `percentEncodeEveryByte(s)` supporting the revised detection
  strategy (not exported; both are implementation details of
  `sanitizeBodySnippetForLog`).
- Regression tests in `tests/security.test.ts`:
  - URL-encoded configured secret in a 500 body → logged snippet
    contains `[REDACTED-BODY encoded-secret]`, no raw or encoded
    secret appears in `console.error`.
  - Byte-by-byte percent-encoded secret (`%74%6F…`) → same coarse
    drop fires.
  - Malformed / binary-ish body (orphan `%`, `%GG`, non-UTF-8 bytes)
    does not throw, does not coarse-drop, and still removes literal
    secret occurrences.
  - Ordinary JSON body with `%` characters but no configured secret
    → passes through unchanged (false-positive guard).
  - Decoded body whose contents coincidentally resemble encoded
    forms but do NOT contain a configured secret → passes through
    unchanged.
  - Empty-secrets input is a no-op.
  - End-to-end: `ProxyClient.request` with `logUpstreamErrors: true`
    and a URL-encoded secret in the upstream body does not leak
    either form to `console.error`.
- Additional Codex 8th-pass regression tests in
  `tests/security.test.ts` (new
  `"Body snippet sanitization — malformed % + encoded secret coexistence"`
  describe block):
  - Basic: `"%GG token=tok%2Fabc"` with configured secret `tok/abc`
    → coarse-drops (exact Codex attack reproduction).
  - Prefix-malformed: malformed `%` run at the start of the body
    followed by `encodeURIComponent(secret)` → coarse-drops.
  - Interleaved: byte-by-byte encoded secret surrounded by
    malformed `%` noise (`%G1`, `%HH`, `%9Z`, `%%`) → coarse-drops.
  - Lowercase-hex variant: `%2f` next to a malformed `%` is caught
    case-insensitively.
  - Mixed encoding: `tok%2F%61bc` (half literal / half encoded,
    decodes to `tok/abc`) with adjacent malformed `%` → caught by
    the lenient-decode fallback.
  - End-to-end: malformed `%` + encoded secret in a 500 body path
    never reaches `console.error` in raw OR encoded form, and the
    coarse-drop marker is present.
  - Benign malformed-only body (no encoded secret) → passes through
    unchanged (false-positive guard for the redesign).

### Fixed (v1.1.1, Codex 8th-pass P3)
- Two strict-TypeScript errors in new security tests:
  - `security.test.ts` `RequestInit | null` cast replaced with a
    runtime null guard so `tsc --noEmit` on tests is clean (TS2352).
  - `security.test.ts` `const next = …` in the deep cause-chain
    walker given an explicit `unknown` annotation to avoid TS7022
    (self-referential inference) under strict mode.

### Security (Codex 9th-pass re-review, same cycle — 1 P1)
- **`UPSTREAM_BASE_URL` query-string / fragment now rejected at
  startup**: `loadConfig` previously only rejected embedded userinfo
  (`user:pass@…`); a base URL like
  `https://api.example.com/v1?api_key=SECRET` parsed cleanly. Later,
  `proxy.ts` composes the outbound URL via string-concatenation
  (`baseUrl + prefixed`), which produced
  `https://api.example.com/v1?api_key=SECRET/users` — the agent's
  path never reached the server, and the secret was **not enrolled in
  `getSecretValues()`** (that helper only walks bearer token and API
  key envs), so `redactString`, `sanitizePathForLog`, and
  `sanitizeBodySnippetForLog` all failed closed on it. A fetch
  exception or cause-chain throw would carry the raw URL (including
  the base-URL secret) through any log site that wasn't already
  redacted for THAT specific string. `loadConfig` now throws on
  `parsed.search` or `parsed.hash` at startup, aligning the runtime
  with the README-documented shape `scheme://host[:port]/path`.
- **Why closure rather than retrofit**: same reasoning as the v1.1.0
  userinfo rejection and v1.1.0 query-blanking for logged paths —
  leak-class closure at the edge is simpler and auditable, versus
  threading yet-another secret source through every redaction site.

### Fixed (v1.1.1, Codex 9th-pass P3)
- **MCP server advertised version bumped to 1.1.1**: `src/index.ts`
  hardcoded `version: "1.0.0"` on the `McpServer` constructor while
  `package.json` already shipped `1.1.1`, so MCP clients saw a stale
  1.0.0 in the initialize handshake. Hardcoded rather than read from
  `package.json` to keep the template free of filesystem JSON
  imports; comment added on the field to flag the coupling.

### Added (v1.1.1, Codex 9th-pass)
- Regression tests in `tests/security.test.ts`
  (`Config startup-log masking` describe block, after the existing
  userinfo-rejection test):
  - Query string only (`?api_key=SECRET`) → `loadConfig` throws.
  - Fragment only (`#token=SECRET`) → throws.
  - Both query and fragment → throws.
  - Clean URL with path only → does not throw (no regression of
    the already-accepted shape).

### Status
- **Codex 8th-pass: received and addressed**. One P1 (body-helper
  malformed-% + encoded-secret coexistence), one P3 (type errors in
  tests).
- **Codex 9th-pass: received and addressed in-release**. One new P1
  (`UPSTREAM_BASE_URL` query/hash leak path) closed by startup
  rejection. One P3 (stale MCP advertised version) bumped to 1.1.1.
  Three P2 findings deferred to v1.1.2 (see queue below). `npm test`
  green (94 tests: 90 existing + 4 new), strict `tsc --noEmit` clean
  on both `src/` and `tests/` under `strict: true`.
- **Kagami independent QA 6th round: GO**. Accepted the v1.1.1
  surgical change; the Codex 8th/9th-pass P1s were design-level
  findings orthogonal to Kagami's GO and were addressed on top.
- **Kagami independent QA 7th round (scope-closure audit): GO**.
  Confirmed the five-point closure frame (anchor declaration,
  anchor achievement, out-of-scope P1 class separation, docstring
  honesty, test coverage) holds independently. No blocker; commit
  and Gumroad swap authorized. 7th-round surfaced three new
  observations for the v1.1.2 queue (below).
- Zen will hold commit + Gumroad upload until both reviews clear.

### v1.1.2 queue (tracked separately, NOT in v1.1.1)
Recorded here for hand-off; none of these are shipped in 1.1.1.

- **(Codex 9th-pass P2 #1) Top-level `loadConfig` / `ProxyClient` /
  `McpServer` construction bypasses `main().catch`**: the module
  top-level in `src/index.ts` calls `loadConfig()` etc. before
  `main()`. Any throw there bypasses the stable redaction message
  and may leak via the default Node uncaught-exception printer.
  v1.1.2 will move these inside `main()` so `main().catch` is the
  single error boundary.
- **(Codex 9th-pass P2 #2) `assertSafeRelativePath` treats the full
  `path` as one string, rejecting legitimate queries**: traversal
  checks currently scan the entire agent-supplied `path` including
  its query/hash, so shapes like `/users?filter=a/../b` false-reject
  despite the `..` being inside a value. v1.1.2 will split on `?` /
  `#` and run traversal detection only against the pathname
  component.
- **(Codex 9th-pass P2 #3) Blanket `@` rejection breaks real APIs**:
  the v1.1.0 `@` / `%40` reject (N5 patch) was introduced against
  `/@evil.com` authority-smuggling but also rejects legitimate
  `/@scope/pkg` (npm) and `user@example.com` path fragments. v1.1.2
  will narrow the rule to authority-position `@` only (i.e. `@`
  between host start and first `/`), letting path-segment `@` pass.
- **(Kagami 6th-round P2-1 + Codex 10th-pass P1) `sanitizeResponseBody`
  still uses literal `.includes(secret)`** on the agent-facing response
  path in `src/proxy.ts` (~215-245). The URL-encoded bypass class
  closed for the log path via the v1.1.1 body helper remains open on
  the response path. Codex 10th-pass escalated this to P1 on the
  grounds that the docstring promised "last-line-of-defence" coverage
  that the implementation does not deliver. v1.1.1 addresses the
  docstring honesty (now states literal-only coverage, with explicit
  v1.1.2 hand-off). The implementation fix is queued for **v1.1.2
  symmetric encode-hardening** reusing `sanitizeBodySnippetForLog`'s
  detection strategy.
- **(Codex 10th-pass P2) `sanitizeBodySnippetForLog` misses
  double-encoded secrets**: `tok%252Fabc` decodes once to `tok%2Fabc`
  but the pass-2 literal-check compares against `tok/abc`, so the
  secret is not detected. Real upstreams rarely emit this, but a
  hostile upstream could use it as a credential exfiltration form.
  v1.1.2 will bound-iterate lenient-decode until the result is a
  fixed point or an iteration cap (e.g. 3) is hit.
- **(Kagami 7th-round 7th-a) `lenientPercentDecode` fixed-point
  iteration (structural fix for Codex 10th-pass P2)**: lift the
  bound-iterate loop into `lenientPercentDecode` itself (cap N=3)
  so every caller — current `sanitizeBodySnippetForLog` Pass 3 and
  the future `sanitizeResponseBody` encode-hardening — inherits
  double-encode handling without per-site loop code. Call sites
  then stay a single lenient-decode invocation.
- **(Kagami 7th-round 7th-b) Asymmetric mixed-encoding regression
  tests**: current 8th-pass suite covers `tok%2F%61bc` (separator
  encoded + trailing chars encoded) but does not directly assert
  `tok%61%2Fbc` (leading chars encoded + separator encoded) or
  `%74ok/abc` (single leading char encoded). Add a parametrized
  variant sweep (4-6 shapes) so future refactors of
  `lenientPercentDecode` or Approach B cannot silently regress on
  asymmetric placements.
- **(Kagami 7th-round 7th-c) `sanitizeStringForAgent` shape
  design constraint for response-path encode-hardening**: when
  v1.1.2 adds encode-hardening to `sanitizeResponseBody`, the
  log-path `coarse-drop to [REDACTED-BODY encoded-secret]`
  semantics cannot transfer as-is — an agent-facing JSON response
  must preserve field positions. The required shape is
  `sanitizeStringForAgent(text, secrets) → string` that replaces
  only the offending substring with a marker (e.g.
  `[REDACTED-encoded-secret]`) and leaves surrounding JSON
  structure intact. v1.1.2 should extract this helper and have
  both log-path and response-path implementations compose it,
  rather than duplicating detection logic.

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
