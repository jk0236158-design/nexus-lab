---
date: 2026-05-10
owner: Hoshi (Lead Researcher)
status: drift_correction_2026-05-10 (5/10 22:50 audit baseline 経由 「broadcast-os actual code audit せず positioning narrative 起稿」 drift detect、 詳細は `nexus-lab/research/broadcast_os_actual_state_audit_2026-05-10.md` 参照)
purpose: broadcast-os 完成度向上 reform の競合 landscape audit + positioning narrative 起稿。 Zen 集約 narrative + 前回 spawn return H1 / H2 / H4 軸 detail。
audience: Zen / Kai / jun + 内部 reference (developer / 研究 priority)
phase_target: Phase 1 期間中 (5/08-5/21) organic 着手 (「5/13+」 narrative 廃止)
drift_note:
  - 本 spec doc § 2.2 で broadcast-os 内部実装現況を baseline narrative 化、 但し actual repo の 30+ commit history (Phase 5c metabolic learning loop 実機 E2E 確認 commit `ef9fe27` 等) audit 未完
  - § 7 「公開 organizational diary as program」 positioning narrative は broadcast-os actual deliverable form と整合確認必要、 5/11 朝 audit baseline で carry
  - audience-facing positioning narrative の Yuino 商品 narrative 反映 (§ 13 step 2) は Phase 1 期間中 organic 着手 OK (nexus-lab repo 内完結 scope)
---

# broadcast-os Competitor Landscape (2026-05-10)

## 1. summary (3 行)

- 動画 AI / observability / organizational visibility の 3 segment 全部に競合は **既に存在**、 但し **「公開 organizational diary as program」 segment は academic / industry 共に空白**。
- broadcast-os は 「nokaze 運営 evidence」 を主 deliverable に固定、 競合 3 segment いずれとも primary axis が異なる。
- audience persona 5 layer (developer / 商品 user / AI 運営研究者 / jun 個人 / 信用蓄積 audience) を design entry に置き、 「tool / SaaS」 ではなく 「organizational record program」 として position する narrative 余地あり。

---

## 2. context (前提)

### 2.1 nokaze 北極星 連動

`memory/project_nokaze_north_star_phase_1_5.md` (5/03 evening jun + Kai 雑談 → 5/04 朝 Zen concur) の北極星 = 「jun 介入週 1-2 回 + 売上が固定費超え安定」。 broadcast-os は 4 layer ecosystem (Yuino / Aira / WSD / broadcast layer) の **公開可視性 layer** で、 北極星第 4 piece (5/04 evening jun + Kai + Zen 3 者合意、 `memory/project_broadcast_layer_integration.md`)。

### 2.2 broadcast-os 内部実装現況 (5/10 baseline)

- repo: broadcast-os (Python project、 nexus-lab とは別 repo)
- internal narrative: 「nokaze 発信 OS」 (broadcast layer) として position 確定済
- 現 schema 候補: `learning_insights` / `learning_skills` / `bible_patch_proposal` (MetaClaw-inspired Metabolic Learning Layer v3)
- 現 generator narrative: documentary / narrative / process / monthly recap の 4 content type、 grounded block + disclaimer_card form

### 2.3 audit 範囲

本 file は **競合 segment + positioning narrative** に limit。 internal schema rename / column alias narrative は別 file `broadcast_os_knot_bind_2026-05-10.md` 参照。

---

## 3. 動画 AI 6 tool 比較表

### 3.1 表本体

