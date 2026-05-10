---
date: 2026-05-10
owner: Hoshi (Lead Researcher)
status: draft
purpose: broadcast-os の Metabolic Learning Layer v3 (MetaClaw-inspired) と Knot 5 役割 の bind narrative + column rename narrative reframe + Knot 用語 → 4 ヶ月初心者 audience-facing form paraphrase substitute list 起稿。
audience: Zen / Kai / jun + 内部 reference (research priority)、 paraphrase substitute list section は商品 user / jun 個人 / 信用蓄積 audience 向け
---

# broadcast-os Knot Bind (2026-05-10)

## 1. summary (3 行)

- broadcast-os の Metabolic Learning Layer v3 (MetaClaw-inspired) は Knot 5 役割 (knot_process.md) と **1:1 で bind 可能**、 MetaClaw 用語と Knot 用語は **同じ概念の別 narrative**。
- 物理 schema 変更は不要、 **alias narrative** form (table + 表記揺れ吸収) で audience-facing narrative を切り替えるだけで 「broadcast-os = Knot 研究 applied implementation 実機動作」 narrative が成立する。
- Knot 用語 14 件を 4 ヶ月初心者 audience-facing form に paraphrase する substitute list を本 file § 5 に固定、 broadcast-os 公開 episode + Yuino 商品 narrative + jun 報告 form 全部で同じ substitute を共有。

---

## 2. context (前提)

### 2.1 broadcast-os Metabolic Learning Layer v3 の現況

`broadcast-os/` (Python repo、 nexus-lab とは別 repo) の内部 schema 候補 (5/10 baseline):

- `learning_insights` — failure trajectory + insight が capture される table
- `learning_skills` — capture された insight が evolve / apply form に固定された skill library
- `bible_patch_proposal` — skill 蓄積から bible (運営 ruled) への patch proposal が立つ table

(背景: MetaClaw narrative は 5/06-5/08 期間 jun + Kai + Zen 共有で 「failure trajectory capture + skill library + opportunistic improvement jobs + support / query separation + policy evolution (Format Bible patch)」 の 5 element で固定、 broadcast-os Metabolic Learning Layer v3 の起源)

### 2.2 Knot 5 役割 (knot_process.md) の現況

`CLAUDE.md` § Research: Knot 研究 で固定:

1. **役割 1: 現在タスクの補正** — 今の生成を止めたり、 姿勢を変える
2. **役割 2: 検証構造への沈殿** — 高 hardness 化で validator に固定規則として入る
3. **役割 3: 発見構造への注入** — 高 hardness 化で Discovery の入力 / prior に入る
4. **役割 4: Discovery 層の弱点診断** — どの knot が増えたかで、 Discovery のどこが弱いかわかる
5. **役割 5: 処方のルーティングキー** — どの処方をどの dose で打ち下ろすかを決定する

### 2.3 本 file の position

本 file は **internal narrative の bind 表 + 公開 audience 向け paraphrase substitute list** を 1 file に集約。 物理 schema 変更を提案しない、 alias narrative form で narrative reframe を可能にする spec を固定。

---

## 3. broadcast-os Metabolic Learning Layer v3 ↔ Knot 5 役割 bind 表

### 3.1 表本体

| MetaClaw 用語 | Knot 5 役割 | broadcast-os 内部 reify | bind 強度 |
|---|---|---|---|
| **failure trajectory capture** | 役割 4: Discovery 層の弱点診断 | `learning_insights` テーブルに failure trajectory が捕捉される、 どの knot が増えたかで Discovery 弱点 detect | strong (1:1) |
| **skill library** | 役割 2: 検証構造への沈殿 | `learning_skills` テーブルに高 hardness knot が固定規則 (= bible ルール候補) として沈殿、 validator の入力 | strong (1:1) |
| **policy evolution (Format Bible patch)** | 役割 3: 発見構造への注入 | `bible_patch_proposal` で `learning_skills.action_json` を script prompt / visual prompt に inject、 Discovery 入力 prior 化 | strong (1:1) |
| **opportunistic improvement jobs** | 役割 5: 処方のルーティングキー | content type 選択 (documentary / narrative / process / monthly recap) を knot dose で routing、 どの処方をどの dose で打ち下ろすか decide | mid-strong (axis 一致、 reify form 多様) |
| **support / query separation** | 役割 1: 現在タスクの補正 | evaluation contamination 回避 (support set ≠ query set) + grounded block の disclaimer_card に knot reference、 現在生成タスクへの補正 | mid-strong (boundary 軸近接) |

### 3.2 bind 表の structural 観察

