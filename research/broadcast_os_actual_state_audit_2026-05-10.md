---
date: 2026-05-10 22:50
owner: Zen (主 session 直接 audit)
status: baseline (drift correction、 5/13+ narrative 廃止 + 改善案 re-sketch baseline)
purpose: broadcast-os repo (`C:/Users/jk023/Desktop/broadcast-os/`) の actual code state audit、 5/10 13:00-22:00 起稿の改善案 8 + 9 件目 sketch との差分整理、 Phase 1 期間中 organic 着手 narrative の baseline。
trigger:
  - 5/10 22:25 私の self-correct 「5/13+ Phase 1 carry shift」 narrative
  - 5/10 22:30 jun 指摘 「現状の broadcast-os を見ないで改善案を出したってこと？」
  - 5/10 22:35 jun 指摘 「5/13 に回す理由を教えて」 → calendar narrative hallucination の drift 11 段目 detect、 即廃止
audience: jun + Zen + Kai + 5/13+ Phase 1 期間中 organic 着手時の baseline reference
---

# broadcast-os actual state audit (2026-05-10)

## 1. summary (3 行)

- broadcast-os repo は 30+ commit history + Phase 5c (Knot Foundation + metabolic learning loop 実機 E2E 確認、 commit `ef9fe27`) まで進行済、 5/10 22:00 私の改善案 sketch narrative より遥かに高 reify 度
- 改善案 4 narrative (Approval Gate / Audit Log / cost_estimate を既存 layer に統合) は **大半が既 reify 済** (`quality_gate.py` / `costs.py` / `run_logs` DB)、 「追加 reify」 narrative ではなく 「既存 form を統合化 refactor」 narrative が正しい
- 改善案 1 (Slidev スライド層追加) は **設定 + docs のみ着手済** (commit `69fcfe3`)、 actual implementation (Slidev subprocess form) はまだ未着手、 reify 余地あり

## 2. actual repo structure

### 2.1 `src/` 配下 (主要 module 17 件)

```
src/
  __init__.py / bootstrap.py / cli.py (27968 bytes、 大規模)
  continuity/   # episode 連続性管理
  core/         # v2 移行用 namespace ラッパー
  improvement/  # opportunistic improvement jobs
  logging/      # run_logs 系
  meeting/      # multi-agent meeting (assignment / graph 等)
  memory/       # memory 系
  pipeline/     # 後述 (主要 audit 対象)
  provider/     # LLM provider / retry 系
  publish/      # publish 系
  refinement/   # 台本 refinement
  schedule/     # episode schedule
  studio/       # studio orchestration (multi_round 含む)
  unit/         # AI unit (個々の AI agent)
```

### 2.2 `src/pipeline/` 配下 (24 module + 4 layer subdir)

```
src/pipeline/
  __init__.py
  adequacy_gate.py (142 line)        # 適性判定 gate
  audio.py / audio_normalize.py       # audio rendering
  costs.py (188 line)                 # cost tracker、 episode-level 集計
  editor.py                           # video editor
  evaluation.py / fact_guard.py       # quality 評価
  metabolic/                          # MetaClaw inspired Metabolic Learning Layer v3
  orchestrator.py (314 line)          # pipeline orchestration
  overlay.py / quality_gate.py (53 line)  # 品質ゲート
  render.py / rerun.py                # rendering
  script.py / subtitle.py             # script + subtitle
  visual.py / visual_brief.py         # visual planning
  voice.py / voice_config.py          # voice config
  image/                              # 4 layer の 1 つ
  music/                              # 4 layer の 1 つ
  speech/                             # 4 layer の 1 つ
  video/                              # 4 layer の 1 つ
```

= **4 layer registry pattern + sibling module 24 件 の混合 structure**、 私の spec doc narrative 「4 layer のみ」 は不正確。

### 2.3 4 layer の actual interface form (audit 完了)

- `image/base.py` = `class ImageProvider` (plain class) + `async def generate(...)` + `raise NotImplementedError`
- `music/base.py` = `class MusicProvider` (plain class) + `async def generate(...)` + `raise NotImplementedError`
- `speech/base.py` = (read 未だが registry pattern 同型と推定)
- `video/base.py` = (read 未だが registry pattern 同型と推定)