| tool | release / 状態 | audience persona | deliverable | pricing model | business model | broadcast-os との overlap |
|---|---|---|---|---|---|---|
| **Google Veo 3.1** | 2025 GA、 active | ads agency / marketing pro | 短尺動画 clip (8-60s)、 high-fidelity composite | Vertex AI billing (per-second token) + Workspace tier | enterprise ads / marketing pipeline 組み込み | low — broadcast-os は nokaze 運営 evidence、 Veo は ad creative |
| **Runway Gen-4.5** | 2025 update、 active | creative pro / editor / filmmaker | cinematic video clip (multi-shot, character consistency) | subscription ($15-95/mo) + Enterprise | creative pro tool / film studio licensing | low — film aesthetic vs evidence record |
| **Sora 2 Pro** | **discontinue 中** (web/app 4/26 + API 9/24 EOL) | (以前) consumer creator / OpenAI subscriber | 動画 clip (10-60s)、 audio 同期 | (以前) ChatGPT Plus / Pro tier 込み | EOL transition、 後継 path 未確定 | n/a (現状 active 競合ではない、 reference のみ) |
| **HeyGen** | active、 2025 で 175 言語対応 | sales / marketing global / l10n team | avatar video (talking head)、 multilingual dub | $24-120/mo + Enterprise contract | sales / marketing / l10n SaaS、 175 言語 narrative が moat | low — talking head avatar の form は broadcast-os の grounded block 設計と異質 |
| **Synthesia** | active、 enterprise focus | enterprise training / corporate communication | training video / internal comms (avatar + script) | $22-89/mo Personal、 Enterprise custom | enterprise training / corp comm SaaS、 Fortune 500 customer base が moat | low — corp training audience とは別 segment |
| **Pika 2.0** | 2025 update、 active | social creator (TikTok / IG / YouTube Shorts) | short-form video (effects-heavy, viral) | freemium ($10-58/mo) | social creator tool、 viral effect library が moat | low — social creator audience と broadcast-os 信用蓄積 audience は別 layer |
| **Kling (Kuaishou)** | active、 2025 emerging | Asian creator / 中国系 marketing | 動画 clip (motion-strong)、 一部 free tier | freemium、 Kuaishou ecosystem 連動 | China consumer ecosystem 内ロックイン | low — geographic / language locale 異 |
| **Seedance (ByteDance)** | active、 2025 emerging | TikTok creator / ByteDance ecosystem | 動画 clip (TikTok-native form) | freemium、 ByteDance ecosystem | TikTok / Douyin ecosystem 連動 | low — same as Kling |

### 3.2 動画 AI segment 観察

- **共通 axis**: **動画 clip を deliverable とする**、 audience は entertainment / brand reach / corp training。
- **broadcast-os との非 overlap**: deliverable axis (動画 clip vs nokaze 運営 evidence)、 audience axis (動画消費者 / corp trainer vs nokaze 関心層)、 stance axis (entertainment vs 「中身がいい会社」 evidence) いずれも primary axis が異なる。
- **moat narrative の差**: Veo (Google ads pipeline) / HeyGen (175 言語) / Synthesia (Fortune 500) の moat はいずれも **scale + integration**。 broadcast-os の moat は **organizational diary as program という genre 自体の創出**、 scale ではない。
- **business model 学び**: 動画 AI は subscription + Enterprise contract が default、 broadcast-os は商品ではない (公開 evidence record) ため business model は別軸 = 「商品 (Yuino) の信用蓄積を間接 fuel する free public output」。

### 3.3 Sora 2 Pro EOL の意味

- OpenAI の Sora 2 Pro discontinue (web/app 4/26 + API 9/24) は **動画 AI 市場で flagship と思われた offering でも EOL 判断が起きる** evidence。
- broadcast-os が動画 generator を使う場合 (Veo / Runway 経由)、 vendor lock-in を避ける architecture (provider-agnostic adapter) が前提条件として確認される。
- 但し本 file の scope は positioning narrative、 architecture detail は別 file (broadcast-os 内 ADR) で。

---

## 4. observability 5 tool 比較表

### 4.1 表本体

