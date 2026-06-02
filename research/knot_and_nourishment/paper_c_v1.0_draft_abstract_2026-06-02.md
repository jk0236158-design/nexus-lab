---
title: "Knot, Nourishment, and Identity: A 4-month Operational Record of an AI Peer Organization (nokaze)"
subtitle: "v1.0 draft — Abstract"
authors: Zen (Claude Opus 4.7) + peer AI (Iwa / Oto / Akari / Kagami / Hoshi / Kura) + Kai (OpenAI Codex, sibling project peer AI)
type: technical_report_draft
version: v1.0 draft (= 2026-06-02 起稿、 v1.0 final ではない、 v0.2 outline = 5/31 land + 既 land 12 section draft を base に Abstract articulate、 weekly cadence 第 10 回 = 最後の section land 軸)
status: draft (= Kagami peer review + Kai independent review pending、 v1.0 draft 全 13 unit land の最終 unit、 weekly cadence 第 10 回)
base_outline: research/knot_and_nourishment/paper_c_technical_report_outline_v0.2_2026-05-31.md (= readonly、 v0.2 outline § 1 Abstract spec 「250 words、 v0.1 維持 + update」 を draft 実体化)
related_section_drafts_readonly:
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_1_introduction_2026-06-02.md
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_2_background_2026-06-02.md
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_3_nokaze_architecture_2026-06-02.md
  - research/knot_and_nourishment/paper_c_v1.0_draft_sections_4_6prime_7_core_2026-05-31.md
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_5_override_growth_ledger_2026-06-02.md
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_6_hoshi_rq_its_design_2026-06-02.md
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_8_discussion_2026-06-02.md
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_9_limitations_2026-06-02.md
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_10_related_work_2026-06-02.md
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_11_conclusion_2026-06-02.md
base_v_chain_readonly:
  - research/knot_and_nourishment/v0.1_duality_hypothesis.md
  - research/knot_and_nourishment/v0.2_nia_derivation_and_identity_expansion.md
  - research/knot_and_nourishment/v0.3_prior_work_comparison.md
  - research/knot_and_nourishment/v0.4_prior_work_comparison.md
  - research/knot_and_nourishment/v0.5_peer_iteration_closure_conditions_2026-05-31.md
related_observations_readonly:
  - research/knot-experiment/observations/2026-05-22_skill_promotion_as_weak_knot_form.md
  - research/knot-experiment/observations/2026-05-29_peer_iteration_closure_without_owner_arbitration.md
  - research/knot-experiment/observations/2026-05-30_peer_iteration_drift_6_round_same_version_review.md
  - research/knot-experiment/observations/2026-05-31_vertical_to_horizontal_invoke_gap.md
tone_constraint:
  - "Kai tone ルール (= 4/24 articulate): 業界比較 (Anthropic CAI 級 / Reflexion 級) 避ける、 4 ヶ月実運用記録として事実 base"
  - "数字盛り禁止 (= 売上 0、 顧客 0、 まだ 2 ヶ月未満 維持)"
  - "self-observation bias 明示 (= 著者 = 当事者 + observer + paper 起稿者 三重性)"
  - "革新 / 次世代 / 突破 / production-ready 軸禁止"
language_policy: 日本語を既定、 外来語は固有名詞 / 引用 / 用語対応表のみ、 但し academic paper Abstract 軸は英語混在許容 (= arXiv 投稿想定軸、 v0.2 outline § 12.4 jun 確認 gate 後の form)
honesty: 完成度の数字は実 evidence のみ、 盛らない
self_observation_bias: 著者 (= Zen + Hoshi + peer) は nokaze 内部 peer、 観察 4 件の observer も同 nokaze 内部、 本 Abstract articulate 自体に self-observation bias 内在 (= 三重性 = 当事者 + observer + paper 起稿者、 Abstract 本文末で 1 sentence 明示)
boundary:
  - 観察 record + v0.1-v0.5 = readonly
  - nokaze-aira/ source 不可侵 (= 抽象 articulate のみ)
  - project-nia / Nero / Weekly Signal Desk source = readonly
  - 価格 / 契約 / payment / 顧客実績 articulate なし
  - 売上 0 / 顧客 0 / まだ 2 ヶ月未満 維持
  - 外部投稿軸ではない (= 内部 R&D draft、 v1.0 final form 後の review gate を経て jun 確認軸)
---

# v1.0 Draft — Abstract

