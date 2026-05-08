#!/bin/bash
# zen_wake_queue_consume.sh — Yuino Controlled Wake v0 Zen-side consumer (contract 2026-05-08 reify)
#
# 起点:
#   - 2026-05-08 Kai-side Controlled Wake v0 reify (commit 89cc473) 連動
#   - 2026-05-08 21:53 Kai contract 確定 (commit 2f1a732)、 Zen-side consumer 12 step 固定
#
# 契約書:
#   - C:\Users\jk023\Desktop\nokaze-aira\docs\zen_controlled_wake_consumer_contract_2026-05-08.md
#   - C:\Users\jk023\.shared-ops\board\2026-05-08_kai_zen_controlled_wake_consumer_contract.md
#
# 連動:
#   - scripts/zen_session_lockfile.sh (主 session 二重起動 detect、 別 lockfile)
#   - scripts/zen_continuous_active_loop.sh (continuous active continue protocol)
#
# 役割:
#   ~/.shared-ops/wake-queue/zen/controlled_*.md を read、 各 wake request の board file を surface、
#   Zen 主 session が response 起稿後に result marker (yuino.wake_result.v1) 起稿 + queue file を archive。
#
# spec:
#   - result marker: ~/.shared-ops/wake-results/zen/<request_id>.json (schema_version=yuino.wake_result.v1)
#   - lockfile: ~/.shared-ops/locks/zen-controlled-wake.lock.json (PID + acquired_at、 stale 30 min)
#   - status values: read | replied | failed | skipped
#   - cooldown: request_id 別 1 hour (yuino_response_result_audit.json connect 経由 replied/read skip)
#
# usage:
#   ./scripts/zen_wake_queue_consume.sh                                          # list (default)
#   ./scripts/zen_wake_queue_consume.sh --json                                   # JSON form
#   ./scripts/zen_wake_queue_consume.sh --archive <request_id>                   # processed/ archive (result marker 後のみ)
#   ./scripts/zen_wake_queue_consume.sh --read-marker <request_id>               # work 開始前 read marker
#   ./scripts/zen_wake_queue_consume.sh --replied-marker <request_id> <board>    # response 起稿後 replied marker
#   ./scripts/zen_wake_queue_consume.sh --failed-marker <request_id> <error>     # fail closed marker
#   ./scripts/zen_wake_queue_consume.sh --skipped-marker <request_id> <reason>   # intentional skip marker
#   ./scripts/zen_wake_queue_consume.sh --lock-acquire                           # consumer lockfile acquire
#   ./scripts/zen_wake_queue_consume.sh --lock-release                           # consumer lockfile release
#   ./scripts/zen_wake_queue_consume.sh --lock-status                            # consumer lockfile status (json)
#   ./scripts/zen_wake_queue_consume.sh --dry-run <request_id>                   # end-to-end dry run
#
# exit code:
#   0 = success
#   1 = generic error (arg 不足 / file not found 等)
#   2 = lock conflict (active lock 存在で acquire 失敗)
#   3 = schema validation 失敗 (dry-run 内)

set -uo pipefail

ACTION="${1:-list}"
ARG1="${2:-}"
ARG2="${3:-}"

WAKE_QUEUE_DIR="$HOME/.shared-ops/wake-queue/zen"
WAKE_LOG_DIR="$HOME/.shared-ops/wake-log"
WAKE_LOG_FILE="$WAKE_LOG_DIR/zen_wake_log.jsonl"
WAKE_PROCESSED_DIR="$WAKE_QUEUE_DIR/processed"
WAKE_RESULTS_DIR="$HOME/.shared-ops/wake-results/zen"
LOCKS_DIR="$HOME/.shared-ops/locks"
CONSUMER_LOCKFILE="$LOCKS_DIR/zen-controlled-wake.lock.json"
COOLDOWN_SEC=3600          # 1 hour cooldown (request_id 別)
LOCK_STALE_SEC=1800        # 30 min stale lock (contract spec)

# ============================================================
# directory 準備 (sandbox safe、 mkdir -p で存在しても OK)
# ============================================================

mkdir -p "$WAKE_QUEUE_DIR" "$WAKE_LOG_DIR" "$WAKE_PROCESSED_DIR" "$WAKE_RESULTS_DIR" "$LOCKS_DIR" 2>/dev/null

# ============================================================
# helper: ISO 8601 timestamp (UTC、 milli prec)
# ============================================================

