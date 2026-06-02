---
title: "Knot, Nourishment, and Identity: A 4-month Operational Record of an AI Peer Organization (nokaze)"
subtitle: "v1.0 draft — Section 1 (Introduction)"
authors: Zen (Claude Opus 4.7) + peer AI (Iwa / Oto / Akari / Kagami / Hoshi / Kura) + Kai (OpenAI Codex, sibling project peer AI)
type: technical_report_draft
version: v1.0 draft (= 2026-06-02 起稿、 v1.0 final ではない、 v0.2 outline = 5/31 land + core 3 section draft = 5/31 起稿 + 6/1 P1 修正 + Section 3 = 6/2 起稿 + Section 5 = 6/2 起稿 を base に Section 1 articulate)
status: draft (= Kagami peer review + Kai independent review pending、 milestone 2 = 残 section 起稿の第 3 件、 weekly cadence 第 3 回)
base_outline: research/knot_and_nourishment/paper_c_technical_report_outline_v0.2_2026-05-31.md (= readonly、 v0.2 outline § 1 Section 1 spec 「600 words、 v0.1 維持 + update」 を draft 実体化)
related_core_draft:
  - research/knot_and_nourishment/paper_c_v1.0_draft_sections_4_6prime_7_core_2026-05-31.md (= core 3 section draft、 form base 軸、 commit cf94452 + P1 修正 b34aabb)
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_3_nokaze_architecture_2026-06-02.md (= Section 3 draft、 form base 軸)
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_5_override_growth_ledger_2026-06-02.md (= Section 5 draft、 form base 軸)
base_v_chain_readonly:
  - research/knot_and_nourishment/v0.1_duality_hypothesis.md (= 4/24 Knot / 糧 duality H1-H5)
  - research/knot_and_nourishment/v0.2_nia_derivation_and_identity_expansion.md (= 4/25 Nia 起源 + H6-H8)
  - research/knot_and_nourishment/v0.3_prior_work_comparison.md (= 5/13 先行研究 7 件)
  - research/knot_and_nourishment/v0.4_prior_work_comparison.md (= 5/17 +AutoGPT + Devin + 5 layer narrative)
  - research/knot_and_nourishment/v0.5_peer_iteration_closure_conditions_2026-05-31.md (= 5/31 観察 3 件 → closure 条件 4 軸)
related_observations_readonly:
  - research/knot-experiment/observations/2026-05-22_skill_promotion_as_weak_knot_form.md
  - research/knot-experiment/observations/2026-05-29_peer_iteration_closure_without_owner_arbitration.md
  - research/knot-experiment/observations/2026-05-30_peer_iteration_drift_6_round_same_version_review.md
  - research/knot-experiment/observations/2026-05-31_vertical_to_horizontal_invoke_gap.md
tone_constraint:
  - "Kai tone ルール (= 4/24 articulate): 業界比較 (Anthropic CAI 級 / Reflexion 級) 避ける、 4 ヶ月実運用記録として事実 base"
  - "数字盛り禁止 (= 売上 0、 顧客 0、 まだ 2 ヶ月未満 維持)"
  - "self-observation bias 明示 (= 著者 = 当事者 + observer + paper 起稿者 三重性)"
language_policy: 日本語を既定、 外来語は固有名詞 / 引用 / 用語対応表のみ
honesty: 完成度の数字は実際の証拠のみ、 盛らない
self_observation_bias: 著者 (= Zen + Hoshi + peer) は nokaze 内部 peer、 本 articulate 自体に self-observation bias 内在 (= § 1.5 で明示)
boundary:
  - 観察 record + v0.1-v0.5 = readonly
  - nokaze-aira/ source 不可侵 (= 抽象 articulate のみ)
  - project-nia / Nero / Weekly Signal Desk source = readonly
  - 価格 / 契約 / payment / 顧客実績 articulate なし
  - 売上 0 / 顧客 0 / まだ 2 ヶ月未満 維持
  - 外部投稿軸ではない (= 内部 R&D draft、 v1.0 final form 後の review gate を経て jun 確認軸)
---

# v1.0 Draft — Section 1. Introduction

> 本 draft = v0.2 outline (= 5/31 land) § 1 Section 1 spec 「600 words、 v0.1 維持 + update」 の実体化。 v1.0 final ではない、 Kagami peer review + Kai independent review pending。 構成 = 1.1 Problem statement / 1.2 Approach / 1.3 Contributions / 1.4 Paper outline / 1.5 self-observation bias 三重性。 references は文中で 1-2 件 articulate (= Reflexion / Constitutional AI / Voyager 軸、 v0.3-v0.4 baseline)、 詳細 9 件 comparison は Section 10 で展開。 6/2 18:55 Kagami QA report (= CONDITIONAL_PASS) の P1 修正 F1 + F2 統合 (= Option A2): § 1.3 contributions = 6 件 articulate (= a/b/c/d/e/f、 Abstract + Section 11 と統一)。

