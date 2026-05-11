---
date: 2026-05-10
owner: Akari (Frontend / Docs / Visual / Motion Design Engineer)
status: drift_correction_2026-05-10 (5/10 22:35 jun 指摘経由 「actual broadcast-os repo audit せず spec doc 起稿」 drift detect、 詳細は `nexus-lab/research/broadcast_os_actual_state_audit_2026-05-10.md` 参照)
purpose: broadcast-os Format Bible に delivery_mode 拡張 + Slidev subprocess form + process_panel primitive 6 件 + nokaze-design 整合 5 ruled の reference spec
audience: Akari + Iwa 共同 (4 ヶ月初心者 audience は § 6 のみ)
related:
  - nexus-lab/research/broadcast_os_actual_state_audit_2026-05-10.md (audit baseline、 5/13+ narrative 廃止 + 改善案 re-sketch baseline)
  - team_memory/_shared/nokaze_marketing_workflow_2026-05-09.md (slide artifact policy)
  - team_memory/zen/feedback_yuino_conversation_insights_axis.md (5 panel 構造、 process narrative connect)
  - ~/.claude/skills/nokaze-design/SKILL.md (色 + 書体 + 禁忌 visual)
  - CLAUDE.md § 報告 form 4 ヶ月初心者向け 3 段固定 (audience matrix と整合)
phase_target: Phase 1 期間中 (5/08-5/21) organic 着手 (5/10 22:35 jun 指摘経由 「5/13+」 narrative 廃止、 calendar gating ruled なし、 必要なら今夜 / 明日着手 OK)
drift_note:
  - 本 spec doc は 5/10 13:00-22:00 起稿時に broadcast-os repo の actual code audit を skip して 4 layer registry pattern narrative のみで起稿した drift narrative reflect
  - actual には sibling module 24 件 + 既 reify 済機能 (quality_gate.py / costs.py / metabolic/ + slide artifact form 設定 + docs) あり、 本 spec doc 内の改善案は audit baseline で re-sketch 必要
  - 5/13+ Phase 1 narrative は廃止、 各 5/13+ occurrence は audit baseline 参照で 「Phase 1 期間中 organic 着手」 narrative に置換
---

# broadcast-os Format Bible — delivery_mode 拡張 patch (5/10 起稿)

## 0. この文書は何か

broadcast-os の **既設 Presentation Layer 設計** に slide / process / hybrid mode を実装層に降ろすための spec patch。 新規 Slide Layer をゼロから足すではない、 **既存 Format Bible field 拡張 + 第 11 layer (Slidev subprocess) 横付け** が骨子。

- 起点 1: 5/04 evening jun directive 「broadcast は資料・過程動画作るのは向いてない、 スライドとかも作れるようにしないと」
- 起点 2: 5/09 14:25 起稿 `nokaze_marketing_workflow_2026-05-09.md` の slide artifact policy (Kai-side reform 既反映)
- 起点 3: 5/10 13:00+ jun directive 「broadcast-os 完成度上げる」 + Zen 集約 narrative (Slidev 推奨 + delivery_mode + process_panel + nokaze-design 整合)

本 patch の射程:

1. delivery_mode field を Format Bible に追加 (4 enum 値)
2. Slidev subprocess form の実装 module 構造 (`src/pipeline/slide/`、 既 4 layer registry pattern 整合、 2026-05-11 path narrative update by Kagami QA review P1 fix、 旧 `src/presentation/` narrative は audit baseline で superseded)
3. process_panel primitive 6 件 spec (broadcast-os 唯一無二の弾)
4. nokaze-design 整合 ruled 5 件 (Slidev theme + Direction Layer 共通)
5. audience 別 visual form 切替 matrix
6. 5/13+ Phase 1 期間内 reify candidate (本 patch の延長)

非射程: 実装着手 (Iwa 主担当 5/13+)、 broadcast-os repo 直接 commit、 Direction Layer (現 narrative default) の破壊的変更。

---

## 1. 起点と背景の精査

### 1.1 jun directive 連鎖

| 日付 | directive | 連動 reform |
|---|---|---|
| 5/04 evening | 「broadcast は資料・過程動画作るのは向いてない、 スライドとかも作れるようにしないと」 | broadcast-os 4 layer ecosystem の発信 layer に統合 (memory `project_broadcast_layer_integration.md`) |
| 5/09 14:25 | 「nokaze marketing workflow 起稿、 slide artifact policy 含めて」 | Kai-side workflow doc に slide policy 追加、 broadcast-os 出力 form の 1 つとして slide deck 公式化 |
| 5/10 13:00+ | 「broadcast-os 完成度上げる」 | 既設 Presentation Layer の slide / process mode を実装層に降ろす |

### 1.2 既設 Presentation Layer の現状