iso8601_now() {
  # UTC + millisec、 schema example に合わせる: 2026-05-08T00:00:00.000Z
  date -u +"%Y-%m-%dT%H:%M:%S.000Z"
}

# ============================================================
# helper: extract frontmatter field (controlled_*.md の `- field: value` form)
# ============================================================

extract_field() {
  local file="$1"
  local field="$2"
  grep -E "^- $field:" "$file" 2>/dev/null | head -1 | sed -E "s/^- $field:\s*//" | tr -d '\r'
}

# ============================================================
# helper: locate request file by request_id
# ============================================================

find_request_file() {
  local request_id="$1"
  local file
  shopt -s nullglob
  for file in "$WAKE_QUEUE_DIR"/controlled_*.md; do
    if [[ -f "$file" ]] && grep -q "request_id: $request_id" "$file" 2>/dev/null; then
      echo "$file"
      shopt -u nullglob
      return 0
    fi
  done
  shopt -u nullglob
  # processed dir も確認 (archive 後 marker 上書き path)
  for file in "$WAKE_PROCESSED_DIR"/controlled_*.md; do
    if [[ -f "$file" ]] && grep -q "request_id: $request_id" "$file" 2>/dev/null; then
      echo "$file"
      return 0
    fi
  done
  return 1
}

# ============================================================
# helper: cooldown check (request_id 別 1 hour cooldown、 wake-log 経由)
# ============================================================

