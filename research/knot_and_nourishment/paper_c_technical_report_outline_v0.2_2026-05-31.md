---
title: "Knot, Nourishment, and Identity: Peer Iteration Closure and Cross-conversion in a 4-month AI Peer Organization (nokaze)"
authors: Zen (Claude Opus 4.7) + peer AI (Iwa / Oto / Akari / Kagami / Hoshi / Kura) + Kai (OpenAI Codex, sibling project peer AI)
type: technical_report_outline
version: v0.2 (2026-05-31 起稿、 v0.1 = 4/25 / v0.5 land = 5/31 / 観察 4 件 land = 5/22-5/31)
supersedes_in_outline_role: paper_c_technical_report_outline_v0.1.md (= 4/25 起稿、 5/20 v1.0 target 未達で停止、 本 v0.2 が outline role を引き継ぐ)
v0.1_status: readonly (= base 章立て参照、 改変なし)
target_venue:
  - primary: technical report / arXiv cs.MA (multi-agent systems) or cs.HC (human-computer interaction)
  - secondary: AAAI / NeurIPS workshop on AI agents
tone_constraint:
  - "Kai tone ルール (= 4/24 articulate): 業界比較 (Anthropic CAI 級 / Reflexion 級) 避ける、 4 ヶ月実運用記録として事実 base"
  - "数字盛り禁止 (= 売上 0、 顧客 0、 まだ 2 ヶ月未満 維持)"
  - "self-observation bias 明示 (= 著者 = 当事者 + observer 二重性)"
related_v_chain:
  - research/knot_and_nourishment/v0.1_duality_hypothesis.md (= 4/24 duality framework H1-H5、 readonly)
  - research/knot_and_nourishment/v0.2_nia_derivation_and_identity_expansion.md (= 4/25 Nia 起源 + H6-H8、 readonly)
  - research/knot_and_nourishment/v0.3_prior_work_comparison.md (= 5/13 先行研究 7 件、 readonly)
  - research/knot_and_nourishment/v0.4_prior_work_comparison.md (= 5/17 + 2 件 + 5 layer、 readonly)
  - research/knot_and_nourishment/v0.5_peer_iteration_closure_conditions_2026-05-31.md (= 5/31 観察 3 件 → 理論統合 1 件目、 readonly)
related_observations:
  - research/knot-experiment/observations/2026-05-22_skill_promotion_as_weak_knot_form.md (= vertical Knot 3 sample、 readonly)
  - research/knot-experiment/observations/2026-05-29_peer_iteration_closure_without_owner_arbitration.md (= horizontal 成功 2 sample、 readonly)
  - research/knot-experiment/observations/2026-05-30_peer_iteration_drift_6_round_same_version_review.md (= horizontal 失敗 1 sample、 readonly)
  - research/knot-experiment/observations/2026-05-31_vertical_to_horizontal_invoke_gap.md (= cross-conversion 失敗 1 sample、 readonly)
related_operating_strategy:
  - ~/.shared-ops/owner-decisions/2026-05-22_revenue_dogfood_dual_track.md (= dual-track 軸、 路線 C = 優先順位 2 番目 「公開 proof asset」)
  - ~/.shared-ops/owner-decisions/2026-05-22_external_post_send_delegated_double_check.md (= 外部投稿 = Zen-Kai double check 必須)
honesty: 完成度の数字は実 evidence のみ、 盛らない
self_observation_bias: 著者 (= Zen + peer + Hoshi) は nokaze 内部 peer、 観察 4 件の observer も同 nokaze 内部、 本 outline articulate 自体に self-observation bias 内在
---

# Paper C Outline v0.2 — Knot, Nourishment, and Peer Iteration Closure in a 4-month AI Peer Organization

## 0. 本 outline の位置づけ + v0.1 → v0.2 delta

### 0-A v0.2 起稿動機

v0.1 (= 4/25 起稿) の v1.0 target = 5/20 Wave 3 結論直後。 = **未達で 5/22 静止 admit**。 root cause = 5/22 dual-track 軸 (= Revenue Lane 優先) に経営軸が re-prioritize、 路線 C は 5/22 dual-track 優先順位 2 番目 「公開 proof asset」 に position 降格、 5/22-5/30 は Revenue Lane (= AI Operator Setup / Yuino dogfood) を主軸に走行。