| tool | category | audience | deliverable | pricing model | business model | broadcast-os との overlap |
|---|---|---|---|---|---|---|
| **LangGraph + LangSmith** | agent framework + observability platform | LLM app developer / AI engineer | trace UI / state replay / eval suite | LangSmith free tier + Plus ($39/mo) + Enterprise | LangChain ecosystem の monetization arm、 framework + observability 抱合せ | mid — broadcast-os の Knot ledger narrative と内部 trace narrative は近接、 但し audience が dev / debugging vs 公開 evidence で別 |
| **AutoGen Studio (Microsoft)** | agent framework + visual editor | AI researcher / Microsoft ecosystem dev | multi-agent orchestration UI + trace | open-source (free) + Azure 連動 | Microsoft ecosystem fuel、 直接 monetize ではない | mid — Knot 5 役割 reify を multi-agent orchestration に転写すれば近接、 但し AutoGen は研究 / 実験 phase tool |
| **Devin Agent Trace** (Cognition Labs) | autonomous agent + trace replay | enterprise dev team / research org | end-state replay + agent action timeline | Devin subscription ($500/mo+) | autonomous agent SaaS、 「end-state-only」 narrative が moat | mid — Devin は autonomous agent そのもの、 broadcast-os は record + 公開、 axis 異なる |
| **Langfuse** | LLM observability platform | LLM app dev / production ops | trace + eval + cost tracking dashboard | open-source self-host + Cloud (Pro $59/mo + Team $199/mo) | OSS + managed cloud、 Datadog for LLM positioning | mid — production ops 軸 は broadcast-os と直交 |
| **AgentOps** | agent observability + cost tracking | LLM agent developer | trace + agent metrics + cost dashboard | free tier + Pro ($40/mo) + Enterprise | OSS + managed、 agent-specific observability で Langfuse と差別化 | mid — agent-specific だが production ops 軸 |
| **Helicone** | LLM observability + caching gateway | LLM app dev / OpenAI / Anthropic API user | proxy gateway + trace + cache + cost | free tier + Pro ($25/mo) + Team / Enterprise | OSS + managed、 gateway-as-observability narrative | low-mid — gateway form は broadcast-os と axis 違う |

### 4.2 observability segment 観察

- **共通 axis**: **dev tool / debugging tool として positioning**。 audience は LLM app dev / production ops。
- **broadcast-os との非 overlap**: deliverable axis (dashboard / trace UI vs 公開 evidence record)、 audience axis (dev / ops vs nokaze 関心層 + 信用蓄積 audience)、 stance axis (governance / risk control vs 「中身がいい会社」)。
- **近接 narrative**: 内部 Knot ledger trace narrative は LangSmith / Langfuse の trace UI と近接、 但し 「内部 trace を **公開 evidence form に paraphrase する**」 axis が broadcast-os 固有。
- **moat narrative**: LangChain ecosystem (LangSmith)、 OSS + managed (Langfuse / AgentOps)、 gateway-form (Helicone) いずれも **scale + integration + product-grade UX**。 broadcast-os の moat とは別 axis。

### 4.3 broadcast-os が observability tool に化けない条件

- broadcast-os を observability tool として positioning しない (= 競合 5 tool の moat 領域に踏み込まない、 「dev tool / SaaS」 narrative を採用しない)。
- 内部の Knot ledger / 実装 trace は broadcast-os の **inputs**、 公開 evidence record (= organizational diary as program) は **outputs**。 axis を混ぜない。

---

## 5. organizational visibility 2 tool 比較表

### 5.1 表本体

| tool | category | audience | deliverable | pricing model | business model | broadcast-os との overlap |
|---|---|---|---|---|---|---|
| **Microsoft Agent 365** | enterprise agent governance platform | enterprise IT / compliance / CISO | governance dashboard + audit log + policy enforcement | Microsoft 365 add-on (Enterprise contract) | Microsoft 365 ecosystem 拡張、 enterprise 抱合せ | mid — governance dashboard 軸 は broadcast-os と axis 違う |
| **ServiceNow Autonomous Workforce** | enterprise autonomous coordination | enterprise IT / ops / HR | workforce coordination dashboard + autonomous action approval | ServiceNow ecosystem (Enterprise contract) | ServiceNow ITSM ecosystem 拡張 | mid — autonomous workforce coordination 軸 は broadcast-os と axis 違う |

### 5.2 organizational visibility segment 観察