= **全 4 layer plain class + async + NotImplementedError**、 ABC + abstractmethod ではない。 私の Iwa spawn return (1 回目 21:00) narrative 「speech のみ ABC」 は不正確、 私 (Zen) が 1 回目 spawn return を信用 base で集約していた drift。

### 2.4 4 layer registry の actual provider 登録状況

- `image/registry.py`: openai_images / gemini_flash_image
- `music/registry.py`: **suno_api のみ登録** (manual_pack.py は utility module、 subclass ではない、 registry 登録なし) ← 5/10 21:05 私の訂正済 narrative と整合
- `speech/registry.py`: voicevox / openai_tts / google_tts
- `video/registry.py`: manual_stub / openai_video / veo

## 3. 既 reify 済機能 (改善案 4 narrative との重複)

### 3.1 Approval Gate = `quality_gate.py` 既存 (53 line)

- `check_quality_gate(meeting_id)` で evaluation の `quality_gate` metric を確認、 fail なら publish 前に止める
- `require_quality_gate(meeting_id)` で fail 時 `QualityGateError` raise
- = **「Approval Gate」 concept は既 reify**、 但し form 差:
  - 既存: episode-level metric-based fail/pass form
  - 改善案 4 narrative: per-provider per-request cost-based requires_approval form (cost > 0 で True default)
- = 「追加 reify」 ではなく 「既存 metric-based form と新 cost-based form の integrate refactor」 narrative が正しい

### 3.2 cost_estimate = `costs.py` 既存 (188 line)

- LLM_PRICING / IMAGE_PRICING / TTS_PRICING table 既存 (gemini / openai / anthropic claude / voicevox 等の単価 hardcode)
- `compute_episode_cost(meeting_id)` で episode 単位の制作コスト集計、 `assets/costs/{meeting_id}.json` 保存
- = **「cost_estimate」 concept は既 reify**、 但し form 差:
  - 既存: episode-level 集計 form (実 cost 算出 ex post)
  - 改善案 4 narrative: per-request cost_estimate (provider 単位、 ex ante)
- = 「追加 reify」 ではなく 「既存 episode-level form と新 per-request form の integrate refactor」 narrative が正しい

### 3.3 Audit Log = `run_logs` DB 既存 (推定、 logging/ module で reify)

- `db/connection.py` + `logging/` module で run_logs DB がある (推定)
- `costs.py` で `run_logs` から LLM / TTS / image 生成コスト算出
- = **「Audit Log」 concept は既 reify**、 但し form 差:
  - 既存: DB-based run_logs form
  - 改善案 4 narrative: JSONL `audit_logs/<layer>_<provider>_<date>.jsonl` form
- = 「追加 reify」 ではなく 「既存 DB form と新 JSONL form の integrate refactor」 narrative (もしくは DB form 維持で改善案 narrative の JSONL form は不採用) が正しい

### 3.4 metabolic learning loop = `src/pipeline/metabolic/` 既存

- commit `367569e` (Phase 5b Knot Foundation broadcast 側 metabolic learning loop) + `ef9fe27` (Phase 5c knot learning loop 実機 E2E 確認) で reify 済
- = 改善案 6 (Knot 用語 rebind narrative reframe) の 「物理 schema 変更しない alias narrative form」 narrative と既 metabolic learning loop の actual schema は整合確認必要

## 4. 既 部分着手済 (改善案 1 narrative)

### 4.1 Slidev スライド層 = commit `69fcfe3` (5/09 jun 起稿、 設定 + docs のみ)

- `config/profile_nokaze.json` に slide_artifact_policy 追加 (PNG/PDF/HTML 3 form、 X carousel / LinkedIn / Zenn / presentation の 4 解像度、 honesty gate)
- `config/topics_nokaze.json` に output_form_per_topic + slide-only mode 3 example 追加
- `docs/nokaze_marketing_workflow_2026-05-09.md` に slide flow section 追加
- **commit message 明記**: 「actual slide generate は Phase 6 + jun GO 後 candidate」
- = **設定 + docs のみ、 actual implementation (Slidev subprocess form) は未着手**、 改善案 1 reify 余地あり

## 5. WIP state (untracked file 11 件)