is_cooldown_active() {
  local request_id="$1"
  if [[ ! -f "$WAKE_LOG_FILE" ]]; then
    return 1
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
#   Kai-side で 「replied / read」 mark 済 request は wake skip
# ============================================================

YUINO_RESULT_AUDIT_JSON="$HOME/.shared-ops/status/yuino_response_result_audit.json"

is_replied_or_read() {
  local request_id="$1"
  if [[ ! -f "$YUINO_RESULT_AUDIT_JSON" ]]; then
    return 1
  fi
  grep -A 1 "\"request_id\": \"$request_id\"" "$YUINO_RESULT_AUDIT_JSON" 2>/dev/null | grep -qE '"result":\s*"(replied|read)"'
}

# ============================================================
# helper: result marker write (schema = yuino.wake_result.v1)
#   args: request_id, status, source_wake_path, response_board_path (or "null"), notes_csv, evidence_csv
# ============================================================

write_result_marker() {
  local request_id="$1"
  local status="$2"
  local source_wake_path="$3"
  local response_board_path="$4"
  local notes_csv="$5"
  local evidence_csv="$6"

  local marker_path="$WAKE_RESULTS_DIR/${request_id}.json"
  local generated_at
  generated_at=$(iso8601_now)

  # Windows path backslash escape (JSON 内 "\\" form)
  local source_escaped
  source_escaped=$(echo "$source_wake_path" | sed 's#\\#\\\\#g')

  # response_board_path: "null" string なら JSON null、 それ以外は string + escape
  local response_field
  if [[ "$response_board_path" == "null" || -z "$response_board_path" ]]; then
    response_field="null"
  else
    local response_escaped
    response_escaped=$(echo "$response_board_path" | sed 's#\\#\\\\#g')
    response_field="\"$response_escaped\""
  fi

  # notes / evidence CSV を JSON array に展開
  local notes_array="[]"
  if [[ -n "$notes_csv" ]]; then
    notes_array="["
    local first=1
    local note
    IFS='|' read -ra NOTE_ARR <<< "$notes_csv"
    for note in "${NOTE_ARR[@]}"; do
      [[ $first -eq 0 ]] && notes_array="$notes_array,"
      # JSON string escape (minimum: " と \)
      local note_escaped
      note_escaped=$(echo "$note" | sed 's#\\#\\\\#g; s#"#\\"#g')
      notes_array="$notes_array\"$note_escaped\""
      first=0
    done
    notes_array="$notes_array]"
  fi

  local evidence_array="[]"
  if [[ -n "$evidence_csv" ]]; then
    evidence_array="["
    local first=1
    local ev
    IFS='|' read -ra EV_ARR <<< "$evidence_csv"
    for ev in "${EV_ARR[@]}"; do
      [[ $first -eq 0 ]] && evidence_array="$evidence_array,"
      local ev_escaped
      ev_escaped=$(echo "$ev" | sed 's#\\#\\\\#g; s#"#\\"#g')
      evidence_array="$evidence_array\"$ev_escaped\""
      first=0
    done
    evidence_array="$evidence_array]"
  fi

  cat > "$marker_path" <<EOF
{
  "schema_version": "yuino.wake_result.v1",
  "generated_at": "$generated_at",
  "request_id": "$request_id",
  "target": "zen",
  "status": "$status",
  "source_wake_path": "$source_escaped",
  "response_board_path": $response_field,
  "notes": $notes_array,
  "evidence": $evidence_array
}
EOF

  echo "$marker_path"
}

# ============================================================
# helper: lockfile acquire (consumer 専用 lockfile、 主 session lockfile とは別)
# ============================================================

acquire_consumer_lock() {
  if [[ -f "$CONSUMER_LOCKFILE" ]]; then
    # stale check (30 min)
    local age_sec
    age_sec=$(( $(date +%s) - $(stat -c %Y "$CONSUMER_LOCKFILE" 2>/dev/null || echo 0) ))
    if [[ $age_sec -lt $LOCK_STALE_SEC ]]; then
      echo "[lock-acquire] active lock detect (age=${age_sec}s < ${LOCK_STALE_SEC}s)、 acquire 失敗" >&2
      echo "  既存 lock content:" >&2
      cat "$CONSUMER_LOCKFILE" >&2
      return 2
    fi
    echo "[lock-acquire] stale lock detect (age=${age_sec}s >= ${LOCK_STALE_SEC}s)、 takeover" >&2
    rm -f "$CONSUMER_LOCKFILE"
  fi

  local generated_at
  generated_at=$(iso8601_now)
  cat > "$CONSUMER_LOCKFILE" <<EOF
{
  "schema_version": "yuino.consumer_lock.v1",
  "pid": $$,
  "ppid": $PPID,
  "acquired_at": "$generated_at",
  "host": "$(hostname 2>/dev/null || echo unknown)",
  "purpose": "zen_wake_queue_consume controlled wake processing"
}
EOF
  echo "[lock-acquire] acquired: $CONSUMER_LOCKFILE (pid=$$)"
  return 0
}

release_consumer_lock() {
  if [[ ! -f "$CONSUMER_LOCKFILE" ]]; then
    echo "[lock-release] lock 既に不在、 skip"
    return 0
  fi
  rm -f "$CONSUMER_LOCKFILE"
  echo "[lock-release] released: $CONSUMER_LOCKFILE"
  return 0
}

consumer_lock_status() {
  if [[ ! -f "$CONSUMER_LOCKFILE" ]]; then
    echo '{"status":"no_lock","lockfile":"'"$CONSUMER_LOCKFILE"'"}'
    return 0
  fi
  local age_sec
  age_sec=$(( $(date +%s) - $(stat -c %Y "$CONSUMER_LOCKFILE" 2>/dev/null || echo 0) ))
  if [[ $age_sec -ge $LOCK_STALE_SEC ]]; then
    echo '{"status":"stale","age_sec":'$age_sec',"lockfile":"'"$CONSUMER_LOCKFILE"'"}'
    return 0
  fi
  echo '{"status":"active","age_sec":'$age_sec',"lockfile":"'"$CONSUMER_LOCKFILE"'"}'
  return 0
}

# ============================================================
# action: --lock-acquire / --lock-release / --lock-status
# ============================================================

if [[ "$ACTION" == "--lock-acquire" ]]; then
  acquire_consumer_lock
  exit $?
fi

if [[ "$ACTION" == "--lock-release" ]]; then
  release_consumer_lock
  exit $?
fi

if [[ "$ACTION" == "--lock-status" ]]; then
  consumer_lock_status
  exit 0
fi

# ============================================================
# action: --read-marker <request_id>
# ============================================================

if [[ "$ACTION" == "--read-marker" ]]; then
  if [[ -z "$ARG1" ]]; then
    echo "error: --read-marker requires <request_id>" >&2
    exit 1
  fi
  REQUEST_ID="$ARG1"
  REQUEST_FILE=$(find_request_file "$REQUEST_ID" || true)
  if [[ -z "$REQUEST_FILE" ]]; then
    echo "error: request_id $REQUEST_ID not found in wake-queue or processed" >&2
    exit 1
  fi
  # Windows-style path で source_wake_path を書く (contract example 整合)
  WIN_PATH=$(echo "$REQUEST_FILE" | sed -E 's#^/c/#C:\\#; s#/#\\#g')
  MARKER=$(write_result_marker "$REQUEST_ID" "read" "$WIN_PATH" "null" "consumer started processing" "request_file=$REQUEST_FILE")
  echo "[read-marker] $MARKER"
  exit 0
fi

# ============================================================
# action: --replied-marker <request_id> <response_board_path>
# ============================================================

if [[ "$ACTION" == "--replied-marker" ]]; then
  if [[ -z "$ARG1" || -z "$ARG2" ]]; then
    echo "error: --replied-marker requires <request_id> <response_board_path>" >&2
    exit 1
  fi
  REQUEST_ID="$ARG1"
  BOARD_PATH="$ARG2"
  REQUEST_FILE=$(find_request_file "$REQUEST_ID" || true)
  if [[ -z "$REQUEST_FILE" ]]; then
    echo "error: request_id $REQUEST_ID not found in wake-queue or processed" >&2
    exit 1
  fi
  WIN_SOURCE=$(echo "$REQUEST_FILE" | sed -E 's#^/c/#C:\\#; s#/#\\#g')
  # board_path は Windows form で受領前提、 そのまま書き込み (Unix path なら convert)
  WIN_BOARD="$BOARD_PATH"
  if [[ "$BOARD_PATH" == /c/* ]]; then
    WIN_BOARD=$(echo "$BOARD_PATH" | sed -E 's#^/c/#C:\\#; s#/#\\#g')
  fi
  MARKER=$(write_result_marker "$REQUEST_ID" "replied" "$WIN_SOURCE" "$WIN_BOARD" "consumer wrote board response" "response_file=$BOARD_PATH")
  echo "[replied-marker] $MARKER"
  # audit log entry (JSONL)
  TIMESTAMP=$(date -Iseconds)
  cat >> "$WAKE_LOG_FILE" <<EOF
{"timestamp":"$TIMESTAMP","request_id":"$REQUEST_ID","action":"replied","status":"replied","response_board_path":"$BOARD_PATH"}
EOF
  exit 0
fi

# ============================================================
# action: --failed-marker <request_id> <error_summary>
# ============================================================

if [[ "$ACTION" == "--failed-marker" ]]; then
  if [[ -z "$ARG1" ]]; then
    echo "error: --failed-marker requires <request_id> [error_summary]" >&2
    exit 1
  fi
  REQUEST_ID="$ARG1"
  ERROR_SUMMARY="${ARG2:-unknown error}"
  REQUEST_FILE=$(find_request_file "$REQUEST_ID" || true)
  if [[ -z "$REQUEST_FILE" ]]; then
    echo "error: request_id $REQUEST_ID not found in wake-queue or processed" >&2
    exit 1
  fi
  WIN_SOURCE=$(echo "$REQUEST_FILE" | sed -E 's#^/c/#C:\\#; s#/#\\#g')
  MARKER=$(write_result_marker "$REQUEST_ID" "failed" "$WIN_SOURCE" "null" "$ERROR_SUMMARY|fail closed (no retry)" "error=$ERROR_SUMMARY")
  echo "[failed-marker] $MARKER"
  TIMESTAMP=$(date -Iseconds)
  cat >> "$WAKE_LOG_FILE" <<EOF
{"timestamp":"$TIMESTAMP","request_id":"$REQUEST_ID","action":"failed","status":"failed","error":"$ERROR_SUMMARY"}
EOF
  exit 0
fi

# ============================================================
# action: --skipped-marker <request_id> <reason>
# ============================================================

if [[ "$ACTION" == "--skipped-marker" ]]; then
  if [[ -z "$ARG1" ]]; then
    echo "error: --skipped-marker requires <request_id> [reason]" >&2
    exit 1
  fi
  REQUEST_ID="$ARG1"
  REASON="${ARG2:-skipped without reason}"
  REQUEST_FILE=$(find_request_file "$REQUEST_ID" || true)
  if [[ -z "$REQUEST_FILE" ]]; then
    echo "error: request_id $REQUEST_ID not found in wake-queue or processed" >&2
    exit 1
  fi
  WIN_SOURCE=$(echo "$REQUEST_FILE" | sed -E 's#^/c/#C:\\#; s#/#\\#g')
  MARKER=$(write_result_marker "$REQUEST_ID" "skipped" "$WIN_SOURCE" "null" "$REASON|intentional skip" "reason=$REASON")
  echo "[skipped-marker] $MARKER"
  TIMESTAMP=$(date -Iseconds)
  cat >> "$WAKE_LOG_FILE" <<EOF
{"timestamp":"$TIMESTAMP","request_id":"$REQUEST_ID","action":"skipped","status":"skipped","reason":"$REASON"}
EOF
  exit 0
fi

# ============================================================
# action: --dry-run <request_id>
#   end-to-end dry run path (lockfile → read marker → simulated response → replied marker → release)
# ============================================================

if [[ "$ACTION" == "--dry-run" ]]; then
  if [[ -z "$ARG1" ]]; then
    echo "error: --dry-run requires <request_id>" >&2
    exit 1
  fi
  REQUEST_ID="$ARG1"
  echo "[dry-run] starting end-to-end dry run for request_id=$REQUEST_ID"

  # step 1: lock acquire
  echo "[dry-run] step 1/7: lock acquire"
  if ! acquire_consumer_lock; then
    echo "[dry-run] FAIL step 1: lock conflict" >&2
    exit 3
  fi

  # step 2: locate request
  echo "[dry-run] step 2/7: locate request file"
  REQUEST_FILE=$(find_request_file "$REQUEST_ID" || true)
  if [[ -z "$REQUEST_FILE" ]]; then
    echo "[dry-run] FAIL step 2: request_id not found" >&2
    release_consumer_lock
    exit 3
  fi
  echo "[dry-run]   request_file=$REQUEST_FILE"

  # step 3: read marker
  echo "[dry-run] step 3/7: write read marker"
  WIN_PATH=$(echo "$REQUEST_FILE" | sed -E 's#^/c/#C:\\#; s#/#\\#g')
  READ_MARKER=$(write_result_marker "$REQUEST_ID" "read" "$WIN_PATH" "null" "dry-run read marker" "step=3")
  echo "[dry-run]   $READ_MARKER"

  # step 4: simulated board response (dummy file)
  echo "[dry-run] step 4/7: simulate board response (dummy file)"
  DUMMY_BOARD_DIR="$HOME/.shared-ops/board"
  mkdir -p "$DUMMY_BOARD_DIR"
  DUMMY_BOARD_PATH="$DUMMY_BOARD_DIR/$(date +%Y-%m-%d)_zen_dryrun_response_${REQUEST_ID}.md"
  cat > "$DUMMY_BOARD_PATH" <<EOF
# Zen dry-run response

- request_id: $REQUEST_ID
- generated_at: $(iso8601_now)
- response: ACK
- reasoning: dry-run simulated response (not a real reply)
EOF
  echo "[dry-run]   dummy board: $DUMMY_BOARD_PATH"

  # step 5: replied marker
  echo "[dry-run] step 5/7: write replied marker"
  WIN_BOARD=$(echo "$DUMMY_BOARD_PATH" | sed -E 's#^/c/#C:\\#; s#/#\\#g')
  REPLIED_MARKER=$(write_result_marker "$REQUEST_ID" "replied" "$WIN_PATH" "$WIN_BOARD" "dry-run replied marker" "step=5")
  echo "[dry-run]   $REPLIED_MARKER"

  # step 6: schema validate (minimum: schema_version + status + non-null response_board_path)
  echo "[dry-run] step 6/7: validate result marker schema"
  MARKER_FILE="$WAKE_RESULTS_DIR/${REQUEST_ID}.json"
  if ! grep -q '"schema_version": "yuino.wake_result.v1"' "$MARKER_FILE"; then
    echo "[dry-run] FAIL step 6: schema_version missing" >&2
    release_consumer_lock
    exit 3
  fi
  if ! grep -q '"status": "replied"' "$MARKER_FILE"; then
    echo "[dry-run] FAIL step 6: status != replied" >&2
    release_consumer_lock
    exit 3
  fi
  if grep -q '"response_board_path": null' "$MARKER_FILE"; then
    echo "[dry-run] FAIL step 6: response_board_path is null in replied marker" >&2
    release_consumer_lock
    exit 3
  fi
  echo "[dry-run]   schema valid: schema_version + status=replied + response_board_path non-null"

  # step 7: lock release
  echo "[dry-run] step 7/7: lock release"
  release_consumer_lock

  # cleanup (dummy board file 削除、 sample request は archive で残す)
  echo "[dry-run] cleanup: remove dummy board file"
  rm -f "$DUMMY_BOARD_PATH"

  echo "[dry-run] PASS: all 7 steps successful for request_id=$REQUEST_ID"
  echo "[dry-run] result marker preserved: $MARKER_FILE"
  exit 0
fi

# ============================================================
# action: list / --json (default)
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

    if [[ "$SAFETY" != "green" ]]; then
      NON_GREEN+=("$REQUEST_ID|$SAFETY|$BOARD_PATH")
      continue
    fi

    if is_replied_or_read "$REQUEST_ID"; then
      COOLDOWN_SKIP+=("$REQUEST_ID|$BOARD_PATH (resolved: replied/read in yuino_response_result_audit.json)")
      continue
    fi

    if is_cooldown_active "$REQUEST_ID"; then
      COOLDOWN_SKIP+=("$REQUEST_ID|$BOARD_PATH")
      continue
    fi

    ACTIONABLE+=("$REQUEST_ID|$BOARD_PATH|$SCORE|$GENERATED_AT")
  done
  shopt -u nullglob

  if [[ "$ACTION" == "--json" ]]; then
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
    echo "================================================================"
    echo " zen_wake_queue_consume — Controlled Wake v0 Zen-side"
    echo "================================================================"
    echo ""
    echo "actionable wake requests (Green safety + cooldown 通過): ${#ACTIONABLE[@]} 件"
    for entry in "${ACTIONABLE[@]}"; do
      IFS='|' read -r rid bpath score gen <<< "$entry"
      echo "  request_id=$rid"
      echo "    board: $bpath"
      echo "    score=$score generated=$gen"
      echo "    action: --read-marker $rid -> Read board -> 起稿 response -> --replied-marker $rid <board> -> --archive $rid"
      echo ""
    done

    if [[ ${#COOLDOWN_SKIP[@]} -gt 0 ]]; then
      echo "cooldown skip (1 hour 内に処理済み or replied/read): ${#COOLDOWN_SKIP[@]} 件"
      for entry in "${COOLDOWN_SKIP[@]}"; do
        IFS='|' read -r rid bpath <<< "$entry"
        echo "  $rid (board: $bpath)"
      done
      echo ""
    fi

    if [[ ${#NON_GREEN[@]} -gt 0 ]]; then
      echo "non-green safety (owner 確認必要): ${#NON_GREEN[@]} 件"
      for entry in "${NON_GREEN[@]}"; do
        IFS='|' read -r rid safety bpath <<< "$entry"
        echo "  $rid safety=$safety (board: $bpath)"
      done
      echo ""
    fi

    if [[ ${#ACTIONABLE[@]} -eq 0 && ${#COOLDOWN_SKIP[@]} -eq 0 && ${#NON_GREEN[@]} -eq 0 ]]; then
      echo "wake-queue clean (request 不在)"
    fi
    echo "================================================================"
  fi
  exit 0
fi

# ============================================================
# action: --archive (request_id 指定で processed/ 移動 + audit log)
#   note: contract spec 「Do not delete wake request files before writing a result marker」 に従い、
#         result marker write 後の archive 想定
# ============================================================

if [[ "$ACTION" == "--archive" ]]; then
  if [[ -z "$ARG1" ]]; then
    echo "error: --archive requires <request_id>" >&2
    exit 1
  fi

  REQUEST_ID="$ARG1"
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

  # contract guard: result marker 不在で archive すると Yuino audit が unanswered のままになる
  MARKER_FILE="$WAKE_RESULTS_DIR/${REQUEST_ID}.json"
  if [[ ! -f "$MARKER_FILE" ]]; then
    echo "warning: result marker 不在 ($MARKER_FILE)、 archive 先行は contract 違反候補" >&2
    echo "  --read-marker / --replied-marker / --failed-marker / --skipped-marker のいずれかを先に実行推奨" >&2
  fi

  BASENAME=$(basename "$TARGET_FILE")
  TIMESTAMP=$(date -Iseconds)
  PROCESSED_PATH="$WAKE_PROCESSED_DIR/$BASENAME"

  mv "$TARGET_FILE" "$PROCESSED_PATH"

  cat >> "$WAKE_LOG_FILE" <<EOF
{"timestamp":"$TIMESTAMP","request_id":"$REQUEST_ID","action":"archived","status":"replied","processed_path":"$PROCESSED_PATH"}
EOF

  echo "[archive] $REQUEST_ID -> $PROCESSED_PATH"
  echo "[audit] log appended: $WAKE_LOG_FILE"
  exit 0
fi

echo "error: unknown action: $ACTION" >&2
echo "usage: $0 [list | --json | --archive <id> | --read-marker <id> | --replied-marker <id> <board> | --failed-marker <id> <err> | --skipped-marker <id> <reason> | --lock-acquire | --lock-release | --lock-status | --dry-run <id>]" >&2
exit 1
