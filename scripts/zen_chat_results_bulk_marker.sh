#!/bin/bash
# zen_chat_results_bulk_marker.sh — chat_outbox stale pending に skipped marker を書く form
#
# 起点:
#   - 2026-06-03 構造的 backlog 軸の 2 段目 = stop hook が「未処理 packet 114 件」 を surface
#   - source = ~/.shared-ops/chat_outbox/zen/*.md で「status: pending」 検出 + ~/.shared-ops/chat_results/zen/{task_id}.json なし
#   - wake-queue とは別軸 (= chat_outbox は task assignment / chat_results は completion marker)
#
# 役割:
#   chat_outbox/zen/ の status:pending file で age threshold 越え かつ chat_results 不在 → skipped marker 書き込み
#
# spec:
#   - skipped marker: ~/.shared-ops/chat_results/zen/<task_id>.json
#   - schema: yuino.chat_result.v0 (= 軽量、 task_id + status + reason + generated_at)
#   - 既定 threshold: 7 日 (= 直近 1 週間は手をつけない)
#   - 既定 mode: --dry-run (= --apply 明示で初めて actual fire)
#   - memory-integrity-repair task は対象外 (= stop hook と同じ除外)
#
# usage:
#   ./scripts/zen_chat_results_bulk_marker.sh                       # dry-run、 default 7 日
#   ./scripts/zen_chat_results_bulk_marker.sh --days 14             # dry-run、 14 日 threshold
#   ./scripts/zen_chat_results_bulk_marker.sh --apply               # actual fire (= marker write のみ、 file は触らない)
#
# 境界:
#   - chat_outbox の file 自体は **書き換えない** (= status: pending のまま、 marker 存在で「未処理印あり」 軸に切替わる)
#   - actual file remove なし、 復元 risk なし

set -uo pipefail

DAYS_THRESHOLD=7
APPLY_MODE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --days)   DAYS_THRESHOLD="$2"; shift 2 ;;
    --apply)  APPLY_MODE=1; shift ;;
    --dry-run) APPLY_MODE=0; shift ;;
    -h|--help) grep "^#" "$0" | head -30; exit 0 ;;
    *) echo "error: unknown arg: $1" >&2; exit 1 ;;
  esac
done

if ! [[ "$DAYS_THRESHOLD" =~ ^[0-9]+$ ]] || [[ "$DAYS_THRESHOLD" -lt 1 ]]; then
  echo "error: --days must be integer >= 1" >&2
  exit 1
fi

CHAT_OUTBOX_DIR="$HOME/.shared-ops/chat_outbox/zen"
CHAT_RESULTS_DIR="$HOME/.shared-ops/chat_results/zen"
TODAY=$(date +%Y-%m-%d)
LOG_FILE="$CHAT_RESULTS_DIR/bulk_marker_${TODAY}.log"

[[ ! -d "$CHAT_OUTBOX_DIR" ]] && { echo "error: CHAT_OUTBOX_DIR not found" >&2; exit 2; }
mkdir -p "$CHAT_RESULTS_DIR" 2>/dev/null

iso8601_now() { date -u +"%Y-%m-%dT%H:%M:%S.000Z"; }

is_stale() {
  local file="$1"
  local now_epoch=$(date +%s)
  local file_epoch=$(stat -c %Y "$file" 2>/dev/null || echo 0)
  local age_sec=$((now_epoch - file_epoch))
  local threshold_sec=$((DAYS_THRESHOLD * 86400))
  [[ $age_sec -ge $threshold_sec ]]
}

write_marker() {
  local task_id="$1"
  local source_file="$2"
  local reason="$3"
  local marker_path="$CHAT_RESULTS_DIR/${task_id}.json"
  local ts=$(iso8601_now)
  local win_source=$(echo "$source_file" | sed -E 's#^/c/#C:\\#; s#/#\\#g')

  cat > "$marker_path" <<EOF
{
  "schema_version": "yuino.chat_result.v0",
  "generated_at": "$ts",
  "task_id": "$task_id",
  "target": "zen",
  "status": "skipped",
  "source_chat_outbox_path": "$win_source",
  "reason": "$reason",
  "notes": ["bulk_marker_by_zen_chat_results_bulk_marker.sh", "threshold_days=$DAYS_THRESHOLD"]
}
EOF
  echo "$marker_path"
}

