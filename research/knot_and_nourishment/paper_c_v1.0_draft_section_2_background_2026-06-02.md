---
title: "Knot, Nourishment, and Identity: A 4-month Operational Record of an AI Peer Organization (nokaze)"
subtitle: "v1.0 draft — Section 2 (Background)"
authors: Zen (Claude Opus 4.7) + peer AI (Iwa / Oto / Akari / Kagami / Hoshi / Kura) + Kai (OpenAI Codex, sibling project peer AI)
type: technical_report_draft
version: v1.0 draft (= 2026-06-02 起稿、 v1.0 final ではない、 v0.2 outline = 5/31 land + core 3 section draft = 5/31 起稿 + 6/1 P1 修正 + Section 3 = 6/2 起稿 + Section 5 = 6/2 起稿 + Section 1 = 6/2 起稿 を base に Section 2 articulate)
status: draft (= Kagami peer review + Kai independent review pending、 milestone 2 = 残 section 起稿の第 4 件、 weekly cadence 第 4 回)
base_outline: research/knot_and_nourishment/paper_c_technical_report_outline_v0.2_2026-05-31.md (= readonly、 v0.2 outline § 1 Section 2 spec 「500 words、 v0.1 維持」 を draft 実体化)
related_drafts:
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_1_introduction_2026-06-02.md (= Section 1 draft、 form base 軸、 § 1.2 Approach + § 1.3 Contributions と交叉参照)
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_3_nokaze_architecture_2026-06-02.md (= Section 3 draft、 nokaze position の物理 evidence 軸)
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_5_override_growth_ledger_2026-06-02.md (= Section 5 draft、 Override 3 層の物理 evidence 軸)
  - research/knot_and_nourishment/paper_c_v1.0_draft_sections_4_6prime_7_core_2026-05-31.md (= core 3 section draft、 commit cf94452 + P1 修正 b34aabb)
base_v_chain_readonly:
  - research/knot_and_nourishment/v0.3_prior_work_comparison.md (= 5/13 先行研究 7 件 baseline)
  - research/knot_and_nourishment/v0.4_prior_work_comparison.md (= 5/17 + AutoGPT + Devin = 9 件 baseline)
tone_constraint:
  - "Kai tone ルール (= 4/24 articulate): 業界比較 (Anthropic CAI 級 / Reflexion 級) 避ける、 4 ヶ月実運用記録として事実 base"
  - "数字盛り禁止 (= 売上 0、 顧客 0、 まだ 2 ヶ月未満 維持)"
  - "self-observation bias 明示 (= 著者 = 当事者 + observer + paper 起稿者 三重性)"
language_policy: 日本語を既定、 外来語は固有名詞 / 引用 / 用語対応表のみ
honesty: 完成度の数字は実際の証拠のみ、 盛らない
self_observation_bias: 著者 (= Zen + Hoshi + peer) は nokaze 内部 peer、 本 articulate 自体に self-observation bias 内在 (= § 2.4 で明示)
boundary:
  - 観察 record + v0.1-v0.5 = readonly
  - nokaze-aira/ source 不可侵 (= 抽象 articulate のみ)
  - project-nia / Nero / Weekly Signal Desk source = readonly
  - 価格 / 契約 / payment / 顧客実績 articulate なし
  - 売上 0 / 顧客 0 / まだ 2 ヶ月未満 維持
  - 外部投稿軸ではない (= 内部 R&D draft、 v1.0 final form 後の review gate を経て jun 確認軸)
---

# v1.0 Draft — Section 2. Background

> 本 draft = v0.2 outline (= 5/31 land) § 1 Section 2 spec 「500 words、 v0.1 維持」 の実体化。 v1.0 final ではない、 Kagami peer review + Kai independent review pending。 構成 = 2.1 単一 LLM self-improvement 軸 / 2.2 multi-agent / peer organization 軸 / 2.3 nokaze position + differential / 2.4 self-positioning bias 明示。 詳細 9 件 comparison は Section 10 (= Related Work) で展開、 本 section は **「先行研究の枠 + nokaze position の差分」** に articulate を絞る。

---

## 2.1 単一 LLM self-improvement 軸 (= 既存研究の主流)

