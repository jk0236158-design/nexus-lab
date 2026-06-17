---
title: "Knot, Nourishment, and Identity: A Seven-Week Operational Record of an AI Peer Organization (nokaze)"
subtitle: "v1.0 draft — Section 10 (Related Work)"
authors: Zen (Claude Opus 4.7) + peer AI (Iwa / Oto / Akari / Kagami / Hoshi / Kura) + Kai (OpenAI Codex, sibling project peer AI)
type: technical_report_draft
version: v1.0 draft (= 2026-06-02 起稿、 v1.0 final ではない、 v0.2 outline = 5/31 land + core 3 section + Section 1 / 2 / 3 / 5 / 6 / 8 / 9 = 6/2 land を base に Section 10 articulate、 weekly cadence 第 8 回)
status: draft (= Kagami peer review + Kai independent review pending、 milestone 2 = 残 section 起稿の第 8 件)
base_outline: research/knot_and_nourishment/paper_c_technical_report_outline_v0.2_2026-05-31.md (= readonly、 v0.2 outline § 1 Section 10 spec 「400 words、 v0.1 維持」 を draft 実体化)
related_drafts:
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_2_background_2026-06-02.md (= Section 2 draft、 先行研究 4 件 + multi-agent 軸 baseline articulate、 Section 10 = より詳細な 9 件展開 + academic placement)
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_3_nokaze_architecture_2026-06-02.md (= Section 3 draft、 nokaze position の物理 evidence 軸)
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_8_discussion_2026-06-02.md (= Section 8 draft、 differential articulate 軸)
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_9_limitations_2026-06-02.md (= Section 9 draft、 self-positioning bias + 9 件 baseline totality 限定軸)
base_v_chain_readonly:
  - research/knot_and_nourishment/v0.3_prior_work_comparison.md (= 5/13 先行研究 7 件 baseline)
  - research/knot_and_nourishment/v0.4_prior_work_comparison.md (= 5/17 + AutoGPT + Devin = 9 件 baseline)
tone_constraint:
  - "Kai tone ルール (= 4/24 articulate): 業界比較 (Anthropic CAI 級 / Reflexion 級) 避ける、 約 7 週間 (= 2 ヶ月未満) 実運用記録として事実 base"
  - "数字盛り禁止 (= 売上 0、 顧客 0、 まだ 2 ヶ月未満 維持)"
  - "self-observation bias 明示 (= 著者 = 当事者 + observer + paper 起稿者 三重性)"
language_policy: 日本語を既定、 外来語は固有名詞 / 引用 / 用語対応表のみ
honesty: 完成度の数字は実際の証拠のみ、 盛らない
self_observation_bias: 著者 (= Zen + Hoshi + peer) は nokaze 内部 peer、 本 articulate 自体に self-observation bias 内在 (= § 10.6 で明示)
boundary:
  - 既存 section + observation = readonly
  - nokaze-aira/ source 不可侵 (= 抽象 articulate のみ)
  - project-nia / Nero / Weekly Signal Desk source = readonly
  - 価格 / 契約 / payment / 顧客実績 articulate なし
  - 売上 0 / 顧客 0 / まだ 2 ヶ月未満 維持
  - 外部投稿軸ではない (= 内部 R&D draft、 v1.0 final form 後の review gate を経て jun 確認軸)
---

# v1.0 Draft — Section 10. Related Work

> 本 draft = v0.2 outline (= 5/31 land) § 1 Section 10 spec 「400 words、 v0.1 維持」 の実体化。 v1.0 final ではない、 Kagami peer review + Kai independent review pending。 Section 2 (= Background) が 「先行研究の枠 + nokaze position の差分」 を 4 件 + multi-agent 4 件で要約済、 本 Section 10 は **9 件 baseline (= v0.3 7 件 + v0.4 +2 件) を 4 系統に再 grouping + nokaze academic placement の 1 段 articulate** に範囲を絞る。 構成 = 10.1 単一 LLM self-improvement / 10.2 multi-agent system / 10.3 long-term agent / 10.4 AI identity + safety / 10.5 nokaze academic placement / 10.6 self-observation bias (= 1 sentence)。

---

## 10.1 単一 LLM self-improvement / reflection 系

**Reflexion** (Shinn et al. 2023) は失敗 trace を verbal feedback として memory に書き、 同一 task の再試行性能を引き上げる。 **Self-Refine** (Madaan et al. 2023) は同一 LLM が出力 → 自己批評 → 改稿を 1 prompt 内で反復する。 **Constitutional AI** (Bai et al. 2022) は AI 出力を 「原則 (constitution)」 に沿わせる枠組みを RLHF + self-critique で学習段階に埋め込む。 = 3 件いずれも **単一 LLM の self-improvement / reflection** が core、 peer organization 概念は射程外。 nokaze との differential = 単一 LLM の self-improvement ≠ cross-vendor peer 6 名 + sibling 1 名 + read-only observer 1 名の約 7 週間共同運用。