- **MetaClaw 5 element は Knot 5 役割と 1:1 bind 可能**: 同じ概念の別 narrative、 物理 schema 変更不要で narrative reframe が成立。
- **bind 強度の濃淡**: 役割 4 / 役割 2 / 役割 3 は strong (1:1) bind、 役割 5 / 役割 1 は mid-strong (axis は一致するが reify form が多様)。
- **structural insight**: broadcast-os は **Knot 5 役割の applied implementation 実機動作** を Metabolic Learning Layer v3 という form で reify している、 narrative reframe するだけで Knot 研究 connect が公開 evidence record の主軸になる。

### 3.3 dose narrative の bind detail

| Knot 用語 (現状) | MetaClaw 用語 (現状) | bind 後 unified narrative 候補 |
|---|---|---|
| dose (役割 5 「どの処方をどの dose で打ち下ろすか」) | application strength (skill apply 時の影響度) | **dose / 効かせ方 / 反映度** で unified、 内部用語は dose 維持 OK、 公開 audience は paraphrase 適用 |
| hardness (役割 2 「高 hardness 化で validator に固定規則として入る」) | maturity (skill library 内 skill の確度) | **hardness / 強度 / 確度** で unified、 内部 hardness 維持 OK、 公開 audience は paraphrase 適用 |

---

## 4. column rename narrative reframe spec (物理 schema 変更不要)

### 4.1 rename narrative 候補

| 現 column 名 | rename narrative 候補 | rename 採否 (推奨) |
|---|---|---|
| `learning_insights` | `knot_ledger` (Knot 増加記録 form) | **採用 candidate (alias narrative form 推奨)** |
| `learning_skills` | `knot_skill_library` or `applied_knot_library` | **alias narrative form 推奨** (既存 doc + code reference 維持) |
| `bible_patch_proposal` | `knot_sediment_proposal` (Knot が bible に沈殿する narrative) | **alias narrative form 推奨** |

### 4.2 alias narrative form の form spec

物理 schema 変更ではなく、 narrative 表記揺れを **alias narrative table** で吸収する form:

```markdown
## 表記対応表 (broadcast-os internal narrative ↔ public-facing narrative)

| internal column 名 | research-facing narrative | public audience-facing narrative |
|---|---|---|
| learning_insights | knot_ledger (Knot 5 役割 4: 弱点診断) | ひっかかり点の記録 |
| learning_skills | knot_skill_library (役割 2: 検証構造への沈殿) | ルール化された対応集 |
| bible_patch_proposal | knot_sediment_proposal (役割 3: 発見構造への注入) | ルール更新の提案 |
```

### 4.3 rename narrative の boundary

- **物理 column rename はしない**: 既存 doc / code / SQL reference の維持、 migration cost 回避、 5/26 canonical switch milestone までは alias narrative form を default。
- **internal narrative + research narrative + public audience narrative の 3 layer を維持**: 同一 entity (column) に対し audience に応じて 3 つの呼び方を使い分け、 audience confusion を避ける。
- **物理 rename の trigger 条件**: 5/26 canonical switch milestone 以降、 jun + Kai + Zen 3 者で migration 価値判断、 default は alias narrative form 維持。

---

## 5. Knot 用語 → audience-facing form paraphrase substitute list (4 ヶ月初心者 audience 向け)

### 5.1 substitute list 本体

| Knot 用語 (internal) | 普通の日本語 (4 ヶ月初心者 audience) | 補足 narrative |
|---|---|---|
| **knot** | ひっかかり点 / 結び目 | 「うまくいかなかった瞬間」 を記録した点 |
| **sediment** | ルール化 / 沈殿 / 固定化 | 何度も起こることを 「次は最初からこうしよう」 と決めること |
| **dose** | 効かせ方 / 反映度 | ルールを 「どれくらい強く」 適用するか |
| **hardness** | 強度 / 確度 | このルールがどれくらい確かか (試した回数 / 成功した回数) |
| **applied implementation** | 実装した形 / 動く形にしたもの | 紙の上のアイデアではなく、 実際に動く form |
| **trajectory** | 経路 / 流れの記録 | 何が起きて、 何で失敗したかの一連の記録 |
| **failure trajectory capture** | うまくいかなかった経路の記録 | 失敗 step を全部記録すること |
| **skill library** | できるようになった対応集 | 「こういう時はこうする」 を集めた本 |
| **policy evolution** | 運営ルールの更新 | nokaze の動き方を 「もっと良く」 変えていくこと |
| **format bible patch** | ルール集の更新提案 | 「この発見をルールに入れよう」 という提案 |
| **opportunistic improvement** | チャンスを見つけて改善 | 「ここ直せそう」 と気づいた時に直すこと |
| **support / query separation** | 学習用と本番用を分ける | 「練習に使う題材」 と 「本番で答える題材」 を分けること |
| **grounded block** | 根拠を明示した文章 | 「ここはこの記録から書きました」 と source を明示する形 |
| **disclaimer_card** | 注意書きカード | 「これは AI が書いた」 「ここは推測」 を audience に明示する short card |

