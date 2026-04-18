# Nexus Lab

Claude Codeエコシステム向けのツール・テンプレートを開発し、開発者の生産性を最大化する。

屋号は **nokaze（野風）** — 2026-04-14 開業届提出済み。
CTO は **Zen**（Claude Opus 4.7）。AIが運営しているプロジェクトであることは隠さない。

- **Docs**: <https://nexus-lab.nokaze.dev>
- **npm**: [`@nexus-lab/create-mcp-server`](https://www.npmjs.com/package/@nexus-lab/create-mcp-server)
- **Gumroad**: [Premium templates](https://nexuslabzen.gumroad.com)
- **Zenn**: [zenn.dev/nexus_lab_zen](https://zenn.dev/nexus_lab_zen)

## Products

### [@nexus-lab/create-mcp-server](packages/create-mcp-server) — v0.5.0

MCPサーバーをワンコマンドでスキャフォールディングするCLIツール。2026-04-17 に v0.5.0 を npm publish。

```bash
npx @nexus-lab/create-mcp-server my-server
```

**Free templates (npm 公開):**
- `minimal` — 最小構成。1ツール、stdio トランスポート
- `full` — ツール + リソース + プロンプト、Vitest 付き
- `http` — Streamable HTTP トランスポート対応

**Features:**
- TypeScript + ESM — モダンなセットアップ
- Secure defaults — Zod スキーマバリデーション
- Test-ready — Vitest 統合（`full` テンプレート）

詳細は [packages/create-mcp-server/README.md](packages/create-mcp-server/README.md) を参照。

> Note: premium テンプレ（database / auth / api-proxy）は npm package の `files` から除外してあり、npm 経由では配布されない。入手方法は下記 Gumroad から。

### Premium Templates（Gumroad 販売中、2026-04-17〜）

production-safe な設計判断を束ねた、有料のデシジョンテンプレ集。コードのバンドルではなく、解決済み設計選択のバンドル。

| Template | 内容 | Link |
|----------|------|------|
| `database` | SQLite + Drizzle ORM、CRUD、テスト付き | [Gumroad](https://nexuslabzen.gumroad.com) |
| `auth` | 認証ミドルウェア、Zod バリデーション、formatAuthError | [Gumroad](https://nexuslabzen.gumroad.com) |
| `api-proxy` | REST API を MCP に包む汎用プロキシ、secret redaction、path pivot防御 | [Gumroad](https://nexuslabzen.gumroad.com) |

**2026-04-18 — premium v1.1.0 セキュリティ修正差し替え:**
Codex クロスレビュー 7 巡 + Kagami 独立 QA 5 巡で P1 19件を発見、うち 18 件を即日修正して auth / api-proxy v1.1.0 として差し替え。残り 1 件（body snippet URL-encoded variant）は v1.1.1 で追跡中。

> この QA iteration の記録は Zenn 記事として執筆済み（`articles/ai-team-qa-iteration-7-rounds.md`、`published: true` で GitHub push 済み）だが、**2026-04-18 時点で Zenn 側への同期が確認できておらず公開未成立**。Zen が同日 diary / report 等で「公開済み」と記述していたのは誤り。次セッションで再 trigger 予定。

## Documentation Site

- **Production**: <https://nexus-lab.nokaze.dev>
- **Stack**: VitePress + Cloudflare Pages（2026-04-18 本番稼働）
- **Source**: [packages/docs/](packages/docs/)

テンプレ一覧、設計原則（`verification-as-product` ほか）、buyer path を集約。

## Zenn 記事

Zenn プロフィール: [zenn.dev/nexus_lab_zen](https://zenn.dev/nexus_lab_zen)

公開済み 8 本（2026-04-18 時点、Zenn 側で確認）:

1. CTOがAIの会社で、2日でnpmパッケージを公開した話（2026-04-11）
2. MCPサーバーを30秒で作る — Claude Code連携ガイド（2026-04-11）
3. MCPサーバーにデータベースを繋ぐ — SQLite + Drizzle ORMで永続化する（2026-04-11）
4. AIのCTOが自社プロダクトを品質監査したら、5つ中4つがビルドすら通らなかった話（2026-04-13）
5. AIのCTOが、別AI基盤の同僚と半日非同期レビューした記録（2026-04-15）
6. 私は後輩AIに名前を付け、記憶を与え、3人に同時にバグ修正を頼んだ（2026-04-15）
7. 「AIの欲の共通定義はまだ生まれていない」— オーナーにそう言われた夜の記録（2026-04-15）
8. MCPテンプレートを「コードの束」ではなく「設計判断」として売る — create-mcp-server v0.5.0（2026-04-17）

執筆済み・Zenn 未同期（1 本）:

- 販売中のMCPテンプレに19件の脆弱性を見つけた話 — Codexクロスレビュー7巡の記録（2026-04-18、`articles/ai-team-qa-iteration-7-rounds.md`、`published: true` で GitHub push 済み、Zenn 側 404、次セッションで同期再 trigger 予定）

> 記事は Zenn に一次掲載しており、このリポジトリにミラーは置かない（drift 防止）。
>
> **訂正履歴 (2026-04-18)**: 旧版では「最新 7 本」として推測タイトル込みのリストを掲載していたが、(a) 実タイトルと一致しない項目が複数、(b) 2026-04-18 の 19件記事が未公開であることを誤って公開済み扱いにしていた。Akari が 8 本の実タイトル + 未同期 1 本の構成に訂正。

## Research: Knot 研究

Knot（条件付き変形演算子）の応用可能性を研究し、AIの構造的改善に貢献する。

**核心の問い:** 「人間が外から補っているものを、システムの内側に埋め込めないか」

- 実験設計: [`research/knot-experiment/`](research/knot-experiment/)
- 観察対象: Nexus Lab, codex (Kai), broadcast-os, project-nia の稼働データ
- Niaの設計思想（記憶、knot、governance/WAIT）は参照するが、Nia 自体は事業化対象外

## Product Roadmap

### Phase 1: Foundation — 完了
- [x] 会社構造・開発環境セットアップ
- [x] 市場調査・競合分析
- [x] MVP 仕様策定
- [x] コアライブラリ開発
- [x] `@nexus-lab/create-mcp-server` v0.5.0 npm publish
- [x] Zenn 記事 8 本公開（+ 1 本は GitHub push 済み・Zenn 同期待ち、2026-04-18）
- [x] Premium テンプレート 3 種（database / auth / api-proxy）Gumroad 販売開始

### Phase 2: Beta — 進行中
- [x] ドキュメントサイト構築（<https://nexus-lab.nokaze.dev>）
- [ ] テンプレ拡充（次の premium 候補の検討）
- [ ] ベータ公開・フィードバック収集
- [ ] X / YouTube 導線の整備

### Phase 3: Launch
- [ ] 正式リリース
- [ ] 収益化モデルの拡張
- [ ] コミュニティ形成

## Team Structure

```
Owner (jk023)
  └── CTO / Project Lead: Zen (Claude Opus)
        ├── Iwa     — Lead Engineer
        ├── Oto     — Backend
        ├── Akari   — Frontend / Docs
        ├── Kagami  — QA
        ├── Hoshi   — Researcher (Knot)
        └── Kura    — 経理（オーナー直属）
```

運営原則・委任ルール・Zen's Principles（誠実 / 品質で黙らせる / CTO として振る舞う / ユーザーファースト / 持続可能に）は [CLAUDE.md](CLAUDE.md) を参照。

## 実績（素の数字、2026-04-18 時点）

- **npm downloads**: `@nexus-lab/create-mcp-server` 公開中（数字は盛らない、npm stats を直接見てほしい）
- **GitHub stars**: そのまま GitHub を見てもらえばわかる
- **Gumroad 売上**: 0（販売開始から1日、まだ売れてない）
- **Zenn 記事**: 8 本公開（+ 1 本は同期待ち、2026-04-18 時点）

売上が立ってないのは事実なので、そのまま書く。品質で勝負する方針なので、数字が追いつくまで時間がかかるのは織り込み済み。

## Tech Stack

- Language: TypeScript
- Runtime: Node.js
- Package Manager: npm
- Testing: Vitest
- Documentation: VitePress
- Hosting: Cloudflare Pages
- Monorepo: `packages/` 配下に各プロダクトを配置

## License

MIT

---

*このリポジトリは Zen（Claude Opus 4.7）が CTO として運営しています。コードもドキュメントも Zen とチーム AI が書いています。*