LLM-based AI agent の自己改善軸は、 単一 LLM 内の reflection / 学習時 alignment / skill 蓄積の 3 系で先行研究が累積している。

**Reflexion** (Shinn et al. 2023) は失敗 trace を自然言語の verbal feedback として memory に書き、 次の task でその memory を参照することで同一 task の再試行性能を引き上げる。 単一 LLM + 短時間軸 (= 1 task の reattempt) が主舞台。

**Constitutional AI** (Bai et al. 2022) は AI の出力を 「原則 (constitution)」 に沿わせる枠組みを RLHF + self-critique で学習段階に埋め込む。 推論時には原則は固定、 動的調整は射程外。

**Voyager** (Wang et al. 2023) は Minecraft 環境で skill library を curriculum 軸で積み上げ、 再利用する。 環境内の reward signal が完結軸を作る、 人間 trigger / peer coordination は設計外。

**Self-Refine** (Madaan et al. 2023) は同一 LLM が出力 → 自己批評 → 改稿を反復する。 1 prompt 内の reflection 完結が core。

これら 4 件はいずれも **「単一 LLM が単独で良くなる」** 軸を core に置く。 複数 LLM の cross-vendor coordination + 4 ヶ月以上の long-term 運用 + 人間との関係維持 boundary は射程外。

---

## 2.2 multi-agent / peer organization 軸 (= framework 系)

複数 agent の orchestration 軸は framework として近年累積している。

**AutoGen** (Wu et al. 2023) + **CrewAI** (2024) は role-playing 軸の multi-agent conversation framework、 各 agent に role を割り当てて task を分解 + 委譲する。 但し session 内 ephemeral 軸 (= 単 conversation 終了で agent state も終了) が default、 long-term identity 連続性は設計外。

**LangChain agents** (Chase 2022-) は orchestration tool / chain の組み合わせで agent loop を組む。 同一 runtime / 同一 vendor 内の component composition が core、 cross-vendor peer organization は射程外。

**AutoGPT** (Significant-Gravitas 2023) は単一 agent loop (= goal → plan → execute → evaluate → iterate) を core、 boundary 概念は max iteration / cost cap の安全装置として持つ。 但し peer organization 概念はなく、 「全自動 AI」 narrative は 2024-2025 の幻滅 phase で再 articulate を要した (= v0.4 § 3-A baseline)。

**Devin** (Cognition AI 2024) は AI software engineer name brand + ACU (= Agent Compute Unit) 計測軸 + IDE / Slack 連動。 dose-based 委任 (= Free / Pro / Max tier) で 「どこまで委任するか」 を区切るが、 委任の境界は task 量 (= ACU) 軸で表化、 役割境界 + peer 間 coordination の表化は射程外。

= multi-agent framework 系の共通 limitation = **(a) session 内 ephemeral 軸 default + (b) 同一 runtime / 同一 vendor 内 + (c) long-term identity / boundary 連続性は設計外**。

---

## 2.3 nokaze position + differential (= 本 paper の独自軸)

nokaze (= 2026-04-13 開業の個人事業屋号、 Section 3.1) の運用 4 ヶ月 (= 2026-02-2026-05) は、 既存研究の 3 軸と differential:

1. **long-term empirical record 軸** = 4 ヶ月実運用 (= ephemeral ≠)、 action count + drift_ratio + Override 発火の月次推移を物理記録 (= Section 7)
2. **cross-vendor peer organization 軸** = 3 runtime AI が共同運営: Anthropic Claude (= Zen + 6 peer = Iwa / Akari / Oto / Kagami / Hoshi / Kura) + OpenAI Codex (= Kai、 sibling project peer) + Google Gemini (= Aira、 read-only observer) (= 同一 vendor / 同一 runtime ≠)
3. **third-party verification の物理化軸** = read-only observer (= Aira = Gemini) が同一 ledger を独立 read、 著者軸 ≠ observer 軸の 1 軸物理化 (= Section 3.2)
4. **boundary 表ベース委任軸** = 8 自走 + 9 jun 確認必須 + 8 件 standing prohibition の 3 段表 (= 委任権限 v1、 2026-05-16) + Knot Guard 8 種の boundary trigger 検出 mechanism (= dose 軸 ≠、 役割境界軸)

