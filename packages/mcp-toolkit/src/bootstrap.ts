import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Bootstrap helpers for MCP servers — extracted from the duplicated
 * `main()` / transport-setup blocks in minimal/full/http/database/auth/api-proxy
 * templates.
 *
 * `runStdio(server)` collapses the `new StdioServerTransport()` +
 * `await server.connect(transport)` + fatal-error-handler boilerplate into
 * one call. `createHttpHandler(...)` collapses the per-session transport map
 * + JSON-RPC routing for Streamable HTTP transport.
 */

export interface RunStdioOptions {
  /**
   * Message logged to stderr once the server is connected. Pass `false` to
   * suppress the log entirely (useful when the parent process is itself an
   * MCP host that owns the user-facing log stream).
   */
  readyMessage?: string | false;
  /**
   * Override the abort/exit handler. Defaults to `process.exit(1)` after
   * logging the error to stderr. Pass a custom function (e.g. for tests)
   * to take over.
   */
  onFatalError?: (error: unknown) => void;
}

/**
 * Connect an `McpServer` to a stdio transport and start serving. Returns
 * the connected server so callers can hold a reference for graceful
 * shutdown if they want.
 *
 * Replaces this duplicated block from minimal/full/database template:
 *
 * ```
 * async function main() {
 *   const transport = new StdioServerTransport();
 *   await server.connect(transport);
 *   console.error("MCP server running on stdio");
 * }
 * main().catch((error) => {
 *   console.error("Fatal error:", error);
 *   process.exit(1);
 * });
 * ```
 *
 * Dynamic-import of the SDK keeps this file consumable even when tests stub
 * out `process.exit` — and avoids paying the SDK import cost in unit tests
 * that only exercise the helpers.
 */
export async function runStdio(
  server: McpServer,
  options: RunStdioOptions = {},
): Promise<McpServer> {
  const { readyMessage = "MCP server running on stdio", onFatalError } = options;

  try {
    // Dynamic import so consumers without stdio (HTTP-only deployments)
    // don't pay the load cost. The SDK is a peerDep so this resolves in
    // the consumer's module graph.
    const { StdioServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/stdio.js"
    );
    const transport = new StdioServerTransport();
    await server.connect(transport);
    if (readyMessage !== false) {
      // stdout is reserved for MCP protocol traffic; stderr only.
      console.error(readyMessage);
    }
    return server;
  } catch (error) {
    if (onFatalError) {
      onFatalError(error);
      return server;
    }
    const message =
      error instanceof Error ? error.message : "unknown startup error";
    console.error(`Fatal error starting server: ${message}`);
    process.exit(1);
  }
}

/**
 * Per-session transport store used by Streamable HTTP MCP servers.
 *
 * Extracted as an explicit type so consumers can substitute (e.g. with a
 * Redis-backed store for multi-instance deployments) without changing the
 * `createHttpSessionRouter` signature.
 */
export interface HttpTransportLike {
  readonly sessionId?: string;
  onclose?: () => void;
  handleRequest(req: unknown, res: unknown, body?: unknown): Promise<void>;
}

export interface SessionStore<T extends HttpTransportLike = HttpTransportLike> {
  has(sessionId: string): boolean;
  get(sessionId: string): T | undefined;
  set(sessionId: string, transport: T): void;
  delete(sessionId: string): void;
}

/**
 * Default in-memory session store. Sufficient for single-instance servers;
 * swap for a shared store in clustered deployments.
 */
export class InMemorySessionStore<T extends HttpTransportLike = HttpTransportLike>
  implements SessionStore<T>
{
  private readonly map = new Map<string, T>();

  has(sessionId: string): boolean {
    return this.map.has(sessionId);
  }
  get(sessionId: string): T | undefined {
    return this.map.get(sessionId);
  }
  set(sessionId: string, transport: T): void {
    this.map.set(sessionId, transport);
  }
  delete(sessionId: string): void {
    this.map.delete(sessionId);
  }
}
