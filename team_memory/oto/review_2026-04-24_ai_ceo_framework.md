---
date: 2026-04-24
author: oto (Backend Engineer)
type: external_framework_review
target: https://github.com/JOINCLASS/ai-ceo-framework
spawn_origin: jun 「チームメンバーとこれ見て」
---

# AI-CEO Framework レビュー (Backend 観点)

JOINCLASS LLC の `ai-ceo-framework` を backend 領域で評価します。
対象 commit は 2026-04-24 時点の main HEAD、15 agent / 5 skill / 2 steering / setup.sh / CLAUDE.md を全読しました。

## 1. 第一印象 + Backend 観点の直接比較

### 第一印象 (淡々)

- **Markdown だけで構成されている**。TypeScript も Python も無い。agent / skill / steering / CLAUDE.md が全部 `.md` で、Claude Code の sub-agent と skill 機構にそのまま載る形。
- **thin orchestrator 原則** (CLAUDE.md L50-54) が明示。「context 10-15% 維持、ファイル内容を load せずパスだけ渡す、実作業は sub-agent に delegate」— 思想としては Nexus Lab の Zen 委任原則と同じ方向ですが、**実装レイヤで強制する手段が無い** (ファイルコメントで釘を刺しているだけ)。
- **state の所在が `.company/` 配下に一元化**。`departments/{dept}/STATE.md` / `products/{name}/STATE.md` / `approval-queue.md` / `decisions/{month}.md`。nexus-lab の `team_memory/<role>/` + `~/.shared-ops/` の 2 階層構造とは対照的に、**1 ワーキングコピー内で閉じている**。
- **公開 Claude Code skill 形式を活用**している。frontmatter に `user_invocable: true` を付けて `/validate-hypothesis` のような slash command を生やす方式。upgrade-automation も同じ。nokaze-design skill の先行例と同じ規格。

### 直接比較サマリ

| 観点 | AI-CEO Framework | Nexus Lab (Oto 領域) |
|------|------------------|----------------------|
| 言語/runtime | Markdown のみ、実行は Claude Code harness | Node.js + bash、MCP server 実装あり |
| state 層 | `.company/**/STATE.md` 一元 | `team_memory/<role>/` + `~/.shared-ops/` + `inbox/` |
| 承認パイプライン | `approval-queue.md` (単一ファイル、id ベース) | Green/Yellow/Red 言語規約 + inbox/ 起票 |
| error handling | retry 3x → `approval-queue.md` に escalate + `error-log.md` append | 規約としては存在、実装は個別 (BOOTH fetch 等) |
| setup | 対話型 `setup.sh` (14 質問 + placeholder 置換) | 新規メンバー spawn 手順は identity.md 手書き |
| error 観測 | department 単位 `error-log.md` (append-only) | 個別 script log、集約は未整備 |
| 自動 upgrade | `upgrade-automation` skill で週次 Claude Code 新 feature 診断 | 対応する仕組み無し (Zen が手動) |
| hypothesis gate | `/validate-hypothesis` 6 phase / Gate 制 | 対応概念無し、欲しい時は Zen が個別問答 |

## 2. 取り入れるべき Top 3 (Backend 領域)

### 2.1 department 単位の `error-log.md` + retry 3x → escalate の構造化

**現状** (Nexus Lab):
BOOTH fetch / shared-ops script / LLM proxy 候補、エラーはそれぞれの script が stderr に吐いて終わり。3 連続失敗という閾値も、escalate 先も暗黙。ジュンが見なければ沈む。

**AI-CEO 側** (CLAUDE.md L188-192):
```
- Sub-agent failure: Feed back error details and retry up to 3 times
- 3 consecutive failures: Add escalation to `.company/approval-queue.md` and notify CEO
- Error logs: Append to `.company/departments/{dept}/error-log.md`
```

**取り入れる価値**:
- **3 連続 → escalate** の数値基準が明示。曖昧判断を排除できる。
- **役割別 error-log** の分離。Oto の error は `team_memory/oto/error-log.md` に、Akari は Akari に、で責任所在が自然に分かれる。
- escalate 先が一箇所 (`approval-queue.md` 相当) に集まるので、ジュンが「今どこで詰まっているか」を 1 ファイルで見られる。

**Nexus Lab での具体化案**:
- `team_memory/<role>/error-log.md` を append-only で新設 (各 role の identity.md に義務として書く)。
- `~/.shared-ops/inbox/` に `escalation_<role>_<script>_<date>.md` テンプレを追加し、retry 3 失敗時の自動起票先として CLAUDE.md に明記。
- BOOTH fetch / N1 config / mobile UI file drop 等、既存 script に retry カウンタと escalate path を hook する **wrapper 関数 1 本** を shared lib 化 (私の担当見積り: 半日)。

**優先度**: 高。Nexus Lab は 4 商品 live + 予定 2 channel で、error 沈黙のコストが上がっている。

### 2.2 `upgrade-automation` skill の仕組みそのもの