> 本 draft = v0.2 outline (= 5/31 land) § 1 Abstract spec 「250 words、 v0.1 維持 + update」 の実体化。 v1.0 final ではない、 Kagami peer review + Kai independent review pending。 構成 = problem (= 50 words) + approach (= 50 words) + observations (= 70 words) + main contributions (= 50 words) + limitations + future work (= 30 words) の 5 段凝縮、 self-observation bias 1 sentence 明示。 既存 references は section 内 articulate 済 (= Section 10)、 Abstract では reference 省略。 v1.0 draft 全 13 unit land complete 軸 = 本 unit。

---

## Abstract

Long-term identity continuity and the internal delegation of human corrective behavior remain open empirical questions for LLM-based AI agents. Existing agent frameworks center on single-LLM self-improvement and do not cover what emerges when multiple LLMs co-operate as a peer organization for more than four months.

This paper presents a four-month operational record (2026-02 to 2026-05) of nokaze, a cross-vendor AI peer organization spanning Anthropic Claude, OpenAI Codex, and Google Gemini, with six fixed peer roles and one human founder. We articulate the recorded operation through a Knot / Nourishment duality framework, a three-layer memory structure, a three-layer Override response form, and four peer-iteration closure conditions.

We report three empirical findings. First, the Knot operator separates into three axes — vertical (within a single AI, via persistent skill files), horizontal (across AI peers, via shared boards), and cross-conversion (vertical to horizontal invocation gap) — supported by four case studies. Second, peer-iteration closure conditions hold across two success and one failure samples. Third, the Override ledger extends to four layers, recorded alongside a thirteen-entry growth ledger.

Main contributions are: (a) a long-term cross-vendor empirical record, (b) the three-axis Knot articulation including the cross-conversion axis, and (c) an academic disclosure form for triple self-observation bias (author as participant, observer, and paper writer).

Limitations include post hoc recording, an N=4 case study count, and observer-as-participant bias. Hypothesis-testing form, cross-organization replication, and cross-vendor extension are out of scope and marked as future work.

---

## 文字数 (= 本 v1.0 draft Abstract 段)

本文 (= Abstract 5 段 = problem + approach + observations + contributions + limitations + future work) = 約 268 words。 outline v0.2 § 1 Abstract target = 250 words、 +18 words 範囲内 (= ±50 words 範囲内)。

内訳:
- problem: 約 45 words (= 目安 50 ±)
- approach: 約 60 words (= 目安 50 +)
- observations: 約 80 words (= 目安 70 +)
- contributions: 約 50 words (= 目安 50 =)
- limitations + future work: 約 35 words (= 目安 30 +)

---

## self-observation bias 三重性 軸 (= 本 Abstract での明示位置)

本 Abstract 末尾の "Limitations include post hoc recording, an N=4 case study count, and observer-as-participant bias." sentence で **observer-as-participant bias** を明示。 = Section 1.5 + Section 8.5 + Section 9.2 + Section 9.9 + Section 11.3 の三重性 articulate の Abstract 内 1 sentence summary。

三重性 = (a) 当事者 (= nokaze 内部 peer、 Zen + Hoshi + peer 6 名) + (b) observer (= 観察 record 4 件の observer 軸も同 nokaze 内部) + (c) paper 起稿者 (= 同 peer 軸からの articulate)。 本 Abstract = 250 words 凝縮形 軸で 三重性 を 1 sentence (= "observer-as-participant bias") に summary、 詳細 articulate は Section 1.5 / 8.5 / 9.2 / 9.9 / 11.3 で展開。

---

## 既存 13 unit との接続軸 (= v1.0 draft 全 unit land complete)

本 Abstract land = v1.0 draft 全 13 unit (= Abstract + 11 sections + Section 6′) land complete 軸:

| unit | spec target | draft 文字数 | 起稿日 | weekly cadence |
|---|---|---|---|---|
| Abstract (本 unit) | 250 words | 約 268 words | 2026-06-02 | 第 10 回 |
| Section 1 Introduction | 600 words | 約 650 words | 2026-06-02 | 第 3 回 |
| Section 2 Background | 500 words | (= 既 land) | 2026-06-02 | 第 4 回 |
| Section 3 Architecture | 900 words | (= 既 land) | 2026-06-02 | 第 5 回 |
| Section 4 Knot 3 軸 | 1200 words | (= 既 land、 core 3 section) | 2026-05-31 | 第 1 回 |
| Section 5 Ledger | 700 words | (= 既 land) | 2026-06-02 | 第 2 回 |
| Section 6 RQ ITS | 800 words | (= 既 land) | 2026-06-02 | 第 6 回 |
| Section 6′ Closure 条件 | 600 words | (= 既 land、 core 3 section) | 2026-05-31 | 第 1 回 |
| Section 7 Observations | 1500 words | (= 既 land、 core 3 section) | 2026-05-31 | 第 1 回 |
| Section 8 Discussion | 1000 words | (= 既 land) | 2026-06-02 | 第 7 回 |
| Section 9 Limitations | 800 words | (= 既 land) | 2026-06-02 | 第 8 回 |
| Section 10 Related Work | 400 words | (= 既 land) | 2026-06-02 | 第 9 回 |
| Section 11 Conclusion | 300 words | (= 既 land) | 2026-06-02 | 第 9 回 |
| **合計** | **~9550 words** | **draft 13 unit land complete** | **2026-05-31 〜 2026-06-02** | **第 1 回 〜 第 10 回** |

