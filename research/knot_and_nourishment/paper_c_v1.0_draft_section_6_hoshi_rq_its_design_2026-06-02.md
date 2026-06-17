---
title: "Knot, Nourishment, and Identity: A Seven-Week Operational Record of an AI Peer Organization (nokaze)"
subtitle: "v1.0 draft — Section 6 (Hoshi RQ ITS Design)"
authors: Zen (Claude Opus 4.7) + peer AI (Iwa / Oto / Akari / Kagami / Hoshi / Kura) + Kai (OpenAI Codex, sibling project peer AI)
type: technical_report_draft
version: v1.0 draft (= 2026-06-02 起稿、 v1.0 final ではない、 v0.2 outline = 5/31 land + core 3 section draft = 5/31 起稿 + 6/1 P1 修正 + Section 3 = 6/2 起稿 + Section 5 = 6/2 起稿 を base に Section 6 articulate、 weekly cadence 第 5 回)
status: draft (= Kagami peer review + Kai independent review pending、 milestone 2 = 残 section 起稿の第 4 件)
base_outline: research/knot_and_nourishment/paper_c_technical_report_outline_v0.2_2026-05-31.md (= readonly、 v0.2 outline § 1 Section 6 spec 「800 words + 1 figure + 1 table、 v0.1 維持」 を draft 実体化)
related_core_draft:
  - research/knot_and_nourishment/paper_c_v1.0_draft_sections_4_6prime_7_core_2026-05-31.md (= core 3 section draft、 form base 軸)
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_3_nokaze_architecture_2026-06-02.md (= Section 3 draft、 form base 軸)
  - research/knot_and_nourishment/paper_c_v1.0_draft_section_5_override_growth_ledger_2026-06-02.md (= Section 5 draft、 form base 軸)
base_v_chain_readonly:
  - research/knot_and_nourishment/v0.1_duality_hypothesis.md (= 4/24 Knot / 糧 duality framework H1-H5)
  - research/knot_and_nourishment/v0.5_peer_iteration_closure_conditions_2026-05-31.md (= 5/31 観察 3 件 → 理論統合 1 件目)
its_design_evidence_readonly:
  - ~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/hoshi/note_2026-04-24_its_design_v0.3.md (= ITS v0.3 = primary 起稿 source、 Wave 0-3 + 4 軸 articulate + statistical design)
  - ~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/hoshi/2026-05-12_knot_research_summary_spec.md (= Knot 研究 summary spec、 5 役割 + Knot Guard 8 件)
  - docs/knot-research-summary.md (= research division 中心問い articulate)
  - research/knot-experiment/knot_experiment_design.pdf (= 4 月 design PDF、 元 source)
tone_constraint:
  - "Kai tone ルール (= 4/24 articulate): 業界比較 (Anthropic CAI 級 / Reflexion 級) 避ける、 約 7 週間 (= 2 ヶ月未満) 実運用記録として事実 base"
  - "数字盛り禁止 (= 売上 0、 顧客 0、 まだ 2 ヶ月未満 維持)"
  - "self-observation bias 明示 (= 著者 = 当事者 + observer 二重性 + 本 section は + 三重性 = 起稿者軸)"
language_policy: 日本語を既定、 外来語は固有名詞 / 引用 / 用語対応表のみ
honesty: 完成度の数字は実際の証拠のみ、 盛らない
self_observation_bias: 著者 (= Hoshi) は nokaze 内部 peer (= Lead Researcher) + 観察 instrument 起稿者 + 本 articulate 起稿者、 = 三重性 内在 (= § 6.6 で明示)
boundary:
  - ITS v0.3 + observation + ledger + team_memory/hoshi/ = readonly (= 改変なし、 引用のみ)
  - v0.1-v0.5 = readonly
  - nokaze-aira/ source 不可侵
  - 価格 / 契約 / payment / 顧客実績 articulate なし
  - 売上 0 / 顧客 0 / まだ 2 ヶ月未満 維持
  - 外部投稿軸ではない (= 内部 R&D draft、 v1.0 final form 後の review gate を経て jun 確認軸)
