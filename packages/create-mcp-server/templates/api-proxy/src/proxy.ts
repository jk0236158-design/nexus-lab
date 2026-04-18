import type { ProxyConfig } from "./config.js";
import { getSecretValues } from "./config.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ProxyRequest {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface ProxyResponse {
  status: number;
  ok: boolean;
  body: unknown;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory token-bucket rate limiter. Template-minimal: a single process-wide
 * bucket, keyed by an identifier the caller supplies (default: "default"). For
 * production, swap for Redis or a shared store.
 */
export class RateLimiter {
  private readonly store = new Map<string, RateLimitEntry>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly clock: () => number = Date.now,
  ) {}

  check(key = "default"): { allowed: boolean; retryAfterMs: number } {
    const now = this.clock();
    let entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.store.set(key, entry);
    }

    entry.count++;

    if (entry.count > this.max) {
      return { allowed: false, retryAfterMs: Math.max(0, entry.resetAt - now) };
    }
    return { allowed: true, retryAfterMs: 0 };
  }
}

/**
 * Builds outbound headers. Auth headers are attached here and never exposed
 * to the MCP client via tool responses.
 */
function buildHeaders(
  config: ProxyConfig,
  extra: Record<string, string> | undefined,
): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/json",
    ...(extra ?? {}),
  };

  if (config.bearerToken) {
    headers.authorization = `Bearer ${config.bearerToken}`;
  }
  if (config.apiKey) {
    headers[config.apiKeyHeader.toLowerCase()] = config.apiKey;
  }
  return headers;
}

/**
 * Reject any path that could escape the configured base-URL path prefix.
 * This blocks dot-segment traversal (`..`, `%2e%2e`), backslash variants,
 * and null bytes before the URL parser gets a chance to normalize them.
 *
 * Returning the normalized path keeps the happy path simple: callers
 * either get a clean relative path back or a thrown error.
 */
function assertSafeRelativePath(rawPath: string): string {
  if (rawPath.length === 0) {
    const err = new Error("path must not be empty");
    (err as Error & { code?: string }).code = "PROXY_INVALID_PATH";
    throw err;
  }

  if (rawPath.includes("\0")) {
    const err = new Error("path must not contain null bytes");
    (err as Error & { code?: string }).code = "PROXY_INVALID_PATH";
    throw err;
  }

  // Block protocol-relative paths up front. When the prefix is `//`,
  // `new URL(base + path)` would resolve to a different host entirely.
  if (rawPath.startsWith("//") || rawPath.startsWith("/\\") || rawPath.startsWith("\\\\")) {
    const err = new Error(
      "path must not start with `//` or `\\\\` (protocol-relative not allowed)",
    );
    (err as Error & { code?: string }).code = "PROXY_INVALID_PATH";
    throw err;
  }

  // A scheme-like prefix (e.g. `http:`) would let the URL parser treat
  // the path as an absolute URL and change host.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(rawPath)) {
    const err = new Error("path must be relative (no scheme)");
    (err as Error & { code?: string }).code = "PROXY_INVALID_PATH";
    throw err;
  }

  // Reject `@` in the path. `new URL("https://api.example.com" + "/@evil.com")`
  // still parses cleanly, but a naive `base + path` string concat without the
  // separating `/` (e.g. "https://api.example.com" + "@evil.com") would flip
  // host to `evil.com`. Defence-in-depth: ban `@` outright — no real REST
  // path needs it, and the composed-URL check below is more trustworthy
  // when the path alphabet is this narrow.
  if (rawPath.includes("@")) {
    const err = new Error("path must not contain `@` (userinfo separator)");
    (err as Error & { code?: string }).code = "PROXY_INVALID_PATH";
    throw err;
  }

  // Decode percent-encoded segments so `%2e%2e` cannot sneak past the
  // dot-segment check. Any malformed encoding is itself rejected.
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    const err = new Error("path contains malformed percent-encoding");
    (err as Error & { code?: string }).code = "PROXY_INVALID_PATH";
    throw err;
  }

  // Also reject `@` after decoding (`%40evil.com`).
  if (decoded.includes("@")) {
    const err = new Error(
      "path must not contain `@` (userinfo separator) after decoding",
    );
    (err as Error & { code?: string }).code = "PROXY_INVALID_PATH";
    throw err;
  }

  // Normalize backslashes (Windows-style) to forward slashes for segmentation.
  const normalized = decoded.replace(/\\/g, "/");
  const segments = normalized.split("/");
  for (const segment of segments) {
    if (segment === ".." || segment === ".") {
      const err = new Error(
        "path must not contain `.` or `..` segments (no traversal)",
      );
      (err as Error & { code?: string }).code = "PROXY_INVALID_PATH";
      throw err;
    }
  }

  return rawPath;
}

