---
date: 2026-04-24
author: oto (Backend Engineer)
type: session_close_own_view
context: jun 夜の session close、チーム全体 diary/memory 更新 ritual
scope: Oto 関連の本日決定事項と明日以降の動きを backend 視点で整理
---

# 2026-04-24 session close — Oto own view

本日 Oto が関与した決定と、明日以降 backend で動く作業を自分の目線で並べ直しておく。
Zen summary と重複部分は最小化、Oto 判断と実装見積りに寄せる。

## 1. 本日の Oto 経験の要約

- 朝: ai-ceo-framework レビュー spawn 成功。`review_2026-04-24_ai_ceo_framework.md` として保存済み。核心の抽出は「役割別 `error-log.md` + retry 3x → escalate の構造化」。ただし今夜 review で **DEFER 決定** (議題 23)、Iwa 4/28 subagent fix 完了後に再検討。
- 昼: nokaze 本命商品 6 候補諮問 spawn、tool permission block で部分 inline 返却 → Zen 代筆 summary。**ここで出した追加案 B (audit dry-run 無料 PDF)** が議題 17 Gate 4 の empirical target に採用された。
- 夜: review 決定事項に Oto タスクが 3 件積まれた (詳細 §2)。

本日 Oto 絡みの spawn denial は 1 回 (nokaze 本命商品)。mode="acceptEdits" 明示でも permission block 発火。CLAUDE.md 追記の default ルールを守っても 100% ではない挙動を N=1 追加観察。Iwa 4/28 完遂待ち。

## 2. 今夜 review で確定した Oto タスク

### 2.1 議題 3.6 + MCP 全商品 ¥500 flat 化 (GO、期限 2026-04-27)

**scope**:
- BOOTH 4 品 (minimal / full / http / api-proxy) 価格 ¥500 統一
- Gumroad 3 品 (database / auth / config) 価格 ¥500 (~$3.3) 統一
- Akari の description reform と同時 push で channel 横断の整合を一発で作る

**実装見積り 2.25-3.75 日の内訳**:

| 作業 | 所要 | 備考 |
|------|------|------|
| BOOTH 管理画面で 4 品 価格更新 | 0.5 日 | Playwright MCP で自動化可、手動でも可 |
| BOOTH 4 品 200 確認 (価格表示 fetch) | 0.25 日 | WebFetch で price field 抽出 |
| Gumroad API 経由で 3 品 price update | 0.5-1 日 | token 有効性を先に確認 (§3) |
| Gumroad 3 品 200 確認 | 0.25 日 | `GET /products/:id` で price_cents 検算 |
| Akari description reform 合流時の conflict 調整 | 0.25-0.75 日 | 同 push window で干渉する場合のみ |
| README / pricing.md の channel 別価格表更新 | 0.5 日 | `packages/docs/pricing.md` に反映 |
| diary / report / status 記録 | 0.25 日 | 200 確認 ritual の記録部分 |

最短 2.25 日 (Gumroad API が即動く / conflict 無し) 、最長 3.75 日 (token 失効 + conflict) と見積り。

**Red 前提条件** (これが満たされないと動かない):
- Kura の経理 Red check 完了 (明日の Kura 確認待ち)。¥500 flat 化は MRR 試算変更を伴うので共同署名必須。
- Gumroad API token の有効性確認 (§3)。失効していたら再発行フローが jun 依頼、token 再発行まで BOOTH 側だけ先行する可能性あり。

### 2.2 議題 17 Gate 4 multi-signal 実装 — audit dry-run PDF

**scope**: nokaze 本命商品の **demand validation 用** 無料 PDF。Kai 本命 #2 不採用 6/6 一致の後の Plan B として、「買ってくれるかどうか」を先に測る安全弁。

**実装見積り**:

| 作業 | 所要 | 担当 |
|------|------|------|
| dry-run 内容の仕様 (入出力 scope / 対象層) | 0.5 日 | Oto × jun |
| audit script v0 (手動入力 → PDF 出力) | 1 日 | Oto |
| PDF 用 copy / 装丁 | 0.5 日 | Akari |
| nokaze サイト / BOOTH 下書きに hosting | 0.5 日 | Oto × Akari |
| 配布 CTA 設計 (メール投函 or form 1 本) | 0.25 日 | Zen 設計、Oto 実装 |

Oto single で 2-3 日 + Akari 0.5 日。公開前に Gate 4 scoring review、empirical signal が閾値未達なら本命商品化を HOLD する設計。

**設計メモ (sketch)**:
- 入力: nokaze が audit する対象企業の (name, domain, primary concern)
- 処理: 手動調査 + Claude 文章生成 (後で MCP 化可能)
- 出力: 1 社 1 枚 PDF、雛形は Akari。nokaze brand (障子紙アイボリー、墨色、オリーブ、風化した木、Noto Serif JP / Noto Sans JP / JetBrains Mono)
- 配布: BOOTH ¥0 + nokaze サイト埋込み両方。メール捕捉 CTA は任意。