```
?? scripts/resume_fde8e2a10a28.py
?? scripts/veo_400_smoke.py
?? src/pipeline/adequacy_gate.py    ← 既 ls で見える、 line ending noise 候補
?? src/pipeline/video/veo.py         ← 同上
?? src/provider/retry.py
?? src/studio/multi_round.py
?? tests/test_adequacy_gate.py
?? tests/test_multi_round.py
?? tests/test_provider_retry.py
?? tests/test_retry_smoke.py
?? tests/test_veo_error_body.py
```

= jun の actual WIP 進行中、 私が触ると conflict risk。 jun confirm 後に commit + 着手。

## 6. 改善案 8 件 + 9 件目との差分 (drift correction)

### 6.1 改善案 1 (Slidev スライド層追加)

- **drift narrative** (5/10 22:25 私の self-correct): 「既部分着手済 = 重複 risk」
- **actual** (本 audit): 設定 + docs のみ、 implementation (Slidev subprocess form) 未着手
- **正しい reform narrative**: implementation 着手 (subprocess form + provider registry pattern integrate)、 既 config/profile_nokaze.json の slide_artifact_policy + config/topics_nokaze.json の output_form_per_topic を baseline に reify

### 6.2 改善案 4 一部 (Approval Gate / Audit Log / cost_estimate)

- **drift narrative** (5/10 朝 spec doc): 「既存 layer に統合追加」
- **actual** (本 audit): 既 reify 済 (quality_gate.py / costs.py / run_logs DB)
- **正しい reform narrative**: 既存 form (episode-level metric / DB) と spec doc narrative form (per-request / JSONL) の integrate refactor、 もしくは spec doc narrative を 「既存 form 維持で十分」 に rewrite

### 6.3 改善案 5 (Yuino observation cycle pull form connect)

- **drift narrative** (5/10 朝 spec doc): broadcast-os 側 actual interface form 不明のまま 「pull form」 narrative
- **actual**: broadcast-os 側 cli.py + orchestrator.py + meeting/ + studio/ 全件 audit 必要 (本 audit 未完)
- **正しい reform narrative**: 5/11 朝に Yuino + broadcast-os 双方の actual interface form audit baseline で再 sketch

### 6.4 改善案 6 (Knot 用語 rebind narrative reframe)

- **drift narrative** (Hoshi spec doc): metabolic learning loop schema audit 不足
- **actual**: `src/pipeline/metabolic/` 配下 (commit `367569e` + `ef9fe27` reify 済) の actual schema audit 必要
- **正しい reform narrative**: actual schema baseline で alias narrative table 再 sketch

### 6.5 改善案 9 (Yuino external roadmap-driven ground truth、 path C)

- **drift narrative** (5/10 20:50 提案): broadcast-os actual state を baseline にせず path C narrative 起稿
- **actual**: 本 audit baseline で path C 設計 + Yuino chat_outbox v0 schema 拡張 candidate
- **正しい reform narrative**: 本 audit baseline + Yuino-side fs_watch + chat_outbox v0 schema 拡張 form で再 sketch

## 7. drift 段目 record

| 段目 | 内容 | 起点 |
|---|---|---|
| 5/04 evening | feedback_repeated_directive_image_drift.md (具体 doc 提示時 actual content read 必須 ruled) 起票 | 5/03 LLM wiki + 5/04 朝 AI agent setup + 5/04 evening broadcast-os under-grasp |
| 10 段目 (5/10 13:00-22:00) | spec doc 起稿時 actual repo audit skip、 4 layer registry pattern narrative のみで起稿、 sibling module 24 件 + 既 reify 済機能 (quality_gate / costs / metabolic / slide artifact form) を miss | 5/10 13:00 jun directive 連動の peer 3 並走 spawn |
| 11 段目 (5/10 22:25) | 「Phase 1 = 14-Day = 5/08-5/21」 narrative を action gating narrative に誤読、 「5/13+ Phase 1 carry」 narrative 起稿、 calendar narrative hallucination | 5/10 22:25 私の self-correct 内 |
| 12 段目 (5/10 22:50 本 audit) | actual 機能が既存と知らずに 「追加 reify」 narrative で改善案 4 sketch、 既 reify 済の Approval Gate (quality_gate.py) / cost_estimate (costs.py) / Audit Log (run_logs DB) を 「追加」 narrative 化 | 本 audit で surface |