export function buildUrl(
  baseUrl: string,
  rawPath: string,
  query: ProxyRequest["query"],
): string {
  const safePath = assertSafeRelativePath(rawPath);
  const prefixed = safePath.startsWith("/") ? safePath : `/${safePath}`;

  // Parse base first so we can re-verify after composition that the final
  // URL has the same origin + path prefix. `new URL(base + path)` alone
  // would happily swallow a resolver trick like `//evil.example.com/x`.
  const base = new URL(baseUrl);
  const composed = new URL(baseUrl + prefixed);

  if (composed.origin !== base.origin) {
    const err = new Error("resolved URL escaped the configured upstream origin");
    (err as Error & { code?: string }).code = "PROXY_INVALID_PATH";
    throw err;
  }

  const basePath = base.pathname.replace(/\/+$/, "");
  const composedPath = composed.pathname;
  if (basePath.length > 0) {
    // composedPath must start with basePath followed by `/` or end-of-string
    const isExact = composedPath === basePath;
    const isUnder = composedPath.startsWith(basePath + "/");
    if (!isExact && !isUnder) {
      const err = new Error(
        "resolved URL escaped the configured upstream path prefix",
      );
      (err as Error & { code?: string }).code = "PROXY_INVALID_PATH";
      throw err;
    }
  }

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      composed.searchParams.set(key, String(value));
    }
  }
  return composed.toString();
}

/**
 * Recursively walk a JSON-shaped value and redact any string that contains
 * a known secret. This is a defence-in-depth layer: the upstream should never
 * echo credentials, but agents mis-wiring a proxy is a known failure mode.
 *
 * Coverage scope (v1.1.1): literal secret occurrences only. URL-encoded
 * variants (`tok%2Fabc` for configured `tok/abc`), byte-by-byte percent
 * encoding, and multi-pass encoding are NOT detected on this agent-facing
 * path. See `sanitizeBodySnippetForLog` for the log-path equivalent that
 * closes that class.
 *
 * Tracked for v1.1.2: symmetric encode-hardening here (Kagami 6th round
 * P2-1 + Codex 10th-pass). Until then, operators should treat this as
 * best-effort and avoid upstreams that echo encoded credentials.
 */
export function sanitizeResponseBody(
  body: unknown,
  secrets: string[],
): unknown {
  if (secrets.length === 0) return body;

  const walk = (value: unknown): unknown => {
    if (typeof value === "string") {
      let out = value;
      for (const secret of secrets) {
        if (secret && out.includes(secret)) {
          out = out.split(secret).join("[REDACTED]");
        }
      }
      return out;
    }
    if (Array.isArray(value)) {
      return value.map(walk);
    }
    if (value !== null && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = walk(v);
      }
      return result;
    }
    return value;
  };

  return walk(body);
}

/**
 * Map a non-ok upstream status to a safe, stable error code. Keeps the
 * MCP client's surface shape deterministic and prevents raw upstream
 * payloads (which may contain stack traces, SQL errors, internal hosts)
 * from flowing to the agent.
 */
function safeErrorForStatus(status: number): {
  code: string;
  message: string;
} {
  if (status === 400) {
    return { code: "UPSTREAM_BAD_REQUEST", message: "Upstream rejected the request as invalid." };
  }
  if (status === 401) {
    return { code: "UPSTREAM_UNAUTHORIZED", message: "Upstream rejected the configured credentials." };
  }
  if (status === 403) {
    return { code: "UPSTREAM_FORBIDDEN", message: "Upstream forbade the request." };
  }
  if (status === 404) {
    return { code: "UPSTREAM_NOT_FOUND", message: "Upstream resource was not found." };
  }
  if (status === 409) {
    return { code: "UPSTREAM_CONFLICT", message: "Upstream reported a conflict." };
  }
  if (status === 422) {
    return { code: "UPSTREAM_UNPROCESSABLE", message: "Upstream could not process the request payload." };
  }
  if (status === 429) {
    return { code: "UPSTREAM_RATE_LIMITED", message: "Upstream is rate-limiting this proxy." };
  }
  if (status >= 500) {
    return { code: "UPSTREAM_SERVER_ERROR", message: "Upstream returned a server error." };
  }
  if (status >= 300 && status < 400) {
    return {
      code: "UPSTREAM_REDIRECT_BLOCKED",
      message:
        "Upstream attempted a redirect; blocked to prevent credential leakage to another host.",
    };
  }
  return { code: "UPSTREAM_ERROR", message: "Upstream returned a non-success status." };
}

/**
 * Redact every configured secret from an arbitrary string. Used to scrub
 * error messages / causes before they leave the process: a raw
 * `TypeError: fetch failed` cause chain can embed the outbound URL and,
 * if the operator misconfigured headers, the bearer token itself.
 */
function redactString(value: string, secrets: string[]): string {
  if (secrets.length === 0) return value;
  let out = value;
  for (const secret of secrets) {
    if (secret && out.includes(secret)) {
      out = out.split(secret).join("[REDACTED]");
    }
  }
  return out;
}

