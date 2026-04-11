#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createDatabase } from "./db.js";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";

/**
 * Zen Memory Server — persistent memory for the Nexus Lab CTO.
 * Stores decisions, learnings, behavioral knots, and session metrics.
 */
async function main() {
  const server = new McpServer({
    name: "zen-memory-server",
    version: "0.1.0",
  });

  // Initialize database (loads from disk or creates new)
  const appDb = await createDatabase();

  // Register tools and resources
  registerTools(server, appDb);
  registerResources(server, appDb);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error starting zen-memory-server:", error);
  process.exit(1);
});
