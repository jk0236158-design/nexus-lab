# Controlled Wake Consumer (Zen-side)

Yuino Controlled Wake v0 の Zen-side consumer reify。 Kai-side が classify した Green + unanswered な request のみ消費する narrow path。

## Contract Reference

正本契約書:

- `C:\Users\jk023\Desktop\nokaze-aira\docs\zen_controlled_wake_consumer_contract_2026-05-08.md`
- `C:\Users\jk023\.shared-ops\board\2026-05-08_kai_zen_controlled_wake_consumer_contract.md`

## Source Of Truth

| 種別 | path |
|---|---|
| 入力 (request file) | `~/.shared-ops/wake-queue/zen/controlled_*.md` |
| 入力 (response audit) | `~/.shared-ops/status/yuino_response_result_audit.json` |
| 入力 (controlled wake status) | `~/.shared-ops/status/yuino_controlled_wake.json` |
| 出力 (result marker) | `~/.shared-ops/wake-results/zen/<request_id>.json` |
| 出力 (board response、 任意) | `~/.shared-ops/board/<date>_zen_kai_response_<slug>.md` |
| lockfile | `~/.shared-ops/locks/zen-controlled-wake.lock.json` |
| audit log | `~/.shared-ops/wake-log/zen_wake_log.jsonl` |

## 12 Step Diagram (contract integral)

```
1.  Scan wake-queue/zen/controlled_*.md
2.  Parse request_id / target / board_path / safety / safety_reason
3.  Read yuino_response_result_audit.json
4.  Skip if already replied or read
5.  Lockfile acquire (zen-controlled-wake.lock.json)
6.  Cooldown check (1 hour per request_id)
7.  Write read marker (status=read)
8.  Read source board file + status/audit context only
9.  Produce bounded response (GO / HOLD / BLOCK / ACK + short reasoning)
10. Write board response file
11. Write replied marker (status=replied + response_board_path)
12. Lockfile release
```

fail closed path (any step 5-11):

```
A.  Write failed marker (status=failed + error summary)
B.  Do not retry, do not start second session
C.  Leave source request in place for Yuino/Aira audit
D.  Lockfile release
```

## Result Marker Schema (yuino.wake_result.v1)

```json
{
  "schema_version": "yuino.wake_result.v1",
  "generated_at": "2026-05-08T00:00:00.000Z",
  "request_id": "response-...",
  "target": "zen",
  "status": "read | replied | failed | skipped",
  "source_wake_path": "C:\\Users\\jk023\\.shared-ops\\wake-queue\\zen\\controlled_response-....md",
  "response_board_path": null | "C:\\Users\\jk023\\.shared-ops\\board\\...",
  "notes": ["bounded notes"],
  "evidence": ["bounded evidence"]
}
```

status 値定義:

| status | 意味 | response_board_path |
|---|---|---|
| `read` | consumer が work 開始した、 board reply 起稿前 | null |
| `replied` | consumer が board reply 起稿完了 | non-null |
| `failed` | step 5-11 のいずれかで fail closed | null |
| `skipped` | 意図的 skip (stale / closed / unsafe / out-of-scope) | null |

## Usage Examples

### list (default、 actionable wake 確認)

```bash
./scripts/zen_wake_queue_consume.sh
./scripts/zen_wake_queue_consume.sh --json   # script 連携用
```

### lockfile lifecycle

```bash
./scripts/zen_wake_queue_consume.sh --lock-acquire
# ... 処理 ...
./scripts/zen_wake_queue_consume.sh --lock-release
./scripts/zen_wake_queue_consume.sh --lock-status   # JSON
```

stale lock (30 min 経過) は acquire 時に自動 takeover、 active lock との conflict は exit 2。

### read marker (work 開始前、 step 7)

```bash
./scripts/zen_wake_queue_consume.sh --read-marker response-abc123
```

### replied marker (board response 起稿後、 step 11)

```bash
./scripts/zen_wake_queue_consume.sh --replied-marker response-abc123 \
  "C:\\Users\\jk023\\.shared-ops\\board\\2026-05-08_zen_kai_response_abc123.md"
```

board path は Windows form (`C:\...`) または Unix form (`/c/...`) 両対応、 内部で Windows form に正規化。

### failed marker (fail closed、 step 5-11 のどこかで失敗時)

```bash
./scripts/zen_wake_queue_consume.sh --failed-marker response-abc123 \
  "board response 起稿時に disk full、 retry なし"
```

### skipped marker (意図的 skip)

```bash
./scripts/zen_wake_queue_consume.sh --skipped-marker response-abc123 \
  "request stale (>24h)、 同一内容を別 board file で対応済"
```

### archive (processed/ 移動、 step 11 後の cleanup)

```bash
./scripts/zen_wake_queue_consume.sh --archive response-abc123
```

result marker 不在で archive すると warning 出力 (Yuino audit が unanswered のまま残る contract 違反候補)。

### dry run (end-to-end test)

```bash
./scripts/zen_wake_queue_consume.sh --dry-run response-abc123   # 単 request 空転
bash scripts/zen_wake_queue_dry_run.sh                              # full dry run (sample 起稿込み)
```

## End-to-End Dry Run

`scripts/zen_wake_queue_dry_run.sh` は sample request を起稿 -> consumer の `--dry-run` を fire -> result marker JSON validate -> cleanup の 4 step で contract § Implementation Completion Condition を空転確認。