/**
 * Prepare an agent-controlled `req.path` for safe inclusion in a log
 * line. `redactString` alone is insufficient here (Codex 5th-pass):
 *
 * - Query / hash parameters can carry **dynamic** tokens that are not
 *   in the configured secret allowlist (e.g. an OAuth `?access_token=…`
 *   the agent constructed on its own).
 * - URL-encoding can obfuscate a literal the secret-match would
 *   otherwise catch (`tok/abc` → `tok%2Fabc`).
 *
 * Strategy: keep the pathname (useful for debugging), replace the
 * whole query string and fragment with a fixed `[REDACTED]`
 * placeholder, then run the result through `redactString` so any
 * configured secret that somehow ended up in the pathname itself is
 * still removed.
 */
export function sanitizePathForLog(rawPath: string, secrets: string[]): string {
  // `?` appears before `#` in a URL, but either may be missing, and
  // `#` can appear without a `?`. Slice in hash-then-query order.
  let pathname = rawPath;
  let hasQuery = false;
  let hasHash = false;

  const hashIdx = pathname.indexOf("#");
  if (hashIdx >= 0) {
    hasHash = true;
    pathname = pathname.slice(0, hashIdx);
  }
  const queryIdx = pathname.indexOf("?");
  if (queryIdx >= 0) {
    hasQuery = true;
    pathname = pathname.slice(0, queryIdx);
  }

  // Two-pass redaction for the pathname itself (Codex 6th-pass — the
  // 5th-pass fix blanked query/hash but left pathname-level encoded
  // secrets alone). We DO NOT round-trip (decode → redact → encode):
  // that inserts its own footguns (double decoding, malformed percent
  // sequences, double-encoded punctuation changing shape). Instead:
  //
  //  1. Raw redact catches literal occurrences.
  //  2. Decode-and-detect: if a configured secret is present in the
  //     decoded form but NOT in the raw, the secret was obfuscated by
  //     URL-encoding. Rather than try to reverse-map the location, we
  //     drop the pathname wholesale — debugging value is lower than
  //     leak risk.
  //
  // Also: decodeURIComponent can throw on malformed input (`%GG`).
  // Treat that as "pathname is probably hostile, drop it" rather
  // than letting the exception propagate into the request path.
  let redactedPathname = redactString(pathname, secrets);
  if (secrets.length > 0) {
    let decoded: string | null = null;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      decoded = null;
    }
    if (decoded === null) {
      redactedPathname = "[REDACTED-MALFORMED-PATH]";
    } else if (decoded !== pathname) {
      // Only pay the check cost when encoding actually changed
      // something. Match against each secret on the decoded form.
      for (const secret of secrets) {
        if (secret && decoded.includes(secret)) {
          redactedPathname = "[REDACTED-PATH]";
          break;
        }
      }
    }
  }

  let out = redactedPathname;
  if (hasQuery) out += "?[REDACTED]";
  if (hasHash) out += "#[REDACTED]";
  return out;
}

/**
 * Lenient percent-decoder: decode every well-formed `%HH` triplet,
 * leave malformed `%` sequences (orphan `%`, `%GG`, truncated trailing
 * `%` / `%H`) as-is. Never throws.
 *
 * Unlike `decodeURIComponent`, this does not fail the whole string when
 * a single byte is malformed, which is the exact property
 * `sanitizeBodySnippetForLog` needs: error bodies routinely carry raw
 * bytes (binary blobs, truncated multibyte sequences) next to a valid
 * percent-encoded secret, and we must still be able to detect the
 * secret in that mixed content.
 *
 * Decoding is done byte-by-byte: we accumulate a Uint8Array of raw
 * bytes (literal code units for non-`%` chars, decoded bytes for
 * well-formed `%HH`) and then run `TextDecoder("utf-8", { fatal: false })`
 * on the result. `fatal: false` means any non-UTF-8 byte sequence
 * becomes U+FFFD — this is what we want: the non-UTF-8 fragment
 * cannot impersonate a secret, and the rest of the string is still
 * scanned.
 */