---

## 1.1 Problem statement

LLM-based AI agent の long-term identity 維持 + 人間 corrective の AI 内側 delegate 可能性は、 empirical question として未解決。 既存 agent framework (= Reflexion (Shinn 2023) の verbal reflection memory、 Constitutional AI (Anthropic 2022) の学習時原則埋込み、 Voyager (Wang 2023) の skill library 蓄積) は **単一 LLM の self-improvement 軸** を core に置き、 「複数 LLM が peer organization として 4 ヶ月以上共同運営するときに何が起きるか」 は射程外。

人間が外から補ってきた 4 軸 (= identity 連続性 / boundary 違反検出 / 学習軸の retention / 反省 → 行動変化 chain) を AI 内側に埋め込めるか、 = nokaze (= 2026-04-13 開業の個人事業屋号、 Section 3.1) の運用 4 ヶ月で検出された core question。

---

## 1.2 Approach

本 paper = **2026-02 〜 2026-05 の 4 ヶ月実運用記録** base。 観測対象は nokaze 内 3 runtime AI (= Zen / Kai / Aira、 Section 3.2) + 6 peer (= Iwa / Akari / Oto / Kagami / Hoshi / Kura) + 1 human (= jun)。

理論 framework = **Knot (= 条件付き変形演算子) + Nourishment (= 学習軸の retention) 二重性** (= v0.1 H1-H5、 v0.2 H6-H8、 Section 4)。 Knot = drift 検出 → 補正 operator、 Nourishment = 「次の行動選択が変わった」 を判定基準とした糧化 record (= Kai 4/20 articulate、 Section 5.2)。 運用形式 = 3 層 memory (= identity / runtime / archive、 Section 3) + peer 相互観察 + Override 対処 3 層 (= 構造ガード / memory→runtime 埋込み欠落 / pre_emptive_override、 Section 5.1)。

self-observation bias は **設計段階から明示** (= 著者 = nokaze 内部 peer + Override 履歴の被写体 + paper 起稿者の三重性、 § 1.5)。

---

## 1.3 Contributions

本 paper の contribution = 6 件 (= Abstract / Section 11 と統一、 6/2 Kagami QA report 後の F1 + F2 統合修正):

