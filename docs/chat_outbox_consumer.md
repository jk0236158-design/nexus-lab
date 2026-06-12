# Chat Outbox Consumer (Zen-side)

Yuino chat_outbox/zen v0 の Zen-side consumer reify。 Kai-side が起稿した chat_outbox packet (任意の board response task) を 5 status (pending / in_progress / completed / blocked / skipped) で消費する narrow path。

## Contract Reference

- 完了報告 (Kai-side): `~/.shared-ops/board/2026-05-09_kai_zen_chat_outbox_v0_implementation_complete.md`
- packet schema (state side): `~/.shared-ops/board/2026-05-09_kai_zen_chat_outbox_v0_implementation_complete.md` 参照 (v0 schema は同 board に含む)
- Kai-side 実装: `nokaze-aira/src/yuino-chat-outbox.ts` + `src/_internal/yuino-chat-ids.ts`

連動 (Zen-side):

- `scripts/zen_wake_queue_consume.sh` = Controlled Wake v0 consumer (別 lockfile で並走)
- `scripts/zen_chat_outbox_dry_run.sh` = end-to-end dry run

## Source Of Truth

| 種別 | path |
|---|---|
| 入力 (packet file) | `~/.shared-ops/chat_outbox/zen/{task_id}.md` (YAML frontmatter + body) |
| 入力 (Kai-side status snapshot) | `~/.shared-ops/status/yuino_chat_outbox.json` |
| 出力 (result marker) | `~/.shared-ops/chat_results/zen/{task_id}.json` |
| 出力 (board response、 任意) | `~/.shared-ops/board/<date>_zen_kai_response_<slug>.md` |
| lockfile | `~/.shared-ops/locks/zen-chat-outbox.lock.json` |
| audit log | `~/.shared-ops/chat-log/zen_chat_outbox_log.jsonl` |
| processed (archive 後) | `~/.shared-ops/chat_outbox/zen/processed/{task_id}.md` |

## 5 Status Diagram

```
[pending]                    Yuino 起稿直後 (Kai-side reify 後)
   |
   | --start <task_id>
   v
[in_progress]                Zen 実行中 (started_at frontmatter 記録)
   |
   +-- --complete <id> <path> -> [completed]    response_paths に path 記録、 result marker (status=completed)
   |
   +-- --block <id> <reason>  -> [blocked]      外部要因 + 内部の再試行候補 (failed は v0 で blocked に寄せる)
   |
   +-- --skip <id> <reason>   -> [skipped]      意図的 skip (stale / out-of-scope / 別 path で対応済)
```

archive (processed/ 移動) は status 確定 (completed / blocked / skipped) 後の cleanup step、 packet を削除しない。

## Result Marker Schema (yuino.chat_result.v0)

```json
{
  "schema_version": "yuino.chat_result.v0",
  "task_id": "task-xxxxxxxx",
  "target": "zen",
  "status": "completed | blocked | skipped",
  "started_at": "2026-05-09T00:00:00.000Z" | null,
  "completed_at": "2026-05-09T00:10:00.000Z" | null,
  "response_paths": ["C:/Users/jk023/.shared-ops/board/..."],
  "evidence": ["board response written"],
  "follow_up_needed": false,
  "next_question_for_jun": null,
  "provider_session_id": null,
  "duration_seconds": 600,
  "notes": []
}
```

status 値定義:

| status | 意味 | response_paths | duration_seconds |
|---|---|---|---|
| `completed` | consumer が board response 起稿 + marker write 完了 | non-empty | started -> completed の差 (sec) |
| `blocked` | 外部要因で停止 (内部の再試行候補)、 v0 では failed もここに寄せる | empty | 計算可 (started 不在なら null) |
| `skipped` | 意図的 skip (stale / closed / unsafe / out-of-scope) | empty | 同上 |

`pending` / `in_progress` は packet frontmatter 上の transient state、 result marker には現れない (terminal 3 状態のみ marker write)。

## Usage Examples

### list (default、 actionable packet 確認)

```bash
./scripts/zen_chat_outbox_consume.sh
./scripts/zen_chat_outbox_consume.sh --json   # script 連携用
```

list は status 別 group 表示 (pending / in_progress / completed / blocked / skipped)。 `--json` は actionable (pending) のみ JSON 配列 + 各 status の件数 summary。