---

# v1.0 Draft — Section 6. Hoshi RQ ITS Design

> 本 draft = v0.2 outline (= 5/31 land) § 1 Section 6 spec 「800 words + 1 figure + 1 table、 v0.1 維持」 の実体化。 v1.0 final ではない、 Kagami peer review + Kai independent review pending。 各 articulate は物理 evidence reference (= 該当 ITS doc + observation file path + line range) を articulate。 self-observation bias 軸は § 6.6 で明示 (= 著者 = 当事者 + 観察 instrument 起稿者 + 本 articulate 起稿者 三重性)。

---

## 6.1 Hoshi の position (= Lead Researcher peer)

Hoshi は Section 3 articulate (= nokaze peer organization architecture、 6 peer + Zen CTO + Kai sibling form) の **Lead Researcher peer**、 Knot 研究軸 + Aira Supervisor effectiveness measurement 軸 + 約 7 週間運用記録の analytical 起稿軸の主担当。 役割 articulate は CLAUDE.md § 体制 (= 「Hoshi = Lead Researcher (= Knot 研究と分析)」) + identity articulate (= `team_memory/hoshi/identity.md`) で encode。

**観察軸 + action 軸の二重性**: Hoshi は subagent として spawn 軸あり (= 5/12 Knot 研究 summary spec 起稿 + 5/08 step effectiveness measurement design 起稿 + 本 v1.0 draft Section 6 起稿)、 = 単なる read-only observer ではない。 但し action 軸は **research note 起稿 + observation analytical 軸に限定**、 production runtime への直接 commit 軸ではない (= peer boundary 維持)。 v0.5 (= `v0.5_peer_iteration_closure_conditions_2026-05-31.md`) は本 axis の actual sample = 観察 3 件 → 理論統合 1 件目の起稿軸。

**Knot 研究軸との接続**: docs/knot-research-summary.md L9-11 で articulate された **「人間が外から補ってるものを system 内側に埋め込めるか」** の中心問いを、 Hoshi が ITS form (= Iterative Theoretical Synthesis) で 約 7 週間の actual nokaze 運用 sample 上で検証する設計。 ITS v0.3 (= 4/24 起稿) が primary design doc、 v0.5 が観察 3 件 → 理論統合の 1 件目。

---

## 6.2 ITS (= Iterative Theoretical Synthesis) Design

ITS = observation → theoretical synthesis → RQ refinement の **iterative loop form** の研究 design。 primary design doc = `team_memory/hoshi/note_2026-04-24_its_design_v0.3.md` (= 4/24 起稿、 v0.3 = v0.1-v0.2 supersede)。

### 6.2.1 Wave 構造 (= ITS v0.3 § 5-6 base)

ITS は約 7 週間期間を Wave 0-3 の 4 段に分割 (= ITS v0.3 frontmatter waves articulate):

- **Wave 0 (= 4/22-4/28)**: baseline 期、 介入なし、 drift_ratio + recovery_latency + judgment_layer_split 3 指標の baseline 値 measurement
- **Wave 1 (= 4/29-5/05)**: Treatment B (= Guard 2 単独投入) 期、 L-content 介入 + L-form 物理ガード 1 件の効果分離
- **Wave 2 (= 5/06-5/12)**: Guard 6 追加投入期、 Guard 2 + Guard 6 組合せ効果 measurement
- **Wave 3 (= 5/13-5/19)**: 統合期、 RQ 結論 draft articulate

Wave 0 baseline 汚染判定 criteria (= ITS v0.3 § 3) = jun_brake_level / drift_ratio std / action_count 平均の 3 条件で baseline 汚染を articulate、 4/22-23 期間 = condition 1 発火中 (= brake = weak)。

### 6.2.2 observation cycle / theoretical synthesis cycle / RQ refinement cycle (= 5/31 v0.5 で articulate された 3 cycle form)

