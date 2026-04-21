---
title: Free vs Premium Comparison
description: All six Nexus Lab MCP templates side-by-side — features, security defaults, use cases, upgrade paths.
---

# Free vs Premium — side by side

Six templates, two tiers. Free templates are scaffolds for getting an MCP server running. Premium templates encode the design decisions that come after "it runs" — how errors are formatted, how keys are compared, how upstream calls are constrained.

<div class="nokaze-meta">

All six templates are MIT-licensed. The three premium templates are bought as zip source from Gumroad ($10 / $15 / $20) or BOOTH (準備中). No subscription; one-time purchase.

</div>

---

## At a glance

<div class="nokaze-comparison-wrap">

| | **minimal** | **full** | **http** | **database** | **auth** | **api-proxy** |
| :-- | :-: | :-: | :-: | :-: | :-: | :-: |
| **Tier** | Free | Free | Free | Premium | Premium | Premium |
| **Price** | $0 | $0 | $0 | **$10** | **$15** | **$20** |
| **Transport** | stdio | stdio | Streamable HTTP | stdio | stdio / HTTP | stdio / HTTP |
| **Tools** | 1 | multiple | multiple | multiple (CRUD) | multiple | multiple |
| **Resources** | — | ✓ | ✓ | ✓ (DB-backed) | — | — |
| **Prompts** | — | ✓ | ✓ | — | — | — |
| **Zod validation** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Vitest wired** | — | ✓ | ✓ | ✓ (+ in-mem DB) | ✓ | ✓ |
| **Integration tests** | — | — | — | ✓ | ✓ | ✓ |
| **Safe error formatting** | partial | partial | partial | ✓ | ✓ | ✓ |
| **Timing-safe auth** | n/a | n/a | n/a | n/a | ✓ | ✓ |
| **Rate limiting** | n/a | n/a | n/a | n/a | ✓ | ✓ |
| **Path-pivot protection** | n/a | n/a | n/a | n/a | n/a | ✓ |
| **Secret bleed prevention** | n/a | n/a | n/a | partial | ✓ | ✓ |
| **Migrations** | n/a | n/a | n/a | ✓ (Drizzle) | n/a | n/a |
| **Install** | `npx create-mcp-server` | `npx create-mcp-server` | `npx create-mcp-server` | Gumroad zip | Gumroad zip | Gumroad zip |

</div>

Legend: ✓ = implemented · partial = present but not hardened · n/a = out of scope for this template.

---

## Full matrix

### Transport

| Template | Transport | Remote-ready |
| :-- | :-- | :-: |
| minimal | stdio | — |
| full | stdio | — |
| http | Streamable HTTP (MCP official recommendation) | ✓ |
| database | stdio (HTTP in roadmap) | — |
| auth | stdio / HTTP | ✓ |
| api-proxy | stdio / HTTP | ✓ |

MCP's official guidance treats Streamable HTTP as the recommended remote transport. SSE remains only for backward compatibility. See [Transport Aware](/principles/transport-aware).

### Features

| Template | Tools | Resources | Prompts | DB | Auth | Upstream proxy |
| :-- | :-: | :-: | :-: | :-: | :-: | :-: |
| minimal | 1 | — | — | — | — | — |
| full | multi | ✓ | ✓ | — | — | — |
| http | multi | ✓ | ✓ | — | — | — |
| database | CRUD | ✓ | — | SQLite + Drizzle | — | — |
| auth | multi | — | — | — | API key + rate limit | — |
| api-proxy | multi | — | — | — | upstream key | allowlisted REST |

### Tests

| Template | Vitest | Unit | Integration | In-memory helpers |
| :-- | :-: | :-: | :-: | :-: |
| minimal | — | — | — | — |
| full | ✓ | ✓ | — | — |
| http | ✓ | ✓ | — | — |
| database | ✓ | ✓ | ✓ | in-memory SQLite helper |
| auth | ✓ | ✓ | ✓ | mock request helpers |
| api-proxy | ✓ | ✓ | ✓ | upstream stub |

### Security defaults

Where premium templates earn their price.

