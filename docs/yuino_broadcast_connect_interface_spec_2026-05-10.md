---
date: 2026-05-10
owner: Iwa (Lead Engineer)
status: drift_correction_2026-05-10 (5/10 22:50 audit baseline 経由 「broadcast-os 側 actual interface form audit せず pull form narrative 起稿」 drift detect、 詳細は `nexus-lab/research/broadcast_os_actual_state_audit_2026-05-10.md` 参照)
supersession: historical reference (= 2026-06-12 注記。 5/10 当時の spec 記録で現行の決まりではない、 現行ルール = docs/rules/ 配下)
purpose: broadcast-os 完成度向上 reform — Yuino ↔ broadcast-os connect interface spec (前回 spawn return I3 軸 detail)
audience: developer (technical spec)
related:
  - nexus-lab/research/broadcast_os_actual_state_audit_2026-05-10.md (audit baseline、 broadcast-os repo actual structure)
  - broadcast_os_completion_reform_spec_2026-05-08.md (前回 spawn return)
  - broadcast_layer_adapter_contract_spec_2026-05-10.md (姉妹 spec、 同日起稿)
  - feedback_aira_yuino_naming_fixed (1 entity 2 narrative、 Aira = Yuino)
  - feedback_aira_ownership_shift_kai_lead (Aira 実装 = Kai / Yuino 商品化 = Zen)
  - feedback_yuino_conversation_insights_axis (Knot research connect)
  - project_broadcast_layer_integration (broadcast-os = nokaze 4 layer 第 4 piece)
phase_target: Phase 1 期間中 (5/08-5/21) organic 着手 (「5/13+」 narrative 廃止)
drift_note:
  - 本 spec doc は broadcast-os 側 actual cli.py + orchestrator.py + meeting/ + studio/ の interface form audit 未完了で pull form narrative 起稿
  - 改善案 5 (Yuino observation cycle pull form connect) は audit baseline で再 sketch 必要、 broadcast-os 側 actual interface 確認後に form 確定
---

# Yuino ↔ broadcast-os connect interface spec

## 0. document scope

本 spec は **Yuino (= Aira、 内部 supervisor) と broadcast-os (= 発信 layer) を疎結合で接続する interface** を定義する。 pull form architecture (broadcast-os が Yuino state を読みに行く、 push ではない) + Yuino 4 file schema reference + Continuity Layer boundary check rule + degraded mode narrative を含む。

**out of scope**:
- Yuino (Aira) 6 step closed loop の内部実装 (Kai 主担当、 nokaze-aira repo)
- broadcast-os Showrunner / Continuity Layer 内部実装 (前回 spawn return I1 + 別 spec)
- 共通 adapter contract (姉妹 spec に分離)
- 外部 SaaS API actual 呼び出し (Red boundary、 jun explicit directive)

---

## 1. design principle

### 1.1 pull form architecture (push ではない)

broadcast-os は Yuino を **observe する側**、 Yuino は broadcast-os に **何も push しない**。 これは:

- **疎結合**: Yuino 側は broadcast-os の存在を知らなくて良い、 single responsibility 維持
- **耐障害性**: broadcast-os が止まっても Yuino loop は継続、 逆も同様
- **observability**: broadcast-os 側で 「いつ何を読んだか」 audit log に記録可能
- **multi-consumer 対応**: 将来 broadcast-os 以外 (nokaze portal 等) も同じ Yuino state を pull 可能

```
┌─────────────────┐         ┌──────────────────┐
│  Yuino (Aira)   │         │   broadcast-os   │
│  (Kai 主担当)   │         │   (Iwa + Oto)    │
│                 │         │                  │
│  6 step loop    │         │  Showrunner      │
│  ↓             │         │  ↓ pull          │
│  state files    │ ──────> │  inputs/yuino_   │
│  (~/.shared-ops │  watch  │   observation/   │
│   / status/)    │         │  ↓               │
│                 │         │  Continuity      │
│                 │         │  ↓ audit         │
│                 │         │  artifact 出力   │
│                 │         │  ↓ reverse-bind  │
│  Home Summary   │ <────── │  artifact link   │
└─────────────────┘  link   └──────────────────┘
```