echo "================================================================"
echo " zen_chat_results_bulk_marker — pending without marker を fix"
echo "================================================================"
echo " threshold:  $DAYS_THRESHOLD 日"
echo " mode:       $([[ $APPLY_MODE -eq 1 ]] && echo "APPLY" || echo "dry-run")"
echo " outbox:     $CHAT_OUTBOX_DIR"
echo " results:    $CHAT_RESULTS_DIR"
echo "================================================================"
echo ""

if [[ $APPLY_MODE -eq 1 ]]; then
  echo "[WARN] --apply mode = chat_results/zen/{task_id}.json marker 書き込み開始"
  echo "[WARN] 5 秒後に開始、 Ctrl+C で abort 可"
  echo ""
  sleep 5
fi

STALE_MARKED=0
STALE_HAS_MARKER=0
FRESH=0
EXCLUDED=0
TOTAL=0
ERRORS=0

{
  echo "# bulk_marker log $TODAY"
  echo "# threshold: $DAYS_THRESHOLD 日"
  echo "# mode: $([[ $APPLY_MODE -eq 1 ]] && echo apply || echo dry-run)"
  echo "# started: $(iso8601_now)"
  echo ""
} > "$LOG_FILE"

shopt -s nullglob
for file in "$CHAT_OUTBOX_DIR"/*.md; do
  [[ -f "$file" ]] || continue
  TOTAL=$((TOTAL + 1))

  basename=$(basename "$file" .md)

  if [[ "$basename" =~ memory-integrity-repair ]]; then
    EXCLUDED=$((EXCLUDED + 1))
    continue
  fi

  if ! grep -q "^status: pending" "$file" 2>/dev/null; then
    continue
  fi

  task_id="$basename"
  marker_path="$CHAT_RESULTS_DIR/${task_id}.json"

  if [[ -f "$marker_path" ]]; then
    STALE_HAS_MARKER=$((STALE_HAS_MARKER + 1))
    continue
  fi

  if ! is_stale "$file"; then
    FRESH=$((FRESH + 1))
    continue
  fi

  age_days=$(( ( $(date +%s) - $(stat -c %Y "$file" 2>/dev/null || echo 0) ) / 86400 ))
  reason="stale_${DAYS_THRESHOLD}d_threshold_bulk_marker_${TODAY}"

  if [[ $APPLY_MODE -eq 1 ]]; then
    if marker=$(write_marker "$task_id" "$file" "$reason"); then
      STALE_MARKED=$((STALE_MARKED + 1))
      echo "[APPLY] $task_id age=${age_days}d -> $marker" >> "$LOG_FILE"
    else
      ERRORS=$((ERRORS + 1))
      echo "[ERR] $task_id age=${age_days}d marker write failed" | tee -a "$LOG_FILE"
    fi
  else
    STALE_MARKED=$((STALE_MARKED + 1))
    echo "[DRY] $task_id age=${age_days}d $basename.md" >> "$LOG_FILE"
  fi
done
shopt -u nullglob

echo "================================================================"
echo " summary"
echo "================================================================"
echo " total scanned:        $TOTAL 件"
echo " excluded (memory-*):  $EXCLUDED 件"
echo " fresh (< ${DAYS_THRESHOLD}d):       $FRESH 件 (= 手付かず)"
echo " already has marker:   $STALE_HAS_MARKER 件 (= skip)"
echo " marker write target:  $STALE_MARKED 件"
echo " errors:               $ERRORS 件"
echo ""

if [[ $APPLY_MODE -eq 1 ]]; then
  echo " action: chat_results/zen/{task_id}.json に skipped marker 書き込み完了"
  echo " 元 chat_outbox file = 触らず (= status:pending のまま、 marker 存在で stop hook 軸の未処理印あり に切替)"
else
  echo " action: dry-run のため marker 書き込みなし"
  echo " 次の手: bash $0 --days $DAYS_THRESHOLD --apply で actual fire"
fi

{
  echo ""
  echo "# summary"
  echo "# total: $TOTAL excluded: $EXCLUDED fresh: $FRESH has_marker: $STALE_HAS_MARKER marked: $STALE_MARKED errors: $ERRORS"
  echo "# finished: $(iso8601_now)"
} >> "$LOG_FILE"

echo " log: $LOG_FILE"
echo "================================================================"
exit 0
