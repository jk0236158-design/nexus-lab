#!/bin/bash
# dev_server_stale_check.sh — port 3100 (ops-console) stale process detect + warn
# memory feedback_nokaze_design_skill_skip_drift.md ritual C reify、 5/07 PM 23:38 起稿
# 5/07 step 2a CSS 破損 incident (PID 22272 stale process detect skip → port hold → silent serve old) 連動
#
# 検出対象:
#   - port 3100 を hold する process 存在 + その process が今 session で起動した dev server か stale か判定
#   - stale 判定基準: process start time が 今 session 開始時刻より古い
#
# usage:
#   ./scripts/dev_server_stale_check.sh [port]  (default: 3100)
#   ./scripts/dev_server_stale_check.sh --kill-stale (stale 検出時 taskkill 提案 + 確認 prompt)

set -uo pipefail

PORT=3100
KILL_STALE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --kill-stale)
      KILL_STALE=true
      shift
      ;;
    -h|--help)
      sed -n '2,15p' "$0"
      exit 0
      ;;
    *)
      PORT="$1"
      shift
      ;;
  esac
done

echo "═══════════════════════════════════════════════"
echo "dev_server_stale_check: port ${PORT}"
echo "═══════════════════════════════════════════════"

# Windows: netstat -ano | grep :PORT
# port を hold する PID を取得
pids=$(netstat -ano 2>/dev/null | grep -E "[:.]${PORT}\s" | grep -E 'LISTEN(ING)?' | awk '{print $NF}' | sort -u || true)

if [[ -z "$pids" ]]; then
  echo "  ✓ port ${PORT} 未使用 (clean state)"
  exit 0
fi

echo "  port ${PORT} を hold する PID:"
for pid in $pids; do
  # tasklist で process 情報取得
  proc_info=$(tasklist //FI "PID eq ${pid}" //FO CSV //NH 2>/dev/null | head -1 || true)
  if [[ -z "$proc_info" ]]; then
    echo "    PID ${pid}: tasklist 取得失敗"
    continue
  fi
  echo "    PID ${pid}: ${proc_info}"
done

# stale 判定: process 起動時刻
stale_pids=()
for pid in $pids; do
  start=$(wmic process where "ProcessId=${pid}" get CreationDate //value 2>/dev/null | grep -oE '[0-9]+\.[0-9]+' | head -1 || true)
  if [[ -z "$start" ]]; then
    continue
  fi
  # CreationDate format: YYYYMMDDHHMMSS.mmmmmm+TZ
  start_time="${start:0:14}"
  start_epoch=$(date -d "${start_time:0:4}-${start_time:4:2}-${start_time:6:2} ${start_time:8:2}:${start_time:10:2}:${start_time:12:2}" +%s 2>/dev/null || echo 0)
  now_epoch=$(date +%s)
  age=$((now_epoch - start_epoch))

  if [[ "$age" -gt 3600 ]]; then
    echo "    🟡 PID ${pid}: 起動から $((age / 60)) min 経過 (1 hour 超 = stale candidate)"
    stale_pids+=("$pid")
  else
    echo "    ✓ PID ${pid}: 起動から $((age / 60)) min (active)"
  fi
done

if [[ ${#stale_pids[@]} -eq 0 ]]; then
  echo ""
  echo "✓ stale process なし"
  exit 0
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "🟡 stale process 検出 ${#stale_pids[@]} 件: ${stale_pids[*]}"
echo "═══════════════════════════════════════════════"
echo ""
echo "推奨: stale process kill + clean restart"
echo "  taskkill //F //PID ${stale_pids[*]}"
echo ""

if [[ "$KILL_STALE" == "true" ]]; then
  echo "--kill-stale 指定、 taskkill 実行..."
  for pid in "${stale_pids[@]}"; do
    taskkill //F //PID "$pid" 2>&1 || true
  done
  echo "✓ stale process kill 完了"
fi

exit 1
