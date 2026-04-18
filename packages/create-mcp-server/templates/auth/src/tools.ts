import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { StringValue } from "ms";
import { generateToken, type AuthUser } from "./auth.js";

function formatAuthError(error: unknown, action: string): string {
  if (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const code = (error as { code: string }).code;
    if (code === "ERR_JWT_EXPIRED") {
      return `AUTH_TOKEN_EXPIRED: Token has expired during ${action}.`;
    }
    if (code.startsWith("ERR_JWT") || code.startsWith("ERR_JWS")) {
      return `AUTH_TOKEN_ERROR: Failed to ${action} due to an invalid token.`;
    }
  }
  return `Failed to ${action}. Please try again or contact support.`;
}

/**
 * Registers all MCP tools on the given server instance, scoped to a single
 * authenticated user. The user is captured in closures, so concurrent
 * requests each get their own server/tool pair and never observe each
 * other's identity or role.
 */
export function registerTools(server: McpServer, user: AuthUser): void {
  server.tool("whoami", "Returns the authenticated user information", {}, () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              id: user.id,
              role: user.role,
              authMethod: user.authMethod,
            },
            null,
            2,
          ),
        },
      ],
    };
  });

  server.tool(
    "generate-token",
    "Generates a JWT token for a given user (admin only)",
    {
      userId: z.string().min(1).describe("The user ID to generate a token for"),
      role: z
        .enum(["admin", "user"])
        .default("user")
        .describe("Role to assign to the token (optional, defaults to 'user')"),
      expiresIn: z
        .string()
        .default("24h")
        .describe(
          "Token expiry duration (optional, defaults to '24h'; e.g., '1h', '7d', '30d')",
        ),
    },
    ({ userId, role, expiresIn }) => {
      if (user.role !== "admin") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "Forbidden",
                  message: "Only admin users can generate tokens",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }

      try {
        const token = generateToken(userId, role, expiresIn as StringValue);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  token,
                  userId,
                  role,
                  expiresIn,
                  generatedBy: user.id,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: formatAuthError(err, "generate token"),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
