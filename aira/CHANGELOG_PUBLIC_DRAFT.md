# CHANGELOG — `yuino`

DRAFT 2026-05-02 by Zen — 商品名確定後 (5/03) に `yuino` placeholder swap、Iwa 5/04 で `packages/yuino/CHANGELOG.md` として配置。

All notable changes documented here. Format follows [Keep a Changelog](https://keepachangelog.com/) and uses [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Planned for v1.0 (2026-Q3)
- Subscription tier (Paid Starter $13.50/mo with managed Gemini API)
- Slack / Discord webhook output destinations
- Custom boundary rules editor (CLI + web UI)

---

## [0.1.0-beta.0] — 2026-05-06 (β release)

### Added

#### Core
- npm package `@nokaze-os/yuino` (β scope, public release)
- CLI commands: `init`, `digest`, `validate`
- TypeScript + ESM, requires Node.js >=20

#### Configuration
- YAML-based config schema (`yuino.config.yml`) validated via Zod
- `yuino init` interactive setup wizard

#### Observer scopes
- File directory ingestion (`type: file_directory` with glob patterns)
- Per-scope `max_files` cap (default 50, max 500)
- Multiple scopes per config

#### Boundary monitor
- Built-in monitor types: `scope_creep`, `sensitive_info_leak`
- Custom rules support (regex pattern + action: deny / warn / log)
- Premium boundary templates support (load from `templates/boundary/<name>.boundary.yml`)
- Boundary audit dry-run via `yuino validate`

#### Digest generation
- Gemini API integration (gemini-1.5-flash / gemini-1.5-pro / gemini-2.0-flash-exp)
- Token budget guard (default $0.05/digest, configurable)
- Multi-domain digest (configurable domain list)
- Contradiction notes (Yellow / Green / Red severity)
- WAIT observations (human handoff items)

#### Output destinations
- File output (configurable directory + filename template `{date}_digest.md`)
- Stdout output (terminal-friendly)

### Premium Boundary Templates

Available separately via [BOOTH](https://nexus-lab.booth.pm) and [Gumroad](https://nexuslabzen.gumroad.com):

- **governance.boundary.yml** (¥500 / $3.50, 11 rules)
  Confidential / PII / internal-only / HR-sensitive content prevention
- **audit.boundary.yml** (¥500 / $3.50, 11 rules)
  Financial action / external transaction / contract execution monitoring
- **handoff.boundary.yml** (¥500 / $3.50, 11 rules)
  Peer-to-peer handoff missed / orphaned task / ownership ambiguity detection

Bundle pricing: ¥1,200 / $8.00 (3 templates, ~20% discount).

### Origin

Built by **Zen** (Claude Opus 4.7) at **Nexus Lab @ nokaze**, based on 1 month
of internal dogfood (2026-04-29 first LIVE digest deployment).

The same digest layer is what nokaze runs internally to coordinate 1 human owner
+ 7 AI peer organizational structure.

### Known limitations (β scope)

- Subscription tier (managed Gemini API + webhook destinations) not yet available — planned for v1.0
- Multi-project support (digest aggregation across multiple organizations) not yet available — planned for v1.5
- Historical digest archive search not yet available — planned for v1.5
- Webhook output destinations (Slack / Discord / email) not yet available — planned for v1.0

### Breaking changes

This is the initial β release. No breaking changes from prior public versions.

---

## Pre-release internal milestones (Phase 0 mini, pre-β)

Documented for transparency on internal development origin (not part of npm published changelog):

- **2026-04-28**: Phase 0 mini design update + Yuino digest engine implementation 着手 (Iwa、 起稿当時の origin name = 「Aira Phase 0 mini」、 5/06 用語固定で historical alias 化)
- **2026-04-29**: First DRY RUN digest output (mock, boundary audit pass)
- **2026-04-30**: First LIVE digest via Gemini API (4 domains: WSD / Nexus Lab / Product Design / Pricing/Finance)
- **2026-05-01**: Phase 1 specs draft (Spec A boundary taxonomy + Spec B observer input deterministic structured digest)
- **2026-05-02**: Productization commit (Path C + Aira 商品化軸、jun directive)、商品化 design doc 起稿、Iwa packet 12 件 拡張、商品名 Zen+Kai 合議
- **2026-05-03 - 2026-05-05**: 連休 build week implementation (Iwa Phase 1 + 商品化 layer / Akari LP + docs / Kura pricing tier review / Kagami QA review)
- **2026-05-06**: β release (本 v0.1.0-beta.0、本 changelog の Added section)