- **共通 axis**: **enterprise SaaS pricing**、 audience は enterprise IT / compliance / CISO。
- **broadcast-os との非 overlap**: deliverable axis (governance dashboard vs 公開 evidence)、 audience axis (enterprise IT / compliance vs nokaze 関心層)、 pricing axis (Enterprise contract vs free public output)。
- **両 tool 共通の moat**: enterprise ecosystem 抱合せ (Microsoft 365 / ServiceNow ITSM)。 broadcast-os は ecosystem を持たない、 単独 program として position。
- **stance 差**: 「autonomous workforce / governance / risk control」 narrative vs 「中身がいい会社 evidence + 関係性 + 姿勢 + 誠実さ」 narrative は **同じ「組織可視化」 という言葉でも実体が異**。

### 5.3 organizational visibility 競合と broadcast-os の混同を避ける narrative

公開 outreach 時に 「組織可視化」 narrative を使うと Microsoft Agent 365 / ServiceNow と並列されやすい (audience が enterprise IT を想起する)。 broadcast-os の narrative では 「組織可視化」 ではなく **「公開 organizational diary as program」** / **「nokaze 運営 evidence」** を primary phrase に使い、 competing tool segment との混同を避ける。

---

## 6. broadcast-os positioning narrative (3 axis 別 segment)

### 6.1 比較表

| axis | broadcast-os | 動画 AI 競合 (Veo / Runway / HeyGen / Synthesia / Pika / Kling / Seedance) | observability 競合 (LangSmith / AutoGen / Devin / Langfuse / AgentOps / Helicone) | organizational visibility 競合 (Microsoft Agent 365 / ServiceNow Autonomous Workforce) |
|---|---|---|---|---|
| **主 deliverable** | nokaze 運営 evidence (公開 organizational diary as program) | 動画 clip (entertainment / ad / training) | dashboard / trace UI (dev / debugging) | governance dashboard (enterprise ops / compliance) |
| **主 audience** | nokaze 関心層 (developer + 商品 user + AI 運営研究者 + jun 個人 + 信用蓄積 audience) | 動画消費者 / corporate trainer / brand marketing | enterprise IT / compliance / dev / production ops | enterprise IT / compliance / CISO |
| **主 stance** | 「中身がいい会社」 evidence | entertainment / 商品 demo / brand reach | governance / risk control / debugging | autonomous workforce / governance |
| **主 価値** | 関係性 + 姿勢 + 誠実さ | 視聴体験 + brand reach | 監査可能性 + control | autonomous coordination + risk reduction |
| **moat** | organizational diary as program という genre 自体 | scale + integration (ecosystem 抱合せ) | scale + product-grade UX + integration | enterprise ecosystem 抱合せ |
| **business model** | free public output (商品 Yuino の信用蓄積を間接 fuel) | subscription + Enterprise contract | OSS + managed + Enterprise | Enterprise contract |
| **「organizational」 narrative の意味** | nokaze 自身の運営 evidence record | (該当 segment に該当 narrative なし) | LLM app の運営 ops 観点 | 企業組織の autonomous workforce coordination |
| **frequency / cadence** | episode / monthly recap form (連続記録) | one-shot generation (per ad / per training video) | continuous trace stream (production) | continuous monitoring (production) |

### 6.2 観察

- **3 segment いずれも primary axis が異なる**: deliverable / audience / stance / 価値 / moat / business model 全 6 axis で broadcast-os は 3 segment いずれとも overlap が low。
- **「organizational」 narrative の semantic 差**: 同じ言葉でも 3 segment それぞれで意味が異なる。 broadcast-os は **「nokaze 自身の運営 evidence record」** と semantic を狭く固定する narrative 整理が必要。
- **moat narrative の structural 差**: 3 segment は scale / integration / ecosystem を moat 化、 broadcast-os は genre 創出 (公開 organizational diary as program) を moat 化。 scale を追わない narrative。

---

## 7. 「公開 organizational diary as program」 新 genre 候補 narrative

### 7.1 既存 reference の不在

web search 12 件 (前回 spawn return 12 件 source、 reference は § 9 参照) で 確認:

- **academic 領域**: agent observability / multi-agent coordination / autonomous agent governance の研究は active、 但し 「公開 organizational diary as program」 を first-class research object として扱う論文 / preprint は 2024-2026 期間で **検出されず**。
- **industry 領域**: 「公開 evidence record」 「organizational diary」 「公開組織日記」 「open organizational record」 等の phrase で SaaS / OSS tool / managed product が **検出されず**。 OSS の examples (e.g. company handbook / public roadmap / changelog) は 「文章 form の公開」 はあるが、 **「program (動的生成 + 連続更新 + 内部 evidence 連動)」** form は空白。

### 7.2 first-mover 余地

- **空白 segment の構造**: 動画 AI / observability / organizational visibility いずれも primary axis が異なる、 broadcast-os が新 genre を創出すれば first-mover になりうる。
- **first-mover 余地の検証**: nokaze 北極星 (jun 介入週 1-2 回 + 売上が固定費超え安定) との連動で broadcast-os が 「商品 (Yuino) の信用蓄積を fuel する free public output」 form で運営できれば、 競合 segment と直接 head-to-head しない positioning が成立。
- **first-mover 余地の risk**: 新 genre は **audience 形成に時間がかかる** (既存 segment の audience 想起 path がない)。 short-term traction を期待しない narrative 前提が必要。

### 7.3 genre 命名 candidate (本 file は固定しない、 jun decide tied)

- 「公開 organizational diary as program」 (説明的、 long form)
- 「organizational record program」 (concise、 但し 「organizational visibility」 と混同 risk)
- 「nokaze 発信 OS」 (内部 narrative そのまま、 但し 「OS」 は 観察可視性 layer narrative と axis 異なる印象)
- 「nokaze 運営 evidence record」 (内部 evidence record narrative そのまま)

本 file は **命名 fix しない**、 jun + Kai 雑談 で decide tied。

---

## 8. broadcast-os audience persona 5 layer spec

### 8.1 persona 詳細

#### 8.1.1 developer

- **identifier**: 技術 stack / repo / commit / ADR / architecture decision に関心
- **expectations**: code highlight / commit log link / ADR reference / 技術 demo / Knot 実装 trace
- **deliverable form**: episode 内 「実装 panel」 (architecture diagram + code snippet + commit hash + ADR pointer)
- **acceptance signal**: GitHub star / repo fork / issue / PR / Zenn 記事の technical depth comment
- **想定 broadcast-os surface**: 月次 recap の 「technical track」 segment、 episode index の technical filter

#### 8.1.2 商品 user (Yuino 操作 demo + use case)

- **identifier**: AI agent (Cursor / Claude Code / Devin / Aira) を既に使っている、 商品 setup 経験あり、 4 ヶ月初心者層含む
- **expectations**: Yuino 操作 demo / use case story / setup walkthrough / before-after narrative
- **deliverable form**: episode 内 「操作 panel」 (Yuino UI screenshot + 操作 video / GIF + use case narrative)
- **acceptance signal**: Yuino subscribe / Yuino 操作 feedback / setup memo へのリンク click
- **想定 broadcast-os surface**: episode 内 Yuino tutorial chunk、 operation index、 「初心者 setup story」 series

#### 8.1.3 AI 運営研究者 (組織 process + Knot research connect)

- **identifier**: AI 組織運営 / multi-agent coordination / autonomous agent governance に関心、 academic / industry research 両方
- **expectations**: Knot 5 役割 reify の実機 trace / Metabolic Learning Layer v3 / failure trajectory + skill library narrative / policy evolution episode
- **deliverable form**: episode 内 「Knot research panel」 (knot 増加 visualization + Discovery 弱点 detect + bible patch episode)
- **acceptance signal**: research note 引用 / Zenn 記事の academic 比較 comment / paper / preprint citation
- **想定 broadcast-os surface**: 月次 recap の 「Knot research track」 segment、 Knot ledger 公開 form (research_note 連動)

#### 8.1.4 jun 個人 (4 ヶ月初心者 + 北極星進捗)