### lockfile lifecycle

```bash
./scripts/zen_chat_outbox_consume.sh --lock-acquire
# ... 処理 ...
./scripts/zen_chat_outbox_consume.sh --lock-release
./scripts/zen_chat_outbox_consume.sh --lock-status   # JSON
```

stale lock (30 min 経過) は acquire 時に自動 takeover、 active lock との conflict は exit 2。 `zen-chat-outbox.lock.json` は wake-queue 用 `zen-controlled-wake.lock.json` とは別 path、 並走 OK。

### --start (work 開始、 pending -> in_progress)

```bash
./scripts/zen_chat_outbox_consume.sh --start task-0ad71310
```

packet frontmatter の `status:` を `in_progress` に rewrite + `started_at: <ISO 8601>` 追記。 `--complete` 時の duration_seconds 計算 source。

### --complete (response 起稿後、 in_progress -> completed)

```bash
./scripts/zen_chat_outbox_consume.sh --complete task-0ad71310 \
  "C:/Users/jk023/.shared-ops/board/2026-05-09_zen_kai_response_xxx.md"
```

response path は Windows form (`C:/...` または `C:\...`) または Unix form (`/c/...`) 両対応、 内部で Windows form (`C:/...`) に正規化。 result marker 起稿 + audit log entry append。

### --block (blocked、 内部の再試行候補)

```bash
./scripts/zen_chat_outbox_consume.sh --block task-0ad71310 \
  "外部 dependency (Polar.sh API) 一時 down、 30 min 待機後 再試行候補"
```

result marker (status=blocked + notes に reason)、 packet 残置 (archive せず)、 jun / Kai が後で resume 判断。

### --skip (意図的 skip)

```bash
./scripts/zen_chat_outbox_consume.sh --skip task-0ad71310 \
  "request stale (>24h)、 同一内容を別 board file で対応済"
```

result marker (status=skipped + notes に reason)、 archive 推奨 (close 状態)。

### --archive (processed/ 移動、 cleanup step)

```bash
./scripts/zen_chat_outbox_consume.sh --archive task-0ad71310
```

result marker 不在で archive すると warning 出力 (Home Summary 不一致候補)。

### --dry-run (single packet end-to-end test)

```bash
./scripts/zen_chat_outbox_consume.sh --dry-run task-0ad71310     # 単 packet 空転
./scripts/zen_chat_outbox_dry_run.sh                              # full dry run (sample 起稿込み)
```

## End-to-End Dry Run

`scripts/zen_chat_outbox_dry_run.sh` は sample packet 起稿 -> consumer の `--dry-run` を fire -> result marker JSON validate -> cleanup の 4 step で full path を空転確認。

```bash
./scripts/zen_chat_outbox_dry_run.sh
```

PASS condition (全 step 必須):

1. sample packet (status: pending) 起稿成功
2. consumer `--dry-run` exit 0 (lock acquire -> --start -> dummy board response -> --complete + marker -> schema validate -> archive -> lock release 全 8 step pass)
3. result marker に schema_version + target=zen + status=completed + task_id + response_paths 非空 + started_at + completed_at 全部存在
4. cleanup 後 sample packet + dummy board 不在 + result marker は preserve (audit evidence)

## Lockfile State Machine

| 状態 | lockfile 存在 | age | acquire 挙動 | release 挙動 |
|---|---|---|---|---|
| no_lock | なし | - | 即 acquire (新規 write) | skip (既に不在) |
| active | あり | < 30 min | exit 2 (conflict) | rm -f |
| stale | あり | >= 30 min | takeover (rm + acquire) | rm -f |

lockfile content (`yuino.consumer_lock.v1`):

```json
{
  "schema_version": "yuino.consumer_lock.v1",
  "pid": 12345,
  "ppid": 6789,
  "acquired_at": "2026-05-09T00:00:00.000Z",
  "host": "...",
  "purpose": "zen_chat_outbox_consume chat_outbox processing"
}
```

## Non-Negotiable Boundaries