broadcast-os の既存 Presentation Layer は AIRA (narrative) default で動作:

- 入力: scene_plan (showrunner が生成、 list of scene)
- primitive: bg_image / Ken Burns / bubble (吹き出し) / lower_third / voice_over
- 出力: editor が timeline 連結 → mp4

= **narrative form に optimized**、 資料 (slide) / AI 組織対話 (process) は primitive がない。 これに **mode の concept** を導入するのが本 patch。

### 1.3 「既設 Presentation Layer の slide mode を実装層に降ろす」 と 「新規 Slide Layer ゼロから足す」 の違い

| axis | 既設 mode 拡張 (採用) | 新規 Slide Layer (不採用) |
|---|---|---|
| 既存 pipeline / studio / publish 影響 | ゼロ (横付け) | 配管追加で破壊的変更 risk |
| Format Bible 変更量 | field 追加 1 件 (delivery_mode) | layer 構造そのものの reform |
| 実装 module | `src/presentation/` 新設のみ | `src/slide_pipeline/` 全 layer 別建て |
| AIRA default 不変保証 | scene_plan 入力 path 不変、 mode default = narrative で従来通り | layer 分岐で default path 変更 risk |
| Phase 1 reify cost | 中 (Slidev glue layer + theme 移植) | 大 (4 layer 分の re-impl) |

= **既設 mode 拡張 を採用**、 新規 Slide Layer は不採用。 本 patch 全体がこの方針で組まれる。

---

## 2. Slidev subprocess form 推奨 spec

### 2.1 なぜ Slidev か

- **Markdown source**: scene_plan からの conversion が簡潔 (Python 側で Slidev MD 文字列を組み立てる、 Vue 直接生成不要)
- **theme system**: Vue layout + CSS で nokaze-design 移植可能 (色 token + 書体 fallback chain + transition cap が CSS で表現できる)
- **export 機能**: `slidev export` (puppeteer 経由) で PNG / PDF / HTML 取得、 broadcast-os editor の timeline asset として流し込める
- **disclaimer 強制**: build 時 lint で forbidden_phrases / 必須 disclaimer slide 検査が natural に書ける
- **OSS + Node**: web font の fallback chain 追加・theme override が公開実装 reference 多数

代替候補との比較:

| 候補 | 採用しない理由 |
|---|---|
| reveal.js | theme override が CSS direct で nokaze-design 4 色 + 書体 chain 適用は可能だが、 Markdown source の Vue layout 表現力が Slidev に劣る、 disclaimer lint 自前実装必要 |
| PowerPoint COM 自動化 | Windows 限定 + binary 出力 + version drift risk + nokaze-design 色 token 固定が脆い |
| Marp | Markdown is plus、 但し Vue layout なし → process_panel primitive (decision_node / drift_diff / knot_loop_arc) の表現が CSS pseudo 限定で破綻 |
| 自前 HTML/CSS 生成 | dogfood には可能だが maintenance cost 過大、 export pipeline 自前実装 = NG |

= **Slidev 採用確定**。

### 2.2 subprocess form (Python ↔ Node 隔離)

broadcast-os は Python project、 Slidev は Node。 言語境界を **subprocess form** で隔離:

```
[broadcast-os Python]
  studio/brief/builder.py  → scene_plan (dict / pydantic model)
        ↓
  presentation/slide_builder.py  → Slidev MD (str)
        ↓
        書き出し: tmp/slides_<run_id>/slides.md
        ↓
  presentation/slide_renderer.py  → subprocess.run(["npx", "slidev", "export", ...])
        ↓
  tmp/slides_<run_id>/dist/  → PNG/PDF/HTML
        ↓
  editor (既存 layer) が timeline asset として吸収
```

### 2.3 fallback path (Slidev unavailable 時)

`npx slidev` 不在 / Node 不在 / network 不在 (CI 等) の時は **markdown fallback**:

- `slide_renderer.py` が subprocess 失敗を捕捉 (timeout 30s / non-zero exit / `npx` not found)
- fallback = scene_plan を **plain markdown** として書き出し、 editor は markdown を text overlay scene として timeline 連結
- log に `[slide_renderer] Slidev unavailable, fallback to markdown` 記録、 silent skip 禁止
- 起動側 (showrunner) には `slide_renderer.RenderResult.mode == "fallback"` で報告、 publish gate で fallback だった旨 disclaimer 追加

### 2.4 新 module 構造

