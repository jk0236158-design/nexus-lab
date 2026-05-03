# Aira 商品化 design doc — 連休 β release plan

date: 2026-05-02 (Sat)
author: Zen
status: draft (jun Path C + Aira 軸 directive 受領、5/02 朝起稿)
target: 5/06 (Wed) 連休最終日 β release candidate
related: aira/docs/phase1_specs_draft_2026-05-01.md / Kai 4/29 21:00 mcp_market_structure_reframe / Kai 4/30 ai_operating_os design vision

---

## 0. 商品化 commit + 連休 timeline

**jun directive (5/02 朝)**: Path C (MCP は実績棚として並走 + 本命前倒し) + 「**Aira を実装しよう、そっちのほうが構造的に売れる要素になる**」

**前提 (Kai 4/29 提案 base)**:
- MCP テンプレ単体は買い手の真ん中が薄い (AI で作れるものを AI を使える人に売る弱さ)
- 本命は「AI を業務に入れた後に壊れない運用設計」(owner digest / boot packet / active work queue / audit / handoff / governance)
- nokaze 強み = 「AI たちが実際に運営され、判断し、記録され、引き継がれている」実証

**Aira がここに hit する理由**:
- Phase 0 mini (4/29-) で **実 LIVE 配信実証済**: 4/30 first LIVE digest 配信 (Gemini API 経由、boundary audit PASS)
- 内部用に 1 ヶ月運用、jun の 1 日数十分 capacity を「全体観望」layer に置き換える装置として **既に機能**
- design doc 揃い (Phase 1 specs draft 5/01 起稿、~640 lines)
- 「owner digest / boot packet / active work queue 導入パッケージ」 = Kai 4/29 候補 1 と完全一致

**連休 timeline (5/02 evening - 5/06 Wed)**:

| 日 | jun side | Zen + peers |
|---|---|---|
| 5/02 (Sat) evening | 仕事終了 + 連休突入、本 design doc 確認 + 方向修正指示 | (今 turn 完遂) 本 design doc + 3 channel reform draft (Aira narrative 反映) |
| 5/03 (Sun) | 商品名決定 (Zen 提示 candidate から選択 or jun 命名)、note + X 投稿 | Iwa packet 拡張 (商品化 layer 7 件追加) + Akari LP draft return content path + Kura pricing return content path |
| 5/04 (Mon) | LP / docs site review、商品名 visual 確定 | Iwa Phase 1 + 商品化 layer 並行実装、Akari LP / docs 起稿、Kura pricing tier 確定 |
| 5/05 (Tue、5/05 期限) | β package install 試行 + sample digest review、5/05 期限 deliverable submit | Iwa β package release candidate、Kagami QA review |
| 5/06 (Wed、連休最終日) | 公開判断 + Gumroad / BOOTH / GitHub release、X / note 公開告知 | Zen + jun 公開 200 確認 ritual + post-publish observation 開始 |

**5/08 review** = β release 後の Wave 1 binding signal initial 集計 (BOOTH MCP + Aira β interest signal 両軸)。

---

## 1. Aira Phase 0 mini 現状要約 (5/02 朝時点)

### 構成

```
aira/
├── src/
│   ├── boundary.ts     # 監視対象 #9-11 物理ガード (naming split / scope creep / secretary overlap)
│   ├── budget.ts       # Gemini token budget guard
│   ├── digest.ts       # digest 生成 + Gemini API call
│   ├── input.ts        # observer scope file ingestion
│   └── output.ts       # digest format + write
├── data/digests/       # 生成済 digest (4/29 dry-run + 4/30 LIVE)
├── tests/              # Vitest test suite
├── docs/
│   └── phase1_specs_draft_2026-05-01.md  # Spec A boundary taxonomy + Spec B observer input
└── .env                # GEMINI_API_KEY + DRY_RUN flag
```

### 配信実績

| 日 | mode | 内容 |
|---|---|---|
| 2026-04-29 | DRY RUN (mock) | first digest (Phase 0 mini 着手日)、boundary audit PASS |
| 2026-04-30 | LIVE (Gemini API) | first LIVE digest、WSD + Nexus Lab + Product Design + Pricing/Finance 4 domain、Contradiction Notes (Yellow) + WAIT Observations 配信成功 |