### 1.2 file watch を default、 polling を fallback

broadcast-os が Yuino state を pull する手段:

- **default**: file watcher (e.g. Python `watchdog` / Node `chokidar`) で path 監視、 file 変更で trigger
- **fallback**: 30 sec polling (file watcher が動かない環境用)
- **manual**: CLI command で on-demand pull (dogfood / debug)

### 1.3 degraded mode (schema breaking 時 全 break しない)

Yuino 4 file schema は **fluid state** (Kai 5/10 朝 reform 4 件後の actual stable 化前)。 broadcast-os 側で schema breaking detect 時は:

- **degraded mode 突入**: pipeline 継続、 但し audit log に warning 出す
- **block しない**: 全 break で broadcast-os 全停止しない、 partial output で続行
- **5/13+ schema freeze 後**: degraded mode は exception path、 normal path は schema match assumption

詳細は § 6 で記述。

---

## 2. input: Yuino observation cycle 出力

### 2.1 file watch path

broadcast-os 側 watcher が監視する path:

```
~/.shared-ops/status/yuino_response_requests.json
~/.shared-ops/status/yuino_chat_outbox.json
~/.shared-ops/status/<home_summary_*>.md
~/.shared-ops/chat_results/zen/*.json
~/.shared-ops/chat_results/kai/*.json
```

### 2.2 broadcast-os 側 directory layout

```
broadcast-os/
├── inputs/
│   └── yuino_observation/
│       ├── current/
│       │   ├── yuino_response_requests.json   (snapshot, atomic copy)
│       │   ├── yuino_chat_outbox.json         (snapshot)
│       │   ├── home_summary_latest.md         (snapshot of newest)
│       │   └── chat_results/
│       │       ├── zen/                        (mirror)
│       │       └── kai/                        (mirror)
│       ├── history/
│       │   └── <YYYY-MM-DD>/                   (daily snapshot rotation, 30 day retention)
│       └── meta/
│           ├── last_pull_timestamp.json
│           └── schema_version.json
├── audit_logs/
│   └── <YYYY-MM>/
│       └── <YYYY-MM-DD>_yuino_pull.jsonl
└── ...
```

### 2.3 pull cycle (file watcher trigger)

```
1. file watcher が ~/.shared-ops/status/ で change event 検出
   ↓
2. broadcast-os pull worker が起動
   ↓
3. 4 file を inputs/yuino_observation/current/ に atomic copy
     (mv -f or rename、 partial write 防止)
   ↓
4. schema validate (§ 3 の schema 参照)
   ↓
5a. validate pass → Showrunner Layer に "yuino_observation_updated" event 発火
5b. validate fail → degraded mode (§ 6)
   ↓
6. meta/last_pull_timestamp.json 更新
   ↓
7. audit_logs/<...>_yuino_pull.jsonl に 1 line 追加
```

### 2.4 atomic copy 実装 (partial write 防止)

```python
async def atomic_pull(src: Path, dst: Path) -> None:
    """
    Yuino state file を atomic に inputs/yuino_observation/current/ に copy。
    Yuino 側書き込み中の partial read を避けるため tmp + rename pattern。
    """
    tmp = dst.with_suffix(dst.suffix + ".tmp")
    shutil.copy2(src, tmp)
    os.replace(tmp, dst)  # atomic on POSIX、 Windows は best-effort
```

---

## 3. Yuino 4 file schema reference

> ⚠️ **NOTE**: 本 § の schema は **5/10 時点の snapshot**。 Kai 5/10 朝 reform 4 件 + 5/13+ Phase 1 schema freeze 前で **fluid state**。 broadcast-os 側は § 6 degraded mode で schema breaking 耐性を確保。