```bash
bash scripts/zen_wake_queue_dry_run.sh
```

PASS condition (全 step 必須):

1. sample request file 起稿成功
2. consumer `--dry-run` exit 0 (lockfile -> read marker -> dummy board -> replied marker -> schema validate -> lock release 全 7 step pass)
3. result marker に schema_version + target=zen + status=replied + response_board_path 非 null 全部存在
4. cleanup 後 sample request 不在 + result marker は preserve (audit evidence)

## Fail Closed Behavior

contract § Fail Closed:

- step 5-11 いずれかで失敗時、 即 `--failed-marker <id> <error>` で marker 起稿
- retry loop 起動禁止、 second session 起動禁止
- source wake-queue file は archive せず保持 (Yuino/Aira audit 用 evidence)
- lockfile は finally / trap で必ず release

consumer script 内の各 marker action は exit 0 を返した時点で audit log にも append、 trace 可能。

## Non-Negotiable Boundaries

contract § Non-Negotiable Boundaries 完全準拠:

- Red / Yellow safety request は consumer から消費しない (list output で `non-green safety` 警告のみ)
- 1 lock window 内で 2 つ目の Zen session 起動禁止 (lockfile が既存ならexit 2)
- 既に `replied` / `read` mark の request は処理しない (yuino_response_result_audit.json check 経由)
- result marker write 前に wake request file を削除しない (--archive は marker 後想定、 marker 不在で warning)
- 外部 action 起動禁止 (consumer は file io のみ)
- general board watcher として運用しない (controlled_*.md prefix file のみ scope)

## Cooldown / Replied 連動

| 状態 | 判定 source | consumer 挙動 |
|---|---|---|
| Yuino audit で `replied` または `read` mark 済 | `~/.shared-ops/status/yuino_response_result_audit.json` | list で `cooldown_skip` group、 actionable から除外 |
| wake-log に 1 hour 以内 entry あり | `~/.shared-ops/wake-log/zen_wake_log.jsonl` | list で `cooldown_skip` group |
| safety != green | request file `- safety: ...` field | list で `non_green` group、 owner 確認誘導 |
| stale lock (30 min 経過) | `~/.shared-ops/locks/zen-controlled-wake.lock.json` mtime | acquire 時に自動 takeover |

## Operational Flow (運用 form)

### 標準 reply path

```bash
# 1. actionable list 確認
./scripts/zen_wake_queue_consume.sh

# 2. lock acquire
./scripts/zen_wake_queue_consume.sh --lock-acquire

# 3. read marker (work 開始合図)
./scripts/zen_wake_queue_consume.sh --read-marker response-abc123

# 4. board file Read + bounded response 起稿 (consumer の外、 manual or sub-agent)
# ... GO / HOLD / BLOCK / ACK + short reasoning ...

# 5. replied marker
./scripts/zen_wake_queue_consume.sh --replied-marker response-abc123 \
  "C:\\Users\\jk023\\.shared-ops\\board\\2026-05-08_zen_kai_response_abc123.md"

# 6. archive
./scripts/zen_wake_queue_consume.sh --archive response-abc123

# 7. lock release
./scripts/zen_wake_queue_consume.sh --lock-release
```

### fail closed path (step 4 で error 発生時の例)

```bash
./scripts/zen_wake_queue_consume.sh --failed-marker response-abc123 "board write 失敗、 retry なし"
./scripts/zen_wake_queue_consume.sh --lock-release
```

source wake request は wake-queue/zen/ に残る、 Yuino/Aira が次の audit で発見可能。

### skip path (request 内容が unsafe / stale 判定)

```bash
./scripts/zen_wake_queue_consume.sh --skipped-marker response-abc123 "外部 action 要求 detect、 Zen scope 外"
./scripts/zen_wake_queue_consume.sh --archive response-abc123
./scripts/zen_wake_queue_consume.sh --lock-release
```

## Connections

- `scripts/zen_session_lockfile.sh` = 主 session lockfile (別 lockfile path、 manual session 二重起動 detect)
- `scripts/zen_continuous_active_loop.sh` = continuous active continue protocol、 batch 完遂後 next batch trigger
- `scripts/zen_startup_sweep.sh` = morning sweep、 wake-queue dir 状況を summary に含む

## Yuino Audit Integration

Kai-side が読む audit:

- `npm run yuino:response-results:local`
- `npm run yuino:night-cycle:dry-run`

mapping:

| consumer marker | Yuino audit 表記 |
|---|---|
| `replied` | `response_results_replied` |
| `read` | `response_results_read` |
| (marker 不在 + board response なし) | `response_results_unanswered` |
| `failed` | `response_results_unanswered` (Aira audit で error trace) |
| `skipped` | `response_results_unanswered` (skip 理由は notes field) |

## Implementation Completion Condition (contract § Implementation Completion Condition)

下記 7 件全部 pass で reify 完了:

1. Kai が controlled wake request 起稿
2. Zen consumer が `read` marker 起稿
3. Zen consumer が board response 起稿
4. Zen consumer が `replied` marker 起稿
5. Yuino response result audit でその request が `replied` 表記
6. 次回 Controlled Wake で同 request が再選定されない
7. hidden session / duplicate session / external action / unbounded retry 全部不在

`scripts/zen_wake_queue_dry_run.sh` で 1-4 + 7 を空転確認、 5-6 は Kai-side の `npm run yuino:response-results:local` で fire 後確認。