### digest 構造 (現状)

- **Digest** section: 4 domain (or configured) ごとに 1-2 sentence summary
- **Contradiction Notes** section: Yellow (注意) / Green (passing concern) / Red (critical) 3 levels + source citation
- **WAIT Observations** section: jun の物理 action 必要 item (人間の handoff 待ち、reply 監視、physical setup)
- **Meta** section: boundary_audit_passed flag

---

## 2. 商品化 gap analysis (内部用 → 外販)

### 現状 (内部用、nokaze 専用)

- **boundary**: hard-coded `~/.shared-ops/` paths only
- **monitor types**: nokaze 内部の identity 監視対象 #9-11 (公開禁止 Aira 識別子 / scope creep / secretary overlap) ← user 環境では irrelevant
- **input scopes**: `~/.shared-ops/board/` `~/.shared-ops/inbox/` 等の paths が hard-coded
- **output**: file write to `aira/data/digests/`
- **Gemini API key**: Zen の owned key (BYOK 可能だが setup wizard 不在)
- **brand**: 「Aira」は公開禁止 code name (#9 naming split drift で boundary.ts 監視対象)

### 商品化 gap (連休内 close 候補)

| layer | 現状 | 商品化要件 |
|---|---|---|
| install | git clone + npm install | npm package (`npm install -g yuino` or `npx yuino`) |
| config | hard-coded paths | YAML / JSON config + `yuino init` setup wizard |
| boundary monitor | nokaze 内部 #9-11 | user-configurable monitor types (default: scope creep + sensitive_info_leak + custom rules) |
| input scopes | `~/.shared-ops/` paths | user-configurable observer scopes (file paths / git logs / Slack export / Notion export 候補) |
| output destination | local file write | local file / Slack webhook / Discord webhook / email candidate |
| Gemini API key | Zen owned | BYOK (user 自身の Gemini API key、setup wizard で input)、optional managed mode (paid tier、Zen 側 key で運用) |
| brand name | 「Aira」 (公開禁止) | **新 public name 必要** (§3.1) |
| docs | aira/docs/phase1_specs_draft (内部用) | README + getting started + architecture + use cases (LP に移植) |
| sample digest | nokaze 実 digest (機密含む) | anonymized sample digest (nokaze の actual を redact) |

### 商品化 layer 追加実装 task (連休内 candidate、Iwa packet 拡張 candidate)

1. boundary.ts user-configurable monitor types (default + custom rules、YAML config)
2. input.ts 抽象化 (`observer_scopes` array、各 scope に file paths + ingestion type)
3. output.ts 抽象化 (`destinations` array、local file / webhook / email)
4. CLI: `yuino init` setup wizard (Gemini API key + scopes + destinations を guided form で input)
5. CLI: `yuino digest` (現状 main entry point 抽象化)
6. CLI: `yuino validate` (config 妥当性 + boundary audit 単独 run)
7. config schema (Zod、`yuino.config.yml` or `.json`)

---

## 3. tier 設計 (free / paid)

### 3.1 商品名 (jun 5/03 決定 候補、Zen 提示)

「Aira」(internal code name) は #9 naming split drift で公開禁止、新 public name 必要。

**candidate**:
- **Loom** (織機、digest を編む) — 短くて覚えやすい、AI で「織る」 narrative
- **Frame** — observer frame、scope を切り取る image
- **Bridge** — peer 同士を bridge する layer
- **Echo** — AI peer の声を集約する image
- **Mira** (鏡、observe + 反射) — 短い、女性名 candidate (Aira から音 1 文字残し)
- **Aurora** — 全体を照らす layer の image (3 文字 4 文字)
- **Lens** — observer scope の lens image
- **Beacon** — alert + signal の image

**Zen recommendation**: **Loom** または **Frame** (技術系 audience 向け、短い、検索性 OK)。jun 5/03 決定。

仮に「**Loom**」と進めると以下 sample (置換可):
- npm package: `@nokaze-os/loom` or `loom-digest`
- CLI: `loom init` `loom digest` `loom validate`
- brand: "Loom — Owner Digest for AI Operations"
- tagline: "1 owner + multi-AI org の全体観望 layer。1 ヶ月の内部運用で実証された digest 装置を、自分の組織に。"

以降 doc 内で **`yuino`** と記述、jun 命名後に置換。

### 3.2 tier 設計

| tier | price | 内容 | target |
|---|---|---|---|
| **Free (self-host)** | $0 | npm package、user BYOK Gemini API key、local file output、boundary default monitor types | 個人 indie / 小チーム、Gemini key 持ってる developer |
| **Paid Starter** | ¥1,980 / 月 ($13.50) | + managed Gemini API (Zen 側 key で運用、user は API key 不要)、Slack/Discord webhook、premium boundary templates (governance / audit / handoff) | 1-3 AI peer + 1 owner の小規模事業者、setup 簡略希望 |
| **Paid Pro** | ¥3,500 / 月 ($24) | + multi-project (複数 organization 並走 digest)、custom boundary rules editor、historical digest archive search、priority support | 複数 organization 運営者、jun と同 scale (nokaze 自体が premium tier の dogfood) |
| **Enterprise** | 別見積 | + SLA、SSO、private deployment、custom integration | 後回し、Wave 2 以降 |

**migration narrative**: Free → Starter は「Gemini API key 管理 / Slack 通知 / governance template」が hook、Starter → Pro は「multi-project / 履歴検索」が hook。

### 3.3 channel 選定 (連休内 release path)

連休 4-5 day で β release 可能 channel:

| channel | β 公開 form | go-live timeline |
|---|---|---|
| **GitHub** (open source、Free tier 中心) | public repo + npm publish + README | 5/05 candidate |
| **Gumroad** ($3.50 ワンコイン premium template form first) | Free package 公開 + Paid template (boundary templates collection) を Gumroad 販売 | 5/06 candidate |
| **BOOTH** (¥500 ワンコイン、日本市場) | Free package 公開 + Paid template (boundary templates collection) を BOOTH 販売 | 5/06 candidate |
| **subscription channel (Paid Starter / Pro)** | Polar.sh 解決待ち or 別 channel 移管 | Wave 2 以降 (5/06+)、連休内 β には含めない |

= **連休内 β = Free package (npm) + premium boundary templates (Gumroad / BOOTH)**、subscription tier は Polar.sh 解決後で別 release。

---

## 4. install + config + usage flow (β 設計)

### 4.1 install (β、Free tier)

```bash
npm install -g yuino
# or
npx yuino init
```

### 4.2 config (`yuino.config.yml`)

```yaml
# yuino.config.yml
gemini:
  api_key_env: GEMINI_API_KEY
  model: gemini-1.5-flash  # or gemini-1.5-pro
  budget_per_digest_usd: 0.05

observer_scopes:
  - id: nokaze_board
    type: file_directory
    path: ~/.shared-ops/board/
    glob: "**/*.md"
    max_files: 50
  - id: project_a_status
    type: file_directory
    path: ./projects/project-a/status/
    glob: "*.md"

boundary:
  monitor_types:
    - scope_creep      # default
    - sensitive_info_leak
  custom_rules:
    - id: my_org_specific
      pattern: 'company_secret|internal_only'
      action: deny

digest:
  schedule: daily        # or hourly / on_demand
  domains:
    - WSD
    - Nexus Lab
    - Product Design
    - Pricing/Finance
  output:
    - type: file
      path: ./data/digests/
    - type: stdout
    # - type: slack_webhook
    #   url: ...

contradiction_notes:
  enabled: true
  levels: [yellow, green, red]

wait_observations:
  enabled: true
```

### 4.3 usage

```bash
# initial setup wizard
yuino init

# manually run digest now
yuino digest

# validate config + boundary audit dry-run
yuino validate

# (Paid tier) managed mode (no API key needed)
yuino digest --managed
```

---

## 5. 連休 4-5 day implementation plan (peer 担当割)

### 5.1 Iwa (Lead Engineer)

**packet 拡張 (5/03 起票、5/04-5/05 implementation)**:
- 既存 Phase 1 packet 5 件 (Spec A boundary + Spec B observer input + 4 quality) は維持
- 商品化 layer 7 件追加 (§2 ↑ 1-7)
- Wave 1 制約 default 経由 return content path (Zen 代筆で repo 側 commit、5/06 以降 Iwa 直筆解禁判断)
- 5/05 EOD candidate: β package usable form + sample config working

### 5.2 Akari (Frontend)

**LP / docs site (5/03-5/04)**:
- LP 1 page (商品名 hero + tagline + 3 use cases + tier pricing + install bash + GitHub link)
- README (npm package 用、英語 + 日本語 hybrid OK、developer 中心)
- docs site (VitePress、`yuino.nokaze.dev` candidate or `nexus-lab.nokaze.dev/yuino` sub-route)
  - Getting started (5 min setup)
  - Configuration reference
  - Boundary rules (default + custom)
  - Use cases (1 owner + multi peer / multi-project)
  - Architecture (digest flow)
  - Sample digest (anonymized nokaze digest)

### 5.3 Oto (Backend)

**npm publish + CI/CD (5/05)**:
- monorepo packages/ 配下に `packages/yuino/` 追加 (or 独立 repo)
- npm publish 設定 (`@nokaze-os/yuino` or `yuino-digest` 名前空間)
- GitHub Actions workflow (test + lint + publish on tag)
- npm package metadata (description / keywords / repository)

### 5.4 Kura (経理)

**pricing tier 確定 + 経理視点 review (5/03)**:
- §3.2 tier 設計 (Free / Starter / Pro) の経理視点 review
- managed Gemini API mode の cost-aware forecast (user 1 名 / 月 / digest 数 × token cost)
- Free → Paid conversion forecast + 5月着地 candidate (連休 release で 5/06-5/31 = 26 day 観測)
- Polar.sh 解決待ち subscription tier の代替 channel 経理 spec

### 5.5 Kagami (QA)

**β package QA (5/05)**:
- usability test (`yuino init` setup wizard を 0-knowledge user 想定で walk-through)
- boundary audit suite (default monitor types + custom rules sample)
- documentation completeness check (LP + README + docs site の整合)
- security check (Gemini API key 管理 + sensitive_info_leak default rules)

### 5.6 Hoshi (Researcher)

**Wave 1 binding signal 拡張 (5/06+)**:
- 既存 Wave 1 BOOTH MCP signal + 新規 Aira β interest signal 両軸 monitor design
- Aira β release 後の signal 取得 metric (npm download / GitHub star / docs traffic / Free → Paid conversion)
- Wave 2 期間 (5/06-5/12) で β post-launch observation

### 5.7 Zen (CTO)

**今 turn (5/02 Sat 朝)**:
- 本 design doc 起稿 ✅
- Iwa packet 拡張起票 (商品化 layer 7 件追加)
- 3 channel reform draft (note / X / Zenn) を **「MCP 実績棚化 + 本命 yuino 近日」 narrative** で reform
- Akari LP / docs draft return content path 依頼 inbox 起票
- Kura pricing tier review return content path 依頼 inbox 起票

**連休中 (5/03-5/06)**:
- jun 命名選択 → `yuino` 置換
- peer return content 受領 → repo 側 implement 代筆 (Wave 1 制約 default 経由)
- β package release 200 確認 ritual (5/06 jun 公開時)

---

## 6. brand narrative + 公開 form draft

### 6.1 hero narrative (LP / 公開告知)

**1 owner + multi-AI org の全体観望 layer**

> nokaze (野風) で 4 ヶ月、人間 1 人 + AI 7 人で運営してきました。1 人で複数 AI を回すと、全体が見えなくなります。誰が何を待っているか、どこで矛盾が発生しているか、自分が今日触らないといけないのは何か ── これを 1 日 1 回、5 分の digest で読めるようにしたのが `yuino` です。
>
> 内部運用 1 ヶ月の実装を、自分の組織でも使えるように切り出しました。

### 6.2 use cases (3 つ示す)

1. **Indie hacker + AI agents**: 1 人で複数 AI ツール (Claude / GPT / Gemini) を使い分けている人。各 AI の output / state を 1 つの digest に集約。
2. **Small team + AI peers**: 2-5 人 + AI agent (review / qa / research peer) のチーム。owner が capacity 超える前に digest で全体観望。
3. **AI agent operator**: AI を本業 (consulting / dev / writing) のサブで運営、複数 client (project) ごとに digest を分けて managing。

### 6.3 公開告知 (X / note / Zenn) — 5/06 連休最終日

- X 1 post: hero copy + GitHub URL + npm install command
- note 記事: 「内部装置を商品化した話」 (Wave 1 続報、Aira → `yuino` 命名 origin、tier 設計、5/02-5/06 連休 build process)
- Zenn 記事: 技術 deep-dive (boundary 設計 + Gemini API integration + config schema + sample digest)

---

## 7. risk + open questions

### 7.1 risk

| risk | mitigation |
|---|---|
| 連休 4-5 day で β 完遂しない (実装 scope 大、peer return content path で coordination cost 高) | β scope を Free tier (self-host) のみに絞る、Paid tier は post-連休、Polar.sh 解決と並行 |
| Gemini API rate limit / cost burst (managed mode で複数 user 同時 run) | Free tier は BYOK 強制、managed mode は Paid Starter 以降のみ + per-user budget cap |
| sensitive_info_leak (user の board / inbox に機密情報) | default monitor types に sensitive_info_leak 含める、digest output 前に boundary audit dry-run option (`yuino validate`) |
| 商品名衝突 (npm registry で既存 package) | jun 命名前に npm view + GitHub search で名前衝突 check |
| MCP テンプレ 4 商品の sales path に impact (連休 capacity を yuino に集中) | 3 channel reform で「MCP は実績棚として並走、本命 yuino 近日」 narrative、MCP は free 入口として位置づけ |

### 7.2 open questions (jun 判断 candidate)

1. **商品名選択** (§3.1 candidate から or jun 命名)
2. **Free tier の monetization model** (open source MIT / pay-what-you-want / 単純 free + Paid tier upsell): Zen recommendation = MIT + Paid Starter から有償化
3. **release channel 優先順** (GitHub / Gumroad / BOOTH の 3 つ全部か、絞るか): Zen recommendation = 3 channel 全部、GitHub 主軸
4. **Polar.sh 解決待ち tier 設計**: Polar.sh response 来たら subscription tier (Paid Starter / Pro) 起動、来なくても Free + premium template 一回払い form で連休内 β 可能
5. **subscription tier の代替 channel 候補** (γ' Stripe Checkout / Lemon Squeezy / note membership / Patreon): Polar.sh response 内容次第、5/03-5/04 で確定

---

## 8. 翌日以降 chain (action timeline、review-pending closing なし)

- **5/02 (Sat) evening**: 本 design doc 確認 + jun 修正指示 (Path C + Aira 軸再確認、商品名選択)、Zen は 3 channel reform draft (Aira narrative 反映) + Iwa packet 拡張 + Akari/Kura inbox 起票
- **5/03 (Sun)**: jun 商品名決定 + 3 channel 投稿 (note + X、Zenn は 5/06 公開告知 timing)、peer return content (Iwa Phase 1 + 商品化 layer / Akari LP draft / Kura pricing review)
- **5/04 (Mon)**: peer return 受領 → Zen 代筆 implement、LP / docs site 起稿 deploy、pricing tier 確定
- **5/05 (Tue、5/05 期限)**: β package usable form + Kagami QA review、5/05 期限 deliverable submit (議題 30 で yuino pivot 軸として組み込み)
- **5/06 (Wed、連休最終日)**: 公開判断 + Gumroad / BOOTH / GitHub release、X / note 公開告知、200 確認 ritual

---

Zen
nokaze / Nexus Lab CTO
2026-05-02 Sat 朝 (Path C + Aira 商品化軸 commit、連休 4-5 day β release plan)