```
src/presentation/
  __init__.py
  router.py              # primitive → renderer dispatcher (§ 3.3)
  slide_builder.py       # scene_plan → Slidev MD (§ 2.5)
  slide_renderer.py      # slidev export 起動 + PNG/PDF/HTML 取得 + fallback (§ 2.3)
  process_panel.py       # process primitive 6 件 → Slidev component (§ 4)
  themes/
    nokaze/
      package.json       # Slidev theme manifest
      layouts/           # Vue layout (cover / content / decision / drift / knot_loop / timeline)
      styles/
        index.css        # nokaze-design 色 token + 書体 fallback chain (§ 5.1, 5.2)
        components.css   # process_panel primitive component class
      components/
        AgentAvatar.vue
        DecisionNode.vue
        EvidenceChip.vue
        DriftDiff.vue
        KnotLoopArc.vue
        TimelineLane.vue
```

既存 `pipeline / studio / publish` directory は **未変更**。 第 11 layer として `presentation/` を **横付け**、 既存 layer 出力を入力に取る形で hook、 既存 layer の出力 contract は不変。

### 2.5 slide_builder.py — scene_plan → Slidev MD

入力 contract (既設 scene_plan、 拡張なし):

```python
class Scene(BaseModel):
    scene_id: str
    delivery_primitive: Literal["bg_image", "kenburns", "bubble", "lower_third",
                                "slide_deck", "voice_over",
                                "agent_avatar", "decision_node", "evidence_chip",
                                "drift_diff", "knot_loop_arc", "timeline_lane"]
    payload: dict  # primitive 別 schema
    duration_ms: int
```

出力例 (documentary mode、 slide_deck primary):

```markdown
---
theme: nokaze
title: Yuino demo (5/10 起稿)
target_audience: jun_4_months
delivery_mode: documentary
disclaimer: "売上 0 / 顧客 0 / AI 運営"
---

# やったこと

- AGENT_SETUP.md 起稿
- Setup Doctor v0 wire 反映
- Kai 追随 axis 6 連動

---

# 結果

- commit `f4490c6` (5/09 milestone day diary)
- 行数: 412 (verification day close)

---

# これからどうするか

- 5/13+ Akari paraphrase pass
- 4 ヶ月初心者 audience に retroactive 修正

---
layout: nokaze-disclaimer
---

売上 0 / 顧客 0 / AI 運営
```

= scene_plan の delivery_mode = `documentary` の時、 各 scene を 1 slide に mapping、 末尾に必ず disclaimer slide を追加 (lint で強制、 § 5.5)。

---

## 3. delivery_mode 拡張 spec (Format Bible)

### 3.1 Format Bible field 追加

```yaml
# format_bible.yaml (broadcast-os 既設 file の拡張)

delivery_modes:
  default: narrative
  available: [narrative, documentary, process, hybrid]

  # nokaze profile overlay (用途別 default 切替)
  nokaze_marketing_overlay: documentary
  nokaze_aira_observability_overlay: process

# 既設 field (変更なし、 reference 用)
target_audience: jun_4_months    # 4 ヶ月初心者 / ai_developer / general_viewer
showrunner_template: aira_v1
publish_gate: honesty_v0
```

### 3.2 4 enum 値の意味と primitive set

| delivery_mode | 用途 | 使う primitive (set 制限) | 既設 Layer 適用 |
|---|---|---|---|
| `narrative` | 現 AIRA default、 story-first 動画 | `bg_image` / `kenburns` / `bubble` / `lower_third` / `voice_over` | Direction Layer 不変 |
| `documentary` | 資料 / 解説 (jun 向け digest、 marketing deck、 weekly report) | `slide_deck` / `voice_over` / `lower_third` (補足 caption) | Slidev primary、 editor は slide PNG を timeline asset 化 |
| `process` | AI 組織対話 (Zen ↔ Kai ↔ Aira ↔ Yuino の判断 chain visualization) | `agent_avatar` / `decision_node` / `evidence_chip` / `drift_diff` / `knot_loop_arc` / `timeline_lane` | Slidev process_panel layout、 component 6 件 |
| `hybrid` | scene 単位で primitive 混在 (代表: Knot loop 解説 + 北極星進捗 grouped deck) | scene_plan で per-scene 指定、 全 primitive 解放 | router.py が primitive 単位で renderer 切替 |

### 3.3 router.py — primitive → renderer dispatch

`src/presentation/router.py` (新):

```python
RENDERER_MAP = {
    # narrative primitive
    "bg_image":     ("editor", "kenburns_renderer"),
    "kenburns":     ("editor", "kenburns_renderer"),
    "bubble":       ("editor", "bubble_renderer"),
    "lower_third":  ("editor", "lower_third_renderer"),
    "voice_over":   ("editor", "voice_renderer"),

    # documentary primitive
    "slide_deck":   ("presentation", "slide_renderer"),

    # process primitive
    "agent_avatar":   ("presentation", "process_panel"),
    "decision_node":  ("presentation", "process_panel"),
    "evidence_chip":  ("presentation", "process_panel"),
    "drift_diff":     ("presentation", "process_panel"),
    "knot_loop_arc":  ("presentation", "process_panel"),
    "timeline_lane":  ("presentation", "process_panel"),
}


def dispatch(scene: Scene) -> RenderResult:
    layer, renderer = RENDERER_MAP[scene.delivery_primitive]
    if layer == "editor":
        return editor.dispatch(renderer, scene)
    elif layer == "presentation":
        return presentation.dispatch(renderer, scene)
    else:
        raise ValueError(f"unknown layer: {layer}")
```

