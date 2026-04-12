import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Example application config returned as a resource
const appConfig = {
  appName: "my-mcp-server",
  version: "0.1.0",
  features: {
    tools: true,
    resources: true,
    prompts: true,
  },
  settings: {
    maxRetries: 3,
    timeoutMs: 5000,
  },
};

// Register resources on the MCP server
export function registerResources(server: McpServer): void {
  server.resource(
    "app-config",
    "config://app",
    { description: "Application configuration data" },
    async () => ({
      contents: [
        {
          uri: "config://app",
          mimeType: "application/json",
          text: JSON.stringify(appConfig, null, 2),
        },
      ],
    })
  );
}
