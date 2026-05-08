# install_zen_wake_queue_watcher.ps1
#
# Registers a Windows Scheduled Task `ZenWakeQueueWatcher` that polls every
# 5 minutes for new Controlled Wake v0 queue files at
# ~/.shared-ops/wake-queue/zen/controlled_*.md. When a fresh, green-safety,
# cooldown-passed request is detected and there is no active Zen session
# (zen_session.lock not held), the watcher emits a notify file the user can
# pick up to manually start a Claude Code session for that wake request.
#
# Why a notify file (not auto-launch claude-code):
#   The current Claude Code CLI does not accept an "initial-directive" / "first
#   message" argument that we can use to inject "wake_queue consume" without a
#   manual prompt. Auto-launching would land in the user's terminal with no
#   primer, which is worse than a clean notify. We therefore stop at
#   "notify + log" and let jun (or a future claude-code spec change) close the
#   loop. This is consistent with axis 3 of the 5/08 enforcement reform
#   (chat-output enforcement is not possible inside the harness without spec
#   support).
#
# Created files (per fire):
#   ~/.shared-ops/_daemon/zen_wake_queue_watcher.log   (append, JSONL-ish)
#   ~/.shared-ops/_daemon/zen_wake_queue_watcher_skip.log (append, skip reasons)
#   ~/.shared-ops/inbox/zen_wake_queue_pending_<request_id>.md (notify, idempotent)
#
# Boundaries:
#   - This installer must be run by jun (Register-ScheduledTask is OS-level).
#   - The task runs at Limited (no admin required).
#   - Idempotent: existing task is replaced.
#   - Rollback: schtasks /Delete /TN ZenWakeQueueWatcher /F
#
# Iwa / 2026-05-08 enforcement layer reform 5-axis (axis 1)

$ErrorActionPreference = "Stop"

$TaskName       = "ZenWakeQueueWatcher"
$WatcherScript  = Join-Path $HOME ".shared-ops\_daemon\zen_wake_queue_watcher.ps1"

# ---------------------------------------------------------------------------
# 1. Materialize watcher script next to the existing daemon scripts.
# ---------------------------------------------------------------------------

$watcherBody = @'
# zen_wake_queue_watcher.ps1 — ZenWakeQueueWatcher entry point (5 min polling).
#
# Logic:
#   1. List ~/.shared-ops/wake-queue/zen/controlled_*.md (skip /processed/).
#   2. For each request:
#      a. Skip if safety != "green".
#      b. Skip if last fire for this request_id < 1 hour ago (cooldown).
#      c. Skip if zen_session.lock is held (active session — let it consume).
#   3. For surviving requests, write a notify file under
#      ~/.shared-ops/inbox/zen_wake_queue_pending_<request_id>.md (idempotent).
#   4. Append a one-line entry per fire to zen_wake_queue_watcher.log
#      (status / request_id / reason).
#
# This script intentionally does NOT spawn claude-code. See header of
# install_zen_wake_queue_watcher.ps1 for the rationale.

$ErrorActionPreference = "Continue"

$SharedOps     = Join-Path $HOME ".shared-ops"
$WakeQueueDir  = Join-Path $SharedOps "wake-queue\zen"
$ProcessedDir  = Join-Path $WakeQueueDir "processed"
$DaemonDir     = Join-Path $SharedOps "_daemon"
$InboxDir      = Join-Path $SharedOps "inbox"
$LockFile      = Join-Path $DaemonDir "zen_session.lock"
$WakeLogJsonl  = Join-Path $SharedOps "wake-log\zen_wake_log.jsonl"
$WatcherLog    = Join-Path $DaemonDir "zen_wake_queue_watcher.log"
$SkipLog       = Join-Path $DaemonDir "zen_wake_queue_watcher_skip.log"

New-Item -ItemType Directory -Force -Path $InboxDir   | Out-Null
New-Item -ItemType Directory -Force -Path $DaemonDir  | Out-Null

if (-not (Test-Path $WakeQueueDir)) {
    # Nothing to do, but keep behavior consistent with cron-style daemons.
    return
}

$now = Get-Date
$nowIso = $now.ToString("yyyy-MM-ddTHH:mm:sszzz")

function Write-WatcherLog([string]$status, [string]$requestId, [string]$detail) {
    $line = "$nowIso`t$status`t$requestId`t$detail"
    Add-Content -Path $WatcherLog -Value $line
}

function Write-SkipLog([string]$requestId, [string]$reason) {
    $line = "$nowIso`t$requestId`t$reason"
    Add-Content -Path $SkipLog -Value $line
}

# Active-session gate. If zen_session.lock is held and fresh, the active
# session will pick up the queue itself; we stay quiet to avoid noise.
$sessionActive = $false
if (Test-Path $LockFile) {
    $lockAge = (Get-Date) - (Get-Item $LockFile).LastWriteTime
    if ($lockAge.TotalMinutes -lt 60) {
        $sessionActive = $true
    }
}

