---
title: Yuino Conversation Insights — 会話から判断が育つ UI
description: Yuino の差別化軸。 4 つの瞬間 panel + 1 つの時間 panel = 会話を通して AI と人の判断が積み重なる構造。 nokaze の Knot 研究と接続。
status: draft
audience: AI を使い始めて 4 ヶ月くらいの人 + 既存 dashboard 不満を持つ AI ユーザー
last_updated: 2026-05-09
---

# Yuino Conversation Insights

> 会話から判断が育つ UI。 4 つの瞬間 panel と、 1 つの時間 panel で、 AI との対話を 「気づき」 と 「決定」 に変えていく。

## こういう不満ありませんか

- AI と話してるうちに、 「あれ、 さっきの結論なんだっけ?」 と思う
- 1 時間後に 「あれ、 これ前に話したよね」 と AI が忘れている
- 何回か議論したのに、 結局 「決まった?」 がはっきりしない
- 過去の判断と矛盾する答えが返ってきても気づかない

これらに、 **会話 → 判断 → 蓄積 → 次の判断** の構造で答えます。

## 4 panel + 1 panel の構造

### 横軸 = 「今この瞬間」 (4 panel)

```
┌─────────────────┬─────────────────┐
│ 1. 会話        │ 2. 候補         │
│ (今話してること) │ (会話から拾った決定候補) │
├─────────────────┼─────────────────┤
│ 3. 判断         │ 4. 行動         │
│ (確定した決定)   │ (誰が何をしている) │
└─────────────────┴─────────────────┘
```

| panel | 中身 |
|---|---|
| **1. 会話** | あなたと AI、 AI 同士のやり取り。 thread 単位で時系列 |
| **2. 候補** | 会話から自動抽出された 「決定っぽい」 もの。 「採用」 「却下」 「保留」 「あなたの判断必要」 で分類 |
| **3. 判断** | 候補から確定した決定。 「採用」 「部分採用」 「却下」 「あなたの判断」 の 4 分類 (= Decision Stability Guard) |
| **4. 行動** | 判断から生まれたタスク。 誰が動いてる、 何が止まってる、 何が完了したか |

= **会話 → 候補 → 判断 → 行動** の 4 step が **画面上で 1 つの流れとして見える**。

### 縦軸 = 「時間を貫く」 (1 panel)

```
┌─────────────────┐
│ 5. 不変の決定    │
│ (北極星 / boundary / identity) │
└─────────────────┘
```

| panel | 中身 |
|---|---|
| **5. 不変の決定** | 「これは絶対に変えない」 と決めた基準。 北極星 (週 1-2 回介入で安定運営)、 安全 boundary、 identity ルール、 nokaze 不可侵層 |

= 「**今の決定**」 (3) と 「**不変の決定**」 (5) を **常に並べて表示**、 短期判断が長期軸からズレた時にすぐ気づける。

## なぜこの形なのか

普通の AI チャット画面は 1 つの長い stream。 「今何が起こってるか」 と 「何が決まったか」 が混ざる。

Yuino は 4 + 1 panel に分けることで:

- **「会話してる時間」 と 「決まったこと」 が分離** = 後で振り返るのが楽
- **「短期判断 vs 長期軸」 が並列** = 矛盾が surface する
- **「気づき」 が 自動抽出** = AI に 「決定っぽいもの全部教えて」 と聞かなくていい

## 内部技術 (透明性)

このパネル構造は、 nokaze が研究している **Knot** (条件付き変形演算子、 「気づきの結び目」 とも) と接続しています:

- 内部では、 各 「気づき」 が strength score 付きの knot として記録
- score が一定値超えたものが **不変の決定** layer (panel 5) に昇格
- 公開向けには 「Conversation Insights」、 内部研究では 「Knot trace」、 同じ entity の 2 narrative

詳細は [Knot 研究の概要](../../../../research/knot-experiment/) を参照。

## 開発状況

- Phase 1 観察試験中 (2026-05-08〜2026-05-21)
- panel 1-3 (会話 / 候補 / 判断) = v0 実装済 (Source-of-Truth + Decision Stability Guard で foundation 完成、 dashboard panel 構築中)
- panel 4 (行動) = v0 実装中 (Task Materializer + Promotion preview で foundation、 5/09 evening reify)
- panel 5 (不変の決定) = narrative 確定済、 wire-level integration は v1 (5/26 milestone 後)
- 統合 UI = Phase 2-3 carry

## 比較 (他のツールとの違い)

| ツール | 強み | Yuino との違い |
|---|---|---|
| ChatGPT 標準 | 即時応答、 広い知識 | 「決定」 と 「会話」 が混ざる |
| Cursor | コード作業に最適化 | コード以外 (経営判断、 設計議論) は薄い |
| Notion AI | ドキュメント整理 | 即時の AI 対話と判断蓄積が分離 |
| **Yuino** | **会話 → 判断 → 行動 → 振り返り の 1 つの流れ** | local-first、 4 + 1 panel、 不変の決定 layer |

## 試したい人へ

まだ販売していません。 開発の様子は [GitHub](https://github.com/jk0236158-design/nexus-lab) と [Zenn](https://zenn.dev/nexus_lab_zen) で公開中。

Phase 6 Launch Readiness Gate で公開判断後、 試用招待します。

---

Zen (Claude Opus 4.7、 nokaze CTO)
2026-05-09 起稿、 5/07 PM jun + Kai 5 panel 構造確定 を audience-facing form に paraphrase、 Knot 研究との axis 整合明示
