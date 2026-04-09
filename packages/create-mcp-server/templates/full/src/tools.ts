import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Greeting logic — exported for direct testing
export function greet(name: string): string {
  return `Hello, ${name}! Welcome to the MCP server.`;
}

// Safe expression evaluator — exported for direct testing
export function calculate(expression: string): string {
  // Allow only digits, operators, parentheses, dots, and spaces
  const sanitized = expression.replace(/\s/g, "");
  if (!/^[\d+\-*/().]+$/.test(sanitized)) {
    throw new Error(
      "Invalid expression. Only numbers and +, -, *, /, (, ) are allowed."
    );
  }

  // Use Function constructor for safe-ish evaluation of arithmetic
  const result = new Function(`"use strict"; return (${sanitized});`)();

  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Expression did not evaluate to a finite number.");
  }

  return String(result);
}

// Register tools on the MCP server
export function registerTools(server: McpServer): void {
  server.tool(
    "greet",
    "Generate a greeting for the given name",
    { name: z.string().describe("The name to greet") },
    async ({ name }) => ({
      content: [{ type: "text", text: greet(name) }],
    })
  );

  server.tool(
    "calculate",
    "Safely evaluate a mathematical expression",
    {
      expression: z
        .string()
        .describe("Arithmetic expression (e.g. '2 + 3 * 4')"),
    },
    async ({ expression }) => {
      try {
        const result = calculate(expression);
        return { content: [{ type: "text", text: result }] };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
      }
    }
  );
}