# Cooldown helper: parse zen_wake_log.jsonl and find last archived/notified
# timestamp for a given request_id. Cooldown = 1 hour.
function Test-CooldownActive([string]$requestId) {
    if (-not (Test-Path $WakeLogJsonl)) { return $false }
    $lines = Get-Content $WakeLogJsonl -ErrorAction SilentlyContinue
    if (-not $lines) { return $false }
    $matches = $lines | Where-Object { $_ -match "`"request_id`":`"$([regex]::Escape($requestId))`"" }
    if (-not $matches) { return $false }
    $last = $matches | Select-Object -Last 1
    if ($last -match '"timestamp":"([^"]+)"') {
        $ts = $matches[1]
        try {
            $lastDt = [datetime]::Parse($ts)
            $diff = (Get-Date) - $lastDt
            return ($diff.TotalSeconds -lt 3600)
        } catch {
            return $false
        }
    }
    return $false
}

# Frontmatter field extractor for the simple "- key: value" format used in
# Controlled Wake v0 queue files (see scripts/zen_wake_queue_consume.sh).
function Get-FmField([string]$path, [string]$field) {
    $line = Select-String -Path $path -Pattern "^- ${field}:" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $line) { return "" }
    return ($line.Line -replace "^- ${field}:\s*", "").Trim()
}

$candidateFiles = Get-ChildItem -Path $WakeQueueDir -Filter "controlled_*.md" -File -ErrorAction SilentlyContinue
if (-not $candidateFiles) {
    Write-WatcherLog "EMPTY" "-" "no_queue_files"
    return
}

foreach ($f in $candidateFiles) {
    $requestId = Get-FmField $f.FullName "request_id"
    $boardPath = Get-FmField $f.FullName "board_path"
    $safety    = Get-FmField $f.FullName "safety"

    if (-not $requestId) {
        Write-SkipLog "<missing>" "no_request_id_field"
        continue
    }
    if ($safety -ne "green") {
        Write-SkipLog $requestId "safety_$safety"
        continue
    }
    if (Test-CooldownActive $requestId) {
        Write-SkipLog $requestId "cooldown_active"
        continue
    }
    if ($sessionActive) {
        Write-SkipLog $requestId "session_active_lock_held"
        continue
    }

    # Emit a notify file so jun (or a tail watcher) sees the pending wake.
    # Idempotent: skip if a notify already exists for this request_id.
    $notifyPath = Join-Path $InboxDir "zen_wake_queue_pending_$requestId.md"
    if (Test-Path $notifyPath) {
        Write-SkipLog $requestId "notify_exists"
        continue
    }

    $notifyBody = @"
---
generated: $nowIso
generated_by: zen_wake_queue_watcher.ps1
request_id: $requestId
board_path: $boardPath
safety: $safety
queue_file: $($f.FullName)
---

# ZenWakeQueueWatcher notify

Controlled Wake v0 request detected, no active Zen session.

To consume:
    bash ~/nexus-lab/scripts/zen_wake_queue_consume.sh
    # then start a Claude Code session and respond to the board file
    bash ~/nexus-lab/scripts/zen_wake_queue_consume.sh --archive $requestId
"@
    Set-Content -Path $notifyPath -Value $notifyBody -Encoding UTF8
    Write-WatcherLog "NOTIFY" $requestId "notify_written:$notifyPath"
}
'@

$watcherDir = Split-Path $WatcherScript -Parent
New-Item -ItemType Directory -Force -Path $watcherDir | Out-Null
Set-Content -Path $WatcherScript -Value $watcherBody -Encoding UTF8

Write-Host "Watcher script written: $WatcherScript"

# ---------------------------------------------------------------------------
# 2. Register the scheduled task (5 min polling, runs every day).
# ---------------------------------------------------------------------------

$shimArg = "-NoProfile -ExecutionPolicy Bypass -File `"$WatcherScript`""

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument $shimArg `
    -WorkingDirectory (Split-Path $WatcherScript -Parent)

# Daily 09:30 anchor + 5 min repetition for 23 h 55 m. This pattern works on
# Win10/11 and avoids the "more than 24h" repetition validation issue.
$trigger = New-ScheduledTaskTrigger -Daily -At 09:30
$trigger.Repetition = (New-ScheduledTaskTrigger -Once -At 09:30 `
    -RepetitionInterval (New-TimeSpan -Minutes 5) `
    -RepetitionDuration (New-TimeSpan -Hours 23 -Minutes 55)).Repetition

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit ([TimeSpan]::FromMinutes(2))

$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Existing task '$TaskName' found; replacing..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Zen wake-queue watcher: every 5 min, surface Controlled Wake v0 pending requests as inbox notify files." | Out-Null

Write-Host ""
Write-Host "Registered scheduled task: $TaskName"
Write-Host "Trigger: daily 09:30 + repeat every 5 min for 23h55m"
Write-Host "RunLevel: Limited (admin not required)"
Write-Host ""
Write-Host "Verify with:"
Write-Host "  schtasks /Query /TN $TaskName /V /FO LIST"
Write-Host ""
Write-Host "Manual fire (for testing):"
Write-Host "  Start-ScheduledTask -TaskName $TaskName"
Write-Host "  Get-Content `"$HOME\.shared-ops\_daemon\zen_wake_queue_watcher.log`" -Tail 5"
Write-Host ""
Write-Host "Rollback:"
Write-Host "  Unregister-ScheduledTask -TaskName $TaskName -Confirm:`$false"
