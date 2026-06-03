#!/bin/bash
# zen_wake_queue_bulk_triage.sh — age threshold bulk triage for Zen wake-queue backlog
#
# 起点:
#   - 2026-06-03 構造的 backlog 軸 (= packet 生成 > consume の累積、 wake-queue/zen 748 file + 最古 5/07)
#   - 既存 scripts/zen_wake_queue_consume.sh は 1 件単位、 大量の stale packet を triage する form 無し
#   - stop hook が 「未処理 packet 115 件」 を毎回 surface、 「止まりすぎ癖」 警告軸の物理原因
#
# 役割:
#   ~/.shared-ops/wake-queue/zen/ の age threshold 越え packet を bulk 検出、 dry-run で list、
#   --apply で skipped marker 書き込み + (controlled_*) は processed/ に move、 (pattern A) は別 form で file move。
#
# spec:
#   - skipped marker: ~/.shared-ops/wake-results/zen/<request_id>.json (schema_version=yuino.wake_result.v1)
#   - reason articulate: stale_{N}d_threshold_triage_{date}
#   - 進行 log: ~/.shared-ops/wake-results/zen/bulk_triage_{date}.log
#   - 既定 threshold: 7 日 (= 直近 1 週間は手を付けない 安全側)
#   - 既定 mode: --dry-run (= --apply 明示で初めて actual fire、 5 秒 sleep + 警告文)
#
# 対象 pattern:
#   A: 2026-MM-DD_response-{hash}.md            (= legacy soft response request、 existing consume.sh は touch 不可)
#   B: controlled_agent-bus-packet-claude_code-response-{hash}.md  (= controlled wake agent-bus 系)
#   C: controlled_task-{hash}.md / controlled_response-{hash}.md / controlled_agent-bus-*.md  (= controlled wake 系)
#   D: controlled_task-peer-review-{hash}.md     (= peer review 系)
#   想定外 pattern = skip + log 出力 (= 安全側)
#
# usage:
#   ./scripts/zen_wake_queue_bulk_triage.sh                      # dry-run、 default 7 日 threshold
#   ./scripts/zen_wake_queue_bulk_triage.sh --days 14            # dry-run、 14 日 threshold
#   ./scripts/zen_wake_queue_bulk_triage.sh --apply              # actual fire (5 秒 sleep + 警告後)
#   ./scripts/zen_wake_queue_bulk_triage.sh --days 14 --apply    # 14 日 threshold で actual fire
#
# exit code:
#   0 = success
#   1 = generic error (引数不整合等)
#   2 = safety abort (apply 中の path / dir 不正)
#
# 境界:
#   - 既存 zen_wake_queue_consume.sh は read のみ、 書き換え禁止
#   - --apply 時のみ file 物理 move、 dry-run は read のみ
#   - bulk skip = 過去 chat trigger の物理消去軸 → 復元には git / 別 backup が要る (= shared-ops は git tracked か別途確認軸)

set -uo pipefail

# ============================================================
# 引数 parse
# ============================================================

DAYS_THRESHOLD=7
APPLY_MODE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --days)
      DAYS_THRESHOLD="$2"
      shift 2
      ;;
    --apply)
      APPLY_MODE=1
      shift
      ;;
    --dry-run)
      APPLY_MODE=0
      shift
      ;;
    -h|--help)
      grep "^#" "$0" | head -50
      exit 0
      ;;
    *)
      echo "error: unknown arg: $1" >&2
      echo "usage: $0 [--days N] [--dry-run|--apply]" >&2
      exit 1
      ;;
  esac
done

if ! [[ "$DAYS_THRESHOLD" =~ ^[0-9]+$ ]]; then
  echo "error: --days must be integer (got: $DAYS_THRESHOLD)" >&2
  exit 1
fi

if [[ "$DAYS_THRESHOLD" -lt 1 ]]; then
  echo "error: --days must be >= 1 (got: $DAYS_THRESHOLD、 直近 packet 保護軸)" >&2
  exit 1