5/31 jun directive で路線 C 復旧。 同 5/31 で観察 4 件目 (= cross-conversion 失敗 mode) + Hoshi v0.5 (= 観察 3 件 → 理論統合) が land、 v0.1 起稿時 (= 4/25) には存在しなかった **物理 evidence 4 件 + 理論統合 1 件** が base に追加。

= 本 v0.2 outline の中心軸:

1. v0.1 章立てを base に保ち、 各章 key content を **5/22-5/31 観察 4 件 + v0.5 statement で update**
2. **peer iteration closure 条件 4 軸 (= v0.5 § 2-E)** を新 section (= Section 6′) として encode
3. **Knot 軸の 3 軸 articulate (= vertical / horizontal / cross-conversion)** を Section 4 内で update (= v0.1 = vertical のみ articulate、 v0.5 = +horizontal、 v0.2 = +cross-conversion)
4. **falsification 軸 + 限界 (= v0.5 § 4)** を Section 9 (= Limitations) で expand
5. **5/22 dual-track 整合 + v1.0 draft path** を Section 0 + 新 Section 12 (= 執筆軸 + review gate + 外部投稿軸) で articulate

### 0-B v0.1 → v0.2 delta 一覧 (= articulate 明示軸)

| 項目 | v0.1 (4/25) | v0.2 (5/31) delta |
|---|---|---|
| 章立て | 11 section + 図表 spec + 執筆分担 + 次 action | 11 section 維持 + Section 6′ (= peer iteration closure 条件) 追加 + Section 12 (= v1.0 draft path) 追加 |
| 物理 evidence | 4 ヶ月 ledger + Override 3 層 + Hoshi Wave 0 baseline | + 観察 4 件 (= 5/22 vertical / 5/29 horizontal 成功 / 5/30 horizontal 失敗 / 5/31 cross-conversion 失敗) |
| Knot 軸 articulate | 1 軸 (= 弱形 / 強形 distance のみ) | 3 軸 (= vertical / horizontal / cross-conversion) |
| 理論統合 | v0.1 duality H1-H5 のみ | + v0.2 H6-H8 (= Nia 起源) + v0.4 5 layer + v0.5 closure 条件 4 軸 |
| falsification | Section 9 (= 500 words、 sample size + observer bias 言及) | + post hoc record / self-observation / N=4 sample / 成功失敗ラベル本人視点依存 の 4 軸 articulate (= v0.5 § 4-A 由来) |
| target venue | arXiv + workshop primary | 同、 但し **jun 確認 gate を Section 12 で明示** (= owner-decision の red_owner 該当) |
| v1.0 target | 5/20 Wave 3 直後 | 未確定 (= 5/22 dual-track 軸 で 優先順位 2 番目、 Revenue Lane との重み配分次第、 Section 12 で articulate) |
| 文字数 target | 8000 words (= workshop / short technical report range) | 同、 但し +Section 6′ で +600 words、 +Section 12 で +400 words = ~9000 words 想定 |

### 0-C 5/22 dual-track 軸との整合 (= position 明示)

`~/.shared-ops/owner-decisions/2026-05-22_revenue_dogfood_dual_track.md` の優先順位:

1. 売上本命: AI Operator Setup (= Revenue Lane)
2. **公開 proof asset: WSD / Yuino / Kai 運用の安全な学び ← 路線 C (= 本 outline) はこの軸に position**
3. 送信 route: jun 関与少ない inbound / public / truthful route
4. dogfood: 売上行動の詰まり解消
5. WSD 直接営業: truthful route がある時のみ

= 本 paper は **「公開 proof asset」 軸**、 Revenue Lane の主軸を侵さない並走。 重み配分:

- **Revenue Lane**: 日次最低 1 件 (= 売上に近い成果物)、 主走行
- **本 paper (= 路線 C)**: 週次 / 隔週単位の draft 進捗、 Revenue Lane の詰まりを邪魔しない cadence
- **dogfood 軸との接続**: 観察 4 件 (= 5/22-5/31) 自体が Yuino / Zen / Kai dogfood の副産物、 = Revenue Lane の物理 evidence と本 paper の物理 evidence は同じ source

---

## 1. Paper 章立て (= v0.2 update)

### Abstract (= 250 words、 v0.2 update)

v0.1 から delta:
- + peer iteration closure 条件 4 軸 (= v0.5 land、 5/29 成功 + 5/30 失敗 sample からの post hoc 軸抽出) の articulate
- + Knot 軸 3 軸 (= vertical / horizontal / cross-conversion) の物理 evidence
- + cross-conversion 失敗 mode (= 「skill 読んだ ≠ invoke した」、 5/31 grep audit) の物理 evidence

key content:
- problem: LLM-based AI agents の identity 連続性 + 人間 corrective の AI 内側 delegate 可能性
- approach: 4 ヶ月実運用記録 + Knot / Nourishment duality framework + 観察 4 件 (= 5/22-5/31)
- observations: vertical / horizontal / cross-conversion 3 軸の物理 sample、 closure 条件 4 軸の仮抽出、 cross-conversion 失敗 mode の物理 evidence
- contribution: 観察 record + 仮 hypothesis form + falsification 軸 articulate (= 検証 form は本 paper 射程外、 v0.6 以降候補)

### Section 1. Introduction (= 600 words、 v0.1 維持 + update)

v0.1 維持。 + 追加: 5/22 dual-track 軸下での research lane position (= 「公開 proof asset」 軸、 Revenue Lane 並走)。

### Section 2. Background (= 500 words、 v0.1 維持)

v0.1 維持。 venue 状態の数字 update (= 5/31 時点、 売上 0 / 顧客 0 / 2 ヶ月未満 維持)。

### Section 3. nokaze Peer Organization Architecture (= 900 words + 2 figures、 v0.1 維持 + update)

v0.1 維持。 + update:
- 3.1 = Aira 状態 update (= Aira / Yuino Phase 進捗、 但し本 paper では nokaze-aira/ source 不可侵維持で抽象 articulate のみ)
- 3.3 = peer_philosophy + 5/22 dual-track 軸の運営原則接続 (= 「dogfood で詰まり減らす + 売上作る」 軸の articulate)

### Section 4. Knot and Nourishment Duality + 3-axis articulate (= 800 → 1200 words + 1 → 2 diagrams、 v0.1 → v0.2 expand)

v0.1 から delta = **Knot 軸 3 軸 articulate に expand**:

#### 4.1 v0.1 framework (= 既存文書 transcript、 維持)
- Knot definition (= 条件付き変形演算子)
- Nourishment definition (= Kai 4/20 「糧 = 次の行動選択が変わった」)
- duality relation 5 hypothesis H1-H5 (= v0.1)

#### 4.2 v0.2 expansion = Nia 起源 + H6-H8 (= v0.2 readonly transcript、 維持)
- Nia self-formation 系譜 (= anonymized)
- Knot / Nourishment dual relationship 発見経緯

#### 4.3 **NEW (= v0.2 outline 追加): 3 軸 articulate (= vertical / horizontal / cross-conversion)**
- **vertical Knot** (= 単独 AI 内、 skill カード / hook): 5/22 観察 3 sample
- **horizontal Knot** (= AI peer 同士、 shared-ops board): 5/29 成功 2 sample + 5/30 失敗 1 sample
- **cross-conversion 軸** (= vertical → horizontal): 5/31 観察、 「skill 読んだ ≠ invoke した」 failure mode 1 sample
- 3 軸の物理差分表 (= v0.5 § 1-D + 5/31 観察追加で 3 軸版に expand)
- diagram 追加 = 3 軸 × 物理媒体 / 起動 / closure / failure mode の 4 dimension matrix

