import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runStdio } from "@nexus-lab/mcp-toolkit/bootstrap";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";

// Create the MCP server instance
const server = new McpServer({
  name: "my-mcp-server",
  version: "0.1.0",
});

// Register all capabilities
registerTools(server);
registerResources(server);
registerPrompts(server);

// Connect via stdio transport (toolkit handles transport setup + fatal-error
// logging — no need for a hand-rolled main()/catch wrapper here).
await runStdio(server);