fi

# ============================================================
# path 定数
# ============================================================

WAKE_QUEUE_DIR="$HOME/.shared-ops/wake-queue/zen"
WAKE_RESULTS_DIR="$HOME/.shared-ops/wake-results/zen"
WAKE_PROCESSED_DIR="$WAKE_QUEUE_DIR/processed"
WAKE_LOG_FILE="$HOME/.shared-ops/wake-log/zen_wake_log.jsonl"

TODAY=$(date +%Y-%m-%d)
LOG_FILE="$WAKE_RESULTS_DIR/bulk_triage_${TODAY}.log"

# safety guard: WAKE_QUEUE_DIR 不在 → abort
if [[ ! -d "$WAKE_QUEUE_DIR" ]]; then
  echo "error: WAKE_QUEUE_DIR not found: $WAKE_QUEUE_DIR" >&2
  exit 2
fi

mkdir -p "$WAKE_RESULTS_DIR" "$WAKE_PROCESSED_DIR" 2>/dev/null

# ============================================================
# helper: ISO 8601 timestamp (UTC、 millisec)
# ============================================================

iso8601_now() {
  date -u +"%Y-%m-%dT%H:%M:%S.000Z"
}

# ============================================================
# helper: age threshold check (file mtime vs threshold 日)
# ============================================================

is_stale() {
  local file="$1"
  local now_epoch
  now_epoch=$(date +%s)
  local file_epoch
  file_epoch=$(stat -c %Y "$file" 2>/dev/null || echo 0)
  local age_sec=$((now_epoch - file_epoch))
  local threshold_sec=$((DAYS_THRESHOLD * 86400))
  [[ $age_sec -ge $threshold_sec ]]
}

# ============================================================
# helper: extract request_id (Pattern A/C/D 共通の `- request_id:` form)
# ============================================================

extract_request_id() {
  local file="$1"
  grep -E "^- request_id:" "$file" 2>/dev/null | head -1 | sed -E "s/^- request_id:\s*//" | tr -d '\r'
}

# Pattern B (agent-bus-packet 系) は packet_id を使う (request_id 未設定の case)
extract_packet_id() {
  local file="$1"
  grep -E "^- packet_id:" "$file" 2>/dev/null | head -1 | sed -E "s/^- packet_id:\s*//" | tr -d '\r'
}

# Pattern D (peer-review 系) は chat_outbox_task_id を使う (request_id field 不在)
extract_chat_outbox_task_id() {
  local file="$1"
  grep -E "^- chat_outbox_task_id:" "$file" 2>/dev/null | head -1 | sed -E "s/^- chat_outbox_task_id:\s*//" | tr -d '\r'
}

# Pattern D fallback: candidate_id
extract_candidate_id() {
  local file="$1"
  grep -E "^- candidate_id:" "$file" 2>/dev/null | head -1 | sed -E "s/^- candidate_id:\s*//" | tr -d '\r'
}

# ============================================================
# helper: detect pattern
#   A: 2026-MM-DD_response-*.md
#   B: controlled_agent-bus-packet-*-response-*.md / controlled_agent-bus-packet-*idle*.md
#   C: controlled_response-*.md / controlled_task-*.md (peer-review 除く)
#   D: controlled_task-peer-review-*.md
#   ?: 想定外
# ============================================================

detect_pattern() {
  local basename="$1"
  if [[ "$basename" =~ ^2026-[0-9]{2}-[0-9]{2}_response-[a-f0-9]+\.md$ ]]; then
    echo "A"
  elif [[ "$basename" =~ ^controlled_task-peer-review- ]]; then
    echo "D"
  elif [[ "$basename" =~ ^controlled_agent-bus-packet- ]]; then
    echo "B"
  elif [[ "$basename" =~ ^controlled_(response|task)- ]]; then
    echo "C"
  else
    echo "?"
  fi
}

# ============================================================
# helper: skipped marker write (yuino.wake_result.v1 schema)
# ============================================================