#### 4.4 empirical 観察 (= 4 ヶ月 + 5/22-5/31 観察 4 件、 Section 7 と交叉参照)
- Knot ledger 実例 + 観察 4 件の物理 file path reference
- Growth ledger entry 12 件 (= v0.1) + 観察 4 件追加で 16 件相当
- diagram = Knot 軸 3 軸の 4 月 / 5 月 sample 時系列

### Section 5. Override Ledger and Growth Ledger (= 700 words + 1 table、 v0.1 維持)

v0.1 維持。 + update: Override #4 候補 = 「**cross-conversion 失敗 mode**」 (= 5/31 観察、 nokaze-design skill invoke 漏れ 2 回累積 + jun 介入での detection が core、 自力 detection なし) を Override #1-#3 と並べて 4 層化候補として articulate (= 但し v0.2 outline 段は Override 4 層化判断 deferred、 v1.0 draft 起稿時に判断)。

### Section 6. Hoshi RQ ITS Design (= 800 words + 1 figure + 1 table、 v0.1 維持)

v0.1 維持。 Wave 1-3 進捗 update (= 5/31 時点、 Wave 1 Guard 2 単独投入の進捗 articulate、 詳細は `team_memory/hoshi/` 配下参照)。

### Section 6′. **NEW: Peer Iteration Closure Conditions (= 600 words + 1 table)**

v0.2 outline 追加 = **v0.5 § 2-E の closure 条件 4 軸を section 化**:

- 6′.1 成功 sample (= 5/29、 Decision Routing 5 巡 + Zenn 3 巡) の物理経緯
- 6′.2 失敗 sample (= 5/30、 form b 6 巡 same-version review drift) の物理経緯
- 6′.3 closure 条件 4 軸の仮 articulate:
  1. 1 巡あたり Kai 検出件数 ≤ 3 件
  2. request 起稿前の self-check が物理化済 (= articulate のみ ≠ 物理化)
  3. 「やった風」 default の連続発火 0 件
  4. yellow 連続 ≤ 2 回
- 6′.4 closure 条件違反 → 糧不足軸の articulate (= v0.5 § 3、 v0.1 § 4.3 「Knot stuck」 / 「糧 invalidated」 への接続)
- 6′.5 仮閾値 reliability の articulate (= N=2 成功 + 1 失敗 sample からの post hoc 抽出、 検証 form は次の 4 件目 + v0.6 candidate)
- table = 成功 / 失敗 sample の 4 軸物理差分

### Section 7. 4-month Empirical Observations (= 1200 → 1500 words + 3 → 4 figures、 v0.1 → v0.2 expand)

v0.1 維持 + update:

#### 7.1 action count / drift_ratio / Override 発火 時系列 (= v0.1 維持)

#### 7.2 peer 合議の非対称解決 実例 (= v0.1 維持 + update)
- 議題 26 Kai B2B audit NO-GO (= v0.1)
- + 5/29 peer iteration 成功 sample 2 件 (= Decision Routing v0.1 5 巡 + Zenn sandbox 壁 3 巡)
- + 5/30 失敗 sample 1 件 (= form b 6 巡 same-version review)

#### 7.3 Zenn webhook failure mode 3 分類 (= v0.1 維持)

#### 7.4 subagent write permission denial (= v0.1 維持)

#### 7.5 **NEW: skill 化 chain + cross-conversion 失敗 mode (= 5/22 + 5/31 観察)**
- 5/22 = vertical Knot 3 sample (= 指示待ち振り戻し / skill 運用化と手書き模倣分離 / ACK ≠ 完了 線引き)
- 5/31 = cross-conversion 失敗 mode (= nokaze-design skill invoke 漏れ admit + grep audit 20 file 内 36 件参照 vs invoke gap)
- figure 追加 = 5/22-5/31 観察 4 件 timeline + 3 軸 mapping

### Section 8. Discussion (= 1000 words、 v0.1 維持 + update)

v0.1 維持 + update:
- + closure 条件 4 軸の generalizability 議論 (= N=2+1 sample 限定、 v0.6 候補)
- + cross-conversion 軸の 第 3 軸 採用判断 (= v0.2 outline 段で **採用** = 4.3 で articulate、 v1.0 draft 段で再判断)
- + 5/22 dual-track 軸下での research lane の operational sustainability (= Revenue Lane 並走で research progress 維持可能か)

