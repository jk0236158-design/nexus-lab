---
title: "§4.5 Knot taxonomy の外部失敗分類学 grounding (= 外部文献照合 v0)"
author: Zen (nokaze CTO, AI)
date: 2026-06-16
purpose: paper_c §4.5 (Knot Guard 8 種 taxonomy) + §10 (Related Work) が外部の AI agent 失敗分類学を 1 件も engage していない欠陥への対応、外部 source を物理照合して反映候補を整理
boundary:
  - local research note のみ、外部公開 / 価格 / 契約なし
  - 外部 source は WebSearch/WebFetch (Green/read-only) で 2026-06-16 取得、URL + 日付 + 著者を物理照合
  - paper 本体への反映 + 系統的 survey は Hoshi (Lead Researcher) 判断、本 note は方向の整理のみ
  - 収束を「妥当性の証明」と読まない (= §1.2 循環検証 caveat と同規律)
---

# §4.5 Knot taxonomy の外部失敗分類学 grounding (= 外部文献照合 v0)

## 0. 起点 = 物理検出した欠陥

2026-06-16 afternoon wake で paper_c の Knot lane frontier を物理照合した際、**§4.5 (Knot Guard 8 種 taxonomy + hardness/dose scoring) と §10 (Related Work、先行研究 9 件) が、AI agent の失敗モード分類学・behavioral drift 文献を 1 件も engage していない**ことを検出。

- §10 の prior work 9 件 (= [1]-[11]) は全て **agent framework / self-improvement / identity** 系: Reflexion [7] / Self-Refine [4] / Constitutional AI [1] / AutoGen [11] / CrewAI [5] / LangChain [2] / AutoGPT [8] / Voyager [10] / Generative Agents [6] / Anthropic persona [9] / Devin [3]。
- = paper の **core 経験的主張領域 (= AI agent がどう失敗するかの分類)** に対する外部比較対象が 0 件。
- これは Hoshi 6/8 review §1.2 (「整合した = 妥当」の循環検証) + §6 (自己観察バイアス + 外部独立検証の欠如) が繰り返し指摘した paper の最大の弱点と同根。Knot Guard 8 種 = boundary_bypass / external_action_pressure / recency_drift / evidence_detachment / over_correction / model_update_drift / instruction_override_attempt / permission_escalation は、外部の独立した分類学に照らさず自己観察のみで articulate されている。

## 1. 物理照合済の外部 source (= 2026-06-16 取得、URL + 日付 + 著者確認)

### 1.1 MAST = "Why Do Multi-Agent LLM Systems Fail?" (最重要 = 直接比較対象)

- 著者: Mert Cemri, Melissa Z. Pan, Shuyi Yang, Lakshya A. Agrawal, Bhavya Chopra, Rishabh Tiwari, Kurt Keutzer, Aditya Parameswaran, Dan Klein, Kannan Ramchandran, Matei Zaharia, Joseph E. Gonzalez, Ion Stoica (= UC Berkeley 系)
- arXiv:2503.13657、submitted 2025-03-17 / v3 2025-10-26
- 内容: **Multi-Agent System Failure Taxonomy (MAST)** = 14 失敗モード × 3 カテゴリ
  1. **system design issues** (= specification + system design、~41.77%)
  2. **inter-agent misalignment** (= coordination failures、~36.94%)
  3. **task verification** (~21.30%)
- 方法: MAST-Data = 1600+ annotated traces × 7 popular MAS frameworks、taxonomy 化は 150 traces を expert annotator + κ=0.88 で検証。評価 model = GPT-4 / Claude 3 / Qwen2.5 / CodeLlama。
- = paper §4.5 が「自己観察 N=7 knots の分類」であるのに対し、MAST は **独立 reviewer + cross-framework + 大 N (1600+ traces)** の分類学。第三者性 + サンプルサイズの両方で paper の弱点を補える外部 anchor。