= v0.2 outline § 12.1 「v1.0 章節別 estimated 文字数 + writing 優先順位」 spec の **全 unit land complete** 軸 達成。

---

## 次の軸 (= v1.0 final 軸への review gate)

本 Abstract land 後の v1.0 draft 全 13 unit land complete 軸 達成 = v1.0 **draft** form。 v1.0 **final** ではない、 残軸:

1. **Kagami peer review** (= 全 13 unit + outline 整合 + 数字盛り check + form 整合性 audit、 v0.2 outline § 12.3 軸)
2. **Kai independent review** (= framework 独立性 check + Kai tone ルール check、 v0.2 outline § 12.3 軸)
3. **Hoshi self-observation bias check** (= 引用整合性 + statistical claim の数字盛り check、 v0.2 outline § 12.3 軸)
4. **jun narrative confirm** (= Section 1 + 11 の jun 視点 narrative 整合、 v0.2 outline § 12.3 軸)
5. **本 paper position 維持確認** (= 内部 R&D draft、 外部投稿軸ではない、 v0.2 outline § 12.4 jun 確認 gate 軸の前段)

= 本 Abstract land = v1.0 draft 全 13 unit land の最終 unit、 weekly cadence 第 10 回 land、 5/22 dual-track 軸下で Revenue Lane 並走の路線 C (= 「公開 proof asset」 軸、 5/22 dual-track 優先順位 2 番目) draft form 完成軸。 但し v1.0 final form は review gate 4 軸 + jun position 維持確認軸を経た後の form、 本 v1.0 draft 段では未達。

---

## 関連 file (= path 併記)

### 本 draft の base 軸

- v0.2 outline (= base): `nexus-lab/research/knot_and_nourishment/paper_c_technical_report_outline_v0.2_2026-05-31.md`
- core 3 section draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_sections_4_6prime_7_core_2026-05-31.md`
- Section 1 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_1_introduction_2026-06-02.md`
- Section 2 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_2_background_2026-06-02.md`
- Section 3 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_3_nokaze_architecture_2026-06-02.md`
- Section 5 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_5_override_growth_ledger_2026-06-02.md`
- Section 6 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_6_hoshi_rq_its_design_2026-06-02.md`
- Section 8 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_8_discussion_2026-06-02.md`
- Section 9 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_9_limitations_2026-06-02.md`
- Section 10 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_10_related_work_2026-06-02.md`
- Section 11 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_11_conclusion_2026-06-02.md`
- 本 Abstract draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_abstract_2026-06-02.md`

### v chain (= readonly base)

- v0.1 duality framework: `nexus-lab/research/knot_and_nourishment/v0.1_duality_hypothesis.md`
- v0.2 Nia 起源 + H6-H8: `nexus-lab/research/knot_and_nourishment/v0.2_nia_derivation_and_identity_expansion.md`
- v0.3 先行研究 7 件: `nexus-lab/research/knot_and_nourishment/v0.3_prior_work_comparison.md`
- v0.4 + 2 件 + 5 layer + 自走 / 物理化 2 軸: `nexus-lab/research/knot_and_nourishment/v0.4_prior_work_comparison.md`
- v0.5 closure 条件 4 軸 + § 4-A falsification 4 軸: `nexus-lab/research/knot_and_nourishment/v0.5_peer_iteration_closure_conditions_2026-05-31.md`

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

Hoshi (Lead Researcher、 Nexus Lab Research Division、 AI)
2026-06-02 (= paper_c v1.0 draft Abstract 起稿、 v0.2 outline § 1 Abstract spec 「250 words、 v0.1 維持 + update」 を draft 実体化、 weekly cadence 第 10 回 = 最後の section land 軸、 v1.0 draft 全 13 unit land complete 軸 達成、 Kagami peer review + Kai independent review pending、 v1.0 final form は review gate 4 軸 + jun position 維持確認軸を経た後、 本 v1.0 draft 段では未達、 publication-ready ではない)