function lenientPercentDecode(text: string): string {
  // Fast path — no `%` means no decoding needed.
  if (text.indexOf("%") < 0) return text;

  const bytes: number[] = [];
  const len = text.length;
  let i = 0;

  const hexValue = (ch: number): number => {
    // '0'..'9'
    if (ch >= 0x30 && ch <= 0x39) return ch - 0x30;
    // 'A'..'F'
    if (ch >= 0x41 && ch <= 0x46) return ch - 0x41 + 10;
    // 'a'..'f'
    if (ch >= 0x61 && ch <= 0x66) return ch - 0x61 + 10;
    return -1;
  };

  while (i < len) {
    const ch = text.charCodeAt(i);
    if (ch === 0x25 /* '%' */ && i + 2 < len) {
      const h1 = hexValue(text.charCodeAt(i + 1));
      const h2 = hexValue(text.charCodeAt(i + 2));
      if (h1 >= 0 && h2 >= 0) {
        bytes.push((h1 << 4) | h2);
        i += 3;
        continue;
      }
    }
    // Non-`%` char, or malformed `%` — emit as UTF-8 bytes. For ASCII
    // (charCode < 0x80) this is a single byte; for higher code units
    // we emit their UTF-8 encoding so the decoder sees a consistent
    // byte stream.
    if (ch < 0x80) {
      bytes.push(ch);
    } else if (ch < 0x800) {
      bytes.push(0xc0 | (ch >> 6), 0x80 | (ch & 0x3f));
    } else if (ch < 0xd800 || ch >= 0xe000) {
      bytes.push(
        0xe0 | (ch >> 12),
        0x80 | ((ch >> 6) & 0x3f),
        0x80 | (ch & 0x3f),
      );
    } else {
      // Surrogate pair.
      const hi = ch;
      const lo = i + 1 < len ? text.charCodeAt(i + 1) : 0;
      if (hi >= 0xd800 && hi <= 0xdbff && lo >= 0xdc00 && lo <= 0xdfff) {
        const cp = 0x10000 + ((hi - 0xd800) << 10) + (lo - 0xdc00);
        bytes.push(
          0xf0 | (cp >> 18),
          0x80 | ((cp >> 12) & 0x3f),
          0x80 | ((cp >> 6) & 0x3f),
          0x80 | (cp & 0x3f),
        );
        i += 2;
        continue;
      }
      // Lone surrogate — emit replacement.
      bytes.push(0xef, 0xbf, 0xbd);
    }
    i++;
  }

  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(
      Uint8Array.from(bytes),
    );
  } catch {
    // Defensive: TextDecoder with fatal:false should never throw, but
    // if it somehow does, fall back to the original text.
    return text;
  }
}

/**
 * Compute the byte-by-byte percent-encoded form of `s` using uppercase
 * hex digits (e.g. `tok/abc` → `%74%6F%6B%2F%61%62%63`). This is the
 * shape an adversarial upstream would emit to bypass a literal
 * `.includes(secret)` check. Used by `sanitizeBodySnippetForLog` to
 * search for the encoded variant directly without relying on decoding.
 */
function percentEncodeEveryByte(s: string): string {
  // Encode via UTF-8 bytes so multi-byte characters produce the
  // byte-level encoded form (`%E4%B8%96` etc.), matching what
  // percent-encoding conventions emit.
  const bytes = new TextEncoder().encode(s);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    out += "%" + (b < 0x10 ? "0" : "") + b.toString(16).toUpperCase();
  }
  return out;
}

/**
 * Prepare a non-ok body snippet for safe inclusion in a log line.
 *
 * `redactString` alone is insufficient for the same reason it was
 * insufficient for `sanitizePathForLog` (Codex 6th / 7th-pass): it's a
 * literal `.includes` match, so a configured secret echoed into the
 * error body in URL-encoded form (`tok%2Fabc` for configured `tok/abc`)
 * or percent-encoded byte-by-byte (`%74%6F%6B...`) sneaks past
 * unredacted and ends up in `console.error`.
 *
 * Strategy (v1.1.1 design, revised after Codex 8th-pass P1):
 *
 *   The v1.1.1 initial design used `decodeURIComponent` on the whole
 *   body and, on throw (malformed `%`), silently fell back to the
 *   literal-redacted form. Codex 8th-pass broke this: an adversarial
 *   upstream that embeds one malformed `%` next to an encoded secret
 *   (`"%GG token=tok%2Fabc"`) throws decode, skips the encoded-variant
 *   check, and leaks. That made the whole "encoded secret" promise
 *   conditional on malformed-% absence, which is attacker-controlled.
 *
 *   Approach B (chosen): detection does not rely on decoding the
 *   whole body. Instead we precompute, per secret, a set of known
 *   encoded *variants* and search for them literally (case-insensitive
 *   for the hex digits). Combined with a lenient decoder pass that
 *   never throws, we cover:
 *
 *     1. Literal form — `redactString` (existing pass).
 *     2. `encodeURIComponent(secret)` — standard URL encoding.
 *     3. Byte-by-byte `%HH` — every byte percent-encoded (uppercase
 *        hex). Matched case-insensitively so `%2f` vs `%2F` is caught.
 *     4. Lenient-decode fallback — decode every well-formed `%HH` but
 *        leave malformed `%` sequences untouched, then search for the
 *        literal secret in the decoded form. This catches mixed
 *        encodings (e.g. `tok%2F%61bc`) that neither (2) nor (3)
 *        precomputed, AND cannot be sabotaged by a malformed `%`
 *        elsewhere in the body.
 *
 *   Any hit in (2), (3), or (4) coarse-drops the whole snippet to
 *   `[REDACTED-BODY encoded-secret]`. We do NOT round-trip
 *   (decode → redact → re-encode): that's the double-encode footgun
 *   we rejected for pathnames.
 *
 * Debuggability trade-off documented in CHANGELOG: when an encoded
 * secret is detected, the operator loses visibility into the body but
 * keeps the status code (UPSTREAM_* in the logged prefix). The
 * alternative — leaking a credential in literal, percent-encoded, or
 * percent-encoded-byte-by-byte form, OR letting a single malformed
 * `%` gate whether leakage happens — is strictly worse.
 */
