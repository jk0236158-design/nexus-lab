# MCP Server — Minimal Template

The smallest possible [Model Context Protocol](https://modelcontextprotocol.io/) server. One tool, stdio transport, ~30 lines of TypeScript. Free.

## Who this is for

- **You're building:** your first MCP server, or a quick proof-of-concept to wire into Claude Desktop / Claude Code.
- **What it is:** one example tool (`echo`) that returns whatever text you pass it, wired up over stdio. Nothing more.
- **What's in the zip:** `src/index.ts`, `package.json`, `tsconfig.json`, `.gitignore`. No tests, no DB, no HTTP — just the SDK + Zod.
- **Not a fit if:** you want resources, prompts, HTTP transport, database, or auth. Pick `full`, `http`, or a premium template instead.
- **Run it in 3 steps:** `npm install` → `npm run build` → `npm start`.
- **Next:** customize `src/index.ts` to add your own tools · scaffold via `npx @nexus-lab/create-mcp-server my-server --template minimal` · or step up to [`full`](../full/README.md) / [`http`](../http/README.md) / [premium](https://nexuslabzen.gumroad.com/) when you need more.

## Quick Start

```bash
npm install
npm run build
npm start
```

The server starts on stdio and waits for MCP protocol messages. Connect it to Claude Desktop by adding it to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"]
    }
  }
}
```

## Customize

`src/index.ts` has one example tool. Copy the `server.tool(...)` call to add your own. Zod schemas describe the arguments; return `{ content: [{ type: "text", text: "..." }] }` for the response.

## When to graduate

- Need **tools + resources + prompts + tests**? → [`full`](../full/README.md)
- Need **HTTP transport** for remote clients? → [`http`](../http/README.md)
- Need **database / auth / API proxying**? → [premium templates](https://nexuslabzen.gumroad.com/)

MIT. Made by [Nexus Lab](https://github.com/nexus-lab-zen/nexus-lab).
