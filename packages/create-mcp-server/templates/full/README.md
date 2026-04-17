# MCP Server — Full Template

A complete starter for a [Model Context Protocol](https://modelcontextprotocol.io/) server with tools, resources, prompts, and Vitest baked in. Free.

## Who this is for

- **You're building:** an MCP server that needs more than a single tool — you want to expose structured resources, reusable prompts, and have test coverage from day one.
- **What it is:** a working MCP server with example tools (`echo`, `add`), a resource (`info://server`), a prompt template, and a Vitest suite. stdio transport.
- **What's in the zip:** `src/` (index, tools, resources, prompts), `tests/` with an example spec, `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`.
- **Not a fit if:** you need HTTP transport (pick `http`), database persistence (pick `database`), or request authentication (pick `auth`).
- **Run it in 3 steps:** `npm install` → `npm run build` → `npm start`. Tests: `npm test`.
- **Next:** extend the three files in `src/` (tools/resources/prompts) · scaffold via `npx @nexus-lab/create-mcp-server my-server --template full` · or step up to [premium templates](https://nexuslabzen.gumroad.com/) when you need DB / auth / API proxying.

## Quick Start

```bash
npm install
npm run build
npm start
```

Run the tests:

```bash
npm test
```

Connect to Claude Desktop via `claude_desktop_config.json`:

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

## What you get

| File | Purpose |
|------|---------|
| `src/index.ts` | Server entry, wires up everything |
| `src/tools.ts` | Example tools (`echo`, `add`) — copy the pattern to add your own |
| `src/resources.ts` | Example resource (`info://server`) — serve static or dynamic data |
| `src/prompts.ts` | Example prompt template — reusable prompt snippets |
| `tests/tools.test.ts` | Example Vitest spec — mirror this shape for your own tests |

All inputs are validated with Zod. All responses follow the MCP content format.

## When to graduate

- Need **stdio only, smallest possible**? → [`minimal`](../minimal/README.md)
- Need **HTTP / Streamable HTTP transport**? → [`http`](../http/README.md)
- Need **persistent storage**? → [`database`](https://nexuslabzen.gumroad.com/l/ijuvn) (premium)
- Need **auth + rate limiting**? → [`auth`](https://nexuslabzen.gumroad.com/l/dghzas) (premium)
- Need **to wrap an existing REST API safely for agents**? → [`api-proxy`](https://nexuslabzen.gumroad.com/l/bktllv) (premium)

MIT. Made by [Nexus Lab](https://github.com/nexus-lab-zen/nexus-lab).