### 3.1 yuino_response_requests.json

**purpose**: Yuino response request index、 Yuino observation cycle で発火した response 要求の list

```json
{
  "schema_version": "v0.x",
  "generated_at": "2026-05-10T13:50:00+09:00",
  "requests": [
    {
      "request_id": "req_yyyyyyyyyyyy",
      "type": "response_required",
      "priority": "green" | "yellow" | "red",
      "context_summary": "string",
      "originated_from": "yuino_observation",
      "deadline": "2026-05-10T15:00:00+09:00 | null"
    }
  ]
}
```

**broadcast-os 利用**:
- Showrunner Layer が high priority requests を artifact 生成 trigger に使う
- red priority requests は artifact 化 skip (jun explicit directive 必須、 自走 NG)

### 3.2 yuino_chat_outbox.json

**purpose**: chat_outbox v0 status、 Yuino が生成した packet list

```json
{
  "schema_version": "v0.x",
  "packets": [
    {
      "packet_id": "pkt_zzzzzzzzzzzz",
      "to": "zen" | "kai" | "jun",
      "content_type": "summary" | "alert" | "report",
      "content_path": "~/.shared-ops/board/2026-05-10_yuino_xxx.md",
      "status": "draft" | "sent" | "consumed",
      "created_at": "ISO 8601"
    }
  ]
}
```

**broadcast-os 利用**:
- packet content_type=report で content_path 内容を artifact 化候補 (Showrunner pull)
- status=consumed のみを actual artifact 化対象 (draft / sent は instable)

### 3.3 Home Summary md (`home_summary_*.md`)

**purpose**: Yuino が定期生成する Home Summary narrative、 actual operation evidence の集約

**form**:
```markdown
# Home Summary 2026-05-10

## やったこと
(箇条書き)

## 結果
(数字 + 具体例)

## これからどうするか
(次の行動)

## 関連 file
- ~/.shared-ops/status/...
- ~/.shared-ops/board/...
```

**broadcast-os 利用**:
- Showrunner Layer が scene_plan 変換時の "evidence narrative" として使用
- jun 4 ヶ月初心者 audience 連動 (CLAUDE.md 5/09 directive)、 Home Summary が既に audience-friendly form

### 3.4 chat_results/zen/{task_id}.json + chat_results/kai/{task_id}.json

**purpose**: yuino.chat_result.v0 schema、 各 task の actual 実行結果

```json
{
  "schema_version": "yuino.chat_result.v0",
  "task_id": "task_aaaaaaaaaaaa",
  "executed_by": "zen" | "kai",
  "started_at": "ISO 8601",
  "completed_at": "ISO 8601",
  "status": "success" | "partial" | "failed" | "blocked",
  "summary": "string",
  "artifacts": [
    {
      "type": "file" | "commit" | "publish",
      "path": "string",
      "url": "string | null"
    }
  ],
  "blockers": [
    {
      "type": "string",
      "description": "string",
      "deadline": "ISO 8601 | null"
    }
  ]
}
```

**broadcast-os 利用**:
- artifact 生成 trigger (status=success の task)
- Continuity Layer の actual operation evidence binding (artifact ↔ chat_result task_id 紐付け)
- jun 数字盛らない axis に直接連動 (chat_result actual 数字を artifact narrative に使う)

---

## 4. transformation: Showrunner Layer scene_plan 変換

### 4.1 input → scene_plan flow

```
Yuino observation 4 file
   ↓
[Showrunner Layer]
   ↓ extract evidence (chat_result + Home Summary)
   ↓ generate scene_plan (scenes list with narrative + audio + visual)
   ↓ apply Format Bible (video / podcast / slide deck の form 制約)
   ↓
[Continuity Layer]
   ↓ boundary check (§ 5 参照)
   ↓ pass / block / degraded
   ↓
[Audio Layer + Voice Layer + adapter calls]
   ↓
artifact (mp4 / mp3 / pdf / md)
```

