import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { StringValue } from "ms";
import { generateToken, type AuthUser } from "./auth.js";

/**
 * Classify a thrown auth/token error. Returns a user-safe message
 * and never leaks internal details (secret paths, stack traces, etc.).
 */
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
 * Thread-local storage for the current request's authenticated user.
 * Set by the transport handler before each MCP request is processed.
 */
let currentUser: AuthUser | undefined;

/**
 * Sets the authenticated user context for the current request.
 * Must be called before the MCP server processes the request.
 */
export function setCurrentUser(user: AuthUser | undefined): void {
  currentUser = user;
}

/**
 * Registers all MCP tools on the given server instance.
 */
export function registerTools(server: McpServer): void {
  /**
   * whoami — Returns information about the currently authenticated user.
   * Available to any authenticated user.
   */
  server.tool("whoami", "Returns the authenticated user information", {}, () => {
    if (!currentUser) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: "No authenticated user in context" },
              null,
              2,
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              id: currentUser.id,
              role: currentUser.role,
              authMethod: currentUser.authMethod,
            },
            null,
            2,
          ),
        },
      ],
    };
  });

  /**
   * generate-token — Generates a JWT for a specified user.
   * Restricted to admin users only.
   */
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
      // Authorization check: only admins can generate tokens
      if (!currentUser || currentUser.role !== "admin") {
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
                  generatedBy: currentUser.id,
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