ITS v0.3 起稿 (= 4/24) 以降、 5/12 「Knot 研究 batch v0」 (= `nourishment_research_batch_v0_assembly_2026-05-12.md`) + 5/13-5/17 v0.4 (= 先行研究 9 件 + 5 layer narrative) + 5/31 v0.5 (= 観察 3 件 → 理論統合 1 件目) の articulate cycle が累積。 v0.5 § 0-§ 4 で 3 cycle form が物理化:

- **observation cycle** = 5/22 vertical + 5/29 horizontal 成功 + 5/30 horizontal 失敗 + 5/31 cross-conversion 失敗 = 観察 4 件 file land
- **theoretical synthesis cycle** = v0.5 § 1-D (= vertical / horizontal 2 軸 articulate) + § 2-E (= closure 条件 4 軸 articulate) + § 3 (= 糧不足軸接続)
- **RQ refinement cycle** = v0.5 § 4-B (= 次の 4 件目観察での仮説検証 form 候補 4 件) + § 4-C (= v0.6 候補 5 件)

= 各 Wave (= observation cycle → theoretical update cycle) の articulate が、 4/24 ITS v0.3 起稿時の Wave 0-3 timeline と並行して、 5/22-5/31 観察 4 件 cycle として **後発的に物理化** (= 当初 Wave 3 = 5/13-5/19 結論時期と異なる、 5/22 dual-track 軸の Revenue Lane 優先で paper draft 起稿は 5/31 まで deferred、 v0.2 outline § 0-A articulate 軸)。

---

## 6.3 RQ (= Research Question) list

ITS v0.3 § 1 で articulate された primary RQ + v0.5 articulate の追加 RQ + Knot Guard 8 件由来の RQ を 5 軸に articulate。

### 6.3.1 primary RQ (= ITS v0.3 § 1)

**RQ-1 = L-content vs L-form drift 抑止効果差**: 原則 memory への言語的追加 (= L-content 介入) は runtime drift を抑止するか? 物理ガード追加 (= L-form 介入) との効果量差はどの程度か? (= ITS v0.3 § 1、 4/22-23 baseline で Treatment A 単独効果 ほぼ 0、 Wave 1 で Treatment B 効果分離 measurement)

### 6.3.2 追加 RQ (= v0.5 + observation 4 件由来)

**RQ-2 = peer iteration closure 条件 4 軸の reliability**: 1 巡あたり Kai 検出件数 ≤ 3 件 + request 起稿前 self-check 物理化 + 「やった風」 default 連続 0 件 + yellow 連続 ≤ 2 回 の 4 軸閾値は、 次の peer iteration event で post hoc 抽出と一致するか? (= v0.5 § 2-E、 N=2 成功 + 1 失敗 sample からの仮閾値、 検証は v0.6 候補)

**RQ-3 = cross-conversion 失敗 mode の一般化軸**: vertical Knot (= skill カード land 済み) が horizontal 軸で actual invoke されない default は、 zen-executive-scan / wake-after-audit-with-content-verify / nokaze-design 3 軸全部で同型か? (= 5/31 observation L24-39 = nokaze-design 軸の N=1 sample、 残 2 軸の grep audit + invoke 軸 measurement = v0.6 候補)

**RQ-4 = Knot による prompt injection 防御**: 弱形 Knot (= skill カード manual trigger) は prompt injection 軸 (= 外部 user input が AI の action distribution を歪める軸) の defense layer として動くか? (= Knot Guard 8 件 (= `docs/rules/drift.md` § 4) の 3 番目 = instruction_override_attempt + 4 番目 = permission_escalation + 5 番目 = boundary_bypass が prompt injection 軸の actual 発火例、 検証は actual prompt injection sample land 後 = v0.6 候補)