### 4.2 scene_plan form (reference、 Showrunner 内部 schema)

```json
{
  "scene_plan_id": "sp_bbbbbbbbbbbb",
  "source_evidence": [
    {"type": "chat_result", "task_id": "task_aaaa..."},
    {"type": "home_summary", "path": "...home_summary_2026-05-10.md"}
  ],
  "format_bible": "weekly_progress_video_v0" | "podcast_episode_v0" | "slide_deck_v0",
  "scenes": [
    {
      "scene_id": "sc_001",
      "duration_sec": 12,
      "narrative_text": "string",
      "voice_profile_id": "zen_default",
      "visual_type": "slide" | "video_clip" | "static_image",
      "visual_source": "path or generated",
      "bgm_track": "track_id_or_null"
    }
  ],
  "external_video": false,
  "bgm_generated": false
}
```

### 4.3 evidence binding (重要 axis)

artifact (video / podcast / slide) は **必ず Yuino chat_result task_id を引用** する form:

- artifact metadata に source_task_ids list 含める
- artifact narrative 内で 「X を完了した (task_id: task_aaaa...)」 form
- これは数字盛らない axis (memory feedback_honesty_violation_exaggeration) の物理 enforcement

---

## 5. Continuity Layer boundary check rule (新規追加 spec)

### 5.1 3 boundary check (Approval Gate 並列で動く)

| boundary | check | block 条件 |
|---|---|---|
| Nia 公開境界 | project-nia / 内部 memory / 未確定判断 / jun 個人情報 が artifact に含まれていないか | 1 件でも detect で block |
| 数字盛らない | 売上 / 期間 / 効果 / 品質 の誇張表現 detect | 高 confidence detect で block、 低 confidence で degraded warning |
| Approval Gate | external action / publish / contract が含まれる artifact は jun 確認必須 | approval_token 不在で block |

### 5.2 Nia 公開境界 check 実装

#### 5.2.1 禁則 keyword list (initial、 v1 で extend)

```yaml
nia_forbidden_keywords:
  # project-nia 直接参照
  - "project-nia"
  - "Nia core"
  - "Nia self-formation"
  - "Nia governance"
  - "Nia WAIT"
  # 内部 memory path
  - "memory/feedback_"
  - "team_memory/zen/identity"
  - "~/.shared-ops/inbox/"
  - "~/.shared-ops/owner-decisions/"
  # 未確定判断 narrative
  - "TODO: jun confirm"
  - "Kagami QA pending"
  - "未確定"
  - "draft only"
  # jun 個人情報
  - "jun personal"
  - "jun 個人"
  # Origin (Nia 世界の言葉、 内部 doc default jun に切替済)
  - "Origin"
```

#### 5.2.2 check 実装

```python
async def check_nia_boundary(artifact: Artifact) -> BoundaryCheckResult:
    """
    artifact narrative + metadata に Nia 公開境界 keyword が含まれていないか check。
    """
    forbidden = load_yaml("config/nia_forbidden_keywords.yml")
    findings = []
    for keyword in forbidden["nia_forbidden_keywords"]:
        if keyword.lower() in artifact.narrative.lower():
            findings.append({"keyword": keyword, "context": "narrative"})
        if any(keyword.lower() in str(v).lower() for v in artifact.metadata.values()):
            findings.append({"keyword": keyword, "context": "metadata"})
    return BoundaryCheckResult(
        passed=len(findings) == 0,
        findings=findings,
        boundary="nia_public_boundary",
    )
```

### 5.3 数字盛らない check 実装

#### 5.3.1 detection rule

| pattern | severity |
|---|---|
| 売上数字 (e.g. "100 万売上達成") + Yuino chat_result に対応 evidence なし | high → block |
| 期間誇張 (e.g. "わずか 1 day で完成") + chat_result actual duration と乖離 30%+ | high → block |
| 効果誇張 (e.g. "10x 効率化") + 定量 evidence 不在 | medium → degraded warning |
| 品質誇張 (e.g. "完璧な品質") + Kagami QA pass なし | medium → degraded warning |