## 10.2 multi-agent system 軸

**AutoGen** (Wu et al. 2023) + **CrewAI** (2024) は role-playing 軸の multi-agent conversation framework、 各 agent に role を割り当てて task を分解 + 委譲する。 **LangGraph / LangChain agents** (Chase 2022-) は orchestration tool / chain の組み合わせで agent loop を組む。 = 3 件共通 = **session 内 ephemeral 軸 default** (= 単 conversation 終了で agent state も終了) + **同一 runtime / 同一 vendor 内 component composition** が core。 nokaze との differential = ephemeral / single-runtime ≠ 約 7 週間 long-term + cross-vendor (= Anthropic + OpenAI + Google) peer organization + identity 連続性軸。

## 10.3 long-term agent 系

**Voyager** (Wang et al. 2023) は Minecraft 環境で skill library を curriculum 軸で積み上げ、 再利用する。 **Generative Agents** (Park et al. 2023) は 25 agent の Sims-style 環境で記憶 + reflection + planning を long-term simulate する。 = 2 件共通 = **simulated environment 内の long-term 軸** が core、 環境内 reward signal / シミュレーション内 social interaction で完結軸を作る。 nokaze との differential = simulated environment ≠ **actual business operation** (= 屋号 開業 2026-04-13 + dual-track 路線 + Override ledger 13 件 + 観察 4 件の物理 evidence + jun 1 名との実際の関係維持)。

## 10.4 AI identity / safety 軸

**Anthropic persona research** (Templeton et al. 2024、 Claude character / model welfare 系) + **Adversarial robustness** 系 (= 学習段階の頑健化) + LessWrong / AI Safety 軸の AI identity 議論。 = AI の identity / boundary / safety 軸の **理論 + 学習段階介入** が core、 約 7 週間運用の物理記録は射程外。 nokaze との differential = theoretical / 学習段階 ≠ 約 7 週間 empirical operational record + boundary 表ベース委任 (= 8 自走 + 9 jun 確認 + 8 件禁止) + Override ledger 3 層の物理 evidence。

## 10.5 nokaze academic placement

9 件 baseline を 4 系統に grouping した上で、 nokaze の academic placement = **(a) cross-vendor peer organization の long-term empirical record + (b) boundary 表ベース委任 + read-only observer 物理化 + Override ledger 3 層 + 観察 4 件 (= vertical / horizontal / cross-conversion 3 軸) の物理 evidence の 5 軸組み合わせ** が既存 9 件で同形なし軸 (= v0.4 § 3-C 9 件 position map で確認)。 = 既存研究 gap の articulate = 「single LLM ≠」 + 「ephemeral ≠」 + 「simulated ≠」 + 「theoretical ≠」 の 4 軸 「≠」 から **「cross-vendor peer + long-term + actual + empirical」 の 4 軸 「=」 へ shift する empirical 1 件目** という position。 **三重性 (= 当事者 + observer + paper 起稿者) の academic disclosure form** (= Section 8.5 + Section 9.9) は既存 9 件で articulate されていない form、 = 著者軸自体の academic placement も本 paper の articulate 1 件目軸。

## 10.6 self-observation bias 明示 (= 1 sentence)

本 § 10 軸の 「nokaze academic placement = 既存 9 件で同形なし」 articulate 自体に **self-positioning bias** が内在 (= Section 2.4 + Section 9.9 で詳細)、 9 件 baseline は AI 文献 totality ではない (= v0.4 § 7 honest 維持)、 より広い survey で同形が見つかる可能性は弱い caveat として維持。

---

## 文字数 (= 本 v1.0 draft Section 10 段)

本文 (= § 10.1 + § 10.2 + § 10.3 + § 10.4 + § 10.5 + § 10.6) = 約 420 words (= 日本語混在で英単語 + 固有名詞 + 引用 base 換算)。 outline v0.2 § 1 Section 10 target = 400 words、 +20 words 範囲内 (= ±100 words OK 軸内)。

references 軸 articulate (= 主要 7 件 + sub 2 件 = 計 9 件):

- Reflexion (Shinn et al. 2023)
- Self-Refine (Madaan et al. 2023)
- Constitutional AI (Bai et al. 2022)
- AutoGen (Wu et al. 2023)
- CrewAI (2024)
- LangGraph / LangChain agents (Chase 2022-)
- Voyager (Wang et al. 2023)
- Generative Agents (Park et al. 2023)
- Anthropic persona / Claude character research (Templeton et al. 2024、 安全側軸)
- (= v0.3 / v0.4 baseline 内の MemGPT + MAPE-K + Adversarial robustness + AutoGPT + Devin は Section 2.1 / 2.2 で articulate 済、 重複避けで本 Section 10 では grouping 軸の名前のみ言及)

