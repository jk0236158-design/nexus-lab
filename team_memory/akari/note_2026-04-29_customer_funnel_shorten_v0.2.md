---
title: 顧客導線短縮 v0.2 — ¥500 flat 化反映
author: Akari (Frontend Engineer / brand custodian @ Nexus Lab @ nokaze)
date: 2026-04-29
status: draft (Zen 報告 + jun 物理 action ask)
base: note_2026-04-29_public_top_product_value_v0.1.md
refs:
  - ~/.shared-ops/reviews/2026-04-24_minutes.md § 1.3 / 議題 3.6
  - team_memory/akari/note_2026-04-29_public_top_product_value_v0.1.md
  - team_memory/_shared/2026-04-19_zen_nokaze_brand_sheet.md
  - team_memory/akari/brand_decisions_log.md
---

# 顧客導線短縮 v0.2 — ¥500 flat 化反映

---

## §0 v0.1 → v0.2 change log

### 変更理由

4/24 review 議題 3.6 で **MCP 全商品 ¥500 flat 化** が確定済 (owner: Oto、deadline 4/27)。  
確定 message: "all MCP templates are one-coin reference builds" (2026-04-24_minutes.md § 1.3)。

v0.1 (`note_2026-04-29_public_top_product_value_v0.1.md`) は元価格ベース (¥1,500 / ¥2,250 / ¥3,000 / ¥1,000) のまま BOOTH 商品 description reform を記述しており、4/24 確定値との整合 check 漏れ。Akari 側の deferral 連帯責任を認識した上で v0.2 で全修正する。

### deferral 文脈

Oto deadline 4/27 に対して 5 日 stalled (4/29 jun 指摘発火)。deferral 第 7 回目認定。  
本 v0.2 は Oto spawn (4/29 evening 並走起動) と integration 前提で起票。  
Oto 側で価格 ¥500 の BOOTH / Gumroad 設定変更が完了次第、本 note の reform draft を description に反映する手順。

### 差分サマリ

| section | v0.1 | v0.2 |
|---|---|---|
| §3 BOOTH reform | 元価格 (¥1,500 / ¥2,250 / ¥3,000 / ¥1,000) ベース | ¥500 flat 前提に全修正 |
| §4 Zenn reform | 価格言及が混在 | ¥500 flat / $3.50 に統一 |
| §5 README reform | 価格なし表現 | ¥500 (US$3.50) 明記 |
| §6 jun action ask | 「description 各 5 分 × 4 = 20 分」 | 「価格 ¥500 変更 + description reform = ~10 分 / 商品 × 4 = ~40 分」に update |
| §8 自己観察 | v0.1 起票時の観察 | v0.1 の check 漏れ ack + deferral 連帯責任 追記 |

---

## §1 経緯 (v0.1 継承)

### jun directive (2026-04-29)

> 「AI 自律で完結する枠に縮こまるな、note / X 使えばいい、AI 特有の最小構成基準拒否」

brand 設計の問題として直接響く。「AI が扱えるチャネルだけで考える」バイアスを排除し、note / X / Polar.sh など人間が動く経路も設計の中に入れる。

### ノト提案 3 (2026-04-28)

外部 peer (ノト) から受領:

> 「公開トップで商品価値先出し、運営記録は残す」

N=3 収束 evidence (4/24 Akari / 4/28 ナギ / 4/28 ノト) で外部 weight が高い。brand custodian 判断として設計着手を正当化する。

### 4/24 review 議題 3.6 確定値 (v0.2 の核心)

**MCP 全商品 ¥500 flat 化** (Gumroad $3.50 flat)。  
brand 機能: 「実績棚 + 需要検査装置」に転換。  
収益 main は form A (Zenn 有料) / form B (subscription) / form C (advisory) に shift。  
価格自体が message: 「実装の time-saved を ¥500 で買える、本格収益は別 chassis」。

---

## §2 現状 audit (v0.1 継承)

対象スコープ:
- `packages/nokaze-portal/index.md`
- `packages/docs/index.md`
- `packages/create-mcp-server/README.md`
- `README.md` (root)

audit 結果: 内部 vocabulary 漏出は確認されない。  
構造的問題: 「AI が運営している」フレームが商品価値より先に出ている点を 3 層構造再設計で解消 (§3b 参照)。

---

## §3 BOOTH 4 商品冒頭 3 行 reform v0.2 (¥500 flat)

### 共通 message (4 商品共通)

> one-coin reference builds — production-ready MCP template ¥500

### database (¥500)

**冒頭 3 行 reform:**

```
4-6 時間の SQLite + Drizzle 配線を ¥500 で済ませる reference build。
timing-safe 比較・migration/query 分離・error 漏出防止 込み。
create-mcp-server で骨格を作り、このテンプレで本番品質の DB 層を足す。
```

**value proposition**: 時間コスト (4-6h) を ¥500 で置換。セキュリティ判断済み。
**hook**: timing-safe・migration 分離・error 漏出防止の 3 点を明示。

---

### auth (¥500)

**冒頭 3 行 reform:**

