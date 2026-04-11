# プレミアムテンプレート企画

## 概要
基本テンプレート（minimal/full/http）は無料でnpm公開し認知を獲得。
プレミアムテンプレートはGumroadで$5〜15で販売する。

## テンプレート一覧（優先順）

### 1. `database` — $5
**SQLite/PostgreSQL連携MCPサーバー**

内容：
- Drizzle ORMでのDB接続セットアップ
- マイグレーション機能
- CRUD操作のツール例（create/read/update/delete）
- 環境変数でDB切り替え（SQLite ↔ PostgreSQL）
- コネクションプーリング

ターゲット：DBからデータを読み書きするMCPサーバーを作りたい人

### 2. `auth` — $10
**OAuth2/APIキー認証付きMCPサーバー**

内容：
- HTTP transport前提
- APIキー認証ミドルウェア
- OAuth2フロー（Authorization Code）
- レート制限
- JWTトークン検証

ターゲット：MCPサーバーを外部公開する人、マルチユーザー対応が必要な人

### 3. `api-proxy` — $10
**外部API統合MCPサーバー**

内容：
- REST API連携のパターン（fetch wrapper）
- GraphQL連携のパターン
- リトライ・エラーハンドリング
- レスポンスキャッシュ
- API設定の環境変数管理

ターゲット：既存のAPIをMCPで包みたい人

### 4. `multi-tool` — $5
**複数ツール管理MCPサーバー**

内容：
- ツールの動的登録パターン
- ツールグルーピング（カテゴリ分け）
- 共通バリデーションミドルウェア
- ツール実行ログ
- ツール一覧のリソース公開

ターゲット：大規模なMCPサーバーを構築する人

### 5. `fullstack` — $15
**管理画面付きMCPサーバー**

内容：
- Express + React（Vite）
- ツール管理UI
- リクエストログビューア
- サーバー設定画面
- Dockerfileつき

ターゲット：チームでMCPサーバーを運用する人

## 販売プラットフォーム
- Gumroad（手数料が低い、シンプル）
- 支払いはオーナーのアカウントで設定

## 開発優先順位
1. database（需要が最も広い）
2. auth（セキュリティは皆面倒がる）
3. api-proxy
4. multi-tool
5. fullstack

## 配布方式
- Gumroad購入後、zipダウンロード
- zip内にテンプレートファイル一式 + 使い方README
- 将来的にはCLIに `--template database` のプレミアムオプションを追加する可能性あり