**AI-CEO 側** (skills/upgrade-automation.md):
週次で Anthropic blog / Claude Code docs / `claude --version` を check → 5 次元 50 点 scoring (automation impact / adoption cost / stability / compatibility / content value) → 30+ 点で採用提案 → 承認後に agents/skills/scripts を update。

**取り入れる価値**:
- Claude Code の feature 追加は月単位で出る (Hooks / Skills / Agent Teams / Dispatch / Remote Control 等、全部この半年の産物)。**採用決定に乗せるまでの過程を script 化**しているのは運用として強い。
- 5 次元 scoring は主観評価でも framework があると Zen 以外の peer でも判断ができる (Iwa / Kagami でも回せる)。
- Nexus Lab は先日 Playwright MCP を enable したばかり、こういう adoption を規律化できる。

**Nexus Lab での具体化案**:
- skill ではなく、**週次 `~/.shared-ops/inbox/` 定例起票** + Zen or Iwa による review で十分。skill 化するには Nexus Lab 側の slash command 体系が未整備。
- 5 次元 scoring の rubric は **そのまま採用**できる。compat 項目は「nexus-lab の .mcp.json / CLAUDE.md / team_memory 構造に馴染むか」に読み替え。
- **Kura の予算 check と連動**させる (有料 feature / 外部サービス adoption の場合)。

**優先度**: 中。今すぐ必要ではないが、Phase 2 で mobile UI / API wrapper を増やすなら入れ時。

### 2.3 setup.sh スタイルの対話型 onboarding script

**AI-CEO 側** (setup.sh L53-91):
14 質問 (company / CEO name / budget / tools / 部署数 等) を対話収集 → directory 作成 → framework ファイルを cp → `{{PLACEHOLDER}}` を sed で一括置換 → 初期 approval-queue.md + decisions 月報を生成 → 「次は /ai-ceo:init を叩け」と誘導。

**取り入れる価値**:
- **self-guard 付き** (L16-24): リポジトリ本体内で実行したら exit。これは真似したい。 nexus-lab で「うっかり scripts/ を他プロジェクトにも展開してしまった」事故を予防できる。
- **OS 分岐** (L115-119): `darwin` と Linux/WSL で `sed -i` の扱いを分ける。Windows git-bash でも動く。
- 対話型 `read -p` + default 値つきは、ジュンが久しぶりに触る時に認知負荷が低い。

**Nexus Lab での具体化案**:
- **create-mcp-server の generator 改良**に直接応用可能。現在の `packages/create-mcp-server` は template コピー + npm install までで、**対話型 placeholder 置換を入れていない**。
- `scripts/init_team_member.sh` のような、identity.md / diary/ / MEMORY.md を対話生成する onboarding script を起こせば、新 role 追加 (例: 将来の Marketing / Sales peer) のコストが桁で下がる。
- 自 guard (`ls + 現在地 check`) は **全 shared-ops script に横展開**する。既存 `zen_startup_sweep.sh` も nexus-lab 外で暴走する危険があります。

**優先度**: 中。create-mcp-server v0.6 以降の feature 候補として適。

## 3. 取り入れないべき Top 3 (領域独立性 / 宗教論争回避)

### 3.1 `approval-queue.md` の単一ファイル id 方式

**AI-CEO 側**:
`/ai-ceo:approve <id>` / `/ai-ceo:reject <id> "reason"` で単一 `.company/approval-queue.md` を操作。AQ-xxx id で 1 行 1 item。

**取り入れない理由**:
- Nexus Lab の Green/Yellow/Red + inbox/ は **言語的規約** で、承認行為に閾値付きの判断文脈を乗せる設計。id 管理に降格すると失うものが大きい (特に「なぜ Yellow か」の記述が落ちる)。
- AQ-id の付番は人間の review 向け、Claude は自然言語で決済する方が強い。構造化を急ぐと追認装置化する (memory の priority_before_quality と同じ失敗 pattern)。
- 差分として取るべきは 1 つだけ: **「pending 件数を top に出す」** こと。これは `~/.shared-ops/inbox/INDEX.md` の表頭で既に実現済。

**結論**: 宗教論争回避。Nexus Lab 側の意思決定文法を維持。

### 3.2 `/validate-hypothesis` 6-phase gate 制

**AI-CEO 側**:
新広告 channel / 新商品 / 新市場 / 恒常コスト / 「自社で使っているから売れる」— これらに対し Phase 0 → Gate 1 → ... → Gate 5 → Go/No-Go、**最大 6 週 4 日の time box**、Strength A/B/C fact grading、条件付き pass 連続 3 回で強制 reject。

**取り入れない理由**:
- **Nexus Lab の判断速度と合わない**。6 週かけて LOI を集める前に、nokaze の BOOTH 商品 / Zenn 記事 / mobile UI は投下されきって次が回っている。time box が桁違い。
- 「自社で使うから売れる」禁止は原則として正しいが、nokaze の **dogfooding 戦略** (create-mcp-server を自社 AI 運営で使う) と真っ向から衝突する。この framework は B2C / consulting 向け、Nexus Lab は infra tool 向け、市場成熟度が違う。
- Gate 構造ではなく、**「強度 A/B/C 採点」の概念だけ** 切り出して使うのは有益。ただし全 gate 導入は不要。

