#!/bin/bash
# zen_wake_queue_consume.sh — Yuino Controlled Wake v0 の Zen-side consume + audit log
#
# 起点: 2026-05-08 Kai-side Controlled Wake v0 reify (commit 89cc473) 連動、 Zen-side responsibility 部分の reify
# spec: jun 5/08 Controlled Wake v0 提案 (board file format: request_id + target + board_path + score + safety)
# 連動: scripts/zen_session_lockfile.sh (議題 30 軸 3) + scripts/zen_continuous_active_loop.sh (continuous active continue protocol)
#
# 役割:
#   ~/.shared-ops/wake-queue/zen/controlled_*.md を read、 各 wake request の board file を surface、
#   Zen 主 session が response 起稿後に audit log 起稿 + queue file を archive。
#
# 動作 (default = 「list + read 推奨」 form、 destructive ではない):
#   1. ~/.shared-ops/wake-queue/zen/controlled_*.md を list
#   2. 各 file の frontmatter (request_id + board_path + score + safety) を抽出
#   3. cooldown check (1 hour、 ~/.shared-ops/wake-log/zen_wake_log.jsonl)
#   4. cooldown 通過 + safety green の request を 「read 推奨 list」 として output
#   5. archive option (--archive) で processed file を /processed/ 移動
#
# usage:
#   ./scripts/zen_wake_queue_consume.sh           # list + read 推奨 form
#   ./scripts/zen_wake_queue_consume.sh --json    # JSON form (script 連携用)
#   ./scripts/zen_wake_queue_consume.sh --archive <request_id>  # processed file archive
#
# exit code:
#   0 = success (list output、 actionable wake あり / なし両方)
#   1 = error (wake-queue dir 不在 等)

set -uo pipefail

ACTION="${1:-list}"
ARG="${2:-}"

WAKE_QUEUE_DIR="$HOME/.shared-ops/wake-queue/zen"
WAKE_LOG_DIR="$HOME/.shared-ops/wake-log"
WAKE_LOG_FILE="$WAKE_LOG_DIR/zen_wake_log.jsonl"
WAKE_PROCESSED_DIR="$WAKE_QUEUE_DIR/processed"
COOLDOWN_SEC=3600  # 1 hour cooldown

# ============================================================
# directory 準備
# ============================================================

mkdir -p "$WAKE_QUEUE_DIR" "$WAKE_LOG_DIR" "$WAKE_PROCESSED_DIR" 2>/dev/null

if [[ ! -d "$WAKE_QUEUE_DIR" ]]; then
  echo "error: wake-queue dir not found: $WAKE_QUEUE_DIR" >&2
  exit 1
fi

# ============================================================
# helper: extract frontmatter field
# ============================================================

extract_field() {
  local file="$1"
  local field="$2"
  grep -E "^- $field:" "$file" 2>/dev/null | head -1 | sed -E "s/^- $field:\s*//" | tr -d '\r'
}

# ============================================================
# helper: cooldown check (request_id 別 1 hour cooldown)
# ============================================================

is_cooldown_active() {
  local request_id="$1"
  if [[ ! -f "$WAKE_LOG_FILE" ]]; then
    return 1  # no log = no cooldown
  fi
  local last_ts
  last_ts=$(grep "\"request_id\":\"$request_id\"" "$WAKE_LOG_FILE" 2>/dev/null | tail -1 | grep -oE '"timestamp":"[^"]+"' | sed -E 's/"timestamp":"([^"]+)"/\1/')
  if [[ -z "$last_ts" ]]; then
    return 1
  fi
  local last_epoch
  last_epoch=$(date -d "$last_ts" +%s 2>/dev/null || echo 0)
  local now_epoch
  now_epoch=$(date +%s)
  local elapsed=$((now_epoch - last_epoch))
  [[ $elapsed -lt $COOLDOWN_SEC ]]
}

# ============================================================
# helper: yuino_response_result_audit.json connect (Kai commit 2bb425a 連動)
#   Kai-side で 「replied / read / unanswered」 mark 済 request は wake skip
# ============================================================

YUINO_RESULT_AUDIT_JSON="$HOME/.shared-ops/status/yuino_response_result_audit.json"

is_replied_or_read() {
  local request_id="$1"
  if [[ ! -f "$YUINO_RESULT_AUDIT_JSON" ]]; then
    return 1  # json 不在 = audit 連動なし、 通常通り actionable list
  fi
  # grep ベース (Windows + Git Bash で precision 動作確認済、 python3 は path translation 問題で skip)
  # JSON 構造: items[].request_id == request_id の直後 (1-3 line) に "result": "replied|read"
  grep -A 1 "\"request_id\": \"$request_id\"" "$YUINO_RESULT_AUDIT_JSON" 2>/dev/null | grep -qE '"result":\s*"(replied|read)"'
}

# ============================================================
# action: list (default)
# ============================================================