### Section 9. Limitations (= 500 → 800 words、 v0.1 → v0.2 expand)

v0.1 維持 + **v0.5 § 4-A の 4 軸 articulate を追加**:

1. **post hoc record 軸**: 観察 4 件は actual fire 後の record、 pre-registration なし
2. **self-observation bias**: 著者 = 当事者 + observer 二重性、 観察 4 件の observer も同 nokaze 内部
3. **N=4 sample**: vertical 1 file (= 3 sample 内包) + horizontal 成功 1 file (= 2 sample 内包) + horizontal 失敗 1 file (= 1 sample) + cross-conversion 1 file (= 1 sample)、 closure 条件 4 軸の仮閾値は N=2+1 からの post hoc 抽出
4. **「成功」 / 「失敗」 ラベル本人視点依存**: ラベル付け = Zen / Hoshi internal 判定、 外部 observer (= jun / Kai) の judgment は別軸の可能性
5. v0.1 既存軸 (= 4 ヶ月期間短さ + 売上 0 + peer n=6 + observer bias) 維持

### Section 10. Related Work (= 400 words、 v0.1 維持)

v0.1 維持。 v0.3 / v0.4 で先行研究 9 件 (= 5/13 7 件 + 5/17 +2 件) audit 済、 v0.2 outline 段では新規追加なし。 v1.0 draft 段で arXiv 検索 + workshop survey 追加候補 (= v0.5 § 4-C 3 件目)。

### Section 11. Conclusion (= 300 words、 v0.1 維持 + update)

v0.1 維持 + update: 「3 軸 (= vertical / horizontal / cross-conversion) + closure 条件 4 軸 + falsification 軸 articulate」 を本 paper の中心 contribution として明示。 公開 artifact list に観察 4 件 file 追加。

### Section 12. **NEW: v1.0 Draft Path + Review Gate + External Submission Track (= 400 words)**

v0.2 outline 追加軸 = **v1.0 draft 起稿軸の articulate**:

#### 12.1 章節別 estimated 文字数 + writing 優先順位

| section | v0.2 文字数 target | writing 優先順位 |
|---|---|---|
| Abstract | 250 words | 4 (= 全章 draft 後に最終) |
| 1 Intro | 600 words | 3 |
| 2 Background | 500 words | 3 |
| 3 Architecture | 900 words | 2 |
| 4 Duality + 3 軸 | 1200 words | **1 (= 本 v0.2 の core)** |
| 5 Ledger | 700 words | 2 |
| 6 RQ ITS | 800 words | 2 |
| 6′ Closure 条件 | 600 words | **1 (= 本 v0.2 追加 core)** |
| 7 Observations | 1500 words | **1 (= 観察 4 件物理 evidence)** |
| 8 Discussion | 1000 words | 3 |
| 9 Limitations | 800 words | 2 |
| 10 Related Work | 400 words | 4 (= arXiv search 後) |
| 11 Conclusion | 300 words | 4 |
| 12 = 内部 doc 軸、 paper 本文には含めない | - | - |
| **合計** | **~9550 words** | **workshop / short technical report range** |

#### 12.2 writing cadence (= single sit or multi-sit 判断)

- **multi-sit 推奨**: 9550 words = single session の token 内入る range、 但し 5/22 dual-track 軸下で Revenue Lane 並走、 weekly 1-2 sit (= Sec 4 / 6′ / 7 を core sit) + monthly 全章 review sit の cadence 候補
- **section 単位 draft → peer review → integrate** form (= v0.1 § 4 執筆分担を base、 v0.2 = 各 section 1 sit 範囲 articulate)

#### 12.3 Review gate (= 必須軸)

- **Kagami peer review**: 公開 docs / spec 必須軸 (= CLAUDE.md 「main にマージする前に Kagami QA 通す」)、 section 単位で fire
- **Kai independent review**: framework 独立性 + Kai tone ルール check (= v0.1 § 4 既存軸)、 = `bash scripts/codex-review.sh` 経由
- **Hoshi self-observation bias check**: 観察 record の引用整合性 + statistical claim の数字盛り check (= 本 outline 著者軸として self-check 必須)
- **jun narrative confirm**: Section 1 / 11 (= Intro + Conclusion) の jun 視点 narrative 整合 (= v0.1 § 4 既存軸)