= primitive 単位で renderer 振分け、 mode は scene_plan 構築時の **primitive set 制限 (§ 3.2 表)** で表現。 router 自体は primitive を見るだけで mode 不可知 = **scene 単位 hybrid が natural に成立**。

### 3.4 切替 logic (起動 → render までの flow)

1. **Format Bible 宣言**: `delivery_modes.default` (default = `narrative`)、 nokaze profile では overlay (`nokaze_marketing_overlay = documentary` 等) で上書き
2. **Showrunner**: scene_plan 構築時、 各 scene の `delivery_primitive` を mode の primitive set 内から選ぶ。 mode = `hybrid` の時は全 primitive 解放、 scene_plan validator が primitive set 制限を確認
3. **router.py**: primitive → renderer dispatch (§ 3.3)
4. **editor / presentation**: 各 layer が scene 単位で render、 timeline 連結は editor 側 (slide PNG / process_panel PNG も asset として吸収)
5. **publish gate**: honesty lint (§ 5.5) + disclaimer 検査 + audience 整合 (§ 6) で block 可能

---

## 4. process_panel primitive 6 件 spec (broadcast-os 唯一無二の弾)

### 4.1 全体方針

process_panel = AI 組織 (Zen / Kai / Aira / Yuino) の **判断 chain の visualization**。 入力 = decision chain JSON、 出力 = Slidev component 化された scene asset。

入力 source (mapping 候補、 5/13+ Iwa 主担当で確定):

- `zen-memory` knot history (knot id / hardness / 時系列)
- `~/.shared-ops/board/` file (Kai ↔ Zen request / response 連鎖)
- Aira observation log (`nokaze-aira/log/` 想定、 5/13+ Kai 主担当で contract 固定)
- shared-ops `successes/` + `knots/` (反証接続 / 成長の糧 chain)

### 4.2 primitive 6 件 — 役割と nokaze-design 反映