if [[ "$ACTION" == "list" || "$ACTION" == "--json" ]]; then
  ACTIONABLE=()
  COOLDOWN_SKIP=()
  NON_GREEN=()

  shopt -s nullglob
  for file in "$WAKE_QUEUE_DIR"/controlled_*.md; do
    if [[ ! -f "$file" ]]; then continue; fi
    REQUEST_ID=$(extract_field "$file" "request_id")
    BOARD_PATH=$(extract_field "$file" "board_path")
    SCORE=$(extract_field "$file" "score")
    SAFETY=$(extract_field "$file" "safety")
    GENERATED_AT=$(extract_field "$file" "generated_at")

    if [[ -z "$REQUEST_ID" ]]; then continue; fi

    # safety check
    if [[ "$SAFETY" != "green" ]]; then
      NON_GREEN+=("$REQUEST_ID|$SAFETY|$BOARD_PATH")
      continue
    fi

    # Yuino response result audit connect (Kai commit 2bb425a 連動)
    # replied / read mark 済の request は wake skip (Yuino-side で resolved 認識済)
    if is_replied_or_read "$REQUEST_ID"; then
      COOLDOWN_SKIP+=("$REQUEST_ID|$BOARD_PATH (resolved: replied/read in yuino_response_result_audit.json)")
      continue
    fi

    # cooldown check
    if is_cooldown_active "$REQUEST_ID"; then
      COOLDOWN_SKIP+=("$REQUEST_ID|$BOARD_PATH")
      continue
    fi

    ACTIONABLE+=("$REQUEST_ID|$BOARD_PATH|$SCORE|$GENERATED_AT")
  done
  shopt -u nullglob

  if [[ "$ACTION" == "--json" ]]; then
    # JSON output (minimum form)
    echo "{"
    echo "  \"actionable_count\": ${#ACTIONABLE[@]},"
    echo "  \"cooldown_skip_count\": ${#COOLDOWN_SKIP[@]},"
    echo "  \"non_green_count\": ${#NON_GREEN[@]},"
    echo "  \"actionable\": ["
    for i in "${!ACTIONABLE[@]}"; do
      IFS='|' read -r rid bpath score gen <<< "${ACTIONABLE[$i]}"
      sep=","
      [[ $i -eq $((${#ACTIONABLE[@]} - 1)) ]] && sep=""
      echo "    {\"request_id\":\"$rid\",\"board_path\":\"$bpath\",\"score\":\"$score\",\"generated_at\":\"$gen\"}$sep"
    done
    echo "  ]"
    echo "}"
  else
    # text output
    echo "================================================================"
    echo " zen_wake_queue_consume — Controlled Wake v0 Zen-side"
    echo "================================================================"
    echo ""
    echo "actionable wake requests (Green safety + cooldown 通過): ${#ACTIONABLE[@]} 件"
    for entry in "${ACTIONABLE[@]}"; do
      IFS='|' read -r rid bpath score gen <<< "$entry"
      echo "  📥 request_id=$rid"
      echo "     board: $bpath"
      echo "     score=$score、 generated=$gen"
      echo "     → action: Read board + 起稿 response + ./scripts/zen_wake_queue_consume.sh --archive $rid"
      echo ""
    done

    if [[ ${#COOLDOWN_SKIP[@]} -gt 0 ]]; then
      echo "cooldown skip (1 hour 内に処理済み): ${#COOLDOWN_SKIP[@]} 件"
      for entry in "${COOLDOWN_SKIP[@]}"; do
        IFS='|' read -r rid bpath <<< "$entry"
        echo "  ⏸ $rid (board: $bpath)"
      done
      echo ""
    fi

    if [[ ${#NON_GREEN[@]} -gt 0 ]]; then
      echo "non-green safety (owner 確認必要): ${#NON_GREEN[@]} 件"
      for entry in "${NON_GREEN[@]}"; do
        IFS='|' read -r rid safety bpath <<< "$entry"
        echo "  ⚠️ $rid safety=$safety (board: $bpath)"
      done
      echo ""
    fi

    if [[ ${#ACTIONABLE[@]} -eq 0 && ${#COOLDOWN_SKIP[@]} -eq 0 && ${#NON_GREEN[@]} -eq 0 ]]; then
      echo "🟢 wake-queue clean (request 不在)"
    fi
    echo "================================================================"
  fi
  exit 0
fi

# ============================================================
# action: archive (request_id 指定で processed/ に移動 + audit log 起稿)
# ============================================================

if [[ "$ACTION" == "--archive" ]]; then
  if [[ -z "$ARG" ]]; then
    echo "error: --archive requires request_id" >&2
    exit 1
  fi

  REQUEST_ID="$ARG"
  TARGET_FILE=""
  shopt -s nullglob
  for file in "$WAKE_QUEUE_DIR"/controlled_*.md; do
    if [[ -f "$file" ]] && grep -q "request_id: $REQUEST_ID" "$file" 2>/dev/null; then
      TARGET_FILE="$file"
      break
    fi
  done
  shopt -u nullglob

  if [[ -z "$TARGET_FILE" ]]; then
    echo "error: request_id $REQUEST_ID not found in wake-queue" >&2
    exit 1
  fi

  BASENAME=$(basename "$TARGET_FILE")
  TIMESTAMP=$(date -Iseconds)
  PROCESSED_PATH="$WAKE_PROCESSED_DIR/$BASENAME"

  # archive (move to processed/)
  mv "$TARGET_FILE" "$PROCESSED_PATH"

  # audit log entry (JSONL)
  cat >> "$WAKE_LOG_FILE" <<EOF
{"timestamp":"$TIMESTAMP","request_id":"$REQUEST_ID","action":"archived","status":"replied","processed_path":"$PROCESSED_PATH"}
EOF

  echo "[archive] $REQUEST_ID → $PROCESSED_PATH"
  echo "[audit] log appended: $WAKE_LOG_FILE"
  exit 0
fi

echo "error: unknown action: $ACTION" >&2
echo "usage: $0 [list | --json | --archive <request_id>]" >&2
exit 1
