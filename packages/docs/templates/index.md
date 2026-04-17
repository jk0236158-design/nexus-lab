---
title: Templates
description: All Nexus Lab MCP server templates
---

# Templates

Every template is production-oriented. Free templates cover common scaffolds. Premium templates encode resolved design decisions for auth, persistence, and API proxying.

## Free (npm)

Installed via `npx @nexus-lab/create-mcp-server <name> --template <template>`.

- [minimal](/templates/minimal) — single tool, stdio transport. Smallest viable MCP server.
- [full](/templates/full) — tools + resources + prompts, Vitest pre-wired.
- [http](/templates/http) — Streamable HTTP transport (remote-ready).

## Premium (Gumroad)

Bought and downloaded as zip. Each includes a buyer-facing README, tests, and the design-decisions brief.

- [database](/templates/database) — SQLite + Drizzle ORM, safe error formatting, migrations.
- [auth](/templates/auth) — secure API key handling, timing-safe comparison, rate limiting.
- [api-proxy](/templates/api-proxy) — agent-safe upstream proxy with path-pivot protection.

## Installation

```bash
npx @nexus-lab/create-mcp-server my-server
```

Pick a template interactively, or pass `--template <name>`.