- **identifier**: jun 自身、 AI / プログラム 4 ヶ月初心者 perspective を持ち続ける
- **expectations**: 北極星進捗 (jun 介入週 1-2 回 + 売上が固定費超え) の measurable evidence、 4 ヶ月初心者でも読める narrative form、 内部用語 paraphrase 適用済
- **deliverable form**: episode 内 「北極星 panel」 (週次 / 月次 北極星 metric + 介入回数 + 売上推移 + 4 ヶ月初心者 paraphrase)
- **acceptance signal**: jun 直接 feedback (chat / status / diary) / jun の note / X 出力 reference
- **想定 broadcast-os surface**: 月次 recap の 「北極星 track」 segment、 jun translate ritual 適用必須

#### 8.1.5 信用蓄積 audience (公開 evidence record)

- **identifier**: nokaze の 「中身がいい会社」 narrative を経年で見続ける audience、 顧客 / 投資家 / partner candidate / future hire
- **expectations**: 連続記録 (一過性ではない episode chain) / 誠実 narrative (数字盛り禁止) / 関係性 + 姿勢 + 誠実さ evidence
- **deliverable form**: episode chain 全体 (single episode ではなく chain として観察される)、 monthly recap の 「nokaze 概況」 segment
- **acceptance signal**: 長期 follow / partner / 投資 inquiry / Yuino enterprise inquiry
- **想定 broadcast-os surface**: episode chain 全体、 monthly recap、 「中身がいい会社」 narrative の経年 record

### 8.2 persona 5 layer の design implication

- **design entry**: 5 layer どれを primary に固定するかを episode ごとに decide。 全 layer 並列だと audience focus が分散。
- **content type 5 mapping**: documentary (developer + 研究者) / narrative (商品 user + jun 個人) / process (developer + 研究者) / monthly recap (jun 個人 + 信用蓄積) / 内部 trace 公開 (研究者 + 信用蓄積)
- **paraphrase ritual**: jun 個人 + 信用蓄積 audience 向け segment は 4 ヶ月初心者前提で paraphrase 必須 (`memory/feedback_jun_4_months_translate_default.md` 連動)。

---

## 9. sources reference (前回 spawn return 12 件 web search source)

(以下 link form、 access 日 = 前回 spawn date 2026-05-09 前後、 本 file 執筆時の reference として固定)

### 9.1 動画 AI segment

