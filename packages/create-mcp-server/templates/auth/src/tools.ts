import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateToken, type AuthUser } from "./auth.js";

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
        .describe("Role to assign to the token"),
      expiresIn: z
        .string()
        .default("24h")
        .describe("Token expiry duration (e.g., '1h', '7d', '30d')"),
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
        const token = generateToken(userId, role, expiresIn);
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
        const message =
          err instanceof Error ? err.message : "Token generation failed";
        return {
          content: [{ type: "text", text: JSON.stringify({ error: message }) }],
          isError: true,
        };
      }
    },
  );
}