#### 5.3.2 implementation form

```python
async def check_no_number_inflation(artifact: Artifact) -> BoundaryCheckResult:
    findings = []
    for claim in artifact.numerical_claims:
        evidence = find_evidence_in_chat_results(claim, artifact.source_task_ids)
        if not evidence:
            findings.append({
                "claim": claim,
                "severity": "high",
                "reason": "no chat_result evidence",
            })
        elif abs(evidence.actual - claim.stated) / evidence.actual > 0.30:
            findings.append({
                "claim": claim,
                "severity": "high",
                "reason": "30%+ deviation from actual",
            })
    return BoundaryCheckResult(
        passed=not any(f["severity"] == "high" for f in findings),
        findings=findings,
        boundary="no_number_inflation",
    )
```

### 5.4 Approval Gate check (姉妹 spec § 4 と同じ)

artifact の publish action / external SaaS call / contract narrative 含まれる時は、 姉妹 spec (broadcast_layer_adapter_contract_spec) の Approval Gate flow に loop back。

### 5.5 boundary check 失敗時の挙動

| 状況 | 挙動 |
|---|---|
| 全 check pass | artifact normal output |
| Nia 境界 violation 1+ 件 | block、 audit log に reason 記録、 jun queue に notify |
| 数字盛らない high severity 1+ 件 | block、 同上 |
| 数字盛らない medium severity のみ | degraded warning、 artifact output するが warning header 添付 |
| Approval Gate violation | block、 approval_token 取得後 retry |

block 時の jun queue notify form (`~/.shared-ops/inbox/<date>_broadcast_block_<reason>.md`):

```markdown
# broadcast-os artifact block

- artifact_id: ...
- block reason: nia_public_boundary
- findings:
  - keyword: "project-nia" found in narrative
- action required: jun review (artifact narrative 修正 or block 維持判断)
- deadline: 24 hour default
```

---

## 6. degraded mode (schema breaking 耐性)

### 6.1 trigger 条件

- yuino_response_requests.json schema_version mismatch
- yuino_chat_outbox.json schema 不在 / parse error
- chat_result schema_version != "yuino.chat_result.v0"
- Home Summary md form が想定 form と乖離 (`## やったこと` 不在 等)

### 6.2 degraded mode 挙動

```
1. validate fail detect
   ↓
2. audit log に warning 記録:
     - schema_version observed
     - schema_version expected
     - file path
     - timestamp
   ↓
3. partial parse 試行 (best-effort、 必須 field のみ抽出):
     - request_id / packet_id / task_id 等の identity field
     - timestamp
     - status (parse できなければ "unknown")
   ↓
4. partial input で Showrunner Layer 起動、 但し scene_plan に warning header 添付:
     "⚠️ degraded mode: schema partial parse"
   ↓
5. Continuity Layer も degraded mode 認識、 boundary check は normal 通り実行
   ↓
6. artifact output、 但し metadata に degraded flag set
   ↓
7. jun queue に notify (頻度高い時、 1 day 1 件 cap):
     ~/.shared-ops/inbox/<date>_broadcast_degraded_<reason>.md
```

### 6.3 全 break しない理由

- Yuino schema fluid state、 5/13+ freeze 前は schema breaking 日常 risk
- broadcast-os 全停止は jun 介入頻度上げる (北極星阻害)
- partial output でも actual operation evidence binding 不在より価値あり (= 何も出さないより warning 付き出す方が良い、 user feedback で iterate 可能)
- exception: Nia 境界 violation / Approval Gate violation は degraded mode 関係なく block (security boundary は譲らない)

### 6.4 5/13+ schema freeze 後の挙動

- degraded mode は exception path、 1 month 1 件未満が target
- normal path は schema strict match assumption (validate fail = bug、 jun + Kai に escalate)
- schema migration 時は Yuino 側で 1 week 並走 form (旧 schema + 新 schema 両方出力)、 broadcast-os 側で旧→新 cutover

