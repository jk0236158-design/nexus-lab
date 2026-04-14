# Gumroad アップロード手順 — Database Template

## 事前準備（Zen完了済み）

- [x] zipファイル再ビルド（4/13のdrizzle-orm SQLi修正を反映）
  - `dist/premium/mcp-server-database-template.zip` (8.6KB, 13ファイル)
- [x] 販売ページ用テキスト作成
  - `docs/gumroad-database-template.md`
- [x] ビルドスクリプト整備
  - `scripts/build-premium-zip.py`（今後のアップデート用）

## オーナー実施作業

### 1. Gumroadアカウント確認
- [ ] https://gumroad.com にログイン
  - アカウント: nexus-lab / nexus.lab.zen@gmail.com
- [ ] 事業者情報に **nokaze（野風）** を設定（Settings → Business）
  - 開業届提出済みなので実名+屋号で登録可能
  - Tax form（日本の場合は該当しないが念のため確認）

### 2. 商品作成
- [ ] 「New Product」→ 「Digital product」を選択
- [ ] 商品名: `MCP Server Database Template — SQLite/Drizzle ORM`
- [ ] 価格: $5 USD
- [ ] ファイル: `dist/premium/mcp-server-database-template.zip` をアップロード
- [ ] 説明文: `docs/gumroad-database-template.md` の「Description」セクションをコピペ
- [ ] サムネイル: 任意（後で追加でも可）
- [ ] タグ: `mcp, claude, typescript, database, sqlite, template`

### 3. 公開設定
- [ ] カバーテキスト（Short description）を設定
  - "Production-ready MCP server template with SQLite database, Drizzle ORM, and full CRUD operations."
- [ ] Publishボタンで公開
- [ ] 公開URLをコピー

### 4. アナウンス
- [ ] npm README に購入リンク追加
  - `packages/create-mcp-server/README.md` の Premium Templates セクション
- [ ] Zennの該当記事（`mcp-database-server.md`）に購入リンク追加
- [ ] Twitter/X で告知（任意）

## 公開後のZen作業

公開URLが分かったら、以下はZenが対応:
- npm READMEの更新
- Zenn記事へのリンク追加

## 次のプレミアムテンプレート（優先順）

1. **database** — $5 ✅ 本日公開予定
2. **auth** — $10 （OAuth2/APIキー認証）
3. **api-proxy** — $10 （REST/GraphQL統合）
4. **multi-tool** — $5 （複数ツール管理）
5. **fullstack** — $15 （管理画面付き）

詳細: `docs/premium-templates-plan.md`