write_skipped_marker() {
  local request_id="$1"
  local source_file="$2"
  local reason="$3"

  local marker_path="$WAKE_RESULTS_DIR/${request_id}.json"
  local generated_at
  generated_at=$(iso8601_now)

  # Windows path form 変換 (既存 marker 整合: /c/Users/... → C:\Users\...)
  local win_source
  win_source=$(echo "$source_file" | sed -E 's#^/c/#C:\\#; s#/#\\#g')

  cat > "$marker_path" <<EOF
{
  "schema_version": "yuino.wake_result.v1",
  "generated_at": "$generated_at",
  "request_id": "$request_id",
  "target": "zen",
  "status": "skipped",
  "source_wake_path": "$win_source",
  "response_board_path": null,
  "notes": ["$reason", "bulk_triage_by_zen_wake_queue_bulk_triage.sh"],
  "evidence": ["reason=$reason", "threshold_days=$DAYS_THRESHOLD", "triage_date=$TODAY"]
}
EOF

  echo "$marker_path"
}

# ============================================================
# helper: audit log entry (existing zen_wake_log.jsonl に append)
# ============================================================

append_audit_log() {
  local request_id="$1"
  local reason="$2"
  local ts
  ts=$(date -Iseconds)
  mkdir -p "$(dirname "$WAKE_LOG_FILE")" 2>/dev/null
  cat >> "$WAKE_LOG_FILE" <<EOF
{"timestamp":"$ts","request_id":"$request_id","action":"skipped","status":"skipped","reason":"$reason","source":"bulk_triage"}
EOF
}

# ============================================================
# main: scan + classify
# ============================================================

echo "================================================================"
echo " zen_wake_queue_bulk_triage — stale packet bulk triage"
echo "================================================================"
echo " threshold:  $DAYS_THRESHOLD 日"
echo " mode:       $([[ $APPLY_MODE -eq 1 ]] && echo "APPLY (= actual fire)" || echo "dry-run (= no write)")"
echo " queue dir:  $WAKE_QUEUE_DIR"
echo " results:    $WAKE_RESULTS_DIR"
echo " triage log: $LOG_FILE"
echo "================================================================"
echo ""

# --apply 時の安全 lag: 5 秒 sleep + 警告文
if [[ $APPLY_MODE -eq 1 ]]; then
  echo "[WARN] --apply mode = actual file move + marker write が走る"
  echo "[WARN] = 過去 chat trigger の物理消去軸、 復元は git / backup が要る"
  echo "[WARN] 5 秒後に開始、 Ctrl+C で abort 可"
  echo ""
  sleep 5
fi

# counter
STALE_A=0
STALE_B=0
STALE_C=0
STALE_D=0
STALE_UNKNOWN=0
FRESH=0
TOTAL_PROCESSED=0
ERRORS=0

# log header
{
  echo "# bulk_triage log $TODAY"
  echo "# threshold: $DAYS_THRESHOLD 日"
  echo "# mode: $([[ $APPLY_MODE -eq 1 ]] && echo apply || echo dry-run)"
  echo "# started: $(iso8601_now)"
  echo ""
} > "$LOG_FILE"

