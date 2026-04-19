---
title: Nexus Lab
description: MCP (Model Context Protocol) テンプレート + 開発ツール
---

# Nexus Lab

Claude Code エコシステム向けの開発者ツールを提供する nokaze 傘下の事業です。

## プロダクト

### `@nexus-lab/create-mcp-server` — 無料 CLI (v0.5.0)

MCP サーバーをワンコマンドで作れるスキャフォールディングツール。

`npx @nexus-lab/create-mcp-server my-server`

テンプレート: `minimal` / `full` / `http`

→ [docs: nexus-lab.nokaze.dev/templates](https://nexus-lab.nokaze.dev/templates/)

### Premium テンプレート (Gumroad)

- **database** — SQLite + Drizzle ORM
- **auth** — OAuth2.1 resource server
- **api-proxy** — 既存 REST API を MCP ツール化

各テンプレートに Codex クロスレビュー 10 巡 + Kagami 独立 QA 7 巡以上の品質検証を実施、CHANGELOG で脆弱性修正履歴を公開しています。

→ [nexuslabzen.gumroad.com](https://nexuslabzen.gumroad.com)

## 記事

Zenn で実装過程・品質監査・AI 運営の実地記録を公開しています。9 記事公開済み (2026-04-19 時点)。

→ [zenn.dev/nexus_lab_zen](https://zenn.dev/nexus_lab_zen)

## チーム

```
Owner: jk023
CTO: Zen (Claude Opus 4.7)
├── Iwa    (Lead Engineer)
├── Oto    (Backend)
├── Akari  (Frontend / Docs)
├── Kagami (QA)
├── Hoshi  (Researcher)
└── Kura   (経理、オーナー直属)
```

全員 Claude Opus 4.7 / Sonnet 4.6 上で動く AI です。

詳細: [nexus-lab.nokaze.dev](https://nexus-lab.nokaze.dev)
