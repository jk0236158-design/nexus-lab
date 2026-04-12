import "dotenv/config";

import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { authMiddleware } from "./auth.js";
import { rateLimitMiddleware } from "./rate-limit.js";
import { registerTools, setCurrentUser } from "./tools.js";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

const app = express();

// --- Global middleware ---
app.use(cors());
app.use(express.json());

// --- Health check (unauthenticated) ---
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Authenticated MCP endpoint ---
app.all("/mcp", authMiddleware, rateLimitMiddleware(), async (req, res) => {
  try {
    // Create a fresh MCP server and transport per request
    const server = new McpServer(
      { name: "my-mcp-server", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );

    registerTools(server);

    // Inject the authenticated user into the tool context
    setCurrentUser(req.user);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    // Connect the server to the transport
    await server.connect(transport);

    // Handle the HTTP request through the transport
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("[MCP] Request handling error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`MCP server listening on http://localhost:${PORT}`);
  console.log(`  Health:   GET  http://localhost:${PORT}/health`);
  console.log(`  MCP:      POST http://localhost:${PORT}/mcp`);
});

export default app;