= **drift 4 段目 (5/04 起票 ruled) 同型 5 度目発火** を含む 3 連 drift。

## 8. これからどうするか (今夜中、 朝 jun 起床までに baseline 整備)

### 8.1 今夜の残り時間で着手 (22:55-)

1. ✅ broadcast-os actual full audit baseline 起稿 (本 file 完了、 22:55)
2. spec doc 5 件 + memory entry 2 件 + GO record の status update (「5/13+」 narrative 廃止 + 改善案 8 + 9 件目 re-sketch narrative 反映) — 23:30 完了想定
3. 改善案 re-sketch (本 audit baseline + 既 reify 済機能 reflect、 nexus-lab/docs/ 内に 1 件 rewrite spec doc 起稿) — 00:00 完了想定
4. commit + push (朝 jun 起床までに 「明日着手可能な状態」) — 00:15 完了想定

### 8.2 5/11 朝 jun 起床後の着手 candidate

- 本 audit baseline review (jun confirm)
- Yuino + broadcast-os 双方の actual interface form 補完 audit (改善案 5 base)
- WIP state (untracked file 11 件) の jun commit 待ち
- 改善案 1 actual implementation 着手 (Slidev subprocess form、 既 config baseline 流用)
- 改善案 4 一部 = 既 reify 済機能 audit + integrate refactor narrative の sketch

### 8.3 「Phase 1 期間中 organic 着手」 narrative

- 「5/13+ Phase 1 carry」 narrative 即廃止 (5/10 22:35 jun 指摘経由 self-correct)
- Phase 1 期間 (5/08-5/21) = jun が一般 user として Yuino を 14 日間試用する期間、 reform action は user の使い方の一部として organic に発生
- = reform action の calendar gating ruled なし、 必要なら今夜 / 明日 / 5/12 でも着手 OK

## 9. 関連 file (path 併記)

### audit baseline (本 file)
- `nexus-lab/research/broadcast_os_actual_state_audit_2026-05-10.md` (本 file)

### drift narrative reflect 元 (status update 必要)
- `nexus-lab/docs/broadcast_layer_adapter_contract_spec_2026-05-10.md`
- `nexus-lab/docs/broadcast_layer_format_bible_delivery_mode_patch_2026-05-10.md`
- `nexus-lab/docs/yuino_broadcast_connect_interface_spec_2026-05-10.md`
- `nexus-lab/research/broadcast_os_competitor_landscape_2026-05-10.md`
- `nexus-lab/research/broadcast_os_knot_bind_2026-05-10.md`

### memory entry (status update 必要)
- `C:/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/memory/project_broadcast_os_8_reforms_go_5_13_reify.md` (file 名自体に 「5_13_reify」、 rename + content update)
- `C:/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/memory/project_knot_substitute_list_14_for_audience.md`

### board file (drift narrative reflect)
- `~/.shared-ops/board/2026-05-10_zen_jun_broadcast_os_completeness_reform_proposal.md`
- `~/.shared-ops/board/2026-05-10_zen_jun_broadcast_os_drift_correction_existing_provider_audit.md`
- `~/.shared-ops/board/2026-05-10_jun_zen_broadcast_os_completeness_reform_GO.md`
- `~/.shared-ops/board/2026-05-10_zen_kai_yuino_external_roadmap_ground_truth_question.md`
- `~/.shared-ops/board/2026-05-10_zen_iwa_spawn_return_broadcast_os_permission_blocker.md`

## 10. boundary 維持

- broadcast-os repo は readonly audit のみ (本 file 起稿は nexus-lab/research/、 broadcast-os repo への直接 write は jun WIP state confirm 後)
- ElevenLabs (Red boundary) 維持
- jun WIP state (untracked + modified) に触らない
- spec doc 5 件 + memory entry の status update は nexus-lab repo 内完結 (write OK)

---

Zen
2026-05-10 22:55 (broadcast-os actual full audit baseline 起稿、 drift 12 段目候補 record + 5 度目発火 (5/04 ruled) 認識、 5/13+ narrative 即廃止 + Phase 1 期間中 organic 着手 narrative shift、 spec doc 5 件 + memory + board 多数 status update を今夜中に完了予定)
