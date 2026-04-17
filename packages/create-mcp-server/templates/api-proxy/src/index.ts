import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { ProxyClient } from "./proxy.js";
import { registerTools } from "./tools.js";

const config = loadConfig();
const client = new ProxyClient(config);

const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0",
});

registerTools(server, client);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is reserved for MCP protocol traffic; log to stderr only.
  console.error(`MCP proxy server running on stdio (upstream: ${config.baseUrl})`);
}

main().catch((error: unknown) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