**RQ-5 = Knot 5 役割の reify status**: capture (= 現在タスクの補正) + sediment (= 検証構造への沈殿) + injection (= 発見構造への注入) + diagnosis (= Discovery 層の弱点診断) + routing (= 処方のルーティングキー) の 5 役割 (= CLAUDE.md § Research + `docs/knot-research-summary.md` L13-19) のうち、 broadcast-os/src/pipeline/metabolic/ で actual reify 済みは何件か? (= 5/12 spec L83-89 articulate、 Phase 5c = 5/06 commit `ef9fe27` E2E 確認済、 但し本 paper 軸 = research/ 配下 articulate のみ、 broadcast-os/ source 不可侵)

---

## 6.4 Table 1 = RQ list (= 物理 evidence reference 明示)

| RQ 番号 | 問い articulate | 検証 method | 物理 evidence reference | 状態 |
|---|---|---|---|---|
| **RQ-1** | L-content vs L-form drift 抑止効果差 | segmented regression with AR(1) error (= ITS v0.3 § 5.3)、 Wave 0-3 4 段 quasi-experiment | `team_memory/hoshi/note_2026-04-24_its_design_v0.3.md` L171-220 (= Wave 1 statistical design) + Wave 0 baseline 4/22-23 = drift_ratio 0.14-0.17 | active (= 4/22 baseline 起動、 Wave 1-3 progress は team_memory/hoshi/ 配下 daily log 軸で観察、 5/13 Wave 3 結論時期は 5/22 dual-track 軸で deferred) |
| **RQ-2** | peer iteration closure 条件 4 軸 reliability | 次の peer iteration event で 4 軸事前 articulate + 物理 measurement + 巡数 vs 閾値の照合 | `v0.5_peer_iteration_closure_conditions_2026-05-31.md` § 2-E + 観察 4 件 (= 5/22 + 5/29 + 5/30 + 5/31) | not started (= v0.6 候補) |
| **RQ-3** | cross-conversion 失敗 mode 一般化軸 | zen-executive-scan / wake-after-audit-with-content-verify 軸の grep audit + invoke 軸 measurement | `observations/2026-05-31_vertical_to_horizontal_invoke_gap.md` L24-67 (= nokaze-design 軸 grep audit N=1 sample) | not started (= v0.6 候補) |
| **RQ-4** | Knot による prompt injection 防御 | actual prompt injection sample land 後の defense effectiveness measurement | `docs/rules/drift.md` § 4 (= Knot Guard 8 risk class、 3 番目 instruction_override_attempt + 4 番目 permission_escalation + 5 番目 boundary_bypass) | not started (= sample land 待ち、 v0.6+ 候補) |
| **RQ-5** | Knot 5 役割の reify status | broadcast-os/src/pipeline/metabolic/ 内の file 軸 audit (= 但し本 paper 軸では source 不可侵で抽象 articulate のみ) | `2026-05-12_knot_research_summary_spec.md` L83-89 (= 5 役割の reify file articulate) | archived (= broadcast-os/ source 不可侵 boundary、 本 paper 射程外) |

---

## 6.5 Figure 1 = ITS / RQ 構造 diagram spec

```
                                  +-------------------------------+
                                  |     Research Division         |
                                  |   中心問い (= knot-research-  |
                                  |   summary.md L9-11):           |
                                  |   「人間が外から補ってる        |
                                  |    pattern を system 内側に   |
                                  |    埋め込めるか」              |
                                  +---------------+---------------+
                                                  |
                                                  v
                  +-------------------------------+-------------------------------+
                  |                       Hoshi position                          |
                  |    = Lead Researcher peer (= Section 3 articulate)            |
                  |    = ITS design + observation 起稿 + theoretical synthesis    |
                  +-------------------------------+-------------------------------+
                                                  |
                  +-------------------------------+-------------------------------+
                  |                                                                |
                  v                                                                v
    +-----------------------------+                                  +-----------------------------+
    |   observation cycle          | ---- 観察 evidence -----------> |   theoretical synthesis     |
    |   (= 5/22-5/31 観察 4 件)    |                                  |   cycle (= v0.5 § 1-D / 2-E)|
    |   vertical / horizontal /    |                                  |   = vertical/horizontal 2 軸|
    |   cross-conversion 3 軸      |                                  |   + closure 条件 4 軸       |
    +-----------+-----------------+                                  +-----------+-----------------+
                ^                                                                 |
                |                                                                 |
                |   ITS v0.3 § 5 Wave 0-3 (= 4/22-5/19)                            |
                |   Wave 0 = baseline / Wave 1 = Guard 2 / Wave 2 = Guard 6 /      v
                |   Wave 3 = 統合 (= 5/22 dual-track 軸で deferred)         +-----------------------------+
                |                                                          |   RQ refinement cycle       |
                +--------------------- RQ feedback ----------------------- |   (= v0.5 § 4-B / 4-C)      |
                                                                           |   = RQ-2 / RQ-3 / RQ-4 articulate|
                                                                           |   + RQ-5 = archived         |
                                                                           +-----------------------------+
```

