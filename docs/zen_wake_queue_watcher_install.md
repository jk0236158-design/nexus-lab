# ZenWakeQueueWatcher install / uninstall 手順

5/08 enforcement layer reform 軸 1 の reify。Controlled Wake v0 の wake-queue
file (`~/.shared-ops/wake-queue/zen/controlled_*.md`) を 5 min 毎に polling
し、 active Zen session が不在 + safety green + cooldown 通過の request を
inbox notify file として surface する Windows Scheduled Task。

## 役割と限界

- 役割: 「主 session 不在のとき、 wake-queue が放置されない」 を物理 enforce する
- 限界: claude-code CLI に initial-directive 引数がないため、 watcher は
  **直接 claude-code を起動しない**。 inbox に notify file を起稿するのみ。
  最終起動は jun の手動 (or 将来の claude-code 仕様変更) に委ねる。
- 連動: `scripts/zen_wake_queue_consume.sh` (Zen-side consume + archive) と組
  で運用。 watcher は 「未読を可視化」、 consume script は 「読んで archive」。

## 前提

- Windows 10/11
- PowerShell 5.1 以上 (Windows 標準同梱)
- 管理者権限不要 (RunLevel Limited)

## 1. install (jun 直接実行)

```powershell
# nexus-lab repo を clone 済み前提
powershell -ExecutionPolicy Bypass -File C:\Users\jk023\nexus-lab\scripts\install_zen_wake_queue_watcher.ps1
```

実行で起こること:

1. `~/.shared-ops/_daemon/zen_wake_queue_watcher.ps1` (watcher 本体) が
   install script から書き出される (idempotent、 上書き可)。
2. Windows Task Scheduler に `ZenWakeQueueWatcher` task が登録される
   (既存があれば置き換え)。
3. trigger: 毎日 09:30 anchor + 5 min 毎 repeat (23h55m duration)、
   = ほぼ 24/7 で 5 min interval 動作。

## 2. 動作確認

### 2-A. task 登録確認

```powershell
schtasks /Query /TN ZenWakeQueueWatcher /V /FO LIST
```

Status = Ready / Next Run Time が今日中になっていれば OK。

### 2-B. 手動 fire test

```powershell
Start-ScheduledTask -TaskName ZenWakeQueueWatcher
# 数秒待つ
Get-Content "$HOME\.shared-ops\_daemon\zen_wake_queue_watcher.log" -Tail 5
```

queue が空なら `EMPTY  -  no_queue_files` line が追加される。
queue file がある場合は `NOTIFY <request_id> notify_written:<path>` または
`SKIP` 系 line が `zen_wake_queue_watcher_skip.log` に追加される。

### 2-C. notify file 確認

```powershell
Get-ChildItem $HOME\.shared-ops\inbox\zen_wake_queue_pending_*.md
```

Zen 主 session 起動後は notify file を read → consume script で archive
→ notify file は手動 or 別 sweep で削除。

## 3. uninstall

```powershell
Unregister-ScheduledTask -TaskName ZenWakeQueueWatcher -Confirm:$false
```

watcher script 本体 (`~/.shared-ops/_daemon/zen_wake_queue_watcher.ps1`) は
残る (再 install 時の高速化のため)。 完全 cleanup は手動削除。

## 4. log file の見方

- `~/.shared-ops/_daemon/zen_wake_queue_watcher.log`
  watcher 本体の動作 log。 1 line = 1 fire 結果。 列は
  `<iso_timestamp>\t<status>\t<request_id>\t<detail>`。
  status: `EMPTY` / `NOTIFY` / (skip 系は別 file)

- `~/.shared-ops/_daemon/zen_wake_queue_watcher_skip.log`
  skip 理由 log。 列は `<iso_timestamp>\t<request_id>\t<reason>`。
  reason: `safety_<color>` / `cooldown_active` / `session_active_lock_held`
  / `notify_exists` / `no_request_id_field`

## 5. 整合 / 注意

- 既存 `ZenAutonomousWake` task (board/_wake marker writer) とは独立。
  両方 install して問題ない (firing path が別、 message form が別)。
- watcher は 1 回 fire あたり 数百 ms で完了する設計。
  ExecutionTimeLimit 2 min は事故 hang 用 safety.
- log rotation は未実装。 1 fire 1 行 × 5 min = 1 day 約 288 line、
  半年で 50K line 程度。 必要に応じ jun が手動で truncate。
