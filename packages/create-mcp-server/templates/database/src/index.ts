import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runStdio } from "@nexus-lab/mcp-toolkit/bootstrap";
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

// Start the server with stdio transport (toolkit handles transport setup +
// fatal-error logging).
await runStdio(server);