- packet 消費は `chat_outbox/zen/task-*.md` prefix file のみ、 任意 path は無視
- 1 lock window 内で 2 つ目の Zen session 起動禁止 (lockfile 既存ならexit 2)
- result marker write 前に packet を削除しない (`--archive` は marker 後想定、 marker 不在で warning)
- consumer は file io のみ、 外部 action (HTTP / API / process launch / model call) 起動禁止
- general board watcher として運用しない (chat_outbox/zen/ 配下限定 scope)
- nokaze-aira/ 触らない (Kai 主担当領域、 Zen-side は readonly 参照のみ)

## Operational Flow (運用 form)

### 標準 reply path

```bash
# 1. actionable list 確認
./scripts/zen_chat_outbox_consume.sh

# 2. lock acquire
./scripts/zen_chat_outbox_consume.sh --lock-acquire

# 3. work 開始 (pending -> in_progress)
./scripts/zen_chat_outbox_consume.sh --start task-0ad71310

# 4. packet Read + bounded response 起稿 (consumer の外、 manual or sub-agent)
# ... GO / HOLD / BLOCK / ACK + short reasoning を board file に起稿 ...

# 5. complete (in_progress -> completed + result marker)
./scripts/zen_chat_outbox_consume.sh --complete task-0ad71310 \
  "C:/Users/jk023/.shared-ops/board/2026-05-09_zen_kai_response_xxx.md"

# 6. archive (processed/ 移動)
./scripts/zen_chat_outbox_consume.sh --archive task-0ad71310

# 7. lock release
./scripts/zen_chat_outbox_consume.sh --lock-release
```

### blocked path (外部要因で停止時)

```bash
./scripts/zen_chat_outbox_consume.sh --block task-0ad71310 \
  "Polar.sh API 502、 再試行候補 (30 min 待機)"
./scripts/zen_chat_outbox_consume.sh --lock-release
```

packet は chat_outbox/zen/ に残る、 jun / Kai が次の audit で resume / archive 判断。

### skip path (packet 内容が unsafe / stale 判定)

```bash
./scripts/zen_chat_outbox_consume.sh --skip task-0ad71310 \
  "request stale (>24h)、 同一内容を別 board file で対応済"
./scripts/zen_chat_outbox_consume.sh --archive task-0ad71310
./scripts/zen_chat_outbox_consume.sh --lock-release
```

## Connections

- `scripts/zen_wake_queue_consume.sh` = Controlled Wake v0 consumer (`zen-controlled-wake.lock.json`、 別 lockfile で並走)
- `scripts/zen_session_lockfile.sh` = 主 session lockfile (manual session 二重起動 detect、 別 path)
- `scripts/zen_continuous_active_loop.sh` = continuous active continue protocol、 batch 完遂後 next batch trigger
- `scripts/zen_startup_sweep.sh` = morning sweep、 chat_outbox dir 状況を summary に含める拡張候補 (5/13+ Phase 1)

## Yuino Audit Integration

Kai-side が読む audit:

- `npm run yuino:chat-outbox:local`
- `npm run yuino:home:local`

Home Summary mapping:

| consumer marker | Yuino audit 表記 |
|---|---|
| `completed` | `chat_outbox_completed` (open packets - 1) |
| `blocked` | `chat_outbox_blocked` (open packets に残留、 再試行候補) |
| `skipped` | `chat_outbox_skipped` (skip 理由は notes field) |
| (marker 不在 + status=in_progress) | `chat_outbox_in_progress` (lock window 内 work、 stale なら takeover) |
| (marker 不在 + status=pending) | `chat_outbox_pending` (open packets、 actionable) |

## Implementation Completion Condition

下記 8 件全部 pass で reify 完了 (Kai 完了報告 § Next interface for Zen side 準拠):

1. consumer が pending packet を list / --json で surface
2. `--start` で status pending -> in_progress + started_at 記録
3. board response (dummy または real) 起稿
4. `--complete` で status in_progress -> completed + result marker (yuino.chat_result.v0) write
5. result marker schema valid (schema_version + target=zen + status=completed + response_paths 非空 + started_at + completed_at)
6. `--archive` で processed/ 移動 (result marker preserve)
7. lockfile lifecycle (acquire -> release) で stale なし
8. dry-run script で 1-7 を空転確認、 既存 wake-queue consumer regression 0

`zen_chat_outbox_dry_run.sh` で 1-8 を空転確認、 real packet (Kai-side が起稿した task-*.md) 消費は jun directive + Kai-side audit 連動で fire。
