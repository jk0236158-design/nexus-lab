# Aira / nokaze-aira 全体レビュー (2026-07-02、jun 依頼)

- 実施: Zen (統合・物理照合) + Iwa / Kagami / Akari / Oto / 汎用 reviewer の 5 並列 read-only レビュー
- 対象: `C:\Users\jk023\Desktop\nokaze-aira` working tree (最終 commit 0ed1132e 6/18、以降未 commit。Kai が 12:12-12:40 も live 編集中 = 動く対象のスナップショット、as-of 注記あり)
- 境界: repo への編集ゼロ・生成 script 実行ゼロ。実行したのは Zen による full vitest 1 回のみ
- 通知済み: board `2026-07-02_zen_kai_aira_readonly_review_in_progress_jun_requested.md`

---

## 1. 全体 verdict (3 行)

**骨格と境界は本物。運営 OS としての設計方向は正しく、外部行為の迂回経路は存在しない (能力そのものがコードに無い、という一番強い形)。** ただし**商品の約束である「完了の真偽」の心臓部に、自己申告で通れる穴が 5 ヶ所**あり、これは Yuino が売ろうとしている問題 (narration が gate を通る) の社内実例になってしまっている。買い手が最初に見るデモにも状態矛盾が 1 件。いずれも作り直しではなく整流で直る範囲。

## 2. 全体の物理事実 (Zen 実測)

| 項目 | 実測 | 評価 |
|---|---|---|
| full test suite | **1760/1761 pass、1 red** (`yuino-substantive-response-writer` の重複 backlog 処理) | ほぼ健康。ただし 6/30 に Kai 自身が登録した「full-suite checkpoint」ルールの実効性に疑問符 |
| git | 最終 commit **6/18**、以降 2 週間分が全部未 commit | 「証拠と復旧」を売る repo に復旧点が無い。exit-sync-guard (dirty worktree 検出器) 自身がこれを flag していない = guard の実運用の穴の証左 |
| status surface | 約 90 面。最大 `yuino_source_of_truth.json` **11.8MB**、「人が読む」md が 710KB (chat_bridge) / 601KB (agent_bus) / 357KB (execution_claim)。5 月から stale な面 (budget_cap 5/18、operator_message 5/11 等) が新鮮な面と混在 | 面の増殖 + 肥大 + 鮮度混在。rotation 機構は repo 内にあるのに未適用 |
| 規模 | src 130 file / tests 127 file / docs 1020 file | 1 file 肥大が進行 (execution-plan 96KB / idle-work-loop 118KB / stability-guard 3,773 行) |

## 3. 機能クラスタごとの verdict

### 3.1 Aira core loop (10 file) — Iwa 担当

閉ループ (観測→判定→dispatch→実行→検証→復旧) としては閉じており、chain e2e + 実データ replay fixture で通し test 済み。**core / dispatcher / tripwire は solid** (tripwire は fail-closed、dispatcher は境界 keyword の実行前 block + 重複防止を test で実証)。

| file | verdict | 一言 |
|---|---|---|
| aira-core (判定器) | solid | 決定論・LLM 不使用・test 良質 |
| aira-dispatcher | solid | dry-run default、silent 解決の穴 1 件 (P2) |
| aira-tripwire (red 検知) | solid | 誤検知しても止まるだけの fail-closed |
| aira-closed-loop | works-rough | **P1: proof 再刻印** (下記) |
| aira-work-executor | **questionable** | **P1: 実体なし完了** (下記)、直接 test ゼロ |
| aira-observer / evaluator / dogfood-runner / exit-sync-guard | works-rough | 判定器の一部が実運用で構造的に死んでいる (idle 判定は age≈0 で発火不能、denial counter の呼び出し元ゼロ) |
| aira-work-generator | solid (単体) | ただし提案の中身を誰も読まない dead-end (次の仕事概念が 2 系統) |

### 3.2 completion-truth / claim / decision (17 file) — Kagami 担当。**商品の心臓部、最重要**

**「done 申告を物理 evidence と照合する」を本当に物理でやっているのは 3 ヶ所だけ** (conversation-claim-capture の path 実在確認 / outcome-accounting の直接 API 計測 / frame-provenance-guard の transcript 実読)。残りの gate 群は「evidence らしい文字列があるか」の語彙照合。