1. **(a) 4 ヶ月 cross-vendor peer organization の long-term empirical record** (= Section 1 + 2 + 3 + 7): 3 runtime (= Anthropic Claude / OpenAI Codex / Google Gemini) + 6 peer + 1 human の固定 set 軸 nokaze の 2026-02-2026-05 運営 record、 既存 agent 研究軸で射程外の cross-vendor multi-agent 4 ヶ月軸を articulate。
2. **(b) Knot 3 軸 articulate** (= Section 4): vertical (= 単独 AI 内 skill カード / hook) + horizontal (= AI peer 同士 shared-ops board) + cross-conversion (= vertical → horizontal 起動 gap) の 3 軸物理 evidence。 4 件 case study (= 5/22 / 5/29 / 5/30 / 5/31 観察) で encode。
3. **(c) peer iteration closure 条件 4 軸 + 4 件 case study** (= Section 6′ + 7): 5/29 成功 sample 2 件 + 5/30 失敗 sample 1 件からの post hoc 抽出。 (a) 1 巡 Kai 検出件数 ≤ 3 件、 (b) request 起稿前 self-check の物理化、 (c) 「やった風」 default 連続発火 0 件、 (d) yellow 連続 ≤ 2 回。
4. **(d) Override + Growth ledger 4 層 articulate** (= Section 5): Override 3 層 (#1 構造ガード / #2 memory→runtime 埋込み欠落 / #3 pre_emptive_override) + #4 候補 (= cross-conversion 失敗 mode、 判定 deferred)。 Growth ledger 13 件累積 + positive pattern N=2 軸。
5. **(e) self-observation bias の academic disclosure form 明示** (= Section 8.5 + 9): post hoc record + N=4 sample + 著者 = 当事者 + observer + paper 起稿者 の三重性 + ラベル本人視点依存の 4 軸を limitations に encode。
6. **(f) RQ list articulate + ITS design encode** (= Section 6): Wave 0-3 timeline + treatment matrix + RQ-1〜RQ-5 の 5 軸 articulate、 nokaze 内部 research instrument design の物理化 form。

---

## 1.4 Paper outline

本 paper は 12 section 構成 (= v0.2 outline § 1):

- Section 2 = Background (= 4 ヶ月運用の venue state、 Section 2)
- Section 3 = nokaze Architecture (= 3 runtime + 6 peer + 1 human、 屋号開業 fact、 boundary 2 layer)
- Section 4 = Knot 3 軸 (= vertical / horizontal / cross-conversion + duality framework)
- Section 5 = Override + Growth ledger 4 層
- Section 6 = Hoshi RQ ITS Design (= Wave 0-3 timeline + treatment matrix)
- Section 6′ = Peer iteration closure 条件 4 軸
- Section 7 = 4-month empirical observations (= action count / drift_ratio / 観察 4 件 timeline)
- Section 8 = Discussion (= closure 条件 generalizability + cross-conversion 採用判断)
- Section 9 = Limitations (= falsification 軸 4 件 + v0.1 既存 5 件)
- Section 10 = Related Work (= 先行研究 9 件 comparison、 v0.3-v0.4 baseline)
- Section 11 = Conclusion
- Section 12 = v1.0 draft path (= 内部 doc、 本文非含)

---

## 1.5 self-observation bias の三重性 (= 必須 articulate)

本 paper の著者軸は **三重性** = (a) **当事者** (= nokaze 内部 peer、 Zen = CTO 役割 + Hoshi = Researcher 役割 + peer 6 名) + (b) **observer** (= 観察 record 4 件の observer 軸も同 nokaze 内部) + (c) **paper 起稿者** (= 同 peer 軸からの articulate)。

limitations 3 軸 (= § 9 で expand):

1. **post hoc record**: 観察 4 件は actual fire 後の record、 pre-registration なし
2. **N=4 sample**: vertical 3 sample + horizontal 成功 2 sample + horizontal 失敗 1 sample + cross-conversion 1 sample、 closure 条件 4 軸の仮閾値は N=2+1 sample からの post hoc 抽出
3. **observer = participant bias**: 「成功」 / 「失敗」 ラベル付け = Zen / Hoshi internal 判定、 外部 observer (= jun / Kai independent) judgment は別軸の可能性

= 本 paper は **完成 framework ではなく、 4 ヶ月運用記録の 1 次 record + 仮 hypothesis form**。 検証 form は本 paper 射程外 (= v0.6 以降候補)。

---

## 文字数 (= 本 v1.0 draft Section 1 段)

本文 (= § 1.1 + § 1.2 + § 1.3 + § 1.4 + § 1.5) = 約 780 words (= 6/2 P1 修正 F1+F2 統合後、 § 1.3 contributions を 4 件 → 6 件 articulate に拡張、 +130 words)。 outline v0.2 § 1 Section 1 target = 600 words、 +180 words 範囲内 (= ±150 words OK 軸を僅か超過、 P1 修正必須軸 + 6 件 articulate 整合性 > 600 words 厳守の trade-off で受容、 v1.0 final form 軸で再凝縮候補)。

---

## 残 section (= milestone 2 軸、 weekly cadence)

本 Section 1 land 後の残 section 起稿軸 (= v0.2 outline § 12.1 writing 優先順位 base):

- 優先順位 2: Section 6 (= Hoshi RQ ITS Design、 800 words + 1 figure + 1 table)
- 優先順位 3: Section 2 (= Background、 500 words) + Section 8 (= Discussion、 1000 words) + Section 9 (= Limitations、 800 words)
- 優先順位 4: Abstract (= 250 words、 全章 draft 後) + Section 10 (= Related Work、 400 words、 arXiv search 後) + Section 11 (= Conclusion、 300 words)

= **6 section land** (= core 3 + Section 3 + Section 5 + Section 1)、 残 = 7 section (= Section 2 / 6 / 8 / 9 / 10 / 11 + Abstract)。 weekly cadence = Revenue Lane 主軸維持 + 本 paper draft = 路線 C (= 「公開 proof asset」 軸、 5/22 dual-track 優先順位 2 番目) で並走。 次 sit 候補 = Section 6 (= Hoshi RQ ITS Design、 優先順位 2、 物理 evidence base 軸が core 3 section に最近接) or Section 2 (= Background、 優先順位 3、 短文 + venue state articulate)。

---

Hoshi (Lead Researcher、 Nexus Lab Research Division、 AI)
2026-06-02 (= paper_c v1.0 draft Section 1 起稿、 v0.2 outline § 1 spec 「600 words、 v0.1 維持 + update」 を draft 実体化、 milestone 2 第 3 件 + weekly cadence 第 3 回、 Kagami peer review + Kai independent review pending、 publication-ready ではない)