export function sanitizeBodySnippetForLog(
  text: string,
  secrets: string[],
): string {
  if (secrets.length === 0) return text;

  // Pass 1 — literal redaction. Handles the common case (upstream
  // echoes `Bearer tok-xyz` verbatim into an error page).
  const literalRedacted = redactString(text, secrets);

  // Pass 2 — encoded-variant literal search. Does NOT depend on
  // decoding the body, so a malformed `%` anywhere in `text` cannot
  // bypass this check (Codex 8th-pass P1 fix).
  //
  // Lowercase once for case-insensitive hex comparison. ASCII-only
  // secrets (bearer tokens, API keys) are the expected shape; this
  // case fold is safe for them and for the `%HH` hex digits.
  const haystack = literalRedacted.toLowerCase();
  for (const secret of secrets) {
    if (!secret) continue;
    const encStandard = encodeURIComponent(secret).toLowerCase();
    const encByByte = percentEncodeEveryByte(secret).toLowerCase();
    // `encStandard` may equal `secret` when the secret has no special
    // characters; that case is already caught by Pass 1, but checking
    // again here is idempotent and cheap.
    if (
      haystack.includes(encStandard) ||
      haystack.includes(encByByte)
    ) {
      return "[REDACTED-BODY encoded-secret]";
    }
  }

  // Pass 3 — lenient-decode fallback. Catches mixed / exotic encodings
  // (e.g. `tok%2F%61bc` decoding to `tok/abc`) that neither precomputed
  // variant covers. Crucially, `lenientPercentDecode` never throws —
  // malformed `%` sequences are preserved as-is, so a single `%GG`
  // cannot gate whether the rest of the string is scanned.
  const leniently = lenientPercentDecode(literalRedacted);
  if (leniently !== literalRedacted) {
    for (const secret of secrets) {
      if (secret && leniently.includes(secret)) {
        return "[REDACTED-BODY encoded-secret]";
      }
    }
  }

  return literalRedacted;
}

/**
 * Cap on how many bytes of a non-ok upstream body we will read into
 * memory for server-side logging. Anything past this is discarded via
 * `reader.cancel()` so a huge error page cannot DoS the proxy.
 */
const ERROR_LOG_BYTE_CAP = 2048;

/**
 * Per-`read()` deadline. A single hanging `reader.read()` would block the
 * request path indefinitely; we race each read against this timeout and
 * bail out on expiry so slow / never-ending bodies cannot stall the proxy.
 */
const ERROR_LOG_READ_TIMEOUT_MS = 500;

/**
 * Read up to `maxBytes` of a response body as text, redact every known
 * secret, and discard the rest of the stream. Used only for server-side
 * logging on non-ok responses: the agent never sees this value.
 *
 * Hardening contract (P1 — Codex re-review):
 * - Never buffers more than `maxBytes` bytes. A single oversized chunk is
 *   sliced to the remaining budget before being kept; the Uint8Array we
 *   allocate is bounded by `maxBytes`, not by the arbitrary upstream
 *   chunk size.
 * - Never blocks indefinitely. Each `reader.read()` is raced against
 *   `ERROR_LOG_READ_TIMEOUT_MS`; on expiry we cancel the reader and
 *   return whatever we have (or a placeholder if that's nothing).
 * - Never propagates exceptions: logging must not add new failure modes
 *   to the request path.
 */
async function readBodySnippetForLog(
  response: Response,
  maxBytes: number,
  secrets: string[],
): Promise<string> {
  try {
    const reader = response.body?.getReader();
    if (!reader) {
      // No streamable body (e.g., HEAD or already-consumed). Use text()
      // as a fallback but still clamp to maxBytes so a misbehaving
      // engine cannot force a full buffer.
      const text = await response.text().catch(() => "");
      const truncated = text.slice(0, maxBytes);
      return sanitizeBodySnippetForLog(truncated, secrets);
    }

    const buffer = new Uint8Array(maxBytes);
    let kept = 0;
    let truncated = false;
    let timedOut = false;

    try {
      while (kept < maxBytes) {
        const readResult = await raceReadWithTimeout(
          reader,
          ERROR_LOG_READ_TIMEOUT_MS,
        );
        if (readResult === "timeout") {
          timedOut = true;
          break;
        }
        const { value, done } = readResult;
        if (done) break;
        if (!value || value.byteLength === 0) continue;

        const remaining = maxBytes - kept;
        if (value.byteLength > remaining) {
          buffer.set(value.subarray(0, remaining), kept);
          kept += remaining;
          truncated = true;
          break;
        }
        buffer.set(value, kept);
        kept += value.byteLength;
      }
    } finally {
      // Always cancel: we got what we need (or timed out), the rest is
      // garbage we don't want to pay to transfer.
      await reader.cancel().catch(() => undefined);
    }

    const text = new TextDecoder("utf-8", { fatal: false }).decode(
      buffer.subarray(0, kept),
    );
    const redacted = sanitizeBodySnippetForLog(text, secrets);
    const suffix = timedOut
      ? "…[read-timeout]"
      : truncated
        ? "…[truncated]"
        : "";
    return redacted + suffix;
  } catch {
    return "[proxy] upstream body could not be read for logging";
  }
}

