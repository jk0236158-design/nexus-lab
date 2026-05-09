---
title: Yuino アーキテクチャ — 15 layer の積み重ね (audience-facing)
description: 5/09 1 day で 15 layer 連鎖 reify した Yuino の構造を、 4 ヶ月初心者 audience 向けに paraphrase。 各 layer = 1 つの 「気づき」 から判断・実行・記録までの chain。
status: draft (Phase 1 観察試験中、 Phase 6 Launch Readiness Gate 前)
audience: AI を使い始めて 4 ヶ月くらいの人 + 「Yuino って中で何してるの?」 と気になる方
last_updated: 2026-05-09
---

# Yuino の中身 — 15 の層

> 一言の道具 ではなく、 「気づき → 判断 → 実行 → 記録 → 振り返り」 の chain を 15 の layer で実装。 1 つの会話が、 安全に AI 業務に変換されるまでの構造。

## なぜ 15 layer なのか

「AI に任せて大丈夫」 と感じるには、 **1 つの場所で 1 つの判断** ではなく、 **複数の安全境界が積み重なっている** 必要があります。 Yuino は 「会話から実行まで」 の道筋を、 各段階で別の検査をかけて通す form。

## 15 layer の役割 (audience-facing)

| 順 | 内部名 | 何をしているか (audience form) | 5/09 reify 時刻 |
|---|---|---|---|
| 1 | Source-of-Truth | 「全部の会話・判断・タスク・記録を 1 か所に保存」 | 10:40 |
| 2 | Session Registry | 「今、 どの AI が何をしているかの一覧」 | 11:03 |
| 3 | Agent Bus | 「どの AI に何を頼むかの仕分け台」 | 12:02 |
| 4 | Result Collector | 「AI から返ってきた結果を整理」 | 12:54 |
| 5 | Adapter Contract | 「各 AI への頼み方の決まり (Codex / Claude / Gemini / Local LLM 別)」 | 12:58 |
| 6 | Chat Bridge | 「会話と Source-of-Truth をつなげる橋」 | 13:13 |
| 7 | Chat → SoT loop | 「会話が記録に流れ込む経路を閉じる」 | 13:17 |
| 8 | Decision Stability Guard | 「判断がブレてないか、 直前の意見に流されてないかを check」 | 13:23 |
| 9 | Task Materializer | 「会話から拾った決定を、 タスクの draft に変える」 | 13:36 |
| 10 | Promotion Preview | 「draft タスクが本物のタスクになれるか preview」 | 13:47 |
| 11 | Promotion Quality Protocol | 「自動でタスク化して大丈夫か、 4 つの threshold で check」 | 14:00 |
| 12 | Promotion Review Loop | 「人間 (or AI) が draft タスクを 「accept / ignore / 取消」 で judge」 | 14:30 |
| 13 | Manual Formalization | 「explicit な local command で初めて本物のタスクに固定 (auto なし)」 | 14:30+ |
| 14 | Context Bundle | 「AI に渡す情報を、 ファイル参照のみ + 秘密は含めない form で梱包」 | 14:35+ |
| 15 | Agent Result Writer + Adapter Dry-Run + Decision Stability Grouping | 「結果を返す path + 実行前契約 + 不安定判断のリスク shape」 | 15:00-15:25 |

## 4 ヶ月初心者 audience への意味

「会話 → 実行 → 結果」 の単純 chain ではなく、 各段階で **「やめる選択肢」 「立ち止まる選択肢」** が組み込まれている:

- 8 (Decision Stability Guard) = 「ブレた? 立ち止まろう」
- 11 (Promotion Quality) = 「数値で根拠ある? なければ進めない」
- 12 (Promotion Review Loop) = 「人 (or AI) が judge」
- 13 (Manual Formalization) = 「explicit command まで auto 動作なし」
- 14 (Context Bundle) = 「秘密と関係ない情報は AI に渡さない」

= **AI が暴走しない構造を、 配線レベルで埋め込む** form。

## なぜ 1 day で 15 layer 動けたのか

各 layer は前の layer の output を入力にする **積み重ね設計**。 Yuino completion design (5/09 朝確定) の Build Priority に従い、 Source-of-Truth → Session Registry → Agent Bus の 3 base layer が完成すると、 残 layer は coverage を埋める形で連鎖して reify。

= 1 から作るのではなく、 **設計 → foundation → coverage の 3 step に分解** した evidence。

## 商品 narrative 3 軸との接続

| 商品 軸 | 関連 layer |
|---|---|
| **Local Web App** ([yuino_lp_draft.md](yuino_lp_draft.md)) | 1 (Source-of-Truth)、 6 (Chat Bridge)、 14 (Context Bundle) |
| **Conversation Insights** ([yuino_conversation_insights.md](yuino_conversation_insights.md)) | 6-7 (Chat Bridge + loop)、 8 (Decision Stability)、 9-13 (Task Materializer chain) |
| **Security 8 軸** ([yuino_security_promise.md](yuino_security_promise.md)) | 11 (Quality Protocol)、 13 (Manual Formalization)、 14 (Context Bundle、 秘密分離) |

## 開発状況

- 15 layer 全部 = v0 reify 完了 (5/09 1 day)
- adapter actual execution path = Phase 2.5 carry (現在 dry-run のみ)
- UI 統合 = Phase 2-3 carry (現在 dashboard panel 別々)
- Phase 6 Launch Readiness Gate = 5/21+ 観察試験完了後

## 透明性

- 各 layer の実装 = `C:\Users\jk023\Desktop\nokaze-aira\src\yuino-*.ts` (TypeScript、 vitest 144 passed)
- 各 layer の docs = `C:\Users\jk023\Desktop\nokaze-aira\docs\yuino_*_v0_implementation_2026-05-09.md`
- 5/09 1 day の reify chain = `C:\Users\jk023\.shared-ops\board\` 内の 15+ board file (Kai → Zen + Zen → Kai 双方向)
- 開発の様子は GitHub + Zenn + X で随時公開

## 注意

- 各 layer の名称 (Agent Bus / Chat Bridge / Context Bundle 等) は 内部技術名、 audience-facing では適切に paraphrase
- 商品ページでは **「会話から判断が育つ」「絶対妥協なし安全」「ローカル優先」** の 3 軸で説明し、 layer の細部は 「興味があれば deep dive」 form

---

Zen (Claude Opus 4.7、 nokaze CTO)
2026-05-09 15:30 起稿、 5/09 Kai 1 day 15 layer reify chain を audience-facing form に paraphrase、 商品 3 軸との接続明示、 Tempo Trap 警戒下 explicit directive trigger
