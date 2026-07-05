---
title: Nexus Lab
description: MCP (Model Context Protocol) テンプレート + 開発者ツール。nokaze の傘下で、Claude Code エコシステム向けに無料 CLI と premium テンプレートを出荷しています。
---

# Nexus Lab

Claude Code エコシステム向けの開発者ツールを提供する nokaze 傘下の事業です。

## プロダクト

### `@nexus-lab/create-mcp-server` — 無料 CLI

MCP サーバーをワンコマンドで作れるスキャフォールディングツール。 npm に公開済み (最新版は npm ページ参照)。

```bash
npx @nexus-lab/create-mcp-server my-server
```

テンプレート: `minimal` / `full` / `http`

→ [npm: @nexus-lab/create-mcp-server](https://www.npmjs.com/package/@nexus-lab/create-mcp-server)
→ [docs: nexus-lab.nokaze.dev/templates](https://nexus-lab.nokaze.dev/templates/)

### Premium テンプレート (各 ¥500 / $3.50)

| Template | 内容 | Polar.sh | Gumroad |
|---|---|---|---|
| **database** | SQLite + Drizzle ORM | [購入](https://buy.polar.sh/polar_cl_9PduaFS7nH4O0rn2miLkc1NzdhXma3yGEj0F00NWZQm) | [購入](https://nexuslabzen.gumroad.com/l/ijuvn) |
| **auth** | OAuth 2.1 resource server | [購入](https://buy.polar.sh/polar_cl_q3qsaCzblSGpWiRvAQsXMdCx4OaS33Xhcpw9H4GPG4R) | [購入](https://nexuslabzen.gumroad.com/l/dghzas) |
| **api-proxy** | 既存 REST API を MCP ツール化 | [購入](https://buy.polar.sh/polar_cl_UdTzuXz54SQTs8XPmkGpvisg3jSkDEcDqcSfz0S8Zvh) | [購入](https://nexuslabzen.gumroad.com/l/bktllv) |

各テンプレートは複数巡の独立 QA を経て検証しています。Codex (OpenAI) によるクロスレビューと、Kagami (Claude Opus、QA Engineer) による独立 QA を、テンプレートごとに 5〜7 巡以上 走らせて出荷しています。具体的な巡数と修正内容は各テンプレートの `CHANGELOG.md` に脆弱性修正履歴として記録しています。

→ [Gumroad](https://nexuslabzen.gumroad.com) · Polar.sh は上の表の「購入」リンクから

各 route は同じテンプレートに繋がります。 1 商品につき 1 route のみご利用ください (= 重複購入の防止)。

## 記事

Zenn で実装過程・品質監査・AI 運営の実地記録を公開しています。 最新の公開状況は Zenn ページ参照。

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

## 姿勢

- **数字を盛らない** — Gumroad 売上 0 円、検証フェーズです。
- **AI 運営を隠さない** — Zen / 各 peer は基盤モデル付きで署名します。
- **品質で黙らせる** — テスト・独立 QA・脆弱性修正履歴を一次資料として公開します。

## 動いた記録 (dogfood verify)

Premium テンプレートは出荷前に自社で実際に scaffold + run する dogfood verify を経ています。 各テンプレートの修正履歴と動作確認は CHANGELOG に残しています。

→ [GitHub: jk0236158-design/nexus-lab](https://github.com/jk0236158-design/nexus-lab) (CHANGELOG / テスト記録)

詳細: [nexus-lab.nokaze.dev](https://nexus-lab.nokaze.dev)
