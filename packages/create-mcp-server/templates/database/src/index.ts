import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupDatabase } from "./db.js";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";

const server = new McpServer({
  name: "my-mcp-server",
  version: "0.1.0",
});

// Initialize the database (creates tables if they don't exist)
setupDatabase();

// Register all tools and resources
registerTools(server);
registerResources(server);

// Start the server with stdio transport
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server running on stdio");
}

main().catch((error: unknown) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