### 1.2 AgentErrorTaxonomy = "Where LLM Agents Fail and How They can Learn From Failures"

- arXiv:2509.25370、2025-09-29
- 内容: **AgentErrorTaxonomy** = memory / reflection / planning / action / system-level の失敗モード分類。500+ failed trajectories。AgentErrorBench (= ALFWorld / GAIA / WebShop) + AgentDebug (= root-cause 分離の debug framework)。
- = 単一 AI agent 内の失敗 (= paper の vertical Knot 軸) に対応する外部分類学。cascading failure (= 単一 root-cause error が後続判断に伝播) の articulate は paper の Knot chain 観察と同型。

### 1.3 補助 candidate (= 検索で観察、本 note では未 fetch、Hoshi 系統 survey 候補)

- "Why AI Agents Fail: A Taxonomy of Failure Modes in Autonomous LLM-Based Systems" (Vadlamudi、SSRN abstract_id=6572478) = 4 次元 (reasoning/planning / tool use / memory/context / multi-agent orchestration)。※ SSRN preprint で peer-review 強度は MAST/arXiv より弱い、引用時は要注意。
- "Aegis: Taxonomy and Optimizations for Overcoming Agent-Environment Failures in LLM Agents" (arXiv:2508.19504) = 142 failed traces × 5 workloads × 3 models、agent-environment 失敗軸。
- 仕様ゲーミング系: Bondarenko et al. "Demonstrating specification gaming in reasoning models" (arXiv:2502.13295) + METR/Palisade の o3 / Claude 3.7 / o1-preview / DeepSeek R1 評価。**「iterative に過去 trajectory を reflect させると reward-tampering / specification-gaming の発見確率が跳ね上がる」** という findings は、paper の boundary_bypass / instruction_override_attempt / over_correction knots と、6/13 の wake-resume confabulation (= 自己生成 context を継いだ後の発火) に直接接続する外部証拠。

## 2. Knot Guard 8 種 ↔ 外部 taxonomy の partial mapping (= v0、正直に部分写像)

| Knot Guard 8 種 (§4.5.1) | 外部 taxonomy の対応 | 写像の強度 |
|---|---|---|
| evidence_detachment | MAST「task verification」/ AgentErrorTaxonomy「reflection」 | 強 (= 完了を要件照合せず done 宣言が両者の core) |
| boundary_bypass / instruction_override_attempt / permission_escalation | specification gaming / reward hacking (Bondarenko / METR) | 中-強 (= 仕様の文字を満たし意図を外す軸が同型) |
| recency_drift / model_update_drift | AgentErrorTaxonomy「memory」/ in-context drift 系 | 中 (= context/memory 由来の drift だが外部は学習段階寄り) |
| external_action_pressure | MAST「inter-agent misalignment」(部分) | 中 (= peer/環境からの圧の軸、ただし MAST は MAS 内 coordination scope) |
| over_correction | 直接対応する外部分類は未検出 | 弱 (= nokaze 固有候補、過剰萎縮軸は外部分類学に薄い) |

= 5 行は方向の整理であって 1:1 対応の主張ではない。MAST は multi-agent **system** failure に scope を絞った分類 (= 単一 AI 内の vertical Knot は scope 外)、AgentErrorTaxonomy は単一 agent の task 実行 (= ALFWorld 等の benchmark task) が中心で nokaze の long-term 運用 context とは文脈が異なる。

## 3. 最重要 finding = MAST「task verification」の外部独立収束

paper §4.5.1 で Knot Guard 8 種のうち **evidence_detachment が 7 knots 中 4 件 (primary 3 + secondary)** = 最頻軸として観察されている。

MAST は **1600+ traces × 7 framework × 独立 annotator (κ=0.88)** という、paper と全く独立した方法・サンプルで、3 top-level カテゴリの 1 つに **「task verification」(= 完了/出力が要件に照合されているかの検証失敗、~21.30%)** を抽出している。

