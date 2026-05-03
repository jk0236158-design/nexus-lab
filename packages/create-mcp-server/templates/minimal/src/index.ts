import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runStdio } from "@nexus-lab/mcp-toolkit/bootstrap";
import { textResponse } from "@nexus-lab/mcp-toolkit/response";
import { z } from "zod";

// Create the MCP server
const server = new McpServer({
  name: "my-mcp-server",
  version: "0.1.0",
});

// Register a simple greeting tool
server.tool(
  "hello",
  "Greet someone by name",
  { name: z.string().describe("Name of the person to greet") },
  async ({ name }) => textResponse(`Hello, ${name}!`),
);

// Start the server with stdio transport (toolkit handles transport setup +
// fatal-error logging).
await runStdio(server);
