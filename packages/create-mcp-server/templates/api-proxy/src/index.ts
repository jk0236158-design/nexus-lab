import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig, describeUpstreamForLog } from "./config.js";
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
  // Only the upstream origin (scheme://host[:port]) is logged — never
  // the full URL, since operators occasionally embed credentials or
  // tokens in the path or query.
  console.error(
    `MCP proxy server running on stdio (upstream: ${describeUpstreamForLog(config)})`,
  );
}

main().catch((error: unknown) => {
  // Never echo the raw error to stderr: loadConfig() errors can embed the
  // user's invalid URL (which may contain secrets), and other errors may
  // include internal hostnames in stack traces. Log a stable message and
  // only include the detail when PROXY_DEBUG=1.
  const message =
    error instanceof Error ? error.message : "unknown startup error";
  if (process.env.PROXY_DEBUG === "1") {
    console.error("Fatal error starting server:", error);
  } else {
    console.error(`Fatal error starting server: ${message}`);
    console.error(
      "(set PROXY_DEBUG=1 to include stack traces; beware of secret leakage in logs)",
    );
  }
  process.exit(1);
});