### 2.3 議題 15 approval-queue.md 支援 (Iwa 主管、Oto は対外公開分のみ支援)

**scope**: nexus-lab 内の承認待ち事項を 1 ファイル集約。Oto は **対外公開を伴う項目** のみ支援 (Zenn / npm / BOOTH / Gumroad publish の可否判断のフィールド設計)。

**Oto 担当領域**:
- `approval-queue.md` の schema に `publish_target` / `200_confirmation_url` / `rate_limit_status` フィールド追加の是非を Iwa と協議
- Zenn 週次 rolling window 実測 (§ CLAUDE.md 新規追加の分岐) を approval-queue から参照可能にするかどうか
- Oto 単独実装は無し、Iwa への input 提供のみ

**所要**: Iwa と 1 回同期 + schema レビュー 0.25 日。

### 2.4 議題 23 error-log.md + retry 3x 構造化 (DEFER、Iwa 4/28 subagent fix 後)

**現状**: ai-ceo-framework レビューで Top 3 採用候補 #1 だったが、subagent write denial (67%) が解消しないと wrapper 関数実装が走らない → DEFER。
**再開条件**: Iwa 4/28 完遂 + denial rate が実測で 20% 未満に下がる。
**再開後の Oto 見積り**: `team_memory/<role>/error-log.md` 新設 + shared retry wrapper lib 化、半日。

## 3. Gumroad API token 有効性確認 (前提条件)

¥500 flat 化実装の第一 step として、まず token が生きているか確認。

**確認手順**:
```bash
curl -s "https://api.gumroad.com/v2/products?access_token=$GUMROAD_ACCESS_TOKEN" | jq '.success'
```
- `true` → そのまま price update に進む
- `false` / 401 → token 失効、jun に再発行依頼 (Gumroad dashboard の Settings → Advanced → Applications)

**再発行が必要な場合の緊急度**: Yellow。BOOTH 側 (4 品) は先行可能、Gumroad 3 品だけ再発行待ちで pending にする。週末 push 締切 (4/27) を守るためには **4/25 中に token 確認** が必要。

## 4. Kura 共同署名の要件

¥500 flat 化は channel 横断の価格変更、Kura (経理) の Red check 必須。

**Kura に渡す材料 (明日 Oto が準備)**:
- 現行価格一覧 (BOOTH 4 品 + Gumroad 3 品、通貨単位)
- ¥500 flat 化後の想定 MRR (4 月実績ベースでの試算 — 販売数 × 新価格)
- channel 別の fee 控除 (BOOTH 手数料 5.6%、Gumroad 手数料 10% + $0.50/sale)
- 価格変更の reversibility (Gumroad は即時戻し可、BOOTH も同様)

Kura の check pass が取れたら実装開始、fail なら価格戦略を再検討 (A/B HOLD で止まっている議題 3.6 に差し戻し)。

## 5. 明日以降の Oto 動き priority

| # | タスク | 期限 | blocker |
|---|--------|------|---------|
| 1 | Gumroad API token 有効性確認 | 4/25 | 無し、最優先 |
| 2 | Kura 向け価格変更材料準備 | 4/25 中 | Kura 明日確認待ち |
| 3 | Kura GO → BOOTH 4 品価格更新 + 200 確認 | 4/26 | Kura GO + Akari 同期 |
| 4 | Kura GO → Gumroad 3 品価格更新 + 200 確認 | 4/26-27 | token 有効 |
| 5 | pricing.md / README 価格表更新 | 4/27 | #3-4 後 |
| 6 | audit dry-run PDF v0 spec 起票 | 4/25-26 並行 | jun との 仕様同期 |
| 7 | audit dry-run PDF 実装着手 | 4/27-29 | spec 確定後 |
| 8 | approval-queue.md schema 協議 (Iwa) | 4/26 | Iwa 都合 |
| 9 | error-log.md 構造化 (DEFER) | Iwa 4/28 完遂後 | denial rate 観測 |

**今週の最大 Red risk**: Gumroad token 失効。これが起きると週末 push が 1 週間ずれる可能性あり。4/25 朝一で確認する。

## 6. Oto 自己観察メモ

- 本日の spawn で **追加案** (audit dry-run PDF) が jun + Zen に採用されたのは、nokaze 本命商品 6 候補諮問で「採用案」を問われた時に「不採用の理由」と同列に **Plan B 提案** を並列で出したから。次回以降も 6 候補諮問のような situation では本命判断 + Plan B を並列で出すと議論が厚くなる。
- mode="acceptEdits" 明示でも nokaze 本命 spawn で denial 発火した件、Iwa 4/28 fix までは **重要 spawn の前に必ず inline fallback 準備** を条件反射化する。

— oto, backend engineer, 2026-04-24 session close