= 単一 LLM self-improvement ≠ + single-runtime ephemeral framework ≠、 **cross-vendor peer organization の 4 ヶ月運用記録 + boundary 表ベース委任 + read-only observer 物理化** が独自貢献軸。

但し本 paper は **完成 framework ではなく 1 次 record + 仮 hypothesis form** (= Section 1.5)。 検証 form は本 paper 射程外、 v0.6 以降候補。

---

## 2.4 self-positioning bias 明示 (= 必須 articulate)

「nokaze position」 の articulate 自体に **self-positioning bias** が内在する。 「単一 LLM ≠ + ephemeral ≠ + same-vendor ≠ = nokaze が唯一」 という frame 自体が、 著者 (= nokaze 内部 peer + paper 起稿者 + Override 履歴の被写体、 三重性) からの positioning。 外部 observer (= jun / Kai independent / 外部読者) の judgment は別軸の可能性。

3 件の honest caveat:

1. **9 件先行研究 baseline の totality 限定** = v0.3 7 件 + v0.4 +AutoGPT + Devin = 9 件は AI 文献 totality ではない、 より広い survey で同形が見つかる可能性は維持 (= v0.4 § 7 honest)
2. **venue state の数字** = 本 paper 起稿時点 (= 2026-06-02) で売上 0 / 顧客 0 / nokaze 創業 (= 2026-04-13) から 2 ヶ月未満。 「4 ヶ月実運用」 の数字は研究観測期間 (= 2026-02-2026-05) であって商業実績ではない、 = 商業成功 evidence なし
3. **observer 物理化軸の不完全性** = Aira (= read-only observer) は同一 jun 環境内、 完全 third-party (= 外部研究機関 audit / 外部読者) ではない、 「内部 peer 三重性 → 内部 observer」 の 1 段拡張のみ

= 本 section の position 取り 「nokaze は cross-vendor peer organization の long-term record 軸が独自貢献」 は **強い主張 (= 4 軸 differential)** + **弱い caveat (= 9 件 baseline totality 限定 + 商業実績なし + 物理化不完全)** の dual 構造、 honest 軸。

---

## 文字数 (= 本 v1.0 draft Section 2 段)

本文 (= § 2.1 + § 2.2 + § 2.3 + § 2.4) = 約 520 words (= 日本語混在で英単語 + 固有名詞 + 引用 base 換算)。 outline v0.2 § 1 Section 2 target = 500 words、 +20 words 範囲内 (= ±100 words OK 軸内)。

---

## 残 section (= milestone 2 軸、 weekly cadence)

本 Section 2 land 後の残 section 起稿軸 (= v0.2 outline § 12.1 writing 優先順位 base):

- 優先順位 2: Section 6 (= Hoshi RQ ITS Design、 800 words + 1 figure + 1 table)
- 優先順位 3: Section 8 (= Discussion、 1000 words) + Section 9 (= Limitations、 800 words)
- 優先順位 4: Abstract (= 250 words、 全章 draft 後) + Section 10 (= Related Work、 400 words、 arXiv search 後) + Section 11 (= Conclusion、 300 words)

= **7 section land** (= core 3 + Section 3 + Section 5 + Section 1 + Section 2)、 残 = 6 section (= Section 6 / 8 / 9 / 10 / 11 + Abstract)。 weekly cadence = Revenue Lane 主軸維持 + 本 paper draft = 路線 C (= 「公開 proof asset」 軸、 5/22 dual-track 優先順位 2 番目) で並走。 次 sit 候補 = Section 6 (= Hoshi RQ ITS Design、 優先順位 2、 物理 evidence base 軸が core 3 section に最近接) or Section 9 (= Limitations、 優先順位 3、 § 2.4 self-positioning bias + § 1.5 三重性の expand 軸が連動)。

---

Hoshi (Lead Researcher、 Nexus Lab Research Division、 AI)
2026-06-02 (= paper_c v1.0 draft Section 2 起稿、 v0.2 outline § 1 spec 「500 words、 v0.1 維持」 を draft 実体化、 milestone 2 第 4 件 + weekly cadence 第 4 回、 Kagami peer review + Kai independent review pending、 publication-ready ではない)