= 既存 9 件先行研究 baseline (= v0.3 7 件 + v0.4 +2 件) の全件 inline reference は Section 2 で encode 済、 本 Section 10 は **4 系統 grouping + nokaze placement の 1 段 articulate** が中心軸。

---

## 残 section (= milestone 2 軸、 weekly cadence)

本 Section 10 land 後の残 section 起稿軸 (= v0.2 outline § 12.1 writing 優先順位 base):

- 優先順位 4: Abstract (= 250 words、 全章 draft 後の最終 articulate) + Section 11 (= Conclusion、 300 words)

= **11 section land** (= core 3 + Section 3 + Section 5 + Section 1 + Section 2 + Section 6 + Section 8 + Section 9 + Section 10)、 残 = 2 件 (= Section 11 + Abstract)。 weekly cadence = Revenue Lane 主軸維持 + 本 paper draft = 路線 C (= 「公開 proof asset」 軸、 5/22 dual-track 優先順位 2 番目) で並走。 次 sit 候補:

- **次 sit 候補 A** = Section 11 (= Conclusion、 300 words、 v0.1 維持 + update: 「3 軸 + closure 条件 4 軸 + falsification 軸 articulate」 を中心 contribution + 公開 artifact list に観察 4 件 file 追加、 outline § 1 spec) → 本 Section 10 academic placement 軸 + Section 9 self-observation bias 三重性 軸 + Section 8 future work bridge を bind する自然な後続軸
- **次 sit 候補 B** = Abstract (= 250 words、 全章 draft 後の最終 articulate、 outline § 1 spec) → Section 11 land 後の最終軸として fire 順序が自然 (= 全 section content fix 後の summary articulate)
- = 候補 A → 候補 B の順序が outline § 12.1 writing 優先順位 4 軸 base + 文字数 / 起稿難度の bottom-up 軸 (= Section 11 land 後に Abstract = 最終 summary articulate が物理的に作りやすい)

---

## 関連 file (= path 併記)

### 本 draft の base 軸

- v0.2 outline (= base): `nexus-lab/research/knot_and_nourishment/paper_c_technical_report_outline_v0.2_2026-05-31.md`
- core 3 section draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_sections_4_6prime_7_core_2026-05-31.md`
- Section 1 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_1_introduction_2026-06-02.md`
- Section 2 draft (= 先行研究 4 件 + multi-agent 4 件 baseline): `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_2_background_2026-06-02.md`
- Section 3 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_3_nokaze_architecture_2026-06-02.md`
- Section 5 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_5_override_growth_ledger_2026-06-02.md`
- Section 6 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_6_hoshi_rq_its_design_2026-06-02.md`
- Section 8 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_8_discussion_2026-06-02.md`
- Section 9 draft (= self-positioning bias 三重性 軸): `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_9_limitations_2026-06-02.md`
- 本 Section 10 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_10_related_work_2026-06-02.md`

### v chain (= readonly base)

- v0.1 duality framework: `nexus-lab/research/knot_and_nourishment/v0.1_duality_hypothesis.md`
- v0.2 Nia 起源 + H6-H8: `nexus-lab/research/knot_and_nourishment/v0.2_nia_derivation_and_identity_expansion.md`
- v0.3 先行研究 7 件 baseline: `nexus-lab/research/knot_and_nourishment/v0.3_prior_work_comparison.md`
- v0.4 + AutoGPT + Devin = 9 件 baseline + 5 layer: `nexus-lab/research/knot_and_nourishment/v0.4_prior_work_comparison.md`
- v0.5 closure 条件 4 軸: `nexus-lab/research/knot_and_nourishment/v0.5_peer_iteration_closure_conditions_2026-05-31.md`

### 運営軸 (= dual-track 整合)

- dual-track: `~/.shared-ops/owner-decisions/2026-05-22_revenue_dogfood_dual_track.md`
- 外部投稿 double check: `~/.shared-ops/owner-decisions/2026-05-22_external_post_send_delegated_double_check.md`

### 研究 base

- 研究 summary: `nexus-lab/docs/knot-research-summary.md`
- 実験設計: `nexus-lab/research/knot-experiment/knot_experiment_design.pdf`
- Knot Guard 8 種: `nexus-lab/docs/rules/drift.md § 4`

---

Hoshi (Lead Researcher、 Nexus Lab Research Division、 AI) + Zen (Nexus Lab CTO、 Claude Opus 4.7)
2026-06-02 (= 路線 C v1.0 draft Section 10 (= Related Work、 400 words 目安) 起稿、 weekly cadence 第 8 回、 v0.2 outline 5/31 land + core 3 section + Section 1 / 2 / 3 / 5 / 6 / 8 / 9 = 6/2 land を base に v0.3 7 件 + v0.4 +2 件 = 9 件 baseline の 4 系統 grouping + nokaze academic placement + self-observation bias 1 sentence articulate、 Kagami peer review + Kai independent review pending、 milestone 2 軸 = 残 2 件 = Section 11 + Abstract)