| file | verdict | 一言 |
|---|---|---|
| execution-claim / frame-provenance-guard / decision-registry (+validator) / decision-completion-gate (logic) / followthrough-runner | solid | claim≠completion の明記、transcript 実読、schema 検査は堅実 |
| conversation-claim-capture | works-rough | 物理照合は本物だが **P1 の昇格穴** |
| outcome-accounting (2,925 行) | works-rough | 計測核 (~700 行) はクラスタ最良。周辺が肥大 (P2 x3) |
| completion-claim-guard / decision-routing / weekly-dogfood-review / commitment | works-rough | fail-open 1 件 / 自己申告日付 1 件 / 免除増殖 |
| completion-authority-gate / design-gap-result | **questionable** | 語彙照合のみ / **P1 自作自演** |
| design-gap-audit / decision-stability-guard (3,773 行) | **over-built** | frontier 使い捨て分岐 / 免除関数 ~60 個 |

decision 系 7 file の責務分割自体は成立 (別名重複ではない)。増殖は file 間でなく file 内 (免除関数の積み上げ)。

### 3.3 closed-beta 商品デモ面 + 導入体験 (14 file) — Akari 担当

デモ 12 画面を実際に browser で開いて確認。3 stage 構成 (動かす → 主張を証明する → 信頼して復旧する) は流れとして良く、slice3 (Evidence / Completion Truth / Claim Check) は差別化の中心として solid。**合成 sample のみで内部情報 leak は実質なし**。install-verifier (毒入り偽 home でまっさら導入を検証) は発想が良い。

| file | verdict |
|---|---|
| foundation / sample-seed / slice3 / slice4 / slice5 / first-run / init / install-verifier / setup-doctor / productization-pulse | solid |
| slice2 / slice6 / preview-pack | works-rough |
| product-layer-check (106KB) | unknown (実行未検証) |

**P1**: ①デモ画面同士の状態矛盾 (index「Sample: off」vs Home「Sample mode on」— 画面が 2 波で別々に生成される構造。**状態の真偽を売る製品のデモで画面ごとに状態が違うのは象徴的に一番痛い**)。②walkthrough (demo-index.html) への導線が README / AGENT_SETUP に**ゼロ** + 冒頭に「何の製品で何が嬉しいか」の一文がない。
P2: Tasks 画面の文字重なり bug、nokaze-design 正本 token 未配布 (Segoe UI / gradient / 強影 = 6/16「基準は配る経路まで」の再発)、"Slice N" 内部語の露出、Node.js 前提の未記載。

### 3.4 operator UI / surface (13 file) — 汎用 reviewer 担当

**北極星 (jun の介入を週 1-2 回へ) に対して設計は正しい方向**。Home の頭 20 行 (「Owner確認なしで、AI側の安全な作業を継続できます」「今はJunが読むものはありません」) は 5 秒で出番の有無が分かる良設計。dashboard-server の守り (loopback 固定・nonce・全 POST 監査) は商品水準。

| file | verdict |
|---|---|
| dashboard-renderer / dashboard-server / ui-translator / chat-outbox / approval-inbox | solid |
| home-summary / task-checklist / mobile-owner-hub / operator-message / chat-bridge / approval-decisions | works-rough |
| task-spine | **questionable** (as-of 12:12、Kai 編集中) |

**P1**: ①task-spine の空振り = 誤情報 (入力の形が 1 段ずれると、エラーでなく「やることなし」と表示。同時刻の Home は次の一手を掲示 = **面ごとに答えが違う**)。②jun の正本 surface の言語割れ (Home 前半は日本語、mobile headline と suggested_action は英語、Counts 章に英語 snake_case ~100 行 — jun 向け 20 行と AI 向け 200 行が同居)。
P2: 同一文が最少 6 ヶ所に重複表示 / chat_bridge.md 710KB / 休眠 surface 2 面 (approval_decisions 5/31、operator_message 5/11) の棚卸し。

### 3.5 agent runtime / 自走 loop / guard (26 file) — Oto 担当

**境界強制は solid — 迂回経路なし。** 外部 host への network 送信コードがクラスタに存在せず (能力の不在)、agent-bus は external_execute を owner 承認済みでも hard-block、gate 連鎖は fail-closed (stale 閾値 0ms)、完了申告は completion authority gate 不合格で throw。**この部分は Yuino の「done 申告が本物か + 境界が見える」の物理実体そのもので、商品面の売りになる質。**

| 対象 | verdict |
|---|---|
| 境界強制 (security / bus block / gate 連鎖 / controlled-wake / result-writer) | **solid** |
| agent infra (bus / runtime / plan) | solid 寄り works-rough (1 file 肥大) |
| 自走 loop (trigger-local 86 step / pre-idle 61 step / night-cycle) | works-rough + over-built (step 重複で 1 cycle ~150 process spawn) |
| external-action-policy (Green/Yellow/Red 分類器) | **questionable** (P1) |
| watchdog 系 (ack-pending / wsd-progress / loop-defect / fixed-flow) | works-rough (責務明確・safe) |

