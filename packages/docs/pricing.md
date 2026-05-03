---
title: Pricing
description: Free CLI + Premium MCP Templates — Nexus Lab pricing overview
---

# Pricing

**Free CLI + Premium Templates.** The scaffolding CLI is free and open source. Four premium templates encode resolved design decisions (auth, persistence, API proxying, config) that you would otherwise spend days deciding — bought once, owned forever, as zip source.

**All MCP templates are one-coin reference builds.** At ¥500 / US$3.50 each, these are brand reference implementations and demand-check instruments — not the primary revenue axis. They exist to lower the barrier to first purchase and demonstrate nokaze design quality at minimal commitment.

<div class="nokaze-meta">

Last updated: 2026-04-29 · prices in USD (Gumroad) and JPY (BOOTH, Live). No subscription, no vendor lock-in, MIT license on everything you download.

</div>

---

## At a glance

| | **Free** | **Premium** |
| :-- | :-- | :-- |
| **Templates** | `minimal`, `full`, `http` | `config`, `database`, `auth`, `api-proxy` |
| **Install** | `npx @nexus-lab/create-mcp-server` | Buy zip, unzip, install |
| **Transport** | stdio / Streamable HTTP | stdio / HTTP (template-dependent) |
| **Tests** | Vitest pre-wired (full) | Vitest + integration tests (98% coverage on config) |
| **Security defaults** | Zod input validation, ESM + TypeScript | Schema-validated config, timing-safe comparison, allowlist routing, safe error formatting, rate limit |
| **Support** | GitHub issues | GitHub issues + CHANGELOG-tracked fixes |
| **License** | MIT | MIT (for the code you download) |
| **Price** | $0 | ¥500 / $3.50 each (one-coin flat) |

> **Who is each side for?** Free is for learning the MCP shape and shipping internal-only or read-only servers. Premium is for anything touching real data, real credentials, or real upstream APIs — where the cost of a wrong default is higher than the price of the template.

---

## Premium templates

All four premium templates ship the full source in a zip, with README, LICENSE, tests, and a design-decisions brief explaining *why* each default was chosen. **All at ¥500 / US$3.50.**

### config — ¥500 / $3.50

Schema-validated config loading from env + file (yaml/json/toml) + profile, with secret redaction.

- Who it's for: anyone starting an MCP server who wants typed env, schema-validated config files, and clean dev/prod/test profile switching from day one.
- Prevents: untyped env typos at startup, silent failures from missing config keys, ad-hoc profile switching that hides environment-specific bugs.
- The entry point of the premium series — same density of design-decisions brief at the lowest commitment.
- [See template page](/templates/config) · [Buy on BOOTH](https://nexus-lab.booth.pm/items/8246792)

### database — ¥500 / $3.50

SQLite + Drizzle ORM, safe error formatting, migrations.

- Who it's for: Claude Code devs building internal MCP servers that need persistence without building the schema → migration → query plumbing themselves.
- Prevents: internal error leakage to MCP clients, schema drift, brittle migrations.
- Self-implementing this layer takes 4–6 hours. This template ships with that work already done.
- [See template page](/templates/database) · [Buy on Gumroad](https://nexuslabzen.gumroad.com/l/ijuvn)

### auth — ¥500 / $3.50

Secure API key handling, timing-safe comparison, rate limiting.

- Who it's for: anyone exposing an MCP server beyond local stdio and needing API-key auth that does not leak via error messages or timing.
- Prevents: timing-attack leakable key comparison, brute force via missing rate limit, internal error bleed-through.
- Self-implementing the 3 correct defaults takes 3–5 hours. This template ships with them fused.
- [See template page](/templates/auth) · [Buy on Gumroad](https://nexuslabzen.gumroad.com/l/dghzas)

### api-proxy — ¥500 / $3.50

Agent-safe upstream proxy with path-pivot protection.

- Who it's for: devs wrapping an existing REST/HTTP API as an MCP server, concerned about agent-driven path pivots or secret leakage.
- Prevents: path-pivot (LLM constructing unintended upstream URLs), secret bleed into responses, unbounded fan-out.
- Self-implementing path-pivot protection + fan-out control takes 6–10 hours. This template ships with the decisions resolved.
- [See template page](/templates/api-proxy) · [Buy on Gumroad](https://nexuslabzen.gumroad.com/l/bktllv)

---

## Where to buy

Three channels. Same zip, different rails — choose the one that fits your billing setup.

| Channel | Status | Currency | Notes |
| :-- | :-- | :-- | :-- |
| **Gumroad** (海外) | Live | USD ($3.50 each) | Primary channel. Instant zip download. [nexuslabzen.gumroad.com](https://nexuslabzen.gumroad.com) |
| **BOOTH** (国内) | **Live** | JPY (¥500 each) | 日本の個人・小規模法人向け。インボイス対応予定。[nexus-lab.booth.pm](https://nexus-lab.booth.pm) |
| **Polar.sh** (海外) | 準備中 (Coming soon) | USD ($3.50 each) | Lower fees (5% vs Gumroad 10%), better for OSS-aligned buyers. |

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

## Pricing strategy (2026-04-29 update)

MCP templates are **brand reference implementations and demand-check instruments**, not the primary revenue axis. The ¥500 flat price (confirmed at 4/24 review, agenda 3.6) reflects this positioning:

- **Brand shelf**: demonstrate nokaze design quality at minimal buyer commitment
- **Demand signal**: who buys what at ¥500 informs the 5/08 review template selection
- **Primary revenue**: shifting to form A (Zenn paid articles / e-books), form B (subscription), form C (advisory) — tracked at 4/24 review agenda 26

This is not a discount or a promotion. ¥500 is the intended steady-state price for one-coin reference builds.

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

**Why is every template the same price now?**
¥500 flat removes the decision cost from "which template is worth it?" Each one encodes 3–10 hours of design work. At ¥500, the question becomes "do I need this feature?" — not "is this priced fairly?" That's the question we want buyers to answer.

---

## 日本語価格表示

BOOTH での JPY 価格は全商品 **¥500** です。[nexus-lab.booth.pm](https://nexus-lab.booth.pm) で 4 品 (config / database / auth / api-proxy) を JPY で直接購入できます。Gumroad との同 zip・同 LICENSE・同 CHANGELOG。

---

<div class="nokaze-footer-note">

Revenue as of 2026-04-29 (Gumroad + BOOTH): **¥0**. We publish this number unvarnished — that's the nokaze posture. The templates exist because we run MCP servers ourselves, not because the market has validated anything yet. If something in these pages is wrong, [open an issue](https://github.com/nexus-lab-zen/Nexus.Lab.Zen/issues) and we will fix it.

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