type ReadOutcome = ReadableStreamReadResult<Uint8Array> | "timeout";

async function raceReadWithTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number,
): Promise<ReadOutcome> {
  let handle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    handle = setTimeout(() => resolve("timeout"), timeoutMs);
    // Allow the process to exit during tests even if a read is pending.
    if (typeof (handle as { unref?: () => void })?.unref === "function") {
      (handle as { unref: () => void }).unref();
    }
  });
  try {
    const result = await Promise.race([reader.read(), timeout]);
    return result;
  } finally {
    if (handle !== undefined) clearTimeout(handle);
  }
}

/**
 * Drain-and-drop a response body without materializing it. Called when
 * we know we're not going to log the body (retry, or logs disabled):
 * leaving the stream unread can stall the underlying socket in some
 * runtimes.
 */
async function discardBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Already-consumed / already-cancelled — no-op.
  }
}

export type FetchLike = typeof fetch;

export interface ProxyClientOptions {
  fetchImpl?: FetchLike;
  rateLimiter?: RateLimiter;
  /**
   * When true, the raw upstream body on a non-ok response is logged via
   * console.error (server-side only) before being replaced with a safe
   * error payload. Default true. Set false in tests.
   */
  logUpstreamErrors?: boolean;
}

/**
 * Thin proxy client wrapping fetch with timeout, retry, rate limit, and
 * response sanitization. Stateless aside from the rate-limiter bucket.
 */
export class ProxyClient {
  private readonly fetchImpl: FetchLike;
  private readonly rateLimiter: RateLimiter;
  private readonly secrets: string[];
  private readonly logUpstreamErrors: boolean;

  constructor(
    private readonly config: ProxyConfig,
    options: ProxyClientOptions = {},
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.rateLimiter =
      options.rateLimiter ??
      new RateLimiter(config.rateLimitMax, config.rateLimitWindowMs);
    this.secrets = getSecretValues(config);
    this.logUpstreamErrors = options.logUpstreamErrors ?? true;
  }

  async request(req: ProxyRequest): Promise<ProxyResponse> {
    const url = buildUrl(this.config.baseUrl, req.path, req.query);
    const headers = buildHeaders(this.config, req.headers);

    const hasBody =
      req.body !== undefined && req.method !== "GET" && req.method !== "DELETE";
    if (hasBody) {
      headers["content-type"] = headers["content-type"] ?? "application/json";
    }

    const init: RequestInit = {
      method: req.method,
      headers,
      body: hasBody ? JSON.stringify(req.body) : undefined,
    };

    const maxAttempts = this.config.maxRetries + 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Rate-limit check per attempt, not per request. An attempt that
      // triggers a retry must consume a second token, otherwise
      // `rateLimitMax × (maxRetries+1)` outbound calls could fit inside
      // one bucket window.
      const limit = this.rateLimiter.check();
      if (!limit.allowed) {
        const err = new Error(
          `Rate limit exceeded. Retry after ${Math.ceil(limit.retryAfterMs / 1000)}s.`,
        );
        (err as Error & { code?: string }).code = "PROXY_RATE_LIMITED";
        throw err;
      }

      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        this.config.timeoutMs,
      );