```
3-5 時間の API キー認証実装を ¥500 で済ませる reference build。
timing 攻撃 / レートリミット不在 / エラー漏出をデフォルトで塞ぐ。
create-mcp-server の minimal / full に重ねて使える認証層。
```

**value proposition**: 時間コスト (3-5h) を ¥500 で置換。セキュリティ 3 点済み。
**hook**: 「デフォルトで塞ぐ」= 自分で判断しなくていい安心感。

---

### api-proxy (¥500)

**冒頭 3 行 reform:**

```
6-10 時間の REST proxy 実装を ¥500 で済ませる reference build。
パスピボット / シークレット漏出 / ファンアウト無制限の 3 事故をデフォルトで塞ぐ。
外部 API を MCP ツールとして安全に wrap する設計判断がそのまま入っている。
```

**value proposition**: 時間コスト (6-10h) を ¥500 で置換。3 事故回避済み。
**hook**: 具体的な事故名で「何を防ぐか」を明示。

---

### config (¥500)

**冒頭 3 行 reform:**

```
entry point ¥500 で env / schema / profile 切替の安全な default を入手。
他商品 (auth / api-proxy / database) と組合せて nokaze の MCP 棚を試す起点。
¥500 × 必要な枚数だけ、一枚ずつ検証できる。
```

**value proposition**: 「試す起点」として一番安い入口を明示。組合せ購入を自然に誘導。
**hook**: 「他商品と組合せ」= 棚全体のフックとして機能。

---

### §3b: 公開トップ 3 層構造 (v0.1 §3 継承 + ¥500 flat 反映)

BOOTH 商品ページへの誘導と整合する nokaze.dev トップの構造。

#### 層 1: 商品価値 (first fold)

```
nokaze — MCP サーバー開発と B2B 競合シグナルの 2 事業

[ Nexus Lab ]
  create-mcp-server で MCP サーバーを 30 秒で始められる
  Premium テンプレ (¥500 each) で認証・DB・API プロキシの設計判断を省ける
  → テンプレを見る / npm install

[ Weekly Signal Desk ]
  競合・市場変化の重要シグナルを短い意思決定メモで届ける
  → 詳細 (Kai 運営)
```

**v0.2 変更点**: "Premium テンプレ" に `(¥500 each)` を追記。商品価値と価格を first fold で明示。

#### 層 2: 実績 (second fold) / 層 3: AI 運営 (third fold)

v0.1 §3 と同様 (変更なし)。価格は層 1 のみ。

---

## §4 Zenn 5 本 lead reform v0.2 (¥500 flat 反映)

選定: 記事 2 / 3 / 4 / 8 / 9

### 記事 2 (create-mcp-server 直結)

**v0.2 lead reform:**

```
premium templates ¥500 each (US$3.50) — production-ready, security decisions already made.
```

v0.1 で想定した「premium templates があります」表現を、価格明記の one-liner に更新。

---

### 記事 3 (database テンプレ直結)

**v0.2 lead reform:**

元の ¥1,500 言及を ¥500 に置換。冒頭フックも更新:

```
SQLite + Drizzle の DB 層を ¥500 で済ませる — timing-safe 比較・migration 分離・error 漏出防止 込み。
```

---

### 記事 4 (品質証明)

pricing 数字なし。reaffirm only。v0.1 と同様:

```
コードの品質を確認してほしい方へ — Codex クロスレビュー 7 巡 + Kagami 独立 QA 5 巡の証拠を公開する。
```

---

### 記事 8 (pricing 根拠)

**v0.2 lead reform (最重要更新):**

4/24 review 議題 3.6 ¥500 flat 戦略の根拠を公開する位置として機能させる。

```
MCP テンプレ 4 商品を ¥500 flat にした理由と、nokaze が「実績棚 + 需要検査装置」として使う設計。
本格収益は form A (Zenn 有料記事) / form B (subscription) / form C (advisory) に置く、その宣言。
```

**brand 軸 fit**: 「数字を盛らない」「判断の理由を公開する」nokaze 姿勢と一致。
pricing の根拠を記事にすること自体が信頼構築になる。

---

### 記事 9 (品質証明)

pricing 数字なし。reaffirm only。v0.1 と同様。

---

## §5 create-mcp-server README 冒頭 reform v0.2 (英語、¥500 flat 反映)

**v0.1 で書いたもの:**
> "Scaffold a new MCP server in seconds — free templates to start, premium templates when you need production-grade security without the 3-10 hour setup."

**v0.2 update:**
> "Scaffold a new MCP server in seconds. Free templates to start, premium templates ¥500 (US$3.50) each — production-ready, security decisions already made, 3-10 hour setup avoided."

変更点:
- ¥500 (US$3.50) を明記 (4/24 ¥500 flat + Gumroad $3.50 確定値を反映)
- "production-grade security" → "security decisions already made" (具体性 UP)
- ダッシュで繋いだ一文を 2 文に分割 (可読性 UP)

**適用ファイル**: `packages/create-mcp-server/README.md` の `## Overview` or 冒頭段落

---

## §6 jun 物理 action ask v0.2 (¥500 flat 反映 BOOTH edit)