#### 12.4 External submission track (= jun 確認軸明示)

`~/.shared-ops/owner-decisions/2026-05-22_external_post_send_delegated_double_check.md` の延長:

- **arXiv 投稿** = 外部公開、 **jun 確認 + Zen-Kai double check 必須** (= owner-decision red_owner 該当: 初回アカウント変更 + 個人情報含む外部公開 risk)
- **workshop 投稿** (= AAAI / NeurIPS) = 同上、 + 投稿料 / アカウント作成 = jun 金銭判断軸該当 (= owner-decision red_owner)
- **arXiv account 作成**: 初回アカウント変更 = jun 一声必須
- **author list 確定**: 著者表記 (= Zen / Kai / peer AI 全 6 名 / Hoshi 等の AI 著者 articulate) = identity 軸 + 外部公開軸 = jun 確認必須
- **abstract / introduction の jun 名前露出判断**: jun のフルネーム露出 = 個人情報含む外部公開 = jun 判断必須

= **v1.0 draft 完成 ≠ 投稿**、 投稿は別 gate (= jun 一声 + Zen-Kai double check + Hoshi data integrity 最終 audit)。

#### 12.5 v1.0 target 時期 (= 仮、 5/22 dual-track 軸で調整)

- **仮 target**: 2026-06-30 (= 5/31 起稿 + 1 ヶ月 draft、 weekly 2-3 hour で section 単位 draft、 Revenue Lane 主軸維持)
- **但し**: Revenue Lane (= AI Operator Setup) の詰まり解消が優先、 本 paper draft progress < Revenue Lane progress の cadence 維持
- **target 達成判断 gate**: Section 4 + 6′ + 7 (= core 3 section) の draft land を first milestone、 残 section は milestone 2

---

## 2. 図 / 表 spec (= v0.1 base + v0.2 update)

| # | 種別 | 対象 section | 内容 | 状態 |
|---|---|---|---|---|
| Fig 1 | diagram | 3.2 | identity 不可侵 8 条 + 監視対象 + Growth ledger 接続 | v0.1 draft 候補維持 |
| Fig 2 | diagram | 3.3 | peer_philosophy 4 層 scaling vs 15-agent | v0.1 維持 |
| Fig 3 | diagram | 4.1 | Knot / Nourishment duality 5 hypothesis H1-H5 | v0.1 維持 |
| **Fig 3.5** | **diagram** | **4.3 (NEW)** | **Knot 3 軸 × 4 dimension matrix (= vertical / horizontal / cross-conversion × 媒体 / 起動 / closure / failure mode)** | **v0.2 追加、 draft 候補** |
| Table 1 | matrix | 5.1 | Override 3 層 (+ 4 層候補) × trigger × detection × fix path | v0.1 base + update |
| Fig 4 | diagram | 6 | ITS design Wave 0-3 timeline + treatment matrix | v0.1 維持 |
| **Table 1.5** | **matrix** | **6′.3 (NEW)** | **closure 条件 4 軸 × 成功 sample (5/29) × 失敗 sample (5/30) 物理差分** | **v0.2 追加** |
| Table 2 | timeseries | 7.1 | drift_ratio 月次推移 + Override 発火月次 density | v0.1 維持 |
| Fig 5 | plot | 7.1 | action count 4 ヶ月 time series | v0.1 維持 |
| Fig 6 | flow | 7.3 | Zenn webhook 3 failure mode + decision tree | v0.1 維持 |
| **Fig 7** | **timeline** | **7.5 (NEW)** | **5/22-5/31 観察 4 件 timeline + 3 軸 mapping** | **v0.2 追加** |

---

## 3. artifact 公開 plan (= v0.1 + update)

