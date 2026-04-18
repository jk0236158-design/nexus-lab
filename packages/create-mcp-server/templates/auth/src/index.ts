import "dotenv/config";

import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { authMiddleware } from "./auth.js";
import { rateLimitMiddleware } from "./rate-limit.js";
import { registerTools } from "./tools.js";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

/**
 * Build the CORS options from CORS_ORIGINS.
 *
 * - Unset (or empty) → CORS disabled entirely. This is the safe default for a
 *   server that authenticates via Authorization / x-api-key headers: a
 *   permissive `*` echo would let any origin's browser replay those
 *   credentials.
 * - Comma-separated allowlist → only those origins get CORS headers back,
 *   credentials mode enabled. Non-matching origins are silently denied.
 */
function buildCorsOptions(): cors.CorsOptions | null {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return null;
  const allowlist = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (allowlist.length === 0) return null;

  return {
    origin(origin, callback) {
      // Same-origin / non-browser requests have no Origin header — allow.
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowlist.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    allowedHeaders: ["content-type", "authorization", "x-api-key"],
    methods: ["GET", "POST", "OPTIONS"],
  };
}

const app = express();

const corsOptions = buildCorsOptions();
if (corsOptions) {
  app.use(cors(corsOptions));
}
// Cap the JSON body at 1MB by default (overridable via BODY_LIMIT). Without
// a cap, an unauthenticated POST with a gigantic body could exhaust process
// memory before the router even looks at auth — and rate-limit-per-IP on
// its own does not prevent a single well-timed huge-body request.
const BODY_LIMIT = process.env.BODY_LIMIT?.trim() || "1mb";
app.use(express.json({ limit: BODY_LIMIT }));

// --- Health check (unauthenticated) ---
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Rate limiters ---
// Pre-auth: keyed by IP, tighter window. Prevents brute-force on API keys /
// JWTs and unauthenticated request floods from reaching the auth layer at
// full throttle.
const preAuthLimiter = rateLimitMiddleware({
  maxEnvVar: "PREAUTH_RATE_LIMIT_MAX",
  windowMsEnvVar: "PREAUTH_RATE_LIMIT_WINDOW_MS",
  defaultMax: 30,
  defaultWindowMs: 60_000,
  keyResolver: (req) =>
    `ip:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`,
});

// Post-auth: keyed by authenticated identity (JWT sub / API-key prefix).
// Applied after authMiddleware so authenticated quota is per-user / per-key.
const postAuthLimiter = rateLimitMiddleware({
  maxEnvVar: "RATE_LIMIT_MAX",
  windowMsEnvVar: "RATE_LIMIT_WINDOW_MS",
  defaultMax: 100,
  defaultWindowMs: 60_000,
  keyResolver: (req) =>
    req.user?.id ?? `ip:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`,
});

// --- Authenticated MCP endpoint ---
// Order matters: pre-auth limiter → authMiddleware → post-auth limiter.
// This ensures invalid credentials and missing-credentials attempts consume
// the IP bucket and cannot brute-force the auth layer.
app.all(
  "/mcp",
  preAuthLimiter,
  authMiddleware,
  postAuthLimiter,
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        // Defensive: authMiddleware should have short-circuited already.
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      // Create a fresh MCP server and transport per request, with tools
      // bound to this user via closure (no module-level state).
      const server = new McpServer(
        { name: "my-mcp-server", version: "1.0.0" },
        { capabilities: { tools: {} } },
      );

      registerTools(server, user);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("[MCP] Request handling error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  },
);

// --- Start server ---
app.listen(PORT, () => {
  console.log(`MCP server listening on http://localhost:${PORT}`);
  console.log(`  Health:   GET  http://localhost:${PORT}/health`);
  console.log(`  MCP:      POST http://localhost:${PORT}/mcp`);
  if (!corsOptions) {
    console.log(
      "  CORS:     disabled (set CORS_ORIGINS to a comma-separated allowlist to enable)",
    );
  } else {
    console.log(
      `  CORS:     allowlist of ${process.env.CORS_ORIGINS?.split(",").length} origin(s)`,
    );
  }
});

export default app;
