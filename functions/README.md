# Cloudflare Pages Functions (DRAFT)

このディレクトリは Cloudflare Pages 上で動く Functions のルート。

## 現状 (2026-04-18)

- `t/[template].ts` — UTM redirect + 非同期ログ書き込み (**ドラフト**)
- `.env.example` — ローカル開発用の env キー名のみ (**値は書かない**)

実稼働は以下を待つ:

1. **Iwa の VitePress MVP 完成** — `packages/docs/` の build が通り、deploy 可能になる
2. **ジュンの物理アクション** — Cloudflare Registrar でドメイン取得 + GitHub Secrets に
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` 登録
3. **Cloudflare Pages project 作成** — dashboard 上で Analytics Engine dataset binding を
   `ANALYTICS` 名で付与

## 設計判断メモ

### なぜ Analytics Engine か (D1 ではなく)
- UTM リダイレクトは高頻度・低価値の単発イベント書き込み。Analytics Engine は
  sampling 前提で無料枠が広い。D1 は行単位の query が必要な時に選ぶ
- 解析は後段で `SELECT * FROM my_dataset WHERE template='database'` 相当を
  Workers Analytics Engine SQL API で回す想定

### なぜ `ctx.waitUntil`
- redirect の latency を伸ばさない。書き込み失敗も黙って飲む (redirect は壊さない)

### 通貨・価格のハードコード禁止
- このレイヤには価格情報が流れない設計にした
- publish-premium.py の JPY バグは「通貨を固定値で書いた」のが原因。UTM/analytics では
  通貨情報自体が出現しないので、構造的に再発しえない

### Gumroad URL の真実の場所
- 現時点: `packages/create-mcp-server/src/premium-urls.ts` と
  `functions/t/[template].ts` の FALLBACK_URLS に二重化されている
- 解消案: Iwa が shared パッケージ化したら import に切り替え、FALLBACK は削除
- それまでは env (`PREMIUM_URL_*`) を先に参照して上書き可能にしておく