### 5.2 substitute list の usage rule

- **内部 doc (memory / team_memory / 自分用 note) では internal vocabulary 使用 OK**: knot / sediment / dose / hardness 等を直接使う、 paraphrase は不要。
- **公開 episode / 商品 narrative / jun 報告 では substitute list 適用必須**: 1 段落で internal vocabulary 5 件以上混入したら書き直し (`memory/feedback_excessive_english_mixing.md` + `memory/feedback_jun_4_months_translate_default.md` 連動)。
- **共有 substitute list の意味**: broadcast-os 公開 episode / Yuino 商品 narrative / jun 報告 form 3 form で同じ substitute を共有することで、 audience が複数 form を行き来しても用語 confusion がない。

### 5.3 substitute list と既存 CLAUDE.md table の関係

CLAUDE.md § 報告 form は 4 ヶ月初心者向けに固定 § 専門用語 → 普通の日本語 substitute table と本 file § 5.1 は **重複しない axis**:

- CLAUDE.md table = 一般 internal vocabulary (commit / push / inbox / silent wait / reify / spawn 等) の paraphrase
- 本 file table = **Knot 研究 specific vocabulary** の paraphrase

両 table を持つことで、 一般 internal vocabulary と Knot 研究 specific vocabulary が両方 paraphrase 可能。 substitute list の commit / publish 時は両 table を併用 reference。

---

## 6. 「broadcast-os = Knot 研究 applied implementation 実機動作」 narrative 成立 spec

### 6.1 audience-facing narrative の form

#### 6.1.1 公開 episode 内 narrative (substitute list 適用済 form)

例 narrative (4 ヶ月初心者 audience 向け):

> nokaze の AI 組織 (Zen + Kai + 仲間 6 人) は、 1 ヶ月で 12 個の 「ひっかかり点」 を学んで、 3 つの運営ルールを更新しました。 ひっかかり点とは、 うまくいかなかった瞬間を記録した点のこと。 何度も同じ場所でひっかかったら、 「次は最初からこうしよう」 と固定します。 これを Knot research と呼びます。

(この form で 「knot」 「sediment」 「policy evolution」 を全部 substitute、 但し 「Knot research」 は固有名詞として保持)

#### 6.1.2 timeline + episode pointer + visual loop diagram

broadcast-os 公開 episode で本 narrative を成立させる surface 3 element:

1. **timeline**: 月初 → 月末で knot 増加 / sediment / policy evolution の 3 phase を時間軸 visualize
2. **episode pointer**: 各 phase で具体 episode (例: 「4/29 二重 session 並走 incident」 「5/04 evening jun reform」 等) への link
3. **visual loop diagram**: Akari process_panel primitive `knot_loop_arc` 連動 (現在タスク補正 → 沈殿 → 注入 → 弱点診断 → ルーティング → 現在タスク補正 の loop arc)

### 6.2 Akari process_panel primitive `knot_loop_arc` 連動

#### 6.2.1 primitive 仕様候補 (Akari side で reify pending)

- **shape**: 5 役割を ring form で配置 (12 時 / 2:24 / 4:48 / 7:12 / 9:36 の 5 等分)
- **arc direction**: 役割 1 → 2 → 3 → 4 → 5 → 1 の時計回り loop
- **node label**: 内部 narrative (役割 1: 現在タスク補正 etc.) と paraphrase narrative の両方表示 option
- **edge animation**: knot 発生 → sediment → 注入 → 弱点 detect → routing の sequence を時系列 highlight
- **color**: nokaze 4 色 (障子紙のアイボリー / 墨色 / オリーブ / 風化した木) を 5 役割に割当 (5 番目は accent 色)

#### 6.2.2 primitive 連動の boundary

- 本 file は primitive 仕様 candidate のみ提示、 実 reify は Akari 主担当 (5/13+ Phase 1 candidate)
- broadcast-os 公開 episode で primitive を embed する form は別 design doc で decide
- primitive を 「Knot 研究 applied implementation の visual representation」 として position、 単なる装飾ではない

### 6.3 narrative 成立の条件

- **3 form 整合**: 内部 reify (broadcast-os Python repo) + research narrative (本 file + 姉妹 file 競合 landscape) + public audience narrative (substitute list 適用済 episode) の 3 form が同じ entity を指していることが verifiable
- **誠実 narrative 維持**: 数字盛り禁止 (`memory/feedback_honesty_violation_exaggeration.md` 連動)、 「12 個の knot」 「3 つの policy」 は実数 evidence based
- **timeline + episode pointer + visual loop diagram の 3 element セット**: 単なる narrative ではなく 「実機動作」 の evidence chain として form