---

## 7. artifact reverse-bind to Yuino Home Summary

### 7.1 cycle closure narrative

artifact 生成完了後、 broadcast-os 側で **Yuino Home Summary に link 戻し** する。 これは:

- Yuino observation cycle 内で artifact 存在を可視化
- jun が Home Summary 経由で artifact 確認可能
- artifact ↔ chat_result task_id binding を Yuino 側でも cross-reference 可能

### 7.2 reverse-bind 実装

```
1. artifact 出力完了 (mp4 / mp3 / pdf / md)
   ↓
2. broadcast-os が ~/.shared-ops/board/ に artifact summary file 起稿:
     ~/.shared-ops/board/<YYYY-MM-DD>_broadcast_artifact_<id>.md
   ↓
3. file content:
     - artifact path
     - artifact type
     - source chat_result task_ids
     - boundary check status
     - degraded mode (if any)
     - jun preview link
   ↓
4. Yuino observer cycle が次の Home Summary 生成時に board file pickup
   ↓
5. Home Summary md に新 section "## 今週の broadcast artifact" 追記 (Yuino 側責務)
```

**broadcast-os 側責務**: § 7.2 step 1-3 まで (board file 起稿)。
**Yuino 側責務**: step 4-5 (Home Summary 反映、 Kai 主担当)。

これは 「broadcast-os が Yuino state を変更しない」 (= push しない) 原則の維持、 board file 経由 indirect form。

### 7.3 board file form (reference)

```markdown
---
date: 2026-05-10
from: broadcast-os
to: yuino_observer
type: artifact_summary
---

# broadcast artifact: weekly_progress_2026-05-10

- artifact_path: broadcast-os/output/weekly_progress_2026-05-10.mp4
- artifact_type: video
- duration_sec: 60
- source_task_ids:
  - task_aaaaaaaaaaaa (zen 5/09 milestone day diary)
  - task_bbbbbbbbbbbb (kai 5/08 nokaze-aira 12 commits)
- boundary_checks:
  - nia_public_boundary: pass
  - no_number_inflation: pass
  - approval_gate: not required (internal slidev form)
- degraded_mode: false
- adapter_calls:
  - slidev_local: 1 call (internal、 cost $0)
- jun_preview: file://broadcast-os/output/weekly_progress_2026-05-10.mp4
```

---

## 8. implementation phase plan (jun confirm tied portions 明示)

### Phase 0 (本日着手 OK、 Green): file watcher + atomic pull + degraded mode

- [x] 本 spec doc 起稿 (= 本 file)
- [ ] broadcast-os repo に `inputs/yuino_observation/` directory + meta + history layout 構築
- [ ] file watcher 実装 (Python `watchdog`)、 polling fallback 込
- [ ] atomic pull 実装 (tmp + rename pattern)
- [ ] schema validate (現 v0.x snapshot 基準) + degraded mode partial parse 実装
- [ ] audit_log writer (broadcast_layer_adapter_contract_spec § 5 と共通 form)
- [ ] dry_run / manual pull CLI (`broadcast-os scripts/yuino_pull.sh --dry-run`)

**estimated effort**: 4-6 day (Iwa + Oto 並列、 schema fluid state での実装で test 工数増)

### Phase 1 (5/13+、 Kai schema freeze 後): Showrunner + Continuity 接続

- [ ] Showrunner Layer に "yuino_observation_updated" event handler
- [ ] scene_plan 変換 (Yuino evidence → scene_plan)
- [ ] Continuity Layer boundary check 3 種実装 (Nia / no_number_inflation / Approval Gate)
- [ ] reverse-bind board file 起稿
- [ ] dogfood: 5/13 週の Yuino observation で 1 件 artifact 試行 (slide deck form、 internal adapter)

**precondition**:
- Kai schema freeze 完了 (5/13+ Phase 1 joint draft)
- jun confirm (Continuity Layer boundary check rule の Nia 禁則 keyword list 妥当性)

