import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const app = express();

app.use(cors());
app.use(express.json());

// Store active transports keyed by session ID
const transports = new Map<string, StreamableHTTPServerTransport>();

/** Create a new MCP server instance and register tools */
function createServer(): McpServer {
  const server = new McpServer({
    name: "my-mcp-server",
    version: "0.1.0",
  });

  // Example tool: hello
  server.tool(
    "hello",
    "Returns a greeting for the given name",
    { name: z.string().describe("Name to greet") },
    async ({ name }) => ({
      content: [{ type: "text", text: `Hello, ${name}!` }],
    }),
  );

  return server;
}

// POST /mcp — handle JSON-RPC requests (initialize + all subsequent calls)
app.post("/mcp", async (req, res) => {
  try {
    // Check for existing session
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (sessionId && transports.has(sessionId)) {
      // Route to existing transport
      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res);
      return;
    }

    // No valid session — create a new one (expects an initialize request)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    // Register transport after creation (sessionId is generated internally)
    const newSessionId = transport.sessionId!;
    transports.set(newSessionId, transport);

    // Clean up on close
    transport.onclose = () => {
      transports.delete(newSessionId);
    };

    // Connect a fresh server to this transport
    const server = createServer();
    await server.connect(transport);

    // Handle the incoming request
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error("Error handling POST /mcp:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// GET /mcp — SSE stream for server-to-client notifications
app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }

  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// DELETE /mcp — terminate a session
app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }

  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

const PORT = parseInt(process.env.PORT || "3000", 10);

app.listen(PORT, () => {
  console.log(`MCP server listening on http://localhost:${PORT}/mcp`);
});