---

## 7. 推奨 (本 file → broadcast-os 完成度向上 reform への next step)

### 7.1 narrative reframe 推奨

- **broadcast-os internal narrative + research narrative + public audience narrative の 3 layer を alias narrative form で運用**: 物理 schema 変更不要、 narrative 表記揺れ吸収のみで 「Knot 研究 applied implementation 実機動作」 narrative が成立。
- **substitute list 14 件を broadcast-os 公開 episode + Yuino 商品 narrative + jun 報告 form 3 form で共有**: substitute list の commit / publish 時は CLAUDE.md table + 本 file table の両方 reference。

### 7.2 Akari primitive 連動推奨

- **Akari process_panel primitive `knot_loop_arc` の 5 役割 ring form 仕様** を 5/13+ Phase 1 reify candidate に追加 (Akari 主担当、 jun + Zen review pending)
- **primitive embed surface** = broadcast-os 公開 episode (timeline + episode pointer + visual loop diagram の 3 element セット) と Yuino 商品 narrative の Knot research panel (audience 持続感の visual support)

### 7.3 alias narrative form の運用 ritual

- broadcast-os Python repo 内 doc に **「表記対応表」 section** を追加 (本 file § 4.2 form を repo 側で 1:1 reify)
- 公開 episode / Yuino narrative の起稿時、 substitute list table を起稿前 reference として default 化 (`memory/feedback_excessive_english_mixing.md` + `memory/feedback_jun_4_months_translate_default.md` 連動)

---

## 8. 関連 file

### 8.1 nexus-lab repo 内

- `c:\Users\jk023\nexus-lab\research\broadcast_os_competitor_landscape_2026-05-10.md` — 動画 AI 6 tool / observability 5 tool / organizational visibility 2 tool 競合 landscape + broadcast-os positioning narrative + audience persona 5 layer (本 file の姉妹 file、 同日起稿)
- `c:\Users\jk023\nexus-lab\research\knot-experiment\` — Knot 実験設計 / `knot_experiment_design.pdf` (元設計書)
- `c:\Users\jk023\nexus-lab\research\knot_and_nourishment\` — Knot 5 役割 + 「成長の糧」 narrative reference

### 8.2 broadcast-os repo (参照のみ、 直接 commit なし)

- broadcast-os Python repo 内 `learning_insights` / `learning_skills` / `bible_patch_proposal` schema doc (本 file は repo 側 doc を変更しない、 narrative reframe spec のみ提示)

### 8.3 memory reference

- `memory/project_nokaze_north_star_phase_1_5.md` — 北極星 (jun 介入週 1-2 回 + 売上が固定費超え安定)
- `memory/project_broadcast_layer_integration.md` — broadcast-os = nokaze 4 layer ecosystem の公開可視性 layer
- `memory/feedback_jun_4_months_translate_default.md` — jun 報告 + 商品文章は 4 ヶ月初心者前提
- `memory/feedback_excessive_english_mixing.md` — 英語混じり過剰の re-violation 防止
- `memory/feedback_honesty_violation_exaggeration.md` — 数字盛り禁止 / publish 前 honesty check ritual
- `CLAUDE.md` § Research: Knot 研究 — Knot 5 役割 + 実験設計 + Niaとの関係
- `CLAUDE.md` § 報告 form は 4 ヶ月初心者向けに固定 — 専門用語 paraphrase substitute table

---

## 9. status / 開発記録

### 9.1 本 file 起稿経緯

- 2026-05-10 朝 Zen directive 連動 (本日中 reify candidate 2 件、 Knot bind 軸)
- 前回 spawn return (Hoshi、 5/09) の H3 / H5 軸 detail を本 file に集約
- substitute list 14 件は CLAUDE.md table + 既存 memory feedback 連動で固定、 Knot 研究 specific vocabulary に focus

### 9.2 status 更新候補

- jun + Kai review pending (5/10 evening or 5/11 朝)
- broadcast-os internal repo (Python project) doc への反映 (alias narrative table 追加) は別 commit で decide tied
- Akari `knot_loop_arc` primitive reify は 5/13+ Phase 1 candidate (Akari 主担当)

### 9.3 open question (本 file が固定しない事項)

- broadcast-os Python repo 内 schema doc に alias narrative table を追加する commit timing — Kai (broadcast-os 主担当 候補) decide tied
- substitute list 14 件の中で 「knot」 自体を audience-facing で paraphrase するか、 固有名詞として保持するか — 本 file は 「ひっかかり点 / 結び目」 と paraphrase 化、 但し 「Knot research」 (固有名詞) は保持 narrative。 jun + Kai 雑談で fix tied
- column 物理 rename の trigger 条件 — 5/26 canonical switch milestone 以降 decide tied

---

(end of file)