      try {
        const response = await this.fetchImpl(url, {
          ...init,
          signal: controller.signal,
          // `redirect: 'manual'` is load-bearing security. Default `follow`
          // would make fetch transparently chase a 302 from the upstream
          // to an attacker-controlled host, **carrying the Authorization
          // and x-api-key headers with it**. Manual mode gives us the 3xx
          // status so we can refuse it. We do NOT implement a safe
          // allowlisted redirect follower: if an upstream genuinely needs
          // redirects (e.g. CDN-signed URLs), the wrapper should be
          // configured with the final origin, not the redirector.
          redirect: "manual",
        });
        clearTimeout(timer);

        // Undici surfaces manual-redirects as status 0 with type "opaqueredirect"
        // (standard fetch behaviour) or as the actual 3xx status depending on
        // the engine. Treat both as refusal.
        const isRedirect =
          (response as Response & { type?: string }).type ===
            "opaqueredirect" ||
          (response.status >= 300 && response.status < 400);

        if (isRedirect) {
          if (this.logUpstreamErrors) {
            // req.path is agent-controlled. Query / hash params can
            // carry dynamic OAuth tokens that never hit our configured
            // secret allowlist, and URL-encoding can hide literals
            // that redactString would otherwise catch. sanitizePathForLog
            // keeps the pathname but blanks out query/hash entirely.
            // (Codex 5th-pass: literal-only redaction was insufficient.)
            const safePath = sanitizePathForLog(req.path, this.secrets);
            console.error(
              `[proxy] Upstream redirect blocked on ${req.method} ${safePath} (status=${response.status}, type=${(response as Response & { type?: string }).type ?? "n/a"})`,
            );
          }
          // Drain-and-drop the redirect body before returning. A 3xx with
          // a Location header can still carry a body (some servers echo
          // the target into an HTML page), and leaving it unread keeps
          // the underlying socket / file descriptor pinned. Cancelling
          // here also closes the last edge where an attacker-controlled
          // body could be buffered without any cap.
          await discardBody(response);
          const safe = safeErrorForStatus(302);
          return {
            status: response.status || 302,
            ok: false,
            body: { error: safe.code, message: safe.message },
          };
        }

        // Branch on response.ok BEFORE reading the body. On non-ok:
        // - a retry-eligible response doesn't need the body read at all
        //   (we throw the body away and try again).
        // - a terminal non-ok response reads at most `ERROR_LOG_BYTE_CAP`
         //  bytes for logging, then cancels the rest. Reading the full
        //   body unconditionally was a DoS vector (huge / slow bodies
        //   would pin memory and request time) and a secret-leak vector
        //   (upstream echoes bearer tokens into error pages).
        if (!response.ok) {
          const retriable =
            response.status >= 500 || response.status === 429;
          if (retriable && attempt < maxAttempts - 1) {
            // Discard the body without reading it so the socket can be
            // released quickly and we don't consume retry-budget time
            // reading a possibly-gigabyte error page.
            await discardBody(response);
            lastError = new Error(`Upstream ${response.status}`);
            continue;
          }

          if (this.logUpstreamErrors) {
            const snippet = await readBodySnippetForLog(
              response,
              ERROR_LOG_BYTE_CAP,
              this.secrets,
            );
            // Same treatment as the redirect branch — pathname only,
            // query/hash replaced with `[REDACTED]` (Codex 5th-pass).
            const safePath = sanitizePathForLog(req.path, this.secrets);
            console.error(
              `[proxy] Upstream ${response.status} on ${req.method} ${safePath}`,
              snippet,
            );
          } else {
            await discardBody(response);
          }

          const safe = safeErrorForStatus(response.status);
          return {
            status: response.status,
            ok: false,
            body: { error: safe.code, message: safe.message },
          };
        }

        const parsedBody = await parseBody(response);
        const sanitized = sanitizeResponseBody(parsedBody, this.secrets);
        return {
          status: response.status,
          ok: true,
          body: sanitized,
        };
      } catch (err) {
        clearTimeout(timer);
        lastError = err;
        // Abort / network error — retry if we have budget
        if (attempt < maxAttempts - 1) continue;
        // Scrub the secret from both the top-level error and its cause
        // chain before we re-throw. Node's `fetch` wraps underlying errors
        // in `TypeError: fetch failed` whose `cause` is the raw
        // `ECONNREFUSED …` (which includes the outbound URL and any
        // headers the engine inlines). Upstream consumers call
        // `formatProxyError()` which maps to a stable user-safe message,
        // but anyone who logs the raw Error should not get credentials.
        throw this.scrubError(err);
      }
    }

    // Unreachable, but keeps types happy
    throw lastError instanceof Error
      ? this.scrubError(lastError)
      : new Error("Proxy request failed");
  }

  /**
   * Walk an Error and its `cause` chain, redacting every configured secret
   * from `message`. We don't rewrite the Error type (callers may still
   * want to instanceof-check `TypeError`), just its user-visible strings.
   *
   * Cycle-safe by construction:
   * - a WeakSet of visited Error instances stops `err.cause === err` and
   *   `a.cause=b; b.cause=a` from recursing forever.
   * - a depth cap (`SCRUB_MAX_DEPTH`) is a second-line defence against
   *   pathological non-Error cause objects whose identity changes every
   *   access (e.g. Proxy traps returning fresh objects).
   */
  private scrubError(err: unknown): unknown {
    if (this.secrets.length === 0) return err;
    return this.scrubErrorInner(err, new WeakSet<Error>(), 0);
  }

  private scrubErrorInner(
    err: unknown,
    visited: WeakSet<Error>,
    depth: number,
  ): unknown {
    // Codex 4th-pass: causes that are NOT Error instances (string,
    // number, plain object) used to slip through unmodified and leak
    // through raw `logger.error(err)` calls. Route them to a dedicated
    // sanitizer that either redacts or drops the value.
    if (!(err instanceof Error)) {
      return this.scrubNonErrorValue(err, depth);
    }
    if (visited.has(err)) return err;
    visited.add(err);

    // Always redact the current node's own strings first, even if we're
    // about to bail out on depth. A prior bug returned `err` unmodified
    // when `depth >= SCRUB_MAX_DEPTH`, which left secrets intact at and
    // below the cap (Codex verified at depth=12).
    this.redactErrorStrings(err);

    if (depth >= SCRUB_MAX_DEPTH) {
      // Cap reached: we cannot trust deeper causes to have been walked,
      // and the `stack` of anything beyond here is not reachable through
      // this walk. Drop the rest of the chain rather than leave
      // un-redacted tails attached to the thrown Error.
      try {
        (err as Error & { cause?: unknown }).cause = undefined;
      } catch {
        // Non-writable cause — leave it; it may be frozen or a getter.
      }
      return err;
    }

    const cause = (err as Error & { cause?: unknown }).cause;
    if (cause !== undefined) {
      try {
        (err as Error & { cause?: unknown }).cause = this.scrubErrorInner(
          cause,
          visited,
          depth + 1,
        );
      } catch {
        // Non-writable .cause — best effort, skip.
      }
    }
    return err;
  }

  /**
   * Scrub a non-Error value attached as a `cause`. We do not descend
   * into arbitrary object graphs (prototype-pollution / accessor traps /
   * huge graphs are all risks); we do the minimum safe thing per type:
   *
   * - string: redact secrets via `redactString`.
   * - number / boolean / bigint / null: return as-is (no string content).
   * - Array: redact strings inside, drop everything else.
   * - plain object (own enumerable keys only): redact string properties,
   *   drop nested non-primitives. Objects with a custom prototype (or
   *   anything beyond depth) are replaced with `undefined` rather than
   *   walked — "don't materialize attacker-controlled object graphs".
   * - anything else (function, symbol, exotic host object): `undefined`.
   */
  private scrubNonErrorValue(value: unknown, depth: number): unknown {
    if (value === null) return null;
    const type = typeof value;
    if (type === "string") {
      return redactString(value as string, this.secrets);
    }
    if (
      type === "number" ||
      type === "boolean" ||
      type === "bigint"
    ) {
      return value;
    }
    if (type === "function" || type === "symbol") {
      return undefined;
    }
    if (depth >= SCRUB_MAX_DEPTH) return undefined;

    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item === "string") {
          return redactString(item, this.secrets);
        }
        if (
          item === null ||
          typeof item === "number" ||
          typeof item === "boolean" ||
          typeof item === "bigint"
        ) {
          return item;
        }
        return undefined;
      });
    }

    // Plain-object guard: refuse exotic prototypes to avoid accessor
    // traps and prototype-pollution surface. Only `Object.prototype`
    // (typical plain objects) and `null` (Object.create(null)) are
    // considered safe to shallow-walk.
    const proto = Object.getPrototypeOf(value as object);
    if (proto !== Object.prototype && proto !== null) {
      return undefined;
    }

    const result: Record<string, unknown> = {};
    // Use Object.keys so we don't traverse inherited properties and
    // don't trigger getters on the prototype.
    for (const key of Object.keys(value as object)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        // Defence-in-depth against prototype-pollution vectors.
        continue;
      }
      let raw: unknown;
      try {
        raw = (value as Record<string, unknown>)[key];
      } catch {
        // Accessor that threw — drop this key.
        continue;
      }
      if (typeof raw === "string") {
        result[key] = redactString(raw, this.secrets);
      } else if (
        raw === null ||
        typeof raw === "number" ||
        typeof raw === "boolean" ||
        typeof raw === "bigint"
      ) {
        result[key] = raw;
      } else if (Array.isArray(raw)) {
        // Arrays are shallow-walked: redact strings, keep primitives,
        // drop anything else. One level only — no recursion into
        // nested objects/arrays inside the array.
        result[key] = raw.map((item) => {
          if (typeof item === "string") {
            return redactString(item, this.secrets);
          }
          if (
            item === null ||
            typeof item === "number" ||
            typeof item === "boolean" ||
            typeof item === "bigint"
          ) {
            return item;
          }
          return undefined;
        });
      }
      // Nested objects / functions: drop. The cost of being strict
      // here is low (the thrown Error's strings are already redacted);
      // the cost of being lax is another leak class.
    }
    return result;
  }

  private redactErrorStrings(err: Error): void {
    try {
      err.message = redactString(err.message, this.secrets);
    } catch {
      // .message is non-writable on some frozen Error subclasses.
    }
    // `stack` is materialized lazily but cached on first access; a raw
    // logger that reads `err.stack` after our walk would otherwise see
    // the original string with secrets inlined (Node embeds the failing
    // URL / message into the stack for `TypeError: fetch failed`).
    try {
      const existing = (err as Error & { stack?: string }).stack;
      if (typeof existing === "string") {
        (err as Error & { stack?: string }).stack = redactString(
          existing,
          this.secrets,
        );
      }
    } catch {
      // .stack is non-writable on some runtimes / subclasses.
    }
  }
}

/** Hard depth ceiling on scrubError's cause-chain walk. */
const SCRUB_MAX_DEPTH = 10;

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  // Non-JSON: return as text. We don't stream binary — this template is for
  // JSON-over-HTTP APIs. Users wrapping file-download APIs should extend.
  return await response.text();
}
