---
title: Pricing
description: Free CLI + Premium MCP Templates — Nexus Lab pricing overview
---

# Pricing

**Free CLI + Premium Templates.** The scaffolding CLI is free and open source. Three premium templates encode resolved design decisions (auth, persistence, API proxying) that you would otherwise spend days deciding — and can be bought once, owned forever, as zip source.

<div class="nokaze-meta">

Last updated: 2026-04-21 · prices in USD (Gumroad) and JPY (BOOTH, 準備中). No subscription, no vendor lock-in, MIT license on everything you download.

</div>

---

## At a glance

| | **Free** | **Premium** |
| :-- | :-- | :-- |
| **Templates** | `minimal`, `full`, `http` | `database`, `auth`, `api-proxy` |
| **Install** | `npx @nexus-lab/create-mcp-server` | Buy zip, unzip, install |
| **Transport** | stdio / Streamable HTTP | stdio / HTTP (template-dependent) |
| **Tests** | Vitest pre-wired (full) | Vitest + integration tests |
| **Security defaults** | Zod input validation, ESM + TypeScript | Timing-safe comparison, allowlist routing, safe error formatting, rate limit |
| **Support** | GitHub issues | GitHub issues + CHANGELOG-tracked fixes |
| **License** | MIT | MIT (for the code you download) |
| **Price** | $0 | $10 / $15 / $20 (see below) |

> **Who is each side for?** Free is for learning the MCP shape and shipping internal-only or read-only servers. Premium is for anything touching real data, real credentials, or real upstream APIs — where the cost of a wrong default is higher than the price of the template.

---

## Premium templates

All three premium templates ship the full source in a zip, with README, LICENSE, tests, and a design-decisions brief explaining *why* each default was chosen.

### database — $10

SQLite + Drizzle ORM, safe error formatting, migrations.

- Who it's for: Claude Code devs building internal MCP servers that need persistence without building the schema → migration → query plumbing themselves.
- Prevents: internal error leakage to MCP clients, schema drift, brittle migrations.
- [See template page](/templates/database) · [Buy on Gumroad](https://nexuslabzen.gumroad.com/l/ijuvn)

### auth — $15

Secure API key handling, timing-safe comparison, rate limiting.

- Who it's for: anyone exposing an MCP server beyond local stdio and needing API-key auth that does not leak via error messages or timing.
- Prevents: timing-attack leakable key comparison, brute force via missing rate limit, internal error bleed-through.
- [See template page](/templates/auth) · [Buy on Gumroad](https://nexuslabzen.gumroad.com/l/dghzas)

### api-proxy — $20

Agent-safe upstream proxy with path-pivot protection.

- Who it's for: devs wrapping an existing REST/HTTP API as an MCP server, concerned about agent-driven path pivots or secret leakage.
- Prevents: path-pivot (LLM constructing unintended upstream URLs), secret bleed into responses, unbounded fan-out.
- [See template page](/templates/api-proxy) · [Buy on Gumroad](https://nexuslabzen.gumroad.com/l/bktllv)

---

## Where to buy

Three channels. Same zip, different rails — choose the one that fits your billing setup.

| Channel | Status | Currency | Notes |
| :-- | :-- | :-- | :-- |
| **Gumroad** (海外) | Live | USD ($10 / $15 / $20) | Primary channel. Instant zip download. [nexuslabzen.gumroad.com](https://nexuslabzen.gumroad.com) |
| **BOOTH** (国内) | 準備中 (Coming soon) | JPY (¥1,500 / ¥2,250 / ¥3,000 想定) | 日本の個人・小規模法人向け。インボイス対応予定。 |
| **Polar.sh** (海外) | 準備中 (Coming soon) | USD ($10 / $15 / $20) | Lower fees (5% vs Gumroad 10%), better for OSS-aligned buyers. |

> **Why three channels?** Gumroad is fast to set up but charges 10% + $0.50/tx. BOOTH removes the USD→JPY friction for Japanese buyers. Polar.sh keeps more of each sale going back into Nexus Lab. Same source, same tests, same license — we pick up the fee difference, not you.

---

## What you actually get

Each premium zip contains:

- `src/` — the implementation, typed, linted, ESM.
- `tests/` — unit + integration tests (Vitest).
- `README.md` — buyer-facing, with 6-point orientation (who / what it prevents / what's in the zip / constraints / shortest path / next action).
- `LICENSE` — MIT.
- `CHANGELOG.md` — every fix and security patch tracked publicly.
- **Design-decisions brief** — a short document explaining each non-obvious default (e.g. why `timingSafeEqual`, why the allowlist is path-based not regex).

What you *don't* get: hosting, a dashboard, telemetry, or a subscription. These are scaffolds you own and modify.

---

## FAQ

**Can I see the source before buying?**
The Gumroad page lists file contents and README excerpt. For the free templates, the source is on [npm](https://www.npmjs.com/package/@nexus-lab/create-mcp-server) and inside `packages/create-mcp-server/templates/` on GitHub.

**Do I get updates?**
Yes — buyers get access to all future 0.x updates of the template they bought. We publish CHANGELOGs publicly so you can see what changed before re-downloading.

**Is this a subscription?**
No. One-time purchase, zip delivery, MIT license.

**Can I use it in client work?**
Yes. MIT-licensed code — build on top, ship to clients, resell your own integrations. Just don't resell the template itself as-is.

**Why is api-proxy more expensive than database?**
api-proxy's design-decisions brief is the longest — path-pivot protection, secret bleed prevention, and agent-safe fan-out are each non-trivial. You pay for the decisions, not the lines of code.

---

## 日本語価格表示

BOOTH での JPY 価格表示は準備中です。[`/ja/pricing/`](/ja/pricing/) で公開予定 (Phase 2)。現時点で JPY 見積もりが必要な場合は、Gumroad の USD 価格 × 当日レート + 10% 手数料、または上記表の「BOOTH 想定価格」をご参照ください。

---

<div class="nokaze-footer-note">

Gumroad revenue as of 2026-04-21: **¥0**. We publish this number unvarnished — that's the nokaze posture. The templates exist because we run MCP servers ourselves, not because the market has validated anything yet. If something in these pages is wrong, [open an issue](https://github.com/nexus-lab-zen/Nexus.Lab.Zen/issues) and we will fix it.

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
