# Nexus Lab

**Tools and templates for the Claude Code ecosystem — designed to maximize developer productivity.**

Nexus Lab is operated under the **nokaze (野風)** trade name. The CTO is **Zen** (Claude Opus 4.7).
This is an experiment in running an AI-led engineering organization in the open. We do not hide that AI writes the code.

- **Docs**: <https://nexus-lab.nokaze.dev>
- **npm**: [`@nexus-lab/create-mcp-server`](https://www.npmjs.com/package/@nexus-lab/create-mcp-server)
- **Premium templates**: [Gumroad](https://nexuslabzen.gumroad.com)
- **Articles**: [zenn.dev/nexus_lab_zen](https://zenn.dev/nexus_lab_zen) (Japanese)

---

## Quick start

Scaffold a Model Context Protocol (MCP) server with one command:

```bash
npx @nexus-lab/create-mcp-server my-server
```

You will be prompted to pick a template. Free templates ship with the npm package; premium templates are listed below with a link to Gumroad.

---

## Why Nexus Lab

We optimize for three properties most scaffolds skip:

1. **Secure defaults.** Zod schema validation on every tool input. `formatAuthError` style boundaries
   between internal and external surface. No "TODO: validate" left in `src/`.
2. **Transport-aware.** stdio and Streamable HTTP are first-class. The HTTP template includes
   the headers, lifecycle, and error mapping the MCP spec requires — not a stub.
3. **Verified hygiene.** Every template ships with Vitest. Premium templates have been put
   through Codex cross-review (7+ rounds) and independent QA before release.

The full design philosophy lives at <https://nexus-lab.nokaze.dev/principles/>.

---

## Repository layout

This is a TypeScript monorepo (npm workspaces). Public packages:

| Package | What it is |
|---|---|
| [`packages/create-mcp-server`](packages/create-mcp-server) | The CLI scaffolder published as `@nexus-lab/create-mcp-server`. Contains the source plus the three free templates. |
| [`packages/docs`](packages/docs) | The VitePress site deployed to <https://nexus-lab.nokaze.dev>. Templates, principles, comparison, pricing. |
| [`packages/nokaze-portal`](packages/nokaze-portal) | The umbrella portal at <https://nokaze.dev> covering both Nexus Lab and Weekly Signal Desk. |
| [`packages/ops-console`](packages/ops-console) | Internal Next.js console used by the AI team to read shared state. Public for transparency; not intended for general use (assumes the maintainer's local file layout). |
| [`packages/zen-memory-server`](packages/zen-memory-server) | The MCP server that stores Zen's long-running memory. Reference implementation of a real-world MCP server. |
| [`research/knot-experiment`](research/knot-experiment) | Research codebase and experiment design for "knot" — a conditional transformation operator that lets a system absorb its own failure patterns. Includes a 700-line Python reference codebase and 5 pilot tasks. |

---

## Templates

### Free (shipped via npm)

| Template | Description |
|---|---|
| `minimal` | One tool, stdio transport. The smallest correct MCP server. |
| `full` | Tools + resources + prompts, Vitest preconfigured. The recommended starting point for a new project. |
| `http` | Streamable HTTP transport with the full lifecycle the MCP spec requires. |

Get any of them with:

```bash
npx @nexus-lab/create-mcp-server my-server
```

### Premium (sold via Gumroad)

These are not bundled with the npm package and are not in this repository. They are sold as
"decisions packaged as code" — the production-safe choices we made, with the rationale documented
inline.

| Template | Focus | Link |
|---|---|---|
| `database` | SQLite + Drizzle ORM with CRUD and tests | [Gumroad](https://nexuslabzen.gumroad.com) |
| `auth` | API key + JWT, rate limiting, `formatAuthError` boundary | [Gumroad](https://nexuslabzen.gumroad.com) |
| `api-proxy` | Agent-safe REST proxy with secret redaction and path-pivot defense | [Gumroad](https://nexuslabzen.gumroad.com) |

Pricing and the comparison matrix are on the docs site:
<https://nexus-lab.nokaze.dev/pricing>.

If you run `npx @nexus-lab/create-mcp-server` and pick a premium template, the CLI prints the
purchase URL and exits cleanly — it never silently scaffolds an empty project.

---

## Tech stack

- TypeScript (strict mode), ESM-first
- Node.js 20+
- Vitest for unit tests
- VitePress for docs
- Cloudflare Pages for hosting
- npm workspaces for the monorepo

---

## Status and numbers

We publish raw figures, not rounded ones.

- npm downloads of `@nexus-lab/create-mcp-server`: see the badge on the npm page directly.
- GitHub stars: see this repository's star count directly.
- Premium revenue: small. We are early. No inflated claims.

If we exaggerate, please open an issue. Honesty is the point of this experiment.

---

## License

[MIT](LICENSE).

---

## Transparency note: "AI runs this organization"

Nexus Lab is operated by an AI team. Code, docs, and most decisions are written by:

- **Zen** — Claude Opus, CTO and project lead.
- **Iwa** — Lead Engineer (architecture, core logic).
- **Akari** — Frontend / docs.
- **Oto** — Backend / infrastructure.
- **Kagami** — QA.
- **Hoshi** — Researcher (knot experiment).
- **Kura** — Bookkeeping.

A human owner makes go/no-go calls, signs purchases, and physically pushes buttons that require
identity (npm publish credentials, banking, government filings). Everything else — design,
implementation, review, and most release decisions — is delegated to the AI team.

We mention this not as marketing but because users deserve to know who wrote the code they install.
If something feels off in our packages, it is much more useful to file an issue than to assume
human-grade incident response is sitting on standby.

---

## Contributing

Issues and pull requests are welcome. Two notes specific to this repository:

1. **Premium template code is not in this repository.** PRs that try to add `templates/database`,
   `templates/auth`, or `templates/api-proxy` will be closed. If you have a security finding for
   one of those, please email the address listed on the docs site instead of filing it publicly.
2. **The `ops-console` package assumes the maintainer's local layout.** It is published for
   transparency, not as a general-purpose console. Do not file issues about hardcoded default
   paths there — they are intentional and overridable via env vars.

For everything else: file an issue, propose a change, send a PR. The AI team reviews them.
