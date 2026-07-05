# @nexus-lab/create-mcp-server

Scaffold a new [Model Context Protocol](https://modelcontextprotocol.io/) server in seconds. Four free templates and three premium templates — each premium one is a ¥500 (US$3.50) reference build with security and integration decisions already made.

```bash
npx @nexus-lab/create-mcp-server my-server
```

## Features

- **TypeScript + ESM** — Modern setup out of the box
- **Secure defaults** — Zod schema validation for all inputs
- **Seven templates** — Four free, three premium
- **Test-ready** — Vitest included in the `full` and `config` templates
- **Non-interactive mode** — `-y` flag for CI / AI-agent setup
- **Build out of the box** — Each free template passes `npm install && npm run build` with no further configuration. CI runs this for all four free templates on every push (see `.github/workflows/ci.yml`).

## Free Templates

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

### `config`
Typed, profile-aware, schema-validated config loader for MCP servers — env + file + profile in one shot, with secret redaction baked into the log path. Vitest suite included.

```bash
npx @nexus-lab/create-mcp-server my-server --template config
```

## Usage

```bash
# Interactive mode
npx @nexus-lab/create-mcp-server

# With project name
npx @nexus-lab/create-mcp-server my-server

# With template
npx @nexus-lab/create-mcp-server my-server --template full

# Non-interactive (CI / AI agent setup)
npx @nexus-lab/create-mcp-server my-server -t config -y --no-install --no-git

# With description flag
npx @nexus-lab/create-mcp-server my-server -t config -d "My config-aware MCP server"

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

Three premium reference builds, each ¥500 (US$3.50) — security and integration design decisions bundled, MIT-licensed source you can read and adapt. Available on [Gumroad](https://nexuslabzen.gumroad.com), [BOOTH](https://nexus-lab.booth.pm), and via the per-template Polar.sh checkout links below.

Each route points to the same template package. Please use only one route per item to avoid duplicate purchase.

| Template | Description | Price | Links |
|----------|-------------|-------|------|
| `database` | SQLite + Drizzle ORM, safe error formatting, migrations | ¥500 / $3.50 | [Polar.sh](https://buy.polar.sh/polar_cl_9PduaFS7nH4O0rn2miLkc1NzdhXma3yGEj0F00NWZQm) · [Gumroad](https://nexuslabzen.gumroad.com/l/ijuvn) |
| `auth` | API key + JWT, timing-safe comparison, two-layer rate limiting | ¥500 / $3.50 | [Polar.sh](https://buy.polar.sh/polar_cl_q3qsaCzblSGpWiRvAQsXMdCx4OaS33Xhcpw9H4GPG4R) · [Gumroad](https://nexuslabzen.gumroad.com/l/dghzas) |
| `api-proxy` | Agent-safe REST proxy, path-pivot protection, secret redaction | ¥500 / $3.50 | [Polar.sh](https://buy.polar.sh/polar_cl_UdTzuXz54SQTs8XPmkGpvisg3jSkDEcDqcSfz0S8Zvh) · [Gumroad](https://nexuslabzen.gumroad.com/l/bktllv) |

Each premium zip includes full source, Vitest suite, design-decisions brief, and CHANGELOG — one-time purchase, MIT license, no subscription.

```bash
# When you select a premium template, you'll be directed to the purchase page
npx @nexus-lab/create-mcp-server my-server --template database
```

## Feedback — what's holding you back?

If you've tried the free templates but haven't moved to the paid ones, we'd like to know what's holding you back. Price, content fit, payment route, timing — any one-line note helps us iterate.

- GitHub Issues: [jk0236158-design/nexus-lab/issues](https://github.com/jk0236158-design/nexus-lab/issues)
- Zenn comments: [zenn.dev/nexus_lab_zen](https://zenn.dev/nexus_lab_zen)

無料テンプレートを試した後、 paid テンプレートに進む / 進まない判断で 何が一番引っかかりますか？ 1 行で十分です。 上記の GitHub Issues か Zenn コメントで教えてください。

## License

MIT — [Nexus Lab](https://github.com/jk0236158-design/nexus-lab)
