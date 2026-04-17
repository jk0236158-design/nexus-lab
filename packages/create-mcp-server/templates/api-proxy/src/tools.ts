import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ProxyClient, HttpMethod } from "./proxy.js";

/**
 * Classify a thrown proxy error. Returns a user-safe message and never
 * leaks upstream URLs, stack traces, or configured credentials.
 */
export function formatProxyError(error: unknown, action: string): string {
  if (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const code = (error as { code: string }).code;
    if (code === "PROXY_RATE_LIMITED") {
      return `PROXY_RATE_LIMITED: Too many requests while trying to ${action}. Please wait and retry.`;
    }
    if (code === "ABORT_ERR" || code === "UND_ERR_ABORTED") {
      return `PROXY_TIMEOUT: The upstream request timed out during ${action}.`;
    }
  }
  if (
    error instanceof Error &&
    (error.name === "AbortError" || /aborted/i.test(error.message))
  ) {
    return `PROXY_TIMEOUT: The upstream request timed out during ${action}.`;
  }
  return `Failed to ${action}. The upstream request did not complete successfully.`;
}

/**
 * Shared response formatter for all proxy tools. Ensures the response body is
 * serialized in a stable shape and the status is always reported separately
 * so the agent can reason about upstream errors without parsing strings.
 */
function toolResponse(status: number, body: unknown, ok: boolean) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ status, ok, body }, null, 2),
      },
    ],
    isError: !ok,
  };
}

// Shared shapes reused across tools. Kept narrow on purpose: we don't accept
// arbitrary headers from the agent (those could override auth) or raw URLs
// (those could point the proxy at the wrong host).
const pathSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine((value) => !/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value), {
    message: "path must be relative (no scheme/host); got an absolute URL",
  })
  .refine((value) => !value.startsWith("//"), {
    message: "path must be relative (no protocol-relative URL)",
  })
  .describe(
    "Relative path appended to UPSTREAM_BASE_URL. Must not contain a scheme or host.",
  );

const querySchema = z
  .record(
    z.string().min(1).max(200),
    z.union([z.string(), z.number(), z.boolean()]),
  )
  .optional()
  .describe("Optional query-string parameters, encoded as key/value pairs.");

const jsonBodySchema = z
  .union([
    z.record(z.string(), z.unknown()),
    z.array(z.unknown()),
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
  ])
  .optional()
  .describe("JSON body sent to the upstream API.");

/**
 * Registers the generic proxy tools on the given MCP server. These are the
 * building blocks — the agent picks the method, path, and payload. For
 * production, wrap this template and register *specific* tools per endpoint
 * so the agent cannot reach arbitrary upstream paths.
 */
export function registerTools(server: McpServer, client: ProxyClient): void {
  const makeHandler = (method: HttpMethod, action: string) =>
    async ({
      path,
      query,
      body,
    }: {
      path: string;
      query?: Record<string, string | number | boolean>;
      body?: unknown;
    }) => {
      try {
        const response = await client.request({
          method,
          path,
          query,
          body: method === "GET" || method === "DELETE" ? undefined : body,
        });
        return toolResponse(response.status, response.body, response.ok);
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatProxyError(err, action),
            },
          ],
          isError: true,
        };
      }
    };

  server.tool(
    "proxy-get",
    "Perform a GET request against the configured upstream API.",
    { path: pathSchema, query: querySchema },
    makeHandler("GET", "fetch resource"),
  );

  server.tool(
    "proxy-post",
    "Perform a POST request against the configured upstream API.",
    { path: pathSchema, query: querySchema, body: jsonBodySchema },
    makeHandler("POST", "create resource"),
  );

  server.tool(
    "proxy-put",
    "Perform a PUT request against the configured upstream API.",
    { path: pathSchema, query: querySchema, body: jsonBodySchema },
    makeHandler("PUT", "replace resource"),
  );

  server.tool(
    "proxy-delete",
    "Perform a DELETE request against the configured upstream API.",
    { path: pathSchema, query: querySchema },
    makeHandler("DELETE", "delete resource"),
  );
}