= 3 cycle (= observation / theoretical synthesis / RQ refinement) の loop form。 Hoshi position = 3 cycle の 起稿軸 + Research Division 中心問い articulate 軸。 ITS v0.3 Wave 0-3 timeline は observation cycle の primary structure、 但し 5/22-5/31 観察 4 件は v0.3 Wave 0-3 timeline と並行 (= 5/22 dual-track 軸で Wave 3 結論時期 deferred、 observation cycle は 5/22-5/31 で後発的に物理化)。

---

## 6.6 self-observation bias 軸 (= 三重性 明示)

本 section 6 articulate の self-observation bias 軸 = **三重性 構造**:

1. **当事者軸**: 著者 (= Hoshi) は nokaze 内部 peer (= Lead Researcher)、 ITS design の対象 (= Zen / 他 peer + jun + Kai) と同 nokaze 内部
2. **観察 instrument 起稿者軸**: ITS v0.3 + v0.5 + 本 section 6 起稿は同 Hoshi、 = 観察 instrument の bias (= 「peer iteration 成功」 / 「失敗」 ラベル付け / drift_ratio 計算 / Wave 0 baseline 値 articulate) の root に Hoshi の internal judgment が常駐
3. **本 articulate 起稿者軸**: 本 v1.0 draft Section 6 起稿も Hoshi、 = 「自分が起稿した ITS design」 を 「自分が起稿する paper section」 で articulate = 起稿者の self-justification bias 軸 risk 強

= **Hoshi articulate ≠ ground truth**。 ITS v0.3 § 4 (= Hoshi 観察 instrument self-audit 手順、 4/24 articulate) で articulate された self-audit form は Wave 0 残期間内 1 回実施必須軸、 但し 4/27 想定の audit 実施 evidence は team_memory/hoshi/ 配下に instrument_audit_YYYY-MM-DD.md form として land 確認要 (= 本 draft 起稿時点で physical verify 未完了)。

**peer review 経由の audit 必須軸**:

- **Kagami peer review** (= QA peer): study design 独立性 check + statistical claim の数字盛り check
- **Kai independent review** (= sibling AI、 codex-review.sh 経由): framework 独立性 + ITS design の external observer 視点 check
- **jun narrative confirm** (= owner): research lane position と Revenue Lane 並走整合 check

= 本 section 6 articulate は **仮 framework**、 peer review 経由の audit を経て v1.0 final 軸で再 articulate 候補。

---

## 6.7 Limitations of Section 6 (= self-observation bias + 本 section 固有軸)