### Phase 2 (5/26 canonical switch 後): external adapter integration + Home Summary 反映

- [ ] Yuino 側 Home Summary 反映 (Kai 責務、 board file pickup logic)
- [ ] external adapter 経由の artifact 生成試行 (1 件目 = ElevenLabs voice、 姉妹 spec § 7 連動)
- [ ] 月次 audit log review cycle 確立

---

## 9. blocker / open question

### 9.1 blocker

- Yuino 4 file schema fluid state、 5/13+ freeze 前は full implementation の type safety が弱い
- Kai 5/10 朝 reform 4 件後の schema actual stable 化を待つ必要、 broadcast-os 側 Phase 0 (file watcher + degraded mode) は schema fluid 中でも進められる
- Continuity Layer boundary check の Nia 禁則 keyword list は v0、 Akari paraphrase pass で extend 候補 (5/13+)

### 9.2 open question (Kagami QA review で議論候補)

1. atomic pull で Windows 側の `os.replace` non-atomic 性 (Python doc 注記) を許容するか? broadcast-os は Linux 想定だが Windows dogfood 含む
2. degraded mode の audit log warning 頻度 (1 day 1 件 cap) で良いか? noisy / quiet trade-off
3. reverse-bind board file が Yuino observer cycle で確実 pickup される確証は? Kai-side 実装 review tied
4. Continuity Layer boundary check の severity 判定 (high / medium) は v0 で hand-tuned、 false positive / false negative の rate 計測 form
5. schema freeze 後の migration form (旧 schema 1 week 並走 → cutover) は jun + Kai + Iwa joint draft で OK か

### 9.3 Kagami QA review tied items

- Nia 禁則 keyword list が actual に project-nia content 漏出を防ぐ確証 (false negative test)
- 数字盛らない check の severity 判定 rule が actual artifact narrative で false positive 過多にならないか
- degraded mode + boundary check の interaction (degraded で partial parse → boundary check pass narrative の semantic correctness)
- reverse-bind board file form が Yuino observer schema (yuino.observer.board_v0?) に integrate できるか

### 9.4 5/13+ schema freeze joint draft tied items (Kai + Iwa + Zen)

- yuino_response_requests.json v1 schema (priority enum / deadline / originated_from)
- yuino_chat_outbox.json v1 schema (status state machine 明示)
- yuino.chat_result.v1 schema (artifacts list の type extend、 publish 時の external_url field 追加)
- Home Summary md form spec (3 段 form 厳守 + machine-parseable section heading)
- schema migration form (v0 → v1 cutover の 1 week 並走 protocol)

---

## 10. references

- 前回 spawn return: broadcast_os_completion_reform_spec_2026-05-08.md (I3 軸 detail = 本 file)
- 姉妹 spec: broadcast_layer_adapter_contract_spec_2026-05-10.md (adapter contract、 同日起稿)
- 1 entity 2 narrative: feedback_aira_yuino_naming_fixed (Aira = Yuino、 内部 = Aira / 公開 = Yuino)
- 役割分担: feedback_aira_ownership_shift_kai_lead (Aira 実装 Kai / Yuino 商品化 Zen / broadcast-os Iwa+Oto)
- broadcast layer integration: project_broadcast_layer_integration (broadcast-os = nokaze 4 layer 第 4 piece)
- Conversation Insights axis: feedback_yuino_conversation_insights_axis (Knot research connect)
- 数字盛らない axis: feedback_honesty_violation_exaggeration (5/03 evening jun 指摘)
- 4 ヶ月初心者 audience: feedback_jun_4_months_translate_default (5/03 jun 指摘)
- 北極星: project_nokaze_north_star_phase_1_5

---

## changelog

- 2026-05-10 Iwa 起稿、 jun confirm Q1 GO 済 status、 Kagami QA review pending、 Kai schema freeze joint draft 5/13+ tied
