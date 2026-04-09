import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Register prompts on the MCP server
export function registerPrompts(server: McpServer): void {
  server.prompt(
    "review-code",
    "Review the provided code and suggest improvements",
    { code: z.string().describe("The source code to review") },
    ({ code }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              "Please review the following code and provide feedback on:",
              "1. Code quality and readability",
              "2. Potential bugs or edge cases",
              "3. Performance considerations",
              "4. Suggested improvements",
              "",
              "```",
              code,
              "```",
            ].join("\n"),
          },
        },
      ],
    })
  );
}