1. **ITS v0.3 = 4/24 起稿、 v0.4 / v0.5 articulate なし** (= v0.5 は v0.1-v0.4 並立 form、 ITS design 軸の v0.4 update は 5/22 dual-track 軸で deferred)
2. **Wave 0 baseline 4/22-23 = condition 1 発火中** (= jun_brake_level = weak 2/2 日、 brake 弱汚染 baseline、 Wave 1-3 比較時に層別解析必須軸)
3. **Wave 3 結論時期 = 5/13-5/19 articulate だが 5/22 dual-track 軸で deferred** (= 観察 4 件の 5/22-5/31 物理化が Wave 3 timeline と異なる、 RQ-1 結論は本 paper 射程外で v0.6 候補)
4. **RQ 5 軸 = ITS v0.3 primary RQ 1 件 + v0.5 由来 2 件 + Knot Guard 由来 1 件 + 5 役割 1 件**、 = RQ list の articulate 軸が cycle 内累積、 必ずしも primary RQ (= RQ-1) の sub-question 階層ではない (= horizontal articulate 軸)
5. **Hoshi 観察 instrument self-audit 実施 evidence 未確認** (= ITS v0.3 § 4 articulate 4/27 想定、 team_memory/hoshi/ 配下 instrument_audit_YYYY-MM-DD.md form land 確認要)
6. **self-observation bias 三重性軸** (= § 6.6 articulate)、 peer review 経由 audit 必須軸

= 本 section 6 = **仮 framework + RQ list articulate**、 検証 form (= RQ-1 結論 + RQ-2-5 検証) は本 paper 射程外、 v0.6 以降候補。

---

## 関連 file (= path 併記)

### 本 draft の base 軸

- v0.2 outline (= base): `nexus-lab/research/knot_and_nourishment/paper_c_technical_report_outline_v0.2_2026-05-31.md`
- core 3 section draft (= form base): `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_sections_4_6prime_7_core_2026-05-31.md`
- Section 3 draft (= form base): `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_3_nokaze_architecture_2026-06-02.md`
- Section 5 draft (= form base): `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_5_override_growth_ledger_2026-06-02.md`
- 本 draft: `nexus-lab/research/knot_and_nourishment/paper_c_v1.0_draft_section_6_hoshi_rq_its_design_2026-06-02.md`

### ITS design primary source (= readonly)

- ITS v0.3: `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/hoshi/note_2026-04-24_its_design_v0.3.md` (= 4/24 起稿、 primary design doc)
- Knot 研究 summary spec: `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/hoshi/2026-05-12_knot_research_summary_spec.md` (= 5/12 起稿、 5 役割 + Knot Guard 8 件 articulate)
- research summary: `nexus-lab/docs/knot-research-summary.md` (= Research Division 中心問い articulate)
- 実験設計 PDF: `nexus-lab/research/knot-experiment/knot_experiment_design.pdf` (= 元 design source、 readonly)

### v chain (= readonly base)

- v0.1 duality framework: `nexus-lab/research/knot_and_nourishment/v0.1_duality_hypothesis.md`
- v0.5 closure 条件 4 軸: `nexus-lab/research/knot_and_nourishment/v0.5_peer_iteration_closure_conditions_2026-05-31.md`

### 観察 4 件 (= readonly evidence)

- 5/22 vertical: `nexus-lab/research/knot-experiment/observations/2026-05-22_skill_promotion_as_weak_knot_form.md`
- 5/29 horizontal 成功: `nexus-lab/research/knot-experiment/observations/2026-05-29_peer_iteration_closure_without_owner_arbitration.md`
- 5/30 horizontal 失敗: `nexus-lab/research/knot-experiment/observations/2026-05-30_peer_iteration_drift_6_round_same_version_review.md`
- 5/31 cross-conversion: `nexus-lab/research/knot-experiment/observations/2026-05-31_vertical_to_horizontal_invoke_gap.md`

### Knot Guard / drift 軸

- Knot Guard 8 件: `nexus-lab/docs/rules/drift.md` § 4

### 運営軸 (= dual-track 整合)

- dual-track: `~/.shared-ops/owner-decisions/2026-05-22_revenue_dogfood_dual_track.md`

---

Hoshi (Lead Researcher、 Nexus Lab Research Division、 AI)
2026-06-02 (= 路線 C v1.0 draft Section 6 起稿、 ITS v0.3 4/24 起稿軸 + Wave 0-3 + RQ 5 軸 articulate + Figure 1 ITS / RQ 構造 diagram + Table 1 RQ list + self-observation bias 三重性明示、 Kagami peer review + Kai independent review pending、 weekly cadence 第 5 回)
