import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Greeting logic — exported for direct testing
export function greet(name: string): string {
  return `Hello, ${name}! Welcome to the MCP server.`;
}

// Safe expression evaluator — exported for direct testing
// Uses a recursive-descent parser instead of Function constructor.
export function calculate(expression: string): string {
  // Allow only digits, operators, parentheses, dots, and spaces
  const sanitized = expression.replace(/\s/g, "");
  if (!/^[\d+\-*/().]+$/.test(sanitized)) {
    throw new Error(
      "Invalid expression. Only numbers and +, -, *, /, (, ) are allowed."
    );
  }

  let pos = 0;

  function parseExpression(): number {
    let left = parseTerm();
    while (pos < sanitized.length && (sanitized[pos] === "+" || sanitized[pos] === "-")) {
      const op = sanitized[pos++];
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    while (pos < sanitized.length && (sanitized[pos] === "*" || sanitized[pos] === "/")) {
      const op = sanitized[pos++];
      const right = parseFactor();
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  function parseFactor(): number {
    // Unary plus/minus
    if (sanitized[pos] === "+" || sanitized[pos] === "-") {
      const op = sanitized[pos++];
      const value = parseFactor();
      return op === "-" ? -value : value;
    }

    // Parenthesized sub-expression
    if (sanitized[pos] === "(") {
      pos++; // skip '('
      const value = parseExpression();
      if (sanitized[pos] !== ")") {
        throw new Error("Invalid expression. Only numbers and +, -, *, /, (, ) are allowed.");
      }
      pos++; // skip ')'
      return value;
    }

    // Number literal (integer or decimal)
    const start = pos;
    while (pos < sanitized.length && (sanitized[pos] >= "0" && sanitized[pos] <= "9" || sanitized[pos] === ".")) {
      pos++;
    }
    if (pos === start) {
      throw new Error("Invalid expression. Only numbers and +, -, *, /, (, ) are allowed.");
    }
    return parseFloat(sanitized.slice(start, pos));
  }

  const result = parseExpression();

  if (pos !== sanitized.length) {
    throw new Error("Invalid expression. Only numbers and +, -, *, /, (, ) are allowed.");
  }

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
