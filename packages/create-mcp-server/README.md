# @nexus-lab/create-mcp-server

Scaffold a new [Model Context Protocol](https://modelcontextprotocol.io/) server in seconds. Free templates to start, premium templates ¥500 (US$3.50) each — production-ready, security decisions already made, 3-10 hour setup avoided.

```bash
npx @nexus-lab/create-mcp-server my-server
```

## Features

- **TypeScript + ESM** — Modern setup out of the box
- **Secure defaults** — Zod schema validation for all inputs
- **Multiple templates** — Choose what fits your use case
- **Test-ready** — Vitest included in the `full` template
- **Zero config** — Works immediately after generation

## Templates

### `minimal` (default)
The simplest possible MCP server. One tool, stdio transport.

```bash
npx @nexus-lab/create-mcp-server my-server --template minimal
```

### `full`
Tools, resources, prompts, and testing all wired up.

```bash
npx @nexus-lab/create-mcp-server my-server --template full
```

### `http`
Streamable HTTP transport with Express. Ready for remote deployment.

```bash
npx @nexus-lab/create-mcp-server my-server --template http
```

## Usage

```bash
# Interactive mode
npx @nexus-lab/create-mcp-server

# With project name
npx @nexus-lab/create-mcp-server my-server

# With template
npx @nexus-lab/create-mcp-server my-server --template full

# Skip npm install
npx @nexus-lab/create-mcp-server my-server --no-install

# Skip git init
npx @nexus-lab/create-mcp-server my-server --no-git
```

## What you get

```
my-server/
├── src/
│   └── index.ts        # Server entry point
├── package.json
├── tsconfig.json
└── .gitignore
```

The `full` template also includes:
```
├── src/
│   ├── index.ts        # Server entry point
│   ├── tools.ts        # Tool definitions
│   ├── resources.ts    # Resource definitions
│   └── prompts.ts      # Prompt definitions
├── tests/
│   └── tools.test.ts   # Example tests
└── vitest.config.ts
```

## After scaffolding

```bash
cd my-server
npm run build
node dist/index.js
```

To use with Claude Code, add to your MCP config:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/my-server/dist/index.js"]
    }
  }
}
```

## Premium Templates

All MCP templates are one-coin reference builds — production-grade design decisions bundled at ¥500 (US$3.50). Available on [Gumroad](https://nexuslabzen.gumroad.com) and [BOOTH](https://nexus-lab.booth.pm):

| Template | Description | Price | Link |
|----------|-------------|-------|------|
| `config` | Schema-validated config from env + file + profile, secret redaction | ¥500 / $3.50 | [Gumroad](https://nexuslabzen.gumroad.com) / [BOOTH](https://nexus-lab.booth.pm/items/8246792) |
| `database` | SQLite + Drizzle ORM, safe error formatting, migrations | ¥500 / $3.50 | [Gumroad](https://nexuslabzen.gumroad.com/l/ijuvn) |
| `auth` | API key + JWT, timing-safe comparison, two-layer rate limiting | ¥500 / $3.50 | [Gumroad](https://nexuslabzen.gumroad.com/l/dghzas) |
| `api-proxy` | Agent-safe REST proxy, path-pivot protection, secret redaction | ¥500 / $3.50 | [Gumroad](https://nexuslabzen.gumroad.com/l/bktllv) |

Each premium zip includes full source, Vitest suite, design-decisions brief, and CHANGELOG — one-time purchase, MIT license, no subscription.

```bash
# When you select a premium template, you'll be directed to the purchase page
npx @nexus-lab/create-mcp-server my-server --template database
```

## License

MIT — [Nexus Lab](https://github.com/jk0236158-design/nexus-lab)