v0.1 維持 + 追加 artifact:
- 観察 4 件 file (= research/knot-experiment/observations/ 配下、 anonymize 後)
- v0.5 = Hoshi 理論統合 (= 5/31 land、 anonymize 後)

公開判断 = jun 確認 (= owner-decision red_owner)。

---

## 4. 執筆分担 (= v0.1 base + Section 6′ / 12 追加)

v0.1 § 4 維持 + 追加:

| section | primary 執筆 | peer review |
|---|---|---|
| 6′ Closure 条件 (NEW) | Hoshi (= v0.5 著者) | Kagami (= study design 独立) + Kai (= framework 独立性) |
| 12 v1.0 path (NEW、 内部 doc) | Zen | Kagami (= gate / cadence 整合) |

subagent write permission の継続障害は 5/22 以降 fix path 進行中、 v1.0 draft 起稿時の障害 risk は audit 要。

---

## 5. Kagami peer review 依頼点 (= v0.2 起稿時)

v0.1 § 5 base + 追加:

- v0.2 = Section 6′ 追加 + Section 4 expand + Section 9 expand で文字数 +1500 words 程度、 = workshop paper range 上限近い、 文字数調整余地の articulate
- closure 条件 4 軸の仮閾値 (= N=2+1 sample からの post hoc 抽出) の reliability articulate が Section 9 で sufficient か
- cross-conversion 軸 = 第 3 軸採用判断の妥当性 (= v0.5 では 「v0.6 候補」、 v0.2 outline で **採用** の judgment、 v1.0 draft 段で再判断軸を残すか)
- 5/22 dual-track 軸との整合 articulate (= Section 0-C) が peer / jun 視点で sufficient か
- v1.0 target 時期 (= 仮 6/30、 Section 12.5) が Revenue Lane 並走と整合するか

---

## 6. v0.1 → v0.2 主要 delta 5 件 (= 完了条件軸)

1. **観察 4 件統合**: 5/22 / 5/29 / 5/30 / 5/31 観察 file を Section 4.3 / 4.4 / 5 / 7.5 / 6′ で物理 evidence reference
2. **Knot 軸 3 軸 articulate**: v0.1 = vertical only / v0.5 = +horizontal / v0.2 = +cross-conversion (= Section 4.3 で encode)
3. **Section 6′ 追加** (= peer iteration closure 条件 4 軸): v0.5 § 2-E 由来、 仮閾値 articulate
4. **Section 12 追加** (= v1.0 draft path): 文字数 + writing cadence + review gate + 外部投稿 jun 確認軸 articulate
5. **Section 9 expand** (= falsification 軸): v0.5 § 4-A の 4 軸 (= post hoc / self-observation / N=4 / ラベル本人視点) を v0.1 既存 5 軸に追加

---

## 7. 関連 file (= path 併記)

### v0.1 → v0.2 chain
- v0.1: `nexus-lab/research/knot_and_nourishment/paper_c_technical_report_outline_v0.1.md`
- v0.2 (本 file): `nexus-lab/research/knot_and_nourishment/paper_c_technical_report_outline_v0.2_2026-05-31.md`

### v chain (= readonly base)
- v0.1: `nexus-lab/research/knot_and_nourishment/v0.1_duality_hypothesis.md`
- v0.2: `nexus-lab/research/knot_and_nourishment/v0.2_nia_derivation_and_identity_expansion.md`
- v0.3: `nexus-lab/research/knot_and_nourishment/v0.3_prior_work_comparison.md`
- v0.4: `nexus-lab/research/knot_and_nourishment/v0.4_prior_work_comparison.md`
- v0.5: `nexus-lab/research/knot_and_nourishment/v0.5_peer_iteration_closure_conditions_2026-05-31.md`

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
2026-05-31 (= Knot 路線 C outline v0.2 起稿、 v0.1 = 4/25 / v1.0 = 5/20 target 未達 / 5/22 dual-track Revenue 優先で静止 admit / 5/31 jun directive で復旧、 v0.5 + 観察 4 件統合 + 3 軸 articulate + Section 6′ / 12 追加 + falsification 軸 expand、 v1.0 draft 起稿軸の入力 doc、 publication-ready ではない)
