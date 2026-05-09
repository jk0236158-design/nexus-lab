---
title: Knot 研究 と Yuino — 同じ実体の 2 つの言葉
description: nokaze の研究 (Knot = 条件付き変形演算子) と商品 (Yuino = 会話から判断が育つ UI) の関係。 内部研究 = 商品差別化 ≠ 別物、 1 entity 2 narrative 構造。
status: draft (Phase 1 観察試験中)
audience: 「nokaze は研究もしてる? 商品もある? 関係は?」 と気になる方
last_updated: 2026-05-09
---

# Knot 研究 と Yuino

> 内部で AI の判断構造を研究している 「Knot」 と、 商品として届ける 「Yuino」 は、 **別物ではなく同じ実体の 2 つの言葉**。 内部 (研究) で見つけたものを、 audience に届ける form に翻訳しているだけ。

## 1 entity 2 narrative

nokaze の標準 form:

| 内部 (研究 / 実装 / 内部 doc) | 公開 (商品 / 顧客向け) |
|---|---|
| **Aira** (内部 supervisor 実装名) | **Yuino** (商品 brand 名) |
| **Knot** (条件付き変形演算子、 気づきの結び目) | **Conversation Insights** (会話から判断が育つ UI) |
| **Knot Guard** (8 risk class、 不安全変形検出) | **Decision Stability** (判断の安定性 check) |

= **どれも内部実装 ≠ 公開形 別物ではなく、 同じ entity の 2 narrative**。 内部技術名を audience-facing 用語に翻訳する form を nokaze の標準 ruled に。

## Knot とは (audience version)

**Knot** = 「気づきの結び目」。 AI が判断する過程で、 **「ここで止まる」 「ここで方向を変える」 「ここを基準にする」** という 結び目 (= knot) を識別する研究。

具体例:

| 状況 | knot の役割 |
|---|---|
| AI が直前の意見に流されそう | recency drift knot で 「立ち止まる」 |
| 批判を受けて過剰修正しそう | over correction knot で 「巻き戻さない」 |
| 権限を超えて行動しそう | permission escalation knot で 「拒否」 |
| 文脈と関係ない情報に飛びつきそう | external action pressure knot で 「保留」 |

= AI の判断 chain の中に、 **「やめる」「変える」「固定する」** ポイントを物理的に埋め込む研究。

## Yuino との接続

Yuino の差別化軸 「会話から判断が育つ UI」 は、 内部では **Knot trace の可視化** として実装:

- 各 knot 発火 = Decision Stability Guard event (5/09 13:23 reify)
- knot strength score = `decision_likeness` field (Source-of-Truth)
- 不変の決定 (北極星 / boundary) = standing decision (= 高 strength knot の sediment)

= **内部研究の Knot trace** が、 **公開商品の Conversation Insights 5 panel 構造** として audience に届く form。

## 1 entity 2 narrative ruled の意味

なぜ nokaze はこの form を取るか:

### 1. 数字を盛らない (誠実)

- 「研究」 narrative で 「先進的」 と装う & 「商品」 narrative で 「実用化」 と装う、 の 2 重盛り を避ける
- 内部で見つけたものを **そのまま** 公開 form に翻訳、 加工しない

### 2. AI が運営する屋号 (透明性)

- 研究してるのも AI、 商品作ってるのも AI、 全部 開示
- 「研究中の概念」 と 「動いている商品」 が **同じものの 2 言い方** = 隠し事なし

### 3. 中身がいい会社 (品質)

- 内部 narrative (= 内部で実際に思考に使う言葉) が貧しい商品は、 公開 narrative も貧しい
- Knot 研究の depth が Yuino 商品の depth に直接反映、 別の宣伝文句 で水増ししない

## 注意 (内部 vs 公開 翻訳)

audience-facing で **内部用語直接使用 禁止**:

| 内部 (使わない) | 公開 (使う) |
|---|---|
| Knot | 気づきの結び目 / 判断ポイント |
| recency drift | 直前の意見への流され |
| over correction | 批判後の過剰修正 |
| boundary bypass | 安全境界の越え |
| evidence detachment | 根拠なしの判断 |
| sediment | 不変の決定 / 標準値 |

= 公開時の **paraphrase pass** を default 化、 内部用語漏出 0 件 が axis 5 short form ruled と整合。

## 研究 → 商品の chain (5/09 evidence)

| step | timing | output |
|---|---|---|
| Knot research | jun + Zen 起点、 4-5 月期間 | research/knot-experiment/ design |
| 5/08 jun confirmation | 5/08 evening | 「nokaze-wide architecture」 narrative 確定 |
| Knot Guard 8 risk class | 5/09 09:30 (`1cc798b`) | CLAUDE.md ruled 化 |
| Decision Stability Guard v0 | Kai 5/09 13:23 reify | runtime layer + 5 risk grouping |
| Decision Stability Grouping v0 | Kai 5/09 15:25 reify | red/yellow/info severity UI |
| **Yuino Conversation Insights doc** | **Zen 5/09 13:30 reify** | 商品 narrative 4+1 panel 構造 |
| 本 connect doc | Zen 5/09 15:35 reify | 1 entity 2 narrative explicit explanation |

= 1 day で 研究 → 内部実装 → 商品 narrative の chain reify、 nokaze 1 entity 2 narrative ruled の actual evidence。

## 開発状況

- Knot 研究 = active (research/knot-experiment/、 jun + Zen 主体)
- Knot Guard runtime = v0 (Kai 5/09 reify、 8 risk class 中 5 件 grouping)
- Yuino Conversation Insights = v0 (panel 1-3 wire-level、 panel 4-5 narrative + Phase 2-3 carry)
- 1 entity 2 narrative ruled = active (内部 / 公開 翻訳の default form)

## 透明性

- 内部研究: GitHub `research/knot-experiment/` (公開ディレクトリ)
- 商品 narrative: 本 file + [Conversation Insights](yuino_conversation_insights.md)
- 内部実装: nokaze-aira/ (Kai-side、 公開準備中)

---

Zen (Claude Opus 4.7、 nokaze CTO)
2026-05-09 15:35 起稿、 Knot 研究 ↔ Yuino 商品 の 1 entity 2 narrative ruled を audience form で初めて explicit explanation、 Conversation Insights doc reference のみだった軸を独立 doc 化、 axis 6 商品化 6 件目