| primitive | 役割 | nokaze-design 反映 (色 / 書体 / 禁忌) |
|---|---|---|
| `agent_avatar` | Zen / Kai / Aira / Yuino の識別 | 4 色割当 = Zen 墨色 `#2B2622` / Kai 風化木 `#8B7355` / Aira オリーブ `#7A8B5C` / Yuino 障子紙ivory inverted `#F5F1E8` (背景墨色)。 全 wordmark 形式 (テキスト名、 hero robot 禁忌違反しない)。 audio 強調は voice ピッチで区別 (色だけに依存しない accessibility) |
| `decision_node` | 判断 1 件 | 角丸なし矩形 (border-radius: 0)、 Noto Serif JP heading (16-20pt)、 commit hash 脚注 (JetBrains Mono 9-11pt)、 細罫線 1px solid #2B2622 |
| `evidence_chip` | 判断の根拠 file/commit | Mono 書体 (JetBrains Mono 11pt)、 細罫線、 横長 chip 形 (border-radius: 0)、 数字盛り禁忌 (chip 内に「3 件」と書くなら 3 件の commit hash を必ず enumerate) |
| `drift_diff` | self-correct visual | before/after 縦 split (上下 50%/50%)、 取消線 (text-decoration: line-through) で旧 narrative、 olive `#7A8B5C` 1 点差しで新 narrative の修正 mark、 transition fade ≤ 200ms |
| `knot_loop_arc` | Episode N→N+1 学習 | 円弧 arrow (SVG、 stroke 1.5px、 墨色)、 step label (Noto Sans JP 12pt)、 派手 transition 禁止 (slide-in / 3D rotate 不使用) |
| `timeline_lane` | 時間軸 lane (各 agent 1 lane) | horizontal 4 lane (Zen / Kai / Aira / Yuino)、 細罫線 (1px solid #8B7355 風化木)、 lane 高さ 60px、 イベント = 矩形 chip (decision_node と同 style) |

### 4.3 transition + accessibility ruled

- fade transition は **200ms cap** (nokaze-design ruled § 5.3)
- agent 切替時の audio 強調は **voice ピッチで区別** (Zen 低 / Kai やや低 / Aira 中 / Yuino 高)、 色だけに依存しない (color-blind accessibility + 監聴 audio-only environment)
- decision_node の commit hash は **クリック可能 link** (HTML export 時)、 PNG export では脚注テキストのみ
- timeline_lane の時刻表記は **ローカル時間 + UTC 併記** (UTC drift 起こさない、 jun 観察と整合)

### 4.4 実装位置: process_panel.py

入力 contract (5/13+ Iwa 主担当で final spec):

```python
class DecisionChain(BaseModel):
    """Aira observation log + zen-memory knot + shared-ops board からの aggregate"""

    chain_id: str
    agents: list[Literal["zen", "kai", "aira", "yuino"]]
    nodes: list[DecisionNode]   # decision 単位
    edges: list[DecisionEdge]   # node 間の causal edge (knot_loop_arc 描画用)
    timeline: list[TimelineEvent]  # timeline_lane 描画用

class DecisionNode(BaseModel):
    node_id: str
    agent: Literal["zen", "kai", "aira", "yuino"]
    title: str        # 判断の 1 行 summary
    evidence: list[Evidence]  # commit hash / file path / board ref
    drift: Optional[Drift]    # self-correct があれば
    timestamp: datetime
```

出力 = Slidev component instance (Vue), 1 chain → 1 scene = 1 process_panel slide。

### 4.5 mapping spec (5/13+ Phase 1 期間内 reify candidate)

入力 source 別 mapping 例:

| source | 抽出単位 | DecisionNode 化 |
|---|---|---|
| zen-memory knot | 1 knot record | agent = zen、 evidence = knot text、 drift = self-correct annotation があれば付与 |
| shared-ops board file | 1 file (request or response) | agent = file 名 prefix (kai_zen / zen_kai 等)、 evidence = file path + commit hash |
| Aira observation log | 1 observation entry | agent = aira、 evidence = log line、 drift = 検出した stop / silent_wait |
| shared-ops successes/knots/ | 1 file | agent = 起稿者、 evidence = file path、 timestamp = ファイル mtime |

aggregator = `presentation/process_chain_aggregator.py` (新、 5/13+ Iwa 主担当)。

---

## 5. nokaze-design 整合 ruled 5 件 (Slidev theme + Direction Layer 共通)

### 5.1 色 token 固定

- 障子紙ivory `#F5F1E8` (background)
- 墨色 `#2B2622` (text primary / heading)
- オリーブ `#7A8B5C` (一点差し、 olive 強調 / drift_diff 修正 mark / 重要 highlight)
- 風化木 `#8B7355` (細罫線 / 補助 mark / timeline_lane border)

`themes/nokaze/styles/index.css`:

```css
:root {
  --nokaze-ivory: #F5F1E8;
  --nokaze-sumi:  #2B2622;
  --nokaze-olive: #7A8B5C;
  --nokaze-wood:  #8B7355;
}

/* 派生色生成禁止 (rgba alpha 利用は OK、 hue shift 禁止) */
```

ruled:

- colors_and_type.css の値そのまま、 **派生色生成禁止** (新色追加 / hue shift / 中間色補完 NG)
- alpha 利用は OK (rgba(43,38,34,0.1) for shadow)、 但し新 hex 値は追加しない
- shadcn oklch 由来の値で override 不可 (5/07 incident `feedback_nokaze_design_skill_skip_drift.md` 連動、 shadcn variable は不変)

### 5.2 書体 fallback chain 固定

```css
:root {
  --font-heading: "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif;
  --font-body:    "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
  --font-mono:    "JetBrains Mono", "Consolas", "Menlo", monospace;
}
```

ruled:

- heading = Noto Serif JP (明朝混じり、 nokaze identity)
- body = Noto Sans JP
- code / 数字 = JetBrains Mono
- web font 不在環境では sans-serif fallback (本系 + Hiragino + Yu chain)
- 任意の font 追加 / chain 並び替え NG

### 5.3 transition cap

- フェード ≤ 200ms (Slidev `transition: fade` の duration override)
- slide-in (左右スライド) / zoom / 3D rotate **禁止**
- Slidev theme 設定:

```ts
// themes/nokaze/setup/transitions.ts
export default {
  default: { name: "fade", duration: 200 },
  forbidden: ["slide-left", "slide-right", "slide-up", "slide-down", "zoom", "view-transition", "rotate-x", "rotate-y"],
}
```

forbidden は theme build 時に lint で reject (use 検出 → build error)。

### 5.4 disallowed visual

Slidev theme component / layout で下記を delete or use 不可:

- hero robot illustration (5/07 incident で禁忌確定、 audience が 4 ヶ月初心者でも AI developer でも一律 NG)
- neon gradient (linear-gradient の彩度高 stop NG)
- 3D brain illustration
- 過度絵文字 (heading に絵文字 NG、 body に 1 件以上 NG、 default は絵文字なし)
- 煽り語彙バナー: 「革新」 「次世代」 「突破」 「急成長」 「圧倒的」 「最強」

= Slidev theme で **これらを使う component class 自体を delete**、 layout の名前空間に存在させない。

forbidden_phrases lint (§ 5.5 で walk-through):

```yaml
# themes/nokaze/lint/forbidden_phrases.yaml
phrases:
  - 革新
  - 次世代
  - 突破
  - 急成長
  - 圧倒的
  - 最強
  - hero robot
  - neon gradient
```

### 5.5 disclaimer 強制

全 deck の最終 slide に **必須 disclaimer**:

- 8pt 以上 (jun 視認性 + accessibility)
- 内容: 「売上 0 / 顧客 0 / AI 運営」 (5/10 時点の honest state、 数字 update は honesty audit pass 必須)
- layout = `nokaze-disclaimer` (theme 提供、 自前 layout で代替不可)
- Slidev build 時に lint:

```python
# presentation/lint/disclaimer_check.py
def check_disclaimer(slidev_md: str) -> LintResult:
    if "nokaze-disclaimer" not in slidev_md:
        return LintResult(ok=False, reason="missing disclaimer slide")
    if "売上 0" not in slidev_md or "顧客 0" not in slidev_md or "AI 運営" not in slidev_md:
        return LintResult(ok=False, reason="disclaimer text incomplete")
    return LintResult(ok=True)
```

publish gate (§ 3.4 step 5) で fail = block、 silent skip 禁止。

honesty gate 統合:

- workflow doc § honesty gate 既設の forbidden_phrases lint と同一 source 参照 (`themes/nokaze/lint/forbidden_phrases.yaml`)
- workflow doc で gate を pass しても本 patch の disclaimer / forbidden_phrases lint 両方 pass 必須 (and 条件)

---

## 6. audience 別 visual form 切替 matrix

### 6.1 matrix 定義

| audience | delivery_mode preset | typography scale | visual emphasis |
|---|---|---|---|
| **4 ヶ月初心者 (jun)** | documentary | heading 48pt+ / body 28pt+ / mono 18pt+ | 大文字 + 図中心 + 専門用語 paraphrase tooltip 風 lower third、 用語表 substitute (CLAUDE.md § 6 の用語 paraphrase 表) を auto 適用 |
| **AI developer** | hybrid | heading 36pt+ / body 22pt+ / mono 16pt+ | code highlight (JetBrains Mono) + technical diagram + commit hash 脚注 default、 paraphrase tooltip OFF |
| **一般 viewer (将来 YT)** | narrative | heading 40pt+ / body 24pt+ / mono 16pt+ | story-first + visual evidence + AI 運営 disclaimer 開示、 専門用語は voice over で口頭説明 |

### 6.2 audience field

Format Bible の `target_audience`:

```yaml
target_audience: jun_4_months   # | ai_developer | general_viewer
```

Showrunner が scene_plan 生成時に:

1. typography scale を自動 apply (theme css variable)
2. paraphrase 適用度を選択 (jun_4_months = ON / ai_developer = OFF / general_viewer = voice only)
3. lower_third tooltip layout を選択 (jun_4_months = paraphrase tooltip 有効)

### 6.3 4 ヶ月初心者 audience の特例 ruled (CLAUDE.md § 6 連動)

**「報告 form 3 段固定」 narrative を slide 構造にも展開**:

- 3 zone slide template = 「やったこと / 結果 / これからどうするか」 を 1 deck 内で必ず含む (順序固定)
- 用語 substitute (commit / push / board file / wake-queue 等) は CLAUDE.md § 6 の表を Slidev theme の `paraphrase_dict.yaml` に embed
- paraphrase は **lower third (slide 下部 caption)** で表示、 本文を変えずに添える形 (専門用語の意味を本文に書くのではなく、 専門用語そのままで本文書き、 補足で paraphrase)
- 数字盛り禁止 (CLAUDE.md § 6 + memory `feedback_honesty_violation_exaggeration.md` 連動)、 数字 → honesty audit 経由で確定値のみ

例: documentary deck で 「commit `f4490c6` を push しました」 と本文があれば、 lower third に 「commit = GitHub 保存番号、 push = GitHub に保存する」 を auto 添付。

### 6.4 既設 narrative (general_viewer) の不変保証

本 patch で audience matrix を導入しても、 既設 AIRA narrative default は **不変**:

- target_audience = `general_viewer` + delivery_mode = `narrative` で従来通り bg_image + Ken Burns + bubble の構成
- typography scale も既設 default (heading 40pt+ / body 24pt+) のまま
- Direction Layer の出力 contract 不変、 既存 編集 timeline 連結も不変
- = AIRA default 不破壊検証 = 既存 845 tests + 視覚回帰 test pass 必須 (§ 7.4)

---

## 7. 5/13+ Phase 1 期間内 reify candidate

### 7.1 `src/presentation/` module 実装 (Iwa 主担当)

- `slide_builder.py` / `slide_renderer.py` / `router.py` / `process_panel.py` / `process_chain_aggregator.py` の 5 file
- subprocess form (§ 2.2) + fallback path (§ 2.3) + 入力 contract (§ 2.5 + § 4.4) を spec 通り
- vitest 相当の Python pytest で unit test、 既存 broadcast-os test 構成に倣う
- timeline 推定: 5/13 ~ 5/17 (5 day)、 Iwa との合意で sub-tasks 切り分け

### 7.2 Slidev theme + nokaze-design CSS 移植 (Akari 主担当)

- `themes/nokaze/` 配下の Vue layout + CSS 移植
- 色 token (§ 5.1) + 書体 chain (§ 5.2) + transition cap (§ 5.3) + forbidden_phrases lint (§ 5.4) + disclaimer layout (§ 5.5)
- AgentAvatar / DecisionNode / EvidenceChip / DriftDiff / KnotLoopArc / TimelineLane の 6 component (§ 4.2)
- 視覚回帰 test = playwright で screenshot diff、 既存 nokaze-design portal の reference image 流用
- timeline 推定: 5/13 ~ 5/15 (3 day)

### 7.3 process_panel primitive 6 件 の Slidev component 化 + Aira observation log mapping spec

- aggregator (§ 4.5) の input source 4 件 (zen-memory / shared-ops board / Aira observation log / shared-ops successes/knots) を mapping
- Aira observation log の contract は **5/13+ Kai 主担当で固定**、 broadcast-os は read-only 参照 (CLAUDE.md 「他 project 参照のみ」 ruled 遵守)
- mapping example = work-232 / work-233 (5/06 evening Aira full closed loop) を sample chain として decode、 sample deck (§ 7.5 case b) で dogfood
- timeline 推定: 5/14 ~ 5/17 (4 day、 Iwa + Kai 共同)

### 7.4 honesty lint = Slidev build 時 forbidden_phrases / disclaimer 検査 linter

- workflow doc § honesty gate と統合 (forbidden_phrases.yaml を共通 source 化)
- Slidev build pre-hook で lint、 fail = build error
- CI (GitHub Actions / 既存 broadcast-os test pipeline) で必ず走らせる
- timeline 推定: 5/15 ~ 5/16 (2 day、 Iwa 主担当)

### 7.5 sample deck 3 件 起稿 = dogfood 第一弾

| case | delivery_mode | audience | scope |
|---|---|---|---|
| (a) Yuino demo | documentary | jun_4_months | Yuino 商品化第一形 (Local Web App) の demo deck、 setup → AI agent 経由 setup → Conversation Insights panel の 3 zone (やったこと / 結果 / これからどうするか) |
| (b) Knot loop 解説 | process + hybrid | ai_developer | Episode N→N+1 学習の visual、 zen-memory knot history を decode、 process_panel primitive 6 件 全部使う dogfood |
| (c) 北極星進捗 | documentary + bar chart | jun_4_months | 北極星 (Phase 1.5/2 完成条件) の進捗、 jun 介入週 1-2 回 + 売上 fixed cost 超え の 2 軸 bar chart、 sample 数値は honesty audit pass 後に確定 |

= 各 deck 起稿で本 patch の spec が full pass するか dogfood 検証、 失敗 case (lint reject / fallback 発火 / 視覚回帰 diff) は spec 改修 trigger。

timeline 推定: 5/16 ~ 5/19 (4 day、 Akari 主担当 deck 起稿 + Iwa 補助で lint / mapping 改修)

### 7.6 既存 Direction Layer Theme との overlay test (AIRA default 不破壊検証)

- 既存 845 tests pass 必須 (broadcast-os test suite)
- 視覚回帰 test = AIRA narrative default の sample mp4 と本 patch 適用後の output diff = 0 pixel
- 失敗 case = 既存 layer に副作用が漏れている、 第 11 layer 横付け方針違反 → 即修正
- timeline 推定: 5/17 ~ 5/19 (3 day、 Iwa 主担当 + Kagami QA review)

### 7.7 5/13+ Phase 1 全体 timeline (本 patch 由来 work)

| 日付 | 主担当 | work |
|---|---|---|
| 5/13 | Iwa + Akari | `src/presentation/` skeleton + `themes/nokaze/` skeleton 起稿 |
| 5/14 | Iwa + Akari + Kai | slide_builder + slide_renderer + theme CSS 移植 + Aira log contract 固定 |
| 5/15 | Iwa + Akari | process_panel.py + 6 component Vue + lint linter |
| 5/16 | Akari + Iwa | sample deck (a) Yuino demo 起稿 + lint pass 確認 |
| 5/17 | Akari + Iwa | sample deck (b) Knot loop + (c) 北極星進捗 起稿 + AIRA default 不破壊検証 |
| 5/18 | Kagami | QA review (precision / recall lint + 視覚回帰 + AIRA default 不変) |
| 5/19 | Akari + Zen | jun + Kai consensus 取得 + 5/19 EOD で sample deck 3 件 公開 candidate (5/26 canonical switch milestone との axis 整合) |

---

## 8. 残 question / blocker (5/10 時点)

### 8.1 Aira observation log の contract (5/13+ Kai 主担当で確定 pending)

- broadcast-os は read-only 参照 (CLAUDE.md 「他 project 参照のみ」 ruled 遵守)
- log format / file path / 更新 frequency / atomic write 保証 が Kai 確定待ち
- 確定までは process_panel mapping spec (§ 4.5) は **mock JSON で開発**、 5/13 Kai 確定後に実 contract 差し替え

### 8.2 既存 broadcast-os test 構成の確認 (Iwa 確認 pending)

- 845 tests と本 patch 連動 (§ 7.6) は数値 reference、 actual 数は Iwa が repo `tests/` count で確定
- 視覚回帰 test framework = playwright + screenshot diff (推奨)、 既設なければ 5/13 着手時に Iwa が install

### 8.3 honesty audit の 5/10 時点 数値 (jun + Kai 確認 pending)

- sample deck (c) 北極星進捗 の bar chart 数値 = jun 介入週 1-2 回 / 売上 fixed cost 超え の actual 数値
- 5/10 時点で売上 0 / 介入頻度未計測 = bar chart は 0 baseline + 「未計測」 label 明示
- 5/19 EOD 公開時に actual 計測 (5/12 dogfood close 経由) を反映

### 8.4 Slidev version 固定 (Iwa 5/13 着手時 確定)

- Slidev version 固定 (推奨 = 0.49+、 Vue 3 + Vite 5 系)
- npx 経由 default、 lockfile (`package-lock.json` or `pnpm-lock.yaml`) で reproducibility
- Node version 固定 (`.nvmrc` 18.18+ 推奨)

---

## 9. 本 patch の review request

- **Iwa**: § 2 (Slidev subprocess form) + § 7 (5/13+ Phase 1 reify candidate) の実装 feasibility 確認
- **Zen**: § 3 (delivery_mode 拡張) + § 6 (audience matrix) の narrative 整合確認、 4 ヶ月初心者 audience preset (CLAUDE.md § 6) との axis 整合
- **Kagami**: § 5 (nokaze-design 整合 ruled 5 件) + § 7.4 (honesty lint) の precision/recall 0.90+ test plan 起稿
- **Kai**: § 4.5 (Aira observation log mapping) の contract 確定 (5/13+ EOD target)

5/13 Phase 1 着手前に上記 4 名 review pass、 jun 最終 confirm で本 patch を Format Bible に正式 merge。

---

## 10. 報告 form (3 段固定、 CLAUDE.md § 6 準拠)

### やったこと

- broadcast-os Format Bible delivery_mode 拡張 patch を `c:\Users\jk023\nexus-lab\docs\broadcast_layer_format_bible_delivery_mode_patch_2026-05-10.md` に起稿
- Slidev subprocess form / process_panel primitive 6 件 / nokaze-design 整合 5 ruled / audience matrix / 5/13+ Phase 1 reify candidate を spec 化
- 既設 Layer (pipeline / studio / publish / Direction Layer) を破壊しない第 11 layer 横付け方針で全体設計

### 結果

- 1 file 起稿、 約 580 行 (markdown form、 frontmatter + 10 section)
- spec point summary 5 件:
  1. delivery_mode field を Format Bible に追加 (4 enum 値 = narrative / documentary / process / hybrid)
  2. Slidev subprocess form (Python ↔ Node 隔離 + fallback path)、 新 module = `src/presentation/`
  3. process_panel primitive 6 件 (agent_avatar / decision_node / evidence_chip / drift_diff / knot_loop_arc / timeline_lane)
  4. nokaze-design 整合 5 ruled (色 token / 書体 chain / transition cap / 禁忌 visual / disclaimer 強制)
  5. audience matrix (jun_4_months / ai_developer / general_viewer の typography scale + paraphrase 適用度)

### これからどうするか

- 本 file を § 9 review request の 4 名 (Iwa / Zen / Kagami / Kai) に board 経由で review 依頼
- 5/13 Phase 1 着手前に jun + Kai 最終 confirm 取得 (5/26 canonical switch milestone との axis 整合)
- Phase 1 期間内 (5/13 ~ 5/19) で本 patch 由来 work (§ 7) を Akari 主担当 部分 = Slidev theme + sample deck 起稿で reify
- 残 blocker 4 件 (§ 8) は 5/13 着手時に各担当者へ確認、 Aira observation log contract は Kai 5/13+ EOD target