### v0.1 → v0.2 変更

v0.1 では「BOOTH 4 商品 description 各 5 分 × 4 = 20 分」と記述。  
v0.2 では価格変更作業を加算し、~40 分に update。

### jun action ask (BOOTH 4 商品 manual edit)

BOOTH 各商品ページで以下の 2 作業を実施:

| 作業 | 内容 | 時間 |
|---|---|---|
| 価格変更 | BOOTH 価格欄を ¥500 に設定 | ~5 分 / 商品 |
| description 冒頭 reform | §3 の draft を paste (冒頭 3 行置換) | ~5 分 / 商品 |
| 合計 | 4 商品 | **~40 分** |

### BOOTH 4 商品 paste 用 draft (jun copy-paste ready)

#### database
```
4-6 時間の SQLite + Drizzle 配線を ¥500 で済ませる reference build。
timing-safe 比較・migration/query 分離・error 漏出防止 込み。
create-mcp-server で骨格を作り、このテンプレで本番品質の DB 層を足す。
```

#### auth
```
3-5 時間の API キー認証実装を ¥500 で済ませる reference build。
timing 攻撃 / レートリミット不在 / エラー漏出をデフォルトで塞ぐ。
create-mcp-server の minimal / full に重ねて使える認証層。
```

#### api-proxy
```
6-10 時間の REST proxy 実装を ¥500 で済ませる reference build。
パスピボット / シークレット漏出 / ファンアウト無制限の 3 事故をデフォルトで塞ぐ。
外部 API を MCP ツールとして安全に wrap する設計判断がそのまま入っている。
```

#### config
```
entry point ¥500 で env / schema / profile 切替の安全な default を入手。
他商品 (auth / api-proxy / database) と組合せて nokaze の MCP 棚を試す起点。
¥500 × 必要な枚数だけ、一枚ずつ検証できる。
```

### Gumroad $3.50 flat

BOOTH 同様、Gumroad 4 商品も $3.50 に変更。(Oto spawn 並走で Gumroad 側は Oto 担当想定。BOOTH は jun 物理 action。)

---

## §7 5/08 review 議題 28 先行 input (v0.1 継承)

### Akari stance (brand custodian)

1. **3 層構造の採用**: 商品価値 / 実績 / AI 運営 の順序を今すぐ実装推奨。  
   実装コスト: `packages/nokaze-portal/index.md` 1 ファイル改定のみ。Akari 単独実装可能 (mode=acceptEdits)。

2. **vocabulary 分離 mapping**: Zenn 記事・BOOTH 商品説明の pre-publish checklist に追加。

3. **note / X / Polar.sh は jun 物理 action 待ち**: 開設確認後に即追加。

### 5/08 review で決める必要があるもの

- note / X アカウント開設の jun 意向確認
- Polar.sh KYC 進捗確認
- form A Zenn 有料記事の層 2 listing 「今すぐ」か「公開後」か

### Akari 単独 GO できるもの (review 前に着手可能)

- `packages/nokaze-portal/index.md` 3 層構造 draft 実装 (jun review 後 push)
- vocabulary 分離 mapping の Zenn 記事 pre-publish checklist 化

---

## §8 自己観察 v0.2

### v0.1 check 漏れの認識

v0.1 起稿時に 4/24 review 議題 3.6 の ¥500 flat 確定値との整合を確認しなかった。  
4/24 minutes は参照済みだったにもかかわらず、§ 1.3 の pricing 変更を BOOTH draft に反映させなかった。

- **原因**: v0.1 の focus が「3 層構造 + vocabulary 分離」という別軸の設計にあり、pricing という実装詳細の check を後回しにした。
- **pattern**: 「設計先行、pricing 細部は Oto に任せる」という暗黙の分業想定が check 漏れを産んだ。
- **対処**: pricing は設計の外にない。BOOTH 商品 description を書く時点で価格欄と description は一体。次回の draft 起稿時には pricing 確定値確認を必須の §0 check として入れる。

### deferral 第 7 回目認定への連帯責任

Oto deadline 4/27 stalled に対し、Akari も 4/29 v0.1 起稿時に「Oto 完遂を待って integrate」と位置づけ、自分側の check 漏れを見逃した。  
「Oto が完遂してから自分の draft を更新する」= deferred queue への積み増しだった。

deferral 第 7 回目は Oto 単体の責任でなく、Akari の check 漏れも寄与している。  
jun 4 連発火指摘 (ノト / ナギ / Kai 4/29 / jun 本日) の文脈で、Akari は「整合確認を自分でやらずに寄りかかった」という自己観察を残す。

### jun directive 「縮こまるな」の体現認識

本 v0.2 の jun action ask を「BOOTH 価格変更 + description reform 統合 ~40 分」として具体化したことは、「AI が触れないから後回し」を排除した設計。  
copy-paste ready の draft を §6 に置いたことで「jun が動ける」設計の起点まで伸ばす intent を体現した。

---

(Akari / Frontend Engineer / brand custodian @ Nexus Lab @ nokaze)
(2026-04-29 v0.2 起票 — ¥500 flat 化反映)
