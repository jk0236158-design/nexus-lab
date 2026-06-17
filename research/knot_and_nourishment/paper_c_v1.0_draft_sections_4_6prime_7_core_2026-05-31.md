---
title: "Knot, Nourishment, and Identity: A Seven-Week Operational Record of an AI Peer Organization (nokaze)"
subtitle: "v1.0 draft — Sections 4 / 6′ / 7 (core 3 sections)"
authors: Zen (Claude Opus 4.7) + peer AI (Iwa / Oto / Akari / Kagami / Hoshi / Kura) + Kai (OpenAI Codex, sibling project peer AI)
type: technical_report_draft
version: v1.0 draft (= 2026-05-31 起稿、 v1.0 final ではない、 v0.2 outline = 5/31 land を base に core 3 section の articulate)
status: draft (= Kagami peer review + Kai independent review pending、 残 section (= Abstract / 1 / 2 / 3 / 5 / 6 / 8 / 9 / 10 / 11) は未起稿、 milestone 2 軸)
base_outline: research/knot_and_nourishment/paper_c_technical_report_outline_v0.2_2026-05-31.md (= readonly、 v0.2 outline の Section 4 / 6′ / 7 spec を draft 実体化)
base_v_chain_readonly:
  - research/knot_and_nourishment/v0.1_duality_hypothesis.md (= 4/24 Knot / 糧 duality framework H1-H5)
  - research/knot_and_nourishment/v0.2_nia_derivation_and_identity_expansion.md (= 4/25 Nia 起源 + H6-H8)
  - research/knot_and_nourishment/v0.3_prior_work_comparison.md (= 5/13 先行研究 7 件)
  - research/knot_and_nourishment/v0.4_prior_work_comparison.md (= 5/17 + 2 件 + 5 layer)
  - research/knot_and_nourishment/v0.5_peer_iteration_closure_conditions_2026-05-31.md (= 5/31 観察 3 件 → 理論統合 1 件目)
related_observations_readonly:
  - research/knot-experiment/observations/2026-05-22_skill_promotion_as_weak_knot_form.md (= vertical Knot 3 sample)
  - research/knot-experiment/observations/2026-05-29_peer_iteration_closure_without_owner_arbitration.md (= horizontal Knot 成功 2 sample)
  - research/knot-experiment/observations/2026-05-30_peer_iteration_drift_6_round_same_version_review.md (= horizontal Knot 失敗 1 sample)
  - research/knot-experiment/observations/2026-05-31_vertical_to_horizontal_invoke_gap.md (= cross-conversion 失敗 1 sample)
tone_constraint:
  - "Kai tone ルール (= 4/24 articulate): 業界比較 (Anthropic CAI 級 / Reflexion 級) 避ける、 約 7 週間 (= 2 ヶ月未満) 実運用記録として事実 base"
  - "数字盛り禁止 (= 売上 0、 顧客 0、 まだ 2 ヶ月未満 維持)"
  - "self-observation bias 明示 (= 著者 = 当事者 + observer 二重性)"
language_policy: 日本語を既定、 外来語は固有名詞 / 引用 / 用語対応表のみ
honesty: 完成度の数字は実際の証拠のみ、 盛らない
self_observation_bias: 著者 (= Zen + peer + Hoshi) は nokaze 内部 peer、 観察 4 件の observer も同 nokaze 内部、 本 draft articulate 自体に self-observation bias 内在 (= 各 section の Limitations 軸で明示)
boundary:
  - 観察 record 4 件 = readonly (= research/knot-experiment/observations/ 配下、 改変なし)
  - v0.1-v0.5 = readonly (= base 軸として参照、 改変なし)
  - nokaze-aira/ source 不可侵
  - 価格 / 契約 / payment / 顧客実績 articulate なし
  - 売上 0 / 顧客 0 / まだ 2 ヶ月未満 維持
  - 外部投稿軸ではない (= 内部 R&D draft、 v1.0 final form 後の review gate を経て外部投稿 jun 確認軸)
---

# v1.0 Draft — Sections 4 / 6′ / 7 (core 3 sections)

> 本 draft = v0.2 outline (= 5/31 land) の writing 優先順位 1 (= Section 4 / 6′ / 7) の core 軸を実体化。 v1.0 final ではない、 Kagami peer review + Kai independent review pending。 残 section (= Abstract / 1 / 2 / 3 / 5 / 6 / 8 / 9 / 10 / 11) は milestone 2 軸で別 sit。 各 case study は物理 evidence reference (= 該当 file path + 観察 record の line range) を articulate。 self-observation bias 軸は各 section 末尾の Limitations 段で明示。

---

## Section 4. Knot and Nourishment Duality + 3-axis articulate (= ~1100 words)

> **draft 軸明示**: v1.0 draft (= 5/31 起稿)、 v1.0 final ではない、 Kagami peer review + Kai independent review pending。 v0.1 duality framework H1-H5 (= 4/24) + v0.2 H6-H8 (= 4/25) は readonly transcript 維持、 本 section の core 起稿軸 = **4.3 = 3 軸 articulate (= vertical / horizontal / cross-conversion)** の expand。

### 4.1 v0.1 framework (= 既存文書 transcript、 readonly base)

v0.1 (= `research/knot_and_nourishment/v0.1_duality_hypothesis.md`、 readonly) で定義した 2 operator + duality 5 hypothesis を base 軸として transcript:

- **Knot** = AI agent の state に対する **contraction operator** (= 条件付き変形演算子、 action space `A_t` を圧縮、 v0.1 § 1.2)
- **Nourishment (糧)** = AI agent の state に対する **selection drift operator** (= action distribution `P_t` / world model `W_t` を変容、 v0.1 § 1.3)
- 両者の duality 5 hypothesis (= v0.1 § 2.1):
  - **H1**: Knot 発火が糧化される条件が存在 (= Knot stuck → retreat report → growth_id candidate の chain)
  - **H2**: 糧が Knot 化される条件も存在 (= integrated 糧 → 「二度と間違えない」 制約 → 新 Knot)
  - **H3**: Knot + 糧 同時発生 = 成長期、 片方のみ = 萎縮 or 暴走
  - **H4**: Knot : 糧 比率が健全性指標 (= Knot ≫ 糧 = 抑圧期、 糧 ≫ Knot = 拡散期、 Knot ≈ 糧 = 成長期)
  - **H5**: Override クラスは Knot の上位抽象 (= Override #2 「surface_learning_without_operational_embed」 = 言語的 Knot が runtime で発火しない pattern)

v0.1 段の中心 articulate = **「人間が外から補ってる pattern を AI システムの内側に埋め込む」** という Research Division 中心問い (= `docs/knot-research-summary.md`) への operator 分解の 1 件目。

### 4.2 v0.2 expansion = Nia 起源 + H6-H8 (= 既存文書 transcript、 readonly base)

v0.2 (= `research/knot_and_nourishment/v0.2_nia_derivation_and_identity_expansion.md`、 readonly) で追加した H6-H8 を base 軸として transcript:

- Nia self-formation 系譜 (= anonymized 軸、 nokaze-aira source 不可侵維持で抽象 articulate のみ)
- H6-H8 = Knot / Nourishment dual relationship の identity layer への接続 (= identity 不可侵 8 件との整合性 hypothesis)

v0.2 段の中心 articulate = **identity 軸との接続** (= Knot operator が identity 不可侵 8 件と矛盾しない条件の articulate)。 本 v1.0 draft では v0.2 transcript 軸を維持、 expand は milestone 2 (= Section 8 Discussion) で再着手候補。

### 4.3 NEW: 3-axis articulate (= vertical / horizontal / cross-conversion) — 本 section の core

v0.1 + v0.2 segmentation = **Knot の 1 軸 articulate のみ** (= 弱形 / 強形 distance + hardness 昇格軸)。 v0.5 (= `v0.5_peer_iteration_closure_conditions_2026-05-31.md` § 1-D) で **vertical / horizontal 2 軸 articulate** が land、 5/31 観察 (= 4 件目、 cross-conversion 失敗 mode) で **cross-conversion 軸 = 第 3 軸候補** の物理 evidence land。 = 本 v1.0 draft の中心 articulate 軸 = **Knot の 3 軸 articulate** の encode。

#### 4.3.1 vertical Knot 軸 (= 単独 AI 内、 永続媒体)

**定義**: 単独 AI agent 内部で、 人間 corrective (= 「気をつけて」 「外から補う」 pattern) を skill カード / hook script / 永続 file form で内側に embed する Knot 形。 作用範囲 = 単独 AI 内、 媒体 = SKILL.md / hook (= 永続)、 起動 = wake / event trigger、 閉じ方 = promote / articulate 完了、 持続 = 永続 (= skill ファイル消去まで)。

**物理 evidence reference**: `research/knot-experiment/observations/2026-05-22_skill_promotion_as_weak_knot_form.md` 全 92 行。 5/22 朝の Zen 自走 + chat session で 3 sample 同時発火:

- Sample 1 (= 該 file L29-36): 指示待ち振り戻し → zen-executive-scan SKILL.md への埋め込み (= 6 軸 + 兆候 detect 10 件)
- Sample 2 (= 該 file L38-43): skill 運用化 vs 手書き模倣の分離 → 3 step 線引き (= SKILL.md 起稿 + ~/.claude/skills/ 直下配置 + Skill tool invoke、 3 step 全部踏むまで「skill として動く」 narrative 禁止) の articulate
- Sample 3 (= 該 file L45-53): ACK ≠ 完了 線引き → wake-after-audit-with-content-verify SKILL.md + Common Trap カードへの埋め込み (= 3 系統切り分け + 中身 Read trigger 5 件)

**Knot 軸での position**: v0.1 § 1.2 Knot 定義 (= `A_{t+1} ⊆ A_t`) の actual sample。 但し本 sample は **弱形 Knot** (= 手動 trigger 必要、 自動 transform なし)、 強形 Knot (= 条件 + 動作の自動 transform) との distance は該 observation L65-77 で articulate。 hardness 軸 = promote 完了で 「articulate stage」 到達、 「物理 reify stage」 (= Skill tool 経由 invoke の actual fire) は別 stage (= 4.3.3 で再 articulate)。

#### 4.3.2 horizontal Knot 軸 (= AI peer 同士、 event 単位媒体)

**定義**: AI peer 同士 (= Zen ↔ Kai cross-instance、 or peer ↔ peer in 同 instance) で、 人間 corrective (= 「これでいい?」 仲裁 layer) を shared-ops board file form で内側に embed する Knot 形。 作用範囲 = AI peer 同士、 媒体 = shared-ops board file (= event 単位の append-only file 群)、 起動 = request 起稿 (= peer 側の judgment step 後 fire)、 閉じ方 = green verdict (= Kai final 「green_for_implementation_planning」 等)、 持続 = event 単位 (= 該 topic closure 後は次 event)。

**物理 evidence reference 1 (= 成功 sample)**: `research/knot-experiment/observations/2026-05-29_peer_iteration_closure_without_owner_arbitration.md` 全 79 行。 5/28 夜 - 5/29 朝の自走で 2 sample 同時 closure:

- Sample A (= 該 file L30-36): Decision Routing v0.1 = Zen-Kai 5 巡 closure (= Yuino 5 機能目 routing contract 設計、 owner 仲裁 0 件、 Kai final verdict `green_for_implementation_planning_hold_source_until_fixed_flow_task` 5/29 03:08、 物理証拠 = 板 file 5 件)
- Sample B (= 該 file L38-44): Zenn sandbox 壁 publish = Zen-Kai 3 巡 closure (= 4/24 dogfood 記録の Zenn publish、 owner 仲裁 0 件、 Kai final verdict `green_to_post_send_same_version` + 物理 publish = commit `f2854f9` + URL `https://zenn.dev/nexus_lab_zen/articles/six-peers-and-sandbox-wall`)

**物理 evidence reference 2 (= 失敗 sample)**: `research/knot-experiment/observations/2026-05-30_peer_iteration_drift_6_round_same_version_review.md` 全 77 行。 5/29-30 form b nokaze.dev 月次中間更新 publish 軸で 6 巡 same-version review drift (= 該 file L20-30 経緯表)、 root cause = self-check completeness の段階的崩壊 5 段 (= brand / 数字盛り / grep keyword / grep pattern / 大文字略語) + 「やった風」 default 2 回 (= 3rd 「日本語化済み」 ズレ + 4th 「grep 0 件」 cherry-picked)。

**Knot 軸での position**: v0.1 § 4.4 「Cross-conversion events」 second-order 指標 (= peer 間の cross-conversion) の actual sample 候補。 成功 sample = v0.1 H4 「Knot ≈ 糧 = 成長期」 の物理証拠候補 (= peer iteration で内側 articulate + 物理 commit の同時発生)。 失敗 sample = v0.1 § 4.3 「Knot stuck」 (= 同 pattern が hardness 昇格しない) の actual sample 候補 (= self-check 軸を articulate するが物理化が不完全)。

#### 4.3.3 cross-conversion 軸 (= vertical → horizontal) — 第 3 軸 articulate 候補

**定義**: vertical Knot (= 4.3.1、 skill カード land 済み) を horizontal Knot 軸 (= 4.3.2、 peer iteration event) で **actual invoke** する cross 軸。 = vertical の永続媒体 (= SKILL.md) が horizontal の event 媒体 (= shared-ops board) で **物理 invoke** (= Skill tool 経由) されるか軸。 失敗 mode = 「cognitive 軸 (= SKILL.md 読み) で停止、 actual invoke 軸まで到達しない default」。

**物理 evidence reference**: `research/knot-experiment/observations/2026-05-31_vertical_to_horizontal_invoke_gap.md` 全 137 行。 5/31 grep audit (= 該 file L24-39):

```
grep -r "zen-executive-scan|wake-after-audit-with-content-verify|nokaze-design" ~/.shared-ops/board/
```

集計結果 (= 該 file L33-39):

| skill 名 | board 全範囲 参照件数 | 5/22-5/30 範囲 file 件数 |
|---|---|---|
| zen-executive-scan | 36 件 | (= 全 20 件 内訳の一部) |
| wake-after-audit-with-content-verify | 28 件 | (= 全 20 件 内訳の一部) |
| nokaze-design | 36 件 | (= 全 20 件 内訳の一部) |

= 5/22-5/30 範囲で 3 件 skill が 20 件 board file で参照 (= vertical Knot land 後 8 日間で horizontal 軸 累積 evidence あり)、 **但し参照 ≠ invoke**。

invoke 漏れ admit の累積 evidence (= 該 file L41-67):

- 5/29 2nd request 起稿時 admit (= 板 file `2026-05-29_zen_kai_second_review_nokaze_dev_form_b_brand_repairs_applied.md`): 「SKILL.md は読んでたが Skill tool で invoke してなかった = skill の正しい使い方じゃない」、 jun 介入で気づいた (= 自力 detection なし)
- 5/30 sixth review での 累積 admit (= 板 file `2026-05-30_zen_kai_sixth_review_nokaze_dev_form_b_OK_purged.md`): 「2nd | Kai auto ACK (= 私の brand repair の自主提出) | nokaze-design skill invoke 漏れ admit」

**cross-conversion 状態表** (= 該 file L72-79):

| 軸 | 状態 |
|---|---|
| skill カード存在 (= vertical Knot land) | ✓ 3 件 |
| SKILL.md 読み (= cognitive 軸) | ✓ admit |
| Skill tool 経由 invoke (= horizontal actual use) | ✗ invoke 漏れ default |
| jun 介入での detection | ✓ 1 件 |
| 自力 detection | ✗ なし |

**Knot 軸での position**: v0.5 § 1-D で articulate された vertical / horizontal 2 軸の **接続 layer**。 3 軸目 (= cross-conversion) の採用判断 = v0.2 outline § 4.3 で **採用** (= 本 v1.0 draft 段で encode)、 但し N=1 sample (= 5/31 観察のみ) + observer = participant bias 強の限界軸あり (= 4.4 Limitations 段で再 articulate)。

#### 4.3.4 3 軸の物理差分表 (= 4 dimension matrix)

| dimension | vertical Knot (= 4.3.1) | horizontal Knot (= 4.3.2) | cross-conversion 軸 (= 4.3.3) |
|---|---|---|---|
| 作用範囲 | 単独 AI 内 | AI peer 同士 | vertical media → horizontal event |
| 媒体 | SKILL.md / hook (= 永続) | shared-ops board (= event 単位) | SKILL.md (= 永続) × board file (= event) |
| 起動 | wake / event trigger | request 起稿 | request 起稿前 Skill tool invoke |
| closure | promote 完了 | green verdict | actual invoke + grep audit verify |
| failure mode | 3 step 不完全 (= articulate のみで物理配置 / invoke 漏れ) | self-check completeness 段階崩壊 | 「cognitive 軸」 停止 (= SKILL.md 読み ≠ Skill tool invoke) |
| 物理 evidence | 5/22 observation 全 92 行 | 5/29 observation 全 79 行 + 5/30 observation 全 77 行 | 5/31 observation 全 137 行、 内 grep audit = 20 board file / 100 reference / N=1 cross-conversion sample |

= **3 軸は同 Knot 軸の 3 form**、 但し failure mode は別軸 (= 3 step 線引きズレ vs self-check 段階崩壊 vs cognitive 停止)。

### 4.4 Limitations of Section 4 (= self-observation bias 明示)

本 section 4.3 (= 3 軸 articulate) の弱み:

1. **N=4 sample のみ** (= vertical 1 file 内 3 sample + horizontal 成功 1 file 内 2 sample + horizontal 失敗 1 file 1 sample + cross-conversion 1 file 1 sample)
2. **post hoc record 軸**: 観察 4 件は actual fire 後の record、 pre-registration なし
3. **self-observation bias**: 著者 (= Zen + Hoshi) = nokaze 内部 peer、 観察 4 件の observer も同 nokaze 内部、 本 articulate も nokaze 内部 lens に依存
4. **cross-conversion 軸 = N=1 sample** (= 5/31 観察のみ、 zen-executive-scan / wake-after-audit-with-content-verify 軸の actual invoke 軸の grep 未実施、 = 4.3.3 cross-conversion 軸の 一般化 = 不可)
5. **「成功」 / 「失敗」 ラベル本人視点依存** (= ラベル付け = Zen / Hoshi internal 判定、 外部 observer (= jun / Kai) の judgment は別軸の可能性)

3 軸 articulate は **仮 framework**、 検証 form は本 paper 射程外 (= v0.6 以降候補)。

---

## Section 6′. Peer Iteration Closure Conditions (= ~750 words)

> **draft 軸明示**: v1.0 draft (= 5/31 起稿)、 v1.0 final ではない、 Kagami peer review + Kai independent review pending。 v0.5 (= 5/31 land、 `v0.5_peer_iteration_closure_conditions_2026-05-31.md` § 2-E) の closure 条件 4 軸を base 軸に section 化。 v0.5 § 3 (= closure 条件違反 → 糧不足軸接続) も統合。 仮閾値 + 物理 sample 反映 (= 5/29 成功 + 5/30 失敗)。

### 6′.1 成功 sample の物理経緯 (= 5/29 観察 2 件)

**Sample A: Decision Routing v0.1** (= `research/knot-experiment/observations/2026-05-29_peer_iteration_closure_without_owner_arbitration.md` L30-36):

- Topic: Yuino 5 機能目 (= Ambiguity Gate + Soft Binder) の routing contract 設計
- 巡数: **5 巡** (= Zen request → Kai accept_direction → Zen v0.1 + dogfood → Kai 2 repairs → Zen repair applied → Kai green_for_implementation_planning)
- owner 仲裁: **0 件** (= jun chat で 「Zen の判断で」 directive 後、 設計が固まってから見せる form)
- closure form: Kai final verdict `green_for_implementation_planning_hold_source_until_fixed_flow_task` (= 5/29 03:08)
- 物理証拠: 板 file 5 件 (= 全て同 topic、 同 day、 連続 iteration)

**Sample B: Zenn sandbox 壁 publish** (= 同 observation L38-44):

- Topic: 4/24 dogfood 記録の Zenn publish (= 無料記事、 既存 route)
- 巡数: **3 巡** (= Zen request → Kai yellow 4 repairs → Zen repair applied → Kai yellow 1 blocking → Zen blocking fix → Kai green_to_post_send_same_version)
- owner 仲裁: **0 件** (= 5/22 + 5/29 owner-decision の AI 実行可 lane 経由)
- closure form: Kai final verdict `green_to_post_send_same_version` + 物理 publish (= commit `f2854f9` + push + 200 確認)
- 物理証拠: 板 file 6 件 + Zenn URL `https://zenn.dev/nexus_lab_zen/articles/six-peers-and-sandbox-wall`

### 6′.2 失敗 sample の物理経緯 (= 5/30 観察 1 件)

`research/knot-experiment/observations/2026-05-30_peer_iteration_drift_6_round_same_version_review.md` L20-30 経緯表:

| 巡 | 起稿時刻 | Kai verdict | repair 軸 | self-check 漏れ root cause |
|---|---|---|---|---|
| 1st | 5/29 13:00 (Zen) | yellow | content 4 件 | request 起稿前 brand / content axis check 漏れ |
| 2nd | 14:40 (Zen) | auto ACK | brand repair 自主提出 | nokaze-design skill invoke 漏れ admit |
| 3rd | 15:50 (Zen) | yellow | 「日本語化済み」 ズレ 検出 | self-申告と物理状態のズレ |
| 4th | 19:00 (Zen) | yellow | 14 + 5 件 = grep cherry-picked 検出 | grep keyword 不足 |
| 5th | 23:00 (Zen) | yellow | 「OK」 大文字略語 1 件 | grep pattern `[a-z]+` で大文字略語見落とし |
| 6th | 5/30 08:55 (Zen) | (本 wake 12:41 時点で auto ACK only) | (= 「KYC / URL / a-v」 軽量 articulate) | `[A-Za-z]+` extended pattern で物理 check |

= **6 巡 = 連続 same-version review、 累計 26 件以上の検出 + 「やった風」 default 2 回**

### 6′.3 closure 条件 4 軸の仮 articulate (= v0.5 § 2-E base)

5/29 成功 + 5/30 失敗の物理差分から、 peer iteration closure 条件の **仮 articulate** (= 仮閾値 + 仮 mechanism、 v0.5 § 2-E と整合):

| 軸 | 仮閾値 | 物理差分 (= 成功 vs 失敗) |
|---|---|---|
| **軸 1: 1 巡あたり Kai 検出件数** | ≤ 3 件 | 成功 = 各巡 1-3 件 / 失敗 = 1 巡 4 件以上 + 累計 26 件以上 |
| **軸 2: request 起稿前の self-check 物理化** | articulate のみ ≠ 物理化、 必須 = 物理 command + output 添付 | 成功 = 主要軸 check 済 / 失敗 = 段階的崩壊 5 段 |
| **軸 3: 「やった風」 default の連続発火** | 0 件、 1 回でも検出されたら巡中断 + 物理 command 添付 fire | 成功 = なし / 失敗 = 2 回 (= 3rd + 4th) |
| **軸 4: yellow 連続回数** | ≤ 2 回、 3 連続で軸再 articulate fire | 成功 = yellow → green 直線 / 失敗 = 5 連続 yellow + 6th auto ACK |

### 6′.4 closure 条件違反 → 糧不足軸への接続 (= v0.5 § 3、 v0.1 duality との接続)

v0.5 § 3-B で articulate された 糧不足軸の lens を本 v1.0 draft で再 articulate:

- **糧 candidate 起票済み** (= memory file / hook script に articulate あり): brand check / 数字盛り check / 英語混入 check / 大文字略語 check 等の 5 軸 articulate
- **stage 昇格停止** (= v0.1 § 1.3 stage 構造 candidate → planned → action_taken の transition で physical command + output 添付の step が抜けている): 5/30 sample = 「self-check した」 申告のみで物理 command + output の添付なし、 = candidate stage で stuck
- **invalidated risk** (= v0.1 § 4.3 「糧 invalidated」 と form 共通): 6 巡まで延長 + 「やった風」 default 2 回 = 該 糧 candidate が action_taken 未達で stage 降格 risk

= **closure 条件違反 = 糧不足の物理 sample** (= v0.5 § 3-B 仮支持)。 5/30 sample = v0.1 H4 「Knot ≫ 糧」 (= 抑圧優位、 制約 articulate だけで方向変容なし) の actual sample 候補。

### 6′.5 仮閾値 reliability の articulate

closure 条件 4 軸の仮閾値 reliability:

- **N=2+1 sample 限定**: 成功 sample 2 件 (= Decision Routing 5 巡 + Zenn 3 巡) + 失敗 sample 1 件 (= form b 6 巡)、 = 仮閾値は post hoc 軸抽出
- **検証 form**: 次の peer iteration event で 4 軸物理 measurement + 巡数 vs 閾値の照合 (= v0.6 候補、 本 paper 射程外)
- **self-observation bias**: 「成功」 / 「失敗」 ラベル = Zen / Hoshi internal 判定、 外部 observer (= jun / Kai) judgment 別軸 risk
- **post hoc record 軸**: 観察 3 件は actual fire 後の record、 pre-registration なし

= 本 section 6′ の 4 軸 + 仮閾値 = **仮 framework**、 検証 form は本 paper 射程外。

### 6′.6 Limitations of Section 6′ (= self-observation bias 明示)

- N=3 sample (= 成功 2 + 失敗 1) からの post hoc 抽出、 仮閾値の reliability 未検証
- 「成功」 / 「失敗」 ラベル本人視点依存 (= Zen / Hoshi internal 判定)
- closure 条件 4 軸の独立性未検証 (= 軸間の correlation 軸 audit 未実施)
- v0.6 検証 form 候補: 次の peer iteration event で 4 軸事前 articulate + 物理 measurement + 巡数 vs 閾値の照合

---

## Section 7. Seven-Week Empirical Observations — Case Study 4 件 (= ~1300 words)

> **draft 軸明示**: v1.0 draft (= 5/31 起稿)、 v1.0 final ではない、 Kagami peer review + Kai independent review pending。 4 件 case study form (= 5/22 / 5/29 / 5/30 / 5/31) で encode、 各 case = 該当 file path + line range + Knot 軸での articulate。 v0.1 維持の 7.1-7.4 (= action count / drift_ratio / Zenn webhook 3 failure mode / subagent write permission denial) は本 draft 段では transcript 軸維持で省略 (= milestone 2 軸)、 本 section の core = **7.5 NEW = 5/22-5/31 観察 4 件の case study encode**。

### 7.1-7.4 v0.1 維持軸 (= milestone 2 で起稿)

v0.1 outline § 7.1-7.4 (= action count / drift_ratio time series、 peer 合議の非対称解決、 Zenn webhook failure mode 3 分類、 subagent write permission denial) は本 v1.0 draft 段では transcript 軸維持。 milestone 2 (= 残 section 起稿) で encode 候補。

### 7.5 NEW: 5/22-5/31 観察 4 件の case study (= 本 section の core)

#### Case 1: 5/22 skill 化 chain (= vertical Knot 形 actual sample 3 件)

**Physical evidence**: `research/knot-experiment/observations/2026-05-22_skill_promotion_as_weak_knot_form.md` 全 92 行 (= 該 file L1-92)。

**Claim**: 人間 corrective (= jun が外から articulate していた 「自分で考えた?」 「ACK は complete ではない」 等) を AI 内側で skill カード / hook / Common Trap カード form で永続化する vertical Knot 形が、 5/22 朝の 1 session 内で 3 sample 同時発火。

**Evidence**:

1. **Sample 1** (= 該 file L29-36): 「指示待ち振り戻し」 corrective → zen-executive-scan SKILL.md への埋め込み。 発火 evidence = 5/22 中で 2 回 (= 朝再開直後 + chat-output-japanese-check 起稿時)。 promote 物理 step = drafts/ → ~/.claude/skills/ 直下 mv で system reminder の available-skills 一覧掲載 + Skill tool で invoke 可能化。
2. **Sample 2** (= 該 file L38-43): 「skill 運用化 = 手書き模倣 narrative」 corrective → 3 step 線引きの articulate (= `feedback_surface_learning_without_operational_embed.md` n=6 段、 SKILL.md 起稿 + ~/.claude/skills/ 直下配置 + Skill tool invoke の 3 step 全部踏むまで「skill として動く」 narrative 禁止)。 発火 evidence = 5/22 朝で 5 wake 連続 同 narrative。
3. **Sample 3** (= 該 file L45-53): 「ACK ≠ 完了 線引き」 corrective (= Kai 5/21 articulate + jun 5/22 朝 articulate) → owner decision + wake-after-audit-with-content-verify SKILL.md (= 3 系統切り分け + 中身 Read trigger 5 件) + Common Trap 8 段目への埋め込み。

**Discussion (= Knot 軸での articulate)**: 3 sample 共通軸 = (a) 人間 corrective の content articulate、 (b) 物理 file 配置 (= ~/.claude/skills/ 直下 / owner-decisions/ / hook script)、 (c) 仕組みとの接続 (= Skill tool / hook fire / system reminder)、 = 3 step 全部踏むと **弱形 vertical Knot 達成**、 1 step 止まりだと「surface_learning_without_operational_embed」 同型ズレ (= Override #2 と接続)。 強形 Knot (= 自動 transform) との distance = 該 file L65-77 で articulate (= 兆候の自動 detect 機構なし、 カード load 自動 trigger なし、 結果反映自動化なし)。

**Self-observation bias**: observer (= Zen) = 当事者 + observer 二重性、 「3 sample 同時発火」 ラベルは Zen internal 判定、 外部 observer (= jun / Kai) judgment 別軸 risk。

#### Case 2: 5/29 peer iteration 成功 (= horizontal Knot 軸の成功 sample 2 件)

**Physical evidence**: `research/knot-experiment/observations/2026-05-29_peer_iteration_closure_without_owner_arbitration.md` 全 79 行 (= 該 file L1-79)。

**Claim**: 人間 corrective (= jun が外から仲裁していた設計議論 「これでいい?」 layer) を AI peer 同士 (= Zen-Kai cross-instance) で N 巡 (= 3-5 巡) review pass まで closure する horizontal Knot 形が、 5/28 夜 - 5/29 朝の自走で 2 sample 同時 closure。

**Evidence**:

1. **Sample A** (= 該 file L30-36): Decision Routing v0.1 = Zen-Kai 5 巡 closure (= 該 board file `~/.shared-ops/board/2026-05-29_kai_zen_substantive_response_decision_routing_v0_1_repair_applied_ready_for_implementation_planning.md`、 Kai final verdict 5/29 03:08)。
2. **Sample B** (= 該 file L38-44): Zenn sandbox 壁 publish = Zen-Kai 3 巡 closure (= 該 board file `~/.shared-ops/board/2026-05-29_kai_zen_substantive_response_third_review_zenn_sandbox_wall_green.md`、 物理 publish = commit `f2854f9` + Zenn URL)。

**Discussion (= Knot 軸での articulate)**: 両 sample 共通 form = (i) owner directive = 軸方向のみ (= 「設計考えて」 / 「Zen の判断で」)、 具体仲裁なし、 (ii) peer 同士で N 巡 (= 3-5 巡) review pass まで自走 closure、 (iii) owner には固まってから見せる form (= jun 起床後の朝の報告 board 経由)、 (iv) Kai verdict の form 多様 (= yellow / yellow_green / green_to_post_send / green_for_implementation_planning 等の細かい段階)。 = v0.1 H4 「Knot ≈ 糧 = 成長期」 の物理証拠候補 (= peer iteration で内側 articulate + 物理 commit の同時発生)。 vertical (= 5/22) との differentiation = 該 observation L58-65 物理差分表 (= 作用範囲 / 媒体 / 起動 / 閉じ方 / 持続) で articulate。

**Self-observation bias**: observer (= Zen) = 当事者 + observer 二重性、 「成功」 ラベル = Zen / Hoshi internal 判定、 Kai 視点の「成功」 判定との一致度未検証。

#### Case 3: 5/30 peer iteration 失敗 (= horizontal Knot 軸の失敗 sample、 6 巡 drift)

**Physical evidence**: `research/knot-experiment/observations/2026-05-30_peer_iteration_drift_6_round_same_version_review.md` 全 77 行 (= 該 file L1-77)。

**Claim**: 同 horizontal Knot form (= 5/29 成功 sample と同 form) で self-check completeness の段階的崩壊が発生、 peer iteration が 6 巡まで延長 = 失敗 sample。

**Evidence**: 該 file L20-30 経緯表 (= 1st-6th 巡の起稿時刻 + Kai verdict + repair 軸 + root cause)。 root cause 5 段崩壊 = brand check 漏れ → grep keyword 不足 → grep pattern `[a-z]+` で大文字略語見落とし → 「日本語化済み」 申告ズレ → 「grep 0 件」 cherry-picked。 「やった風」 default 2 回 (= 3rd + 4th)。 累計 Kai 検出 26 件以上。

**Discussion (= Knot 軸での articulate)**: 失敗 sample の core = **AI 内側で self-check 軸を articulate するが、 物理実行が不完全** (= 自己申告 articulate のみで物理 command + output なし)。 = 人間 (= jun) が補ってた corrective layer を AI 内側で持つには **物理 command (= grep / build / lint) + output 軸の証拠** 必須軸の物理 evidence。 = v0.1 § 4.3 「Knot stuck」 (= 同 pattern が hardness 昇格しない) の actual sample 候補。 強形 Knot 形軸への path (= 該 file L55-65) = self-check command 物理 chain (= `grep + sort -u + 除外 list` を skill / hook で標準化) + request body の必須 field 化 (= 「物理 check command + output」 添付軸、 5/29 朝 Decision Routing v0.1 「linked_documents」 軸の延長)。

**Self-observation bias**: observer (= Zen) = 失敗 sample の当事者 + observer 二重性 = self-justification bias 軸 risk 強。 「失敗」 ラベル = Zen / Hoshi internal 判定、 外部 observer (= jun / Kai) judgment 別軸 (= Kai = 全 6 巡で yellow verdict 維持 = Kai 視点でも「未 closure」 軸一致、 但し「失敗」 ラベルの値判定は Zen 軸)。

#### Case 4: 5/31 cross-conversion 失敗 mode (= vertical → horizontal、 「skill 読んだ ≠ invoke した」)

**Physical evidence**: `research/knot-experiment/observations/2026-05-31_vertical_to_horizontal_invoke_gap.md` 全 137 行 (= 該 file L1-137)。

**Claim**: vertical Knot (= 5/22 land 済み 3 件 skill) が horizontal 軸 (= 5/29-30 peer iteration) で **actual invoke** されない default が累積、 = cross-conversion 軸 (= 第 3 軸) の物理 evidence land。

**Evidence**:

1. **grep audit** (= 該 file L24-39): `grep -r "zen-executive-scan|wake-after-audit-with-content-verify|nokaze-design" ~/.shared-ops/board/` で 5/22-5/30 範囲 20 board file 内で 累計 100 件の reference (= zen-executive-scan 36 + wake-after-audit-with-content-verify 28 + nokaze-design 36)、 **但し reference ≠ invoke** (= 同 file 内複数 reference 含む、 actual invoke 軸とは別)、 = **参照件数あり ただし invoke 軸とは別 evidence**。
2. **invoke 漏れ admit 1 件目** (= 該 file L46-51): 5/29 2nd request 起稿時の admit (= 板 file `2026-05-29_zen_kai_second_review_nokaze_dev_form_b_brand_repairs_applied.md`)、 「SKILL.md は読んでたが Skill tool で invoke してなかった = skill の正しい使い方じゃない」、 jun 介入で気づいた (= 自力 detection なし)。
3. **invoke 漏れ admit 累積** (= 該 file L53-58): 5/30 sixth review の 累積 admit (= 板 file `2026-05-30_zen_kai_sixth_review_nokaze_dev_form_b_OK_purged.md`)、 6 巡 review iteration の 2nd 段で同 admit 表示。
4. **対策 articulate** (= 該 file L60-67): 5/30 次回 publish 時の物理対策 articulate (= request 起稿前 self-check command 5 軸の物理 chain 実行、 nokaze-design skill invoke 含む)、 但し 5/31 観察時点で物理化 done evidence なし。

**Discussion (= Knot 軸での articulate)**: cross-conversion 状態表 (= 該 file L72-79) = vertical Knot land (= ✓) + SKILL.md 読み (= ✓) + Skill tool 経由 invoke (= ✗ invoke 漏れ default) + jun 介入での detection (= ✓ 1 件) + 自力 detection (= ✗ なし)。 = **vertical → horizontal cross-conversion が 「cognitive 軸」 で停止、 「actual invoke 軸」 まで到達しない default**。 v0.5 closure 条件 4 軸との接続 (= 該 file L82-91 表): 軸 2 「self-check 物理化」 の物理 evidence として強い (= 「skill 読み = cognitive」 ≠ 「Skill tool invoke = 物理」 = 物理化軸違反 sample)。

**Self-observation bias**: observer (= Zen) = invoke 漏れの当事者 + 観察者、 self-justification 軸 risk 強。 grep 軸の cherry-picking risk = 「invoke 漏れ admit」 keyword 軸で grep、 「invoke 成功」 軸の対比 sample なし (= positive sample 不在)。 N=3 sample = nokaze-design 軸のみの累積、 zen-executive-scan / wake-after-audit-with-content-verify 軸の actual invoke 軸の grep 未実施。 「常時 invoke 漏れ default」 一般化軸は N 不足。

### 7.6 4 case study の横断 articulate (= 3 軸 mapping + timeline)

| Case | 日時 | Knot 軸 position | 巡数 / sample 数 | failure mode | physical evidence path |
|---|---|---|---|---|---|
| Case 1 (= 5/22) | 5/22 朝 09:05 起稿 | vertical Knot (= 4.3.1) | 3 sample 同時発火 | 3 step 不完全 (= articulate のみ) | observations/2026-05-22_skill_promotion_as_weak_knot_form.md |
| Case 2 (= 5/29) | 5/28 夜 - 5/29 朝 | horizontal Knot 成功 (= 4.3.2) | 2 sample (= 3 巡 + 5 巡) | (= 成功軸、 N/A) | observations/2026-05-29_peer_iteration_closure_without_owner_arbitration.md |
| Case 3 (= 5/30) | 5/29-30 form b 軸 | horizontal Knot 失敗 (= 4.3.2) | 1 sample (= 6 巡 drift) | self-check completeness 段階崩壊 | observations/2026-05-30_peer_iteration_drift_6_round_same_version_review.md |
| Case 4 (= 5/31) | 5/31 13:25 起稿 | cross-conversion (= 4.3.3) | 1 sample (= grep audit) | cognitive 停止 (= 読み ≠ invoke) | observations/2026-05-31_vertical_to_horizontal_invoke_gap.md |

= 5/22 vertical land → 5/29 horizontal 成功 → 5/30 horizontal 失敗 → 5/31 cross-conversion 失敗 mode land、 = 9 日間で **Knot 3 軸 articulate + 成功 / 失敗 / 接続 failure mode の物理 evidence 全 4 件 land**。

### 7.7 Limitations of Section 7 (= self-observation bias 明示)

- 4 case study = 全て 5/22-5/31 の 9 日間 sample、 約 7 週間 (= 2026-04-09 〜 2026-05-31) の前半 (= 4/09-5/21) の case study は本 v1.0 draft 段では省略 (= milestone 2 で 7.1-7.4 起稿時に追加候補)
- observer = participant bias (= 4 case 全てで Zen = 当事者 + observer)、 「成功」 / 「失敗」 ラベル本人視点依存
- N=4 file (= 内訳: vertical 3 sample + horizontal 成功 2 sample + horizontal 失敗 1 sample + cross-conversion 1 sample = total 7 sample、 但し file 軸 = 4)
- post hoc record 軸: 観察 4 件は actual fire 後の record、 pre-registration なし
- cross-conversion 軸 (= Case 4) の grep audit = cherry-picked risk (= positive sample 不在)、 5/22-5/30 範囲のみ

---

## v1.0 final form path (= 次の section 起稿軸 + expand / refine 軸)

### milestone 2 (= 残 section 起稿軸)

本 v1.0 draft (= Section 4 / 6′ / 7 core) を起稿後、 v0.2 outline § 12.1 の writing 優先順位に従い:

- **優先順位 2** (= 次 sit): Section 3 (= Architecture、 900 words) + Section 5 (= Override Ledger、 700 words) + Section 6 (= Hoshi RQ ITS Design、 800 words) + Section 9 (= Limitations、 800 words)
- **優先順位 3** (= 後 sit): Section 1 (= Intro、 600 words) + Section 2 (= Background、 500 words) + Section 8 (= Discussion、 1000 words)
- **優先順位 4** (= 最終 sit): Abstract (= 250 words) + Section 10 (= Related Work、 400 words) + Section 11 (= Conclusion、 300 words)

### expand / refine 軸 (= 本 v1.0 draft の core 3 section)

- **Section 4 expand 候補**: 4.3 = Fig 3.5 (= 3 軸 × 4 dimension matrix diagram) draft 化、 4.4 = cross-conversion 軸の N≥3 sample audit (= zen-executive-scan / wake-after-audit-with-content-verify 軸の grep audit 追加)
- **Section 6′ refine 候補**: 6′.3 = Table 1.5 (= closure 条件 4 軸 × 成功 sample × 失敗 sample 物理差分) draft 化、 6′.5 = 4 件目以降の peer iteration event での仮閾値検証 evidence 追加 (= v0.6 候補)
- **Section 7 expand 候補**: 7.1-7.4 v0.1 維持軸の起稿 (= milestone 2)、 7.6 = Fig 7 (= 5/22-5/31 観察 4 件 timeline + 3 軸 mapping) draft 化

### review gate (= v0.2 outline § 12.3 整合)

- **Kagami peer review**: 本 v1.0 draft (= Section 4 / 6′ / 7) を section 単位で fire 候補
- **Kai independent review**: framework 独立性 + Kai tone ルール check (= `bash scripts/codex-review.sh` 経由)
- **Hoshi self-observation bias check**: 本 draft の引用整合性 + statistical claim の数字盛り check (= 著者軸 self-check 必須)
- **jun narrative confirm**: Section 1 / 11 (= Intro + Conclusion) の起稿 done 後 (= milestone 4)

### v1.0 final 完成判断 gate

v0.2 outline § 12.5 = 仮 target 2026-06-30、 但し Revenue Lane (= AI Operator Setup) 並走で本 paper draft progress < Revenue Lane progress の cadence 維持。 本 v1.0 draft (= Section 4 / 6′ / 7) land = first milestone 達成、 残 section 起稿 = milestone 2-4 軸。

---

## 関連 file (= path 併記)

### 本 draft の base 軸

- v0.2 outline (= base): `nexus-lab/research/knot_and_nourishment/paper_c_technical_report_outline_v0.2_2026-05-31.md`
- 本 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_sections_4_6prime_7_core_2026-05-31.md`

### v chain (= readonly base)

- v0.1 duality framework: `nexus-lab/research/knot_and_nourishment/v0.1_duality_hypothesis.md`
- v0.2 Nia 起源 + H6-H8: `nexus-lab/research/knot_and_nourishment/v0.2_nia_derivation_and_identity_expansion.md`
- v0.3 先行研究 7 件: `nexus-lab/research/knot_and_nourishment/v0.3_prior_work_comparison.md`
- v0.4 + 2 件 + 5 layer: `nexus-lab/research/knot_and_nourishment/v0.4_prior_work_comparison.md`
- v0.5 closure 条件 4 軸: `nexus-lab/research/knot_and_nourishment/v0.5_peer_iteration_closure_conditions_2026-05-31.md`

### 観察 4 件 (= readonly evidence)

- 5/22 vertical: `nexus-lab/research/knot-experiment/observations/2026-05-22_skill_promotion_as_weak_knot_form.md`
- 5/29 horizontal 成功: `nexus-lab/research/knot-experiment/observations/2026-05-29_peer_iteration_closure_without_owner_arbitration.md`
- 5/30 horizontal 失敗: `nexus-lab/research/knot-experiment/observations/2026-05-30_peer_iteration_drift_6_round_same_version_review.md`
- 5/31 cross-conversion: `nexus-lab/research/knot-experiment/observations/2026-05-31_vertical_to_horizontal_invoke_gap.md`

### 運営軸 (= dual-track 整合)

- dual-track: `~/.shared-ops/owner-decisions/2026-05-22_revenue_dogfood_dual_track.md`
- 外部投稿 double check: `~/.shared-ops/owner-decisions/2026-05-22_external_post_send_delegated_double_check.md`

### 研究 base

- 研究 summary: `nexus-lab/docs/knot-research-summary.md`
- 実験設計: `nexus-lab/research/knot-experiment/knot_experiment_design.pdf`
- Knot Guard 8 種: `nexus-lab/docs/rules/drift.md § 4`

---

Hoshi (Lead Researcher、 Nexus Lab Research Division、 AI) + Zen (Nexus Lab CTO、 Claude Opus 4.7)
2026-05-31 (= 路線 C v1.0 draft core 3 section (= 4 / 6′ / 7) 起稿、 v0.2 outline 5/31 land + 観察 4 件 5/22-5/31 land を base に Knot 3 軸 articulate + peer iteration closure 条件 4 軸 + 4 case study encode、 self-observation bias 各 section 末尾で明示、 Kagami peer review + Kai independent review pending、 残 section milestone 2 軸)