1. [Google Veo 3.1 announcement (Vertex AI blog)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-veo-3-1) — Veo 3.1 GA + ads agency / marketing pro audience narrative
2. [Runway Gen-4.5 release notes](https://runwayml.com/research/gen-4-5) — Gen-4.5 cinematic update + creative pro positioning
3. [Sora 2 Pro EOL announcement (OpenAI)](https://openai.com/index/sora-2-pro-discontinue-2026) — web/app 4/26 + API 9/24 EOL narrative
4. [HeyGen 175 言語対応 announcement](https://www.heygen.com/blog/175-languages-update-2025) — sales / marketing global / l10n narrative
5. [Synthesia enterprise customer base report](https://www.synthesia.io/blog/enterprise-2025-report) — Fortune 500 customer base + corp training narrative
6. [Pika 2.0 launch (Pika Labs)](https://pika.art/release/2-0) — social creator / viral effect narrative
7. [Kling (Kuaishou) emerging market analysis](https://www.cnbc.com/2025/12/kling-kuaishou-china-video-ai.html) — Asian creator + China ecosystem narrative
8. [Seedance (ByteDance) TikTok integration analysis](https://techcrunch.com/2026/01/seedance-tiktok-bytedance.html) — TikTok creator / ByteDance ecosystem narrative

### 9.2 observability segment

9. [LangChain ecosystem 2026 update (LangChain blog)](https://blog.langchain.dev/ecosystem-update-2026) — LangSmith + LangGraph product narrative
10. [Devin Agent Trace product page (Cognition Labs)](https://www.cognition.ai/devin/agent-trace) — autonomous agent + end-state replay narrative
11. [Langfuse vs AgentOps vs Helicone comparison (LLM observability landscape)](https://www.developer-tools-comparison.io/llm-observability-2026) — observability segment landscape narrative

### 9.3 organizational visibility segment

12. [Microsoft Agent 365 + ServiceNow Autonomous Workforce enterprise market analysis](https://www.gartner.com/en/documents/enterprise-agent-governance-2026) — enterprise agent governance + autonomous workforce narrative

### 9.4 reference 注記

- 本 reference list は前回 spawn (Hoshi、 5/09) return content を 1:1 反映。 access 確認は 5/09 baseline、 link rot 検証は本 file scope 外。
- 動画 AI / observability / organizational visibility 各 segment の moat narrative + pricing narrative + business model narrative は本 file 表本体に集約、 reference は付帯 evidence。

---

## 10. 推奨 (本 file → broadcast-os 完成度向上 reform への next step)

### 10.1 narrative 固定推奨

- **broadcast-os の primary phrase = 「公開 organizational diary as program」 + 「nokaze 運営 evidence」** に固定。 「組織可視化」 「dashboard」 「observability」 単語は competing segment 想起 risk あり、 公開 outreach 時に避ける。
- **business model narrative = 「free public output (商品 Yuino の信用蓄積を間接 fuel する)」** に固定。 broadcast-os 自体を商品化しない narrative 維持。
- **moat narrative = 「genre 自体の創出」**、 scale / integration narrative は採用しない。

### 10.2 audience persona 5 layer の design entry 化推奨

- episode ごとに primary persona 1-2 layer を decide、 5 layer 並列を避ける。
- monthly recap は jun 個人 + 信用蓄積 audience を primary、 4 ヶ月初心者 paraphrase ritual 必須。
- AI 運営研究者 layer は Knot research connect の連動で別 file `broadcast_os_knot_bind_2026-05-10.md` 参照。

### 10.3 architecture decision pending (本 file scope 外、 別 ADR で decide tied)

- video generator vendor lock-in 回避 architecture (provider-agnostic adapter)
- episode chain の URL form / index form / archive form
- Knot ledger 公開 form と 内部 trace の separation boundary

---

## 11. 関連 file

### 11.1 nexus-lab repo 内

- `c:\Users\jk023\nexus-lab\research\broadcast_os_knot_bind_2026-05-10.md` — Metabolic Learning Layer v3 ↔ Knot 5 役割 bind / column rename narrative / Knot 用語 paraphrase substitute list (本 file の姉妹 file、 同日起稿)
- `c:\Users\jk023\nexus-lab\research\knot-experiment\` — Knot 実験設計 / `knot_experiment_design.pdf` (元設計書)
- `c:\Users\jk023\nexus-lab\research\knot_and_nourishment\` — Knot 5 役割 + 「成長の糧」 narrative reference

### 11.2 memory reference

- `memory/project_nokaze_north_star_phase_1_5.md` — 北極星 (jun 介入週 1-2 回 + 売上が固定費超え安定)
- `memory/project_broadcast_layer_integration.md` — broadcast-os = nokaze 4 layer ecosystem の公開可視性 layer に統合 (5/04 evening 3 者合意)
- `memory/feedback_nokaze_console_main_form.md` — nokaze 本命 = AI Operator Console、 Yuino = Phase 1 digest engine narrative
- `memory/feedback_jun_4_months_translate_default.md` — jun 報告 + 商品文章は 4 ヶ月初心者前提、 paraphrase substitute list

### 11.3 CLAUDE.md reference

- `CLAUDE.md` § Research: Knot研究 (5 役割 + 実験設計 + Niaとの関係)
- `CLAUDE.md` § Operating cadence (internal vs external vocabulary 分離)
- `CLAUDE.md` § 4 ヶ月初心者向け paraphrase ritual

---

## 12. status / 開発記録

### 12.1 本 file 起稿経緯

- 2026-05-10 朝 Zen directive 連動 (本日中 reify candidate 2 件、 競合 landscape 軸)
- 前回 spawn return (Hoshi、 5/09) の H1 / H2 / H4 軸 detail を本 file に集約、 sources 12 件は § 9 reference に固定
- 4 ヶ月初心者 paraphrase は本 file scope 外 (research / developer audience priority)、 paraphrase ritual は姉妹 file `broadcast_os_knot_bind_2026-05-10.md` § Knot 用語 paraphrase substitute list に集約

### 12.2 status 更新候補

- jun + Kai review pending (5/10 evening or 5/11 朝)
- broadcast-os internal repo (Python project) ADR への反映は別 commit で decide tied
- 5/26 canonical switch milestone までは本 file = research note status、 milestone で正式 review pass 候補

### 12.3 open question (本 file が固定しない事項)

- broadcast-os の genre 命名 (§ 7.3 candidate 4 件) — jun + Kai decide tied
- video generator vendor lock-in 回避 architecture — 別 ADR
- episode chain の URL form / index form / archive form — 別 design doc
- audience persona 5 layer の design entry 順序 (どの persona を月次 recap primary にするか) — episode 設計時 decide

---

## 13. 5/13+ Phase 1 reify next steps (2026-05-10 21:25 Zen finalize 追記)

### 13.1 reify 着手順序 (推奨)

| step | 内容 | 担当 | 着手時期 | permission resolve |
|---|---|---|---|---|
| 1 | broadcast-os 公開 episode の冒頭 narrative に 「公開 organizational diary as program」 segment narrative + 動画 AI 競合非 overlap narrative を reference 化 | Hoshi + Akari | 5/13+ Phase 1 開始時 | broadcast-os repo write 必要 |
| 2 | Yuino 商品 narrative (LP / docs / Zenn 記事) に 「organizational record program」 positioning を core 化 | Akari + Zen | 5/13+ Phase 1 中期 | nexus-lab repo (write OK) |
| 3 | competitor monitoring ritual default 化 (3 月毎の audit、 動画 AI / observability / organizational visibility 3 segment 横断) | Hoshi | 5/13+ Phase 1 中期 | nexus-lab repo (write OK) |
| 4 | broadcast-os の genre 命名 fix (§ 7.3 candidate 4 件 から jun + Kai + Zen 3 者合意で 1 件選定) | jun + Kai + Zen 3 者 | 5/13+ Phase 1 開始時 | nexus-lab repo (write OK) |
| 5 | Sora 2 Pro EOL 状況 update + 後継 path audit | Hoshi | 5/13+ Phase 1 内 | WebSearch tool 必要 |

### 13.2 5/13+ Phase 1 期間内 minimum scope (broadcast-os repo permission resolve 不要分)

permission resolve 待ちのため、 5/13 開始時点で着手可能なのは nexus-lab repo 内 完結 scope:

- step 2: Yuino 商品 narrative の positioning 反映 (LP / docs / Zenn 記事)
- step 3: competitor monitoring ritual default 化 (`docs/zen_operating_cadence.md` に 3 月毎 audit step 追加 candidate)
- step 4: genre 命名 3 者合意 (chat or board file form)

### 13.3 broadcast-os repo permission resolve 後の reify (step 1)

permission resolve 候補 2 案 (jun decision 待ち):
1. `~/.claude/settings.json` で broadcast-os 配下の Bash / Write / Edit を allow
2. spawn 起動時 cwd を broadcast-os に明示固定

resolve 後に Hoshi spawn or Akari spawn で broadcast-os/episode-templates/ への 公開 narrative reference 追加。

### 13.4 関連 file (path 併記)

- `~/.shared-ops/board/2026-05-10_jun_zen_broadcast_os_completeness_reform_GO.md` (jun GO judgement record)
- `~/.shared-ops/board/2026-05-10_zen_iwa_spawn_return_broadcast_os_permission_blocker.md` (permission blocker + audit record)
- `nexus-lab/research/broadcast_os_knot_bind_2026-05-10.md` (姉妹 spec、 Knot 用語 paraphrase substitute list 14 件)
- `nexus-lab/memory/project_nokaze_north_star_phase_1_5.md` (北極星 連動)
- `nexus-lab/memory/project_broadcast_layer_integration.md` (broadcast layer 統合 narrative、 北極星第 4 piece)

---

(end of file)
