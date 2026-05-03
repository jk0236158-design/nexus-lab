/**
 * Response formatters shared by every MCP tool. Centralises the MCP content
 * shape so individual templates only declare the payload, not the wrapping.
 *
 * Extracted from the duplicated `toolResponse` / `formatXxxError` helpers
 * that appeared in api-proxy/tools.ts, auth/tools.ts, database/tools.ts.
 */

export interface ToolContentTextItem {
  type: "text";
  text: string;
}

export interface ToolResponse {
  content: ToolContentTextItem[];
  isError?: boolean;
  /**
   * Index signature mirrors `CallToolResult` in @modelcontextprotocol/sdk so
   * `server.tool(...)` callbacks can return a `ToolResponse` directly without
   * a structural-compatibility error. The SDK uses this slot for `_meta` and
   * any unknown future fields the protocol may add.
   */
  [key: string]: unknown;
}

/**
 * Wrap an arbitrary value as an MCP tool response. JSON.stringifies non-string
 * payloads so the agent always receives a stable text shape; the optional
 * `pretty` flag matches the 2-space indent used across our existing tools.
 */
export function jsonResponse(payload: unknown, pretty = true): ToolResponse {
  const text =
    typeof payload === "string"
      ? payload
      : JSON.stringify(payload, null, pretty ? 2 : 0);
  return {
    content: [{ type: "text", text }],
  };
}

/**
 * Wrap a plain text payload as an MCP tool response.
 */
export function textResponse(text: string): ToolResponse {
  return {
    content: [{ type: "text", text }],
  };
}

/**
 * Wrap an error message as an MCP tool response with `isError: true` so
 * the SDK marks the tool call as failed.
 */
export function errorResponse(message: string): ToolResponse {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

/**
 * Shared status/body envelope used by the api-proxy template's tools. Kept
 * here so other proxy-style templates (and the upcoming N1 config template)
 * can produce the same shape without copy-pasting.
 */
export function statusResponse(
  status: number,
  body: unknown,
  ok: boolean,
): ToolResponse {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ status, ok, body }, null, 2),
      },
    ],
    isError: !ok,
  };
}

/**
 * Convert an unknown thrown value into a user-safe message. Never echoes
 * stack traces or constructor names — keeps the MCP client surface stable.
 *
 * Templates with domain-specific error codes (db constraint, jwt expired,
 * proxy timeout) should keep their own classifier on top of this; this is
 * the catch-all baseline.
 */
export function safeErrorMessage(error: unknown, action: string): string {
  if (error instanceof Error && error.message) {
    return `Failed to ${action}: ${error.message}`;
  }
  return `Failed to ${action}. Please try again or contact support.`;
}