| Concern | Free covers | Premium hardens |
| :-- | :-- | :-- |
| Input validation | Zod schemas (all templates) | + error formatter that never echoes internal detail |
| Secret handling | `.env.example`, `.env` gitignored | + refusal to echo secrets in any response path |
| Key comparison | n/a | `timingSafeEqual` in `auth` / `api-proxy` |
| Rate limiting | n/a | in-memory token bucket in `auth` / `api-proxy` |
| Path pivot | n/a | strict allowlist routing in `api-proxy` |
| Error leakage | `try/catch` | normalized error envelope, no stack traces, no upstream body leakage |

### Use cases

| Template | Best for | Not for |
| :-- | :-- | :-- |
| minimal | Learning MCP shape; one-tool internal server | Anything multi-tool or remote |
| full | Tools + resources + prompts demo; local-only | Remote, persisted, or authenticated servers |
| http | Remote-accessible demo; no auth | Anything exposing real data or credentials |
| database | Internal server needing SQLite persistence | Multi-tenant; strict auth (combine with `auth`) |
| auth | Remote server needing API-key auth + rate limit | OAuth/OIDC flows (v1 is API key only) |
| api-proxy | Wrapping an existing REST API safely for agents | Streaming upstreams (v1 is request/response) |

---

## Upgrade paths

Free templates are entry points. Each one has a clear next step when your server outgrows the scaffold.

### minimal → ?

- Add multiple tools + resources + prompts → **full**
- Expose over the network → **http**
- Persist data → **database** (premium)
- Require authentication → **auth** (premium)
- Wrap an upstream REST API → **api-proxy** (premium)

### full → ?

- Go remote → **http**
- Persist data → **database** (premium)
- Require authentication → **auth** (premium)

### http → ?

- Add JWT / API key + rate limiting → **auth** (premium)
- Wrap an existing REST API with agent-safe defaults → **api-proxy** (premium)

### database → ?

- Combine with **auth** for authenticated CRUD servers (in roadmap as a composed template)

### auth → ?

- Combine with **api-proxy** for authenticated upstream wrapping

### api-proxy → ?

- Combine with **auth** if *your* MCP server also needs to authenticate clients (not just the upstream)

---

## How to choose

Ask in this order:

1. **Does it need to leave the local machine?** If yes → `http` (free) minimum.
2. **Does it touch real data?** If yes → `database` (premium).
3. **Does it accept requests from outside Claude Code?** If yes → `auth` (premium).
4. **Does it call an external API on the LLM's behalf?** If yes → `api-proxy` (premium).

You can always start with a free template and migrate up — the source layout is consistent across all six.

---

## Buy

| Channel | Status | Link |
| :-- | :-- | :-- |
| Gumroad (USD) | Live | [nexuslabzen.gumroad.com](https://nexuslabzen.gumroad.com) |
| BOOTH (JPY) | 準備中 | TBA |
| Polar.sh (USD, lower fees) | 準備中 | TBA |

Full pricing detail: [Pricing](/pricing).

---

<div class="nokaze-footer-note">

Revenue to date: **¥0** (as of 2026-04-21). We publish this openly — premium pricing is a hypothesis, not a validated market. If the comparison above is missing a dimension that would help your decision, [open an issue](https://github.com/nexus-lab-zen/Nexus.Lab.Zen/issues).

</div>

<style scoped>
.nokaze-meta {
  font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", system-ui, sans-serif;
  font-size: 13px;
  line-height: 20px;
  color: #6B6B6B;
  border-left: 2px solid #D9D3C4;
  padding: 4px 0 4px 12px;
  margin: 16px 0 24px;
}
.nokaze-comparison-wrap {
  overflow-x: auto;
}
.nokaze-comparison-wrap table {
  font-family: "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 12px;
}
.nokaze-footer-note {
  font-family: "Noto Serif JP", "Hiragino Mincho ProN", Georgia, serif;
  font-size: 13px;
  line-height: 22px;
  color: #3D3D3D;
  border-top: 1px solid #D9D3C4;
  padding-top: 16px;
  margin-top: 40px;
}
</style>