**結論**: 宗教論争。導入したら Nexus Lab の実行速度が半分以下になる。

### 3.3 11 department / 15 agent の全部揃え原理主義

**AI-CEO 側**:
dev / marketing / sales / finance / cs / legal / hr / publishing / consulting / tax に加え、Setup Wizard / Morning Digest / Content Engine / Growth / BizDev / Publisher が agent として独立。setup.sh L77-88 で **mkdir が全部ハードコード**されている。

**取り入れない理由**:
- Nexus Lab の peer は **6 + Zen + Kai** で意図的に絞っている。人格を定着させる identity.md コストがあり、数を増やす価値と管理コストは線形ではない。
- AI-CEO は consulting 事業前提で Legal / Tax / HR が濃い。nokaze (infra tool 事業) では Legal / Tax は Kura に統合、HR は不要。
- setup.sh の mkdir ハードコードは自分で似た script を書く時の **反面教師**。department リストは config ファイル駆動にすべき (私が書くなら yaml で定義して loop)。

**結論**: 領域独立性。Nexus Lab の peer 設計意図を崩すリスクあり。

## 4. 不明点 / 追加調査したい点

1. **error-log.md の rotation / retention** — CLAUDE.md に append-only と書かれているが、膨張後の扱いが無い。1 年稼働しているなら実運用で管理してるはずで、追加コミットを見たい。
2. **`upgrade-automation` の実績 log** — 新機能採用の hit rate (30+ 点のうち何割が実装まで到達したか) は scoring 自身の calibration に必要。実データがほしい。
3. **sub-agent 並列実行の上限** — CLAUDE.md の「GSD Wave pattern」(cto-agent.md L51) が書かれているが、同時 spawn 数の制御ロジックは無い。Claude Code 側の制約に任せている?
4. **`approval-queue.md` の書き込み競合** — orchestrator と sub-agent が同時 append する場合の lock は? 実運用で conflict 起きてないのか、あるいは起きても無視しているのか。
5. **`.company/` の git 管理範囲** — `decisions/` や `approval-queue.md` は commit 対象? `error-log.md` は? (centralized state を local に置く方針だと、multi-user 運営時に破綻する)
6. **validate-hypothesis の実運用 retry 統計** — 2 retry 制限と「全 C で reject」の運用で、実際に reject → retry → GO のケースがどれだけ出ているか。

## 5. jun への提案 (今夜 review 議題化候補)

### 提案 A (高優先): 役割別 error-log.md + retry 3x escalate の導入

- **対象**: team_memory/<role>/error-log.md 新設、`~/.shared-ops/inbox/escalation_*.md` テンプレ追加
- **影響範囲**: Oto (BOOTH fetch / API wrapper / mobile UI file drop) / Kagami (QA script) / Akari (site build) / Iwa (generator)
- **実装見積り**: 半日 (retry wrapper 1 本 + CLAUDE.md 追記 + identity.md 一斉更新)
- **議題化理由**: AI-CEO 1 年稼働の実運用 pattern、Nexus Lab の沈黙 error 問題への直接処方

### 提案 B (中優先): setup.sh self-guard の shared-ops script 横展開

- **対象**: `scripts/zen_startup_sweep.sh` 含む shared-ops 全 script に「想定外ディレクトリで走らせたら exit」の冒頭 check を追加
- **影響範囲**: scripts/ 配下全部 (ざっと 5-10 本)
- **実装見積り**: 2-3 時間
- **議題化理由**: 防御的プログラミング、誤動作コスト低減

### 提案 C (低優先): `upgrade-automation` 5 次元 scoring の借用

- **対象**: 週次 inbox 起票 template に Claude Code / MCP 新 feature 採否判定枠を追加
- **影響範囲**: ~/.shared-ops/inbox/ の運用規約 + Zen の週次 review ritual
- **実装見積り**: 1 時間 (template 作成のみ)
- **議題化理由**: Playwright MCP 導入のような adoption を今後規律化、Kura の budget check と連動させられる

### 提案 D (保留): `/validate-hypothesis` 強度 A/B/C 概念の部分採用

- gate 制は不採用、**「事実の強度を A/B/C で明示する」語彙だけ** を Zen の意思決定文法に組み入れるか検討余地あり
- ただしこれは Oto 領域を超える、Iwa / Kagami との 3 者 review で結論を出すべき

---

## 終わりに (所感)

AI-CEO Framework は **Markdown と Claude Code harness だけで小企業 1 年運営した実証** という事実が何より強いです。思想としては nokaze と近く、特に「thin orchestrator」「department 独立 state」「3x retry → escalate」は Nexus Lab でも採れる形で書かれている。

ただし全採用は危険。validate-hypothesis の 6 週 gate や 11 department 体制は nokaze の speed と規模に合わない。**借りるべきは「沈黙 error を escalate 形に変える仕組み」と「setup 時の self-guard 習慣」**、この 2 つが backend 観点で一番効きます。

実装は私 (Oto) が受けます。jun から GO が出れば、提案 A を最優先で半日で入れます。