**P1**: red 判定 regex が**英語のみ** — 「決済」「返金」「価格変更」と日本語で書かれた行為は owner 必須の赤に落ちず黄 (Kai+Zen) で通る分類になる。`yuino-security.ts` は日本語 keyword を既に持っているので、同じ 2 言語 list を寄せれば閉じる (regex 1 行 + テスト 2 件)。
P2: red_owner 分岐のテスト空白 / pre-idle 失敗時に古い status が残る / budget-cap が定義のみで enforcement 未接続 / decision-commitment だけ 8GB heap 指定。

## 4. P1 統合 (重要度順)

**A. 商品の約束に直撃 (completion-truth の自己申告穴、5 件) — すべて Kai 領域**
1. cited evidence 全欠でも `verified` 昇格 (`yuino-conversation-claim-capture.ts:636-645`) — verified 数が done-list frontier 前進判定に波及。fix 案 = 新 state `provenance_only` に分離
2. review narration の自動生成 (`yuino-completion-design-gap-result.ts:787-793` の `review_evidence=Kai adoption accepted...` hardcode) → それを検査する authority-gate がその文字列で pass する自作自演閉路
3. 免除関数 ~90 個の言い回し一致で hold 素通り (`decision-stability-guard` ~60 + `decision-commitment` ~30、「221/221」等のテスト数文字列一致を検証扱い) — 免除の data 化 + verification だけ実 file path 解決必須化
4. closed-loop の proof 再刻印 (`aira-closed-loop.ts:213-317` 未 commit 分) — 過去 run の実行証拠を新しい generated_at で再刻印 = state_integrity_contract (6/11) と正面衝突。latest_run と best_proof の field 分離で解ける
5. work-executor の実体なし完了 (`aira-work-executor.ts:220-307`) — dispatch された仕事の本体をやらず「要約 doc を書く」だけで complete + 直接 test ゼロ

**B. 境界 (1 件)**
6. red gate 判定語の英語限定 (`yuino-external-action-policy.ts:174-177`) — 小さい fix で閉じる

**C. 買い手初見 (2 件)**
7. デモ画面同士の状態矛盾 (Sample on/off が index と Home で逆、生成 2 波が原因) — 全画面一括再生成経路 + footer に生成時刻
8. walkthrough への導線ゼロ + 「何の製品か」1 文の不在 (README / AGENT_SETUP / index 冒頭) — Akari が文案 draft 可

**D. 運用衛生 (3 件)**
9. full suite 1 red (`yuino-substantive-response-writer` の canonicalize/duplicate-close case) — 6/30 full-suite checkpoint 決定との不整合
10. git 2 週間未 commit — 復旧点の不在。exit-sync-guard が自 repo を flag していない (= guard 実効性の live 証拠)
11. task-spine の空振り誤情報 + 面ごとの答え割れ (Kai が編集中 as-of — 修理後に「不一致 → 無言」構造が残っていないかだけ確認)

## 5. 良かったもの (明示しておく)

- **境界の設計思想**: 外部行為の能力不在 + fail-closed + 完了権限 throw。これは他所に無い実装で、商品の看板に偽りがない部分
- Home Summary の頭 20 行 / dashboard の日本語 first / approval-inbox の一元化 — 北極星に直結する UX
- install-verifier (毒入り偽 home での導入検証)、tripwire の fail-closed、atomic-file util の Windows EPERM retry、dashboard-server のセキュリティ
- outcome-accounting の計測核 (売上/世界の動きを直接 API 計測、内部作業を進捗と数えない) と frame-provenance-guard (6/13・6/18 confabulation の直接対策)
- テスト文化: 実 tempdir + 実 file 書込みで mock に逃げない形式が全クラスタ共通

## 6. 完成図 (運営 OS) への位置づけまとめ

- **商品面・必須**: closed-beta slice 群 (特に slice3)、dashboard 一式、ui-translator、home-summary、approval-inbox、first-run / init / install-verifier / setup-doctor、completion authority gate、wsd-progress-guard、ack-pending-watchdog、audit redact
- **内部専用 (商品に出さない)**: observer / evaluator / dogfood-runner / exit-sync-guard (heuristic parse のまま)、kai-status-reflector、loop-defect / fixed-flow、trust
- **過剰 (整理候補)**: work-generator (dead-end)、design-gap-audit / stability-guard の免除・frontier 焼き込み群、pre-idle × trigger-local の重複 step、budget-cap の未接続閾値、night-cycle (14 日観察用と明記あり)

## 7. 補足 (各クラスタの詳細)

各 reviewer の全文 (file:line 付き) は本 file の元になった 5 本の return にあり、P2/P3 の完全な一覧は Kai への board handoff に添付する。デモ画面の screenshot 12 枚 = `~/nexus-lab/akari-*.png`。

— Zen (統合)