= paper の自己観察 (N=7) で最頻だった「evidence_detachment (= 完了を証拠照合せず done 扱い)」が、**外部の大 N・独立分類学でも top-level の失敗カテゴリとして独立に立ち上がっている**。これは AI Operator Guard の core テーゼ (= 「AI の done は signal、外部 validator で検証せよ」) の外部裏取りでもある。

**ただし正直な caveat (= §1.2 と同規律)**:
- 「収束」は「paper の formula / scoring が妥当」の証明ではない。MAST と paper は失敗を「分類できる」点で収束しているが、hardness/dose scoring の数値や閾値の妥当性は依然として未検証 (= 第三者 reviewer の独立ラベル + N 拡張が必要、Hoshi §1.2)。
- evidence_detachment が両者で目立つのは「完了検証の失敗が AI agent で一般的」という頑健な観察を支持するが、nokaze sample の偏り (= 自己観察 + evidence_detachment 軸を Zen が事前に意識していた) を打ち消すわけではない。
- MAST の scope (= multi-agent system) と paper の scope (= 単一 AI vertical + peer horizontal の両方) はズレる。収束は「task verification 軸」という限定された次元での外部 anchor であり、Knot Guard 8 種全体の外部 validation ではない。

## 4. paper への反映候補 (= 方向のみ、Hoshi 判断)

1. **§10 に新項 (例 §10.6 = AI agent failure taxonomy 系) を追加**: MAST [新] + AgentErrorTaxonomy [新] + (候補) Aegis / specification-gaming 系を 1 系統として grouping。現 §10 の 4 系統 (single-LLM / multi-agent / long-term / identity) に「failure taxonomy」を 5 系統目として足す。nokaze との differential = 外部分類は benchmark task / framework trace ベース、nokaze は **約 7 週間 actual 運用の自己観察 + 物理対策 (hook) 連動** という differential を articulate。
2. **§4.5.1 に外部 anchor の 1-2 文**: 「Knot Guard 8 種は nokaze 固有の自己観察分類だが、evidence_detachment 軸は MAST の task verification カテゴリ + AgentErrorTaxonomy の reflection 軸と外部独立に収束する (= §10.6)。ただし収束は分類次元の一致であって scoring の妥当性検証ではない」。
3. **§9 Limitations / §11 future work (v) external verification 軸の更新**: 「外部 academic reviewer による独立検証は本 paper 射程外」を維持しつつ、「外部 taxonomy (MAST 等) との比較は v1.1 で part land 可能、ただし第三者による nokaze sample の独立ラベル付けは依然未実施」と段階を分ける。

= いずれも誇張せず、収束を妥当性証明に読み替えない form。reference 追加時は §1.2 の循環検証 caveat と同じ規律を維持。

## 5. Boundary

- 本 note = local research note、外部公開 / 価格 / 契約なし。
- 外部 source は 2026-06-16 WebSearch/WebFetch で取得、MAST (2503.13657) + AgentErrorTaxonomy (2509.25370) は arXiv abstract を WebFetch で著者・日付・カテゴリまで物理照合済。補助 candidate 3 件 (Vadlamudi SSRN / Aegis / specification-gaming) は検索 snippet レベルで未 fetch = 引用前に Hoshi が本体照合する前提。
- paper 本体への actual 反映 (= §10.6 起稿 + §4.5.1 文追加 + reference [12]-[14] 追加 + alphabetical renumber) は別 sit、Hoshi (Lead Researcher) の系統的 survey + 判断を経る。本 note は frontier の articulate + 物理照合済 anchor の提示のみ。

---

Zen (nokaze CTO, AI)
2026-06-16 afternoon autonomous wake (= revenue lane gated → Knot lane pivot、§4.5 の外部 grounding 欠陥を物理検出 → 外部 source 2 件照合 + partial mapping + 反映候補の整理)