shopt -s nullglob
for file in "$WAKE_QUEUE_DIR"/*.md; do
  [[ -f "$file" ]] || continue
  basename=$(basename "$file")
  TOTAL_PROCESSED=$((TOTAL_PROCESSED + 1))

  # age check (fresh 軸 = skip)
  if ! is_stale "$file"; then
    FRESH=$((FRESH + 1))
    continue
  fi

  pattern=$(detect_pattern "$basename")

  case "$pattern" in
    A)
      STALE_A=$((STALE_A + 1))
      request_id=$(extract_request_id "$file")
      ;;
    B)
      STALE_B=$((STALE_B + 1))
      request_id=$(extract_packet_id "$file")
      # packet_id 不在の case は request_id field を試す
      [[ -z "$request_id" ]] && request_id=$(extract_request_id "$file")
      ;;
    C)
      STALE_C=$((STALE_C + 1))
      request_id=$(extract_request_id "$file")
      ;;
    D)
      STALE_D=$((STALE_D + 1))
      # peer-review form は chat_outbox_task_id / candidate_id を使う
      request_id=$(extract_chat_outbox_task_id "$file")
      [[ -z "$request_id" ]] && request_id=$(extract_candidate_id "$file")
      [[ -z "$request_id" ]] && request_id=$(extract_request_id "$file")
      ;;
    ?)
      STALE_UNKNOWN=$((STALE_UNKNOWN + 1))
      echo "[pattern-?] $basename (skip、 想定外 form)" | tee -a "$LOG_FILE"
      continue
      ;;
  esac

  if [[ -z "$request_id" ]]; then
    echo "[no-id] $basename pattern=$pattern (skip、 request_id 抽出失敗)" | tee -a "$LOG_FILE"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  reason="stale_${DAYS_THRESHOLD}d_threshold_triage_${TODAY}"

  if [[ $APPLY_MODE -eq 1 ]]; then
    # marker write
    marker=$(write_skipped_marker "$request_id" "$file" "$reason")

    # file move to processed/
    target_path="$WAKE_PROCESSED_DIR/$basename"
    if mv "$file" "$target_path" 2>/dev/null; then
      append_audit_log "$request_id" "$reason"
      echo "[$pattern] APPLY: $request_id -> processed/  marker=$marker" >> "$LOG_FILE"
    else
      echo "[$pattern] ERR: $request_id mv failed  source=$file" | tee -a "$LOG_FILE"
      ERRORS=$((ERRORS + 1))
    fi
  else
    age_days=$(( ( $(date +%s) - $(stat -c %Y "$file" 2>/dev/null || echo 0) ) / 86400 ))
    echo "[$pattern] DRY: $request_id age=${age_days}d  $basename" >> "$LOG_FILE"
  fi
done
shopt -u nullglob

# ============================================================
# summary
# ============================================================

STALE_TOTAL=$((STALE_A + STALE_B + STALE_C + STALE_D + STALE_UNKNOWN))

echo ""
echo "================================================================"
echo " summary"
echo "================================================================"
echo " total scanned:    $TOTAL_PROCESSED 件"
echo " fresh (< ${DAYS_THRESHOLD}d):     $FRESH 件 (= 手付かず)"
echo " stale total:      $STALE_TOTAL 件"
echo "   pattern A:      $STALE_A 件 (= legacy 2026-MM-DD_response-*.md)"
echo "   pattern B:      $STALE_B 件 (= controlled_agent-bus-packet-*)"
echo "   pattern C:      $STALE_C 件 (= controlled_response/task-*)"
echo "   pattern D:      $STALE_D 件 (= controlled_task-peer-review-*)"
echo "   pattern ?:      $STALE_UNKNOWN 件 (= 想定外 form、 skip)"
echo " errors:           $ERRORS 件"
echo ""

if [[ $APPLY_MODE -eq 1 ]]; then
  echo " action: marker 書き込み + processed/ への file move 完了"
  echo " marker dir: $WAKE_RESULTS_DIR"
  echo " processed:  $WAKE_PROCESSED_DIR"
else
  echo " action: dry-run のため file 移動なし、 marker 書き込みなし"
  echo " 次の手:    bash $0 --days $DAYS_THRESHOLD --apply  で actual fire"
fi

{
  echo ""
  echo "# summary"
  echo "# total: $TOTAL_PROCESSED  fresh: $FRESH  stale: $STALE_TOTAL  errors: $ERRORS"
  echo "# pattern A: $STALE_A  B: $STALE_B  C: $STALE_C  D: $STALE_D  ?: $STALE_UNKNOWN"
  echo "# finished: $(iso8601_now)"
} >> "$LOG_FILE"

echo "================================================================"
echo " log: $LOG_FILE"
echo "================================================================"

exit 0
