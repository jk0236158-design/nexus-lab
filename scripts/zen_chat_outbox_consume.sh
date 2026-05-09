#!/bin/bash
# zen_chat_outbox_consume.sh — Yuino chat_outbox/zen v0 Zen-side consumer
#
# 起点:
#   - 2026-05-09 Kai-side chat_outbox/zen v0 reify 完了 (commit dbd63c1)
#   - 完了報告: ~/.shared-ops/board/2026-05-09_kai_zen_chat_outbox_v0_implementation_complete.md
#   - Iwa 着手 (Zen 委任): chat_outbox consumer 起稿
#
# packet schema 参考:
#   - C:\Users\jk023\.shared-ops\chat_outbox\zen\task-*.md (frontmatter: YAML form、 status: pending|in_progress|completed|blocked|skipped)
#   - C:\Users\jk023\.shared-ops\status\yuino_chat_outbox.json (Kai-side が reify 済 status snapshot)
#
# 連動:
#   - scripts/zen_wake_queue_consume.sh (controlled wake consumer、 別 lockfile で並走)
#   - scripts/zen_chat_outbox_dry_run.sh (end-to-end dry run)
#
# 役割:
#   ~/.shared-ops/chat_outbox/zen/{task_id}.md を read、 status pending な packet を surface、
#   Zen 主 session が response 起稿後に result marker (yuino.chat_result.v0) 起稿 + packet を archive。
#
# spec:
#   - packet path: ~/.shared-ops/chat_outbox/zen/{task_id}.md (YAML frontmatter + body)
#   - result marker: ~/.shared-ops/chat_results/zen/{task_id}.json (schema_version=yuino.chat_result.v0)
#   - lockfile: ~/.shared-ops/locks/zen-chat-outbox.lock.json (wake-queue lockfile と並走、 別 lock)
#   - status enum: pending | in_progress | completed | blocked | skipped
#
# usage:
#   ./scripts/zen_chat_outbox_consume.sh                                          # list (default)
#   ./scripts/zen_chat_outbox_consume.sh --json                                   # JSON form (status: pending のみ)
#   ./scripts/zen_chat_outbox_consume.sh --lock-acquire                           # consumer lockfile acquire
#   ./scripts/zen_chat_outbox_consume.sh --lock-release                           # consumer lockfile release
#   ./scripts/zen_chat_outbox_consume.sh --lock-status                            # consumer lockfile status (json)
#   ./scripts/zen_chat_outbox_consume.sh --start <task_id>                       # status: pending -> in_progress、 started_at 記録
#   ./scripts/zen_chat_outbox_consume.sh --complete <task_id> <response_path>    # in_progress -> completed、 result marker 起稿
#   ./scripts/zen_chat_outbox_consume.sh --block <task_id> <reason>              # blocked、 result marker 起稿
#   ./scripts/zen_chat_outbox_consume.sh --skip <task_id> <reason>               # skipped、 result marker 起稿
#   ./scripts/zen_chat_outbox_consume.sh --archive <task_id>                     # processed/ 移動 (result marker preserve)
#   ./scripts/zen_chat_outbox_consume.sh --dry-run <task_id>                     # end-to-end dry run
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

CHAT_OUTBOX_DIR="$HOME/.shared-ops/chat_outbox/zen"
CHAT_OUTBOX_PROCESSED_DIR="$CHAT_OUTBOX_DIR/processed"
CHAT_RESULTS_DIR="$HOME/.shared-ops/chat_results/zen"
CHAT_LOG_DIR="$HOME/.shared-ops/chat-log"
CHAT_LOG_FILE="$CHAT_LOG_DIR/zen_chat_outbox_log.jsonl"
LOCKS_DIR="$HOME/.shared-ops/locks"
CONSUMER_LOCKFILE="$LOCKS_DIR/zen-chat-outbox.lock.json"
LOCK_STALE_SEC=1800        # 30 min stale lock (zen_wake_queue_consume と同 spec)

# ============================================================
# directory 準備 (sandbox safe、 mkdir -p で存在しても OK)
# ============================================================

mkdir -p "$CHAT_OUTBOX_DIR" "$CHAT_OUTBOX_PROCESSED_DIR" "$CHAT_RESULTS_DIR" "$CHAT_LOG_DIR" "$LOCKS_DIR" 2>/dev/null

# ============================================================
# helper: ISO 8601 timestamp (UTC、 milli prec)
# ============================================================

iso8601_now() {
  date -u +"%Y-%m-%dT%H:%M:%S.000Z"
}

# ============================================================
# helper: epoch seconds (started_at calc 用)
# ============================================================

epoch_now() {
  date +%s
}

# ============================================================
# helper: extract YAML frontmatter field (`key: value` form、 - prefix なし)
#   chat_outbox packet は YAML frontmatter (`---` wrap)、 wake-queue (`- field:`) と form 違う
# ============================================================

extract_yaml_field() {
  local file="$1"
  local field="$2"
  # frontmatter (`---` から `---` まで) の中で `field: value` を pick
  # awk で frontmatter range 限定、 余計な multi-line list は無視 (single value field のみ対象)
  awk -v f="$field" '
    BEGIN { in_fm=0; depth=0 }
    /^---[[:space:]]*$/ {
      depth++
      if (depth == 1) { in_fm=1; next }
      if (depth == 2) { in_fm=0; exit }
    }
    in_fm && $0 ~ "^"f":" {
      sub("^"f":[[:space:]]*", "")
      gsub(/\r/, "")
      gsub(/^[[:space:]]+|[[:space:]]+$/, "")
      # quote strip (single or double)
      gsub(/^"|"$/, "")
      gsub(/^'\''|'\''$/, "")
      print
      exit
    }
  ' "$file" 2>/dev/null
}

# ============================================================
# helper: locate packet file by task_id
#   chat_outbox/zen/{task_id}.md または processed/{task_id}.md
# ============================================================

find_packet_file() {
  local task_id="$1"
  local primary="$CHAT_OUTBOX_DIR/${task_id}.md"
  local processed="$CHAT_OUTBOX_PROCESSED_DIR/${task_id}.md"
  if [[ -f "$primary" ]]; then
    echo "$primary"
    return 0
  fi
  if [[ -f "$processed" ]]; then
    echo "$processed"
    return 0
  fi
  return 1
}

# ============================================================
# helper: rewrite YAML frontmatter status field
#   args: file, new_status
#   既存 status: <old> 行を status: <new> で置換、 frontmatter 内のみ
# ============================================================

rewrite_status() {
  local file="$1"
  local new_status="$2"
  local tmp
  tmp="$(mktemp)"
  awk -v ns="$new_status" '
    BEGIN { in_fm=0; depth=0 }
    /^---[[:space:]]*$/ {
      depth++
      if (depth == 1) in_fm=1
      else if (depth == 2) in_fm=0
      print
      next
    }
    in_fm && /^status:[[:space:]]/ {
      print "status: " ns
      next
    }
    { print }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

# ============================================================
# helper: append YAML frontmatter field (started_at / completed_at)
#   既存 field 不在時のみ追加、 frontmatter 末尾 (closing `---` 直前) に insert
# ============================================================

append_yaml_field() {
  local file="$1"
  local field="$2"
  local value="$3"
  # 既存有無 check
  if extract_yaml_field "$file" "$field" >/dev/null 2>&1; then
    local existing
    existing=$(extract_yaml_field "$file" "$field")
    if [[ -n "$existing" ]]; then
      # 既存行を sed で置換
      local tmp
      tmp="$(mktemp)"
      awk -v f="$field" -v v="$value" '
        BEGIN { in_fm=0; depth=0; replaced=0 }
        /^---[[:space:]]*$/ {
          depth++
          if (depth == 1) in_fm=1
          else if (depth == 2) in_fm=0
          print
          next
        }
        in_fm && $0 ~ "^"f":" && !replaced {
          print f": " v
          replaced=1
          next
        }
        { print }
      ' "$file" > "$tmp"
      mv "$tmp" "$file"
      return 0
    fi
  fi
  # 不在 -> closing `---` 直前 insert
  local tmp
  tmp="$(mktemp)"
  awk -v f="$field" -v v="$value" '
    BEGIN { in_fm=0; depth=0; inserted=0 }
    /^---[[:space:]]*$/ {
      depth++
      if (depth == 1) { in_fm=1; print; next }
      if (depth == 2 && !inserted) {
        print f": " v
        inserted=1
        in_fm=0
        print
        next
      }
    }
    { print }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

# ============================================================
# helper: result marker write (schema = yuino.chat_result.v0)
#   args: task_id, status, started_at, completed_at, response_paths_csv (| 区切り、 "null" で null array), evidence_csv, notes_csv
# ============================================================

write_result_marker() {
  local task_id="$1"
  local status="$2"
  local started_at="$3"
  local completed_at="$4"
  local response_paths_csv="$5"
  local evidence_csv="$6"
  local notes_csv="$7"

  local marker_path="$CHAT_RESULTS_DIR/${task_id}.json"

  # duration_seconds calc (started_at + completed_at が ISO 8601 で両方ある時のみ)
  local duration_field="null"
  if [[ -n "$started_at" && -n "$completed_at" && "$started_at" != "null" && "$completed_at" != "null" ]]; then
    local s_epoch c_epoch
    s_epoch=$(date -d "$started_at" +%s 2>/dev/null || echo "")
    c_epoch=$(date -d "$completed_at" +%s 2>/dev/null || echo "")
    if [[ -n "$s_epoch" && -n "$c_epoch" ]]; then
      duration_field=$((c_epoch - s_epoch))
    fi
  fi

  # started_at / completed_at JSON field (string or null)
  local started_field="null"
  if [[ -n "$started_at" && "$started_at" != "null" ]]; then
    started_field="\"$started_at\""
  fi
  local completed_field="null"
  if [[ -n "$completed_at" && "$completed_at" != "null" ]]; then
    completed_field="\"$completed_at\""
  fi

  # response_paths array
  local response_paths_array="[]"
  if [[ -n "$response_paths_csv" && "$response_paths_csv" != "null" ]]; then
    response_paths_array="["
    local first=1
    local p
    IFS='|' read -ra P_ARR <<< "$response_paths_csv"
    for p in "${P_ARR[@]}"; do
      [[ $first -eq 0 ]] && response_paths_array="$response_paths_array,"
      local p_escaped
      p_escaped=$(printf '%s' "$p" | sed 's#\\#\\\\#g; s#"#\\"#g')
      response_paths_array="$response_paths_array\"$p_escaped\""
      first=0
    done
    response_paths_array="$response_paths_array]"
  fi

  # evidence array
  local evidence_array="[]"
  if [[ -n "$evidence_csv" && "$evidence_csv" != "null" ]]; then
    evidence_array="["
    local first=1
    local ev
    IFS='|' read -ra EV_ARR <<< "$evidence_csv"
    for ev in "${EV_ARR[@]}"; do
      [[ $first -eq 0 ]] && evidence_array="$evidence_array,"
      local ev_escaped
      ev_escaped=$(printf '%s' "$ev" | sed 's#\\#\\\\#g; s#"#\\"#g')
      evidence_array="$evidence_array\"$ev_escaped\""
      first=0
    done
    evidence_array="$evidence_array]"
  fi

  # notes array
  local notes_array="[]"
  if [[ -n "$notes_csv" && "$notes_csv" != "null" ]]; then
    notes_array="["
    local first=1
    local note
    IFS='|' read -ra NOTE_ARR <<< "$notes_csv"
    for note in "${NOTE_ARR[@]}"; do
      [[ $first -eq 0 ]] && notes_array="$notes_array,"
      local note_escaped
      note_escaped=$(printf '%s' "$note" | sed 's#\\#\\\\#g; s#"#\\"#g')
      notes_array="$notes_array\"$note_escaped\""
      first=0
    done
    notes_array="$notes_array]"
  fi

  cat > "$marker_path" <<EOF
{
  "schema_version": "yuino.chat_result.v0",
  "task_id": "$task_id",
  "target": "zen",
  "status": "$status",
  "started_at": $started_field,
  "completed_at": $completed_field,
  "response_paths": $response_paths_array,
  "evidence": $evidence_array,
  "follow_up_needed": false,
  "next_question_for_jun": null,
  "provider_session_id": null,
  "duration_seconds": $duration_field,
  "notes": $notes_array
}
EOF

  echo "$marker_path"
}

# ============================================================
# helper: append audit log entry (JSONL)
# ============================================================

append_log() {
  local task_id="$1"
  local action="$2"
  local status="$3"
  local extra="$4"  # optional KEY=VALUE pair string、 JSON 内に挿入
  local ts
  ts=$(date -Iseconds)
  local extra_field=""
  if [[ -n "$extra" ]]; then
    extra_field=",$extra"
  fi
  cat >> "$CHAT_LOG_FILE" <<EOF
{"timestamp":"$ts","task_id":"$task_id","action":"$action","status":"$status"$extra_field}
EOF
}

# ============================================================
# helper: lockfile acquire (consumer 専用 lockfile、 wake-queue lockfile とは別 path)
# ============================================================

acquire_consumer_lock() {
  if [[ -f "$CONSUMER_LOCKFILE" ]]; then
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
  "purpose": "zen_chat_outbox_consume chat_outbox processing"
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
# helper: convert path (Unix /c/... -> Windows C:\...) optional
#   board_path や response_path は Windows form / Unix form 両入力 OK
#   result marker JSON 内は Windows form (Kai schema example 整合)
# ============================================================

to_windows_path() {
  local p="$1"
  if [[ "$p" == /c/* ]]; then
    echo "$p" | sed -E 's#^/c/#C:/#'
  else
    echo "$p"
  fi
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
# action: --start <task_id>
#   status: pending -> in_progress、 started_at 記録
# ============================================================

if [[ "$ACTION" == "--start" ]]; then
  if [[ -z "$ARG1" ]]; then
    echo "error: --start requires <task_id>" >&2
    exit 1
  fi
  TASK_ID="$ARG1"
  PACKET_FILE=$(find_packet_file "$TASK_ID" || true)
  if [[ -z "$PACKET_FILE" ]]; then
    echo "error: task_id $TASK_ID not found in chat_outbox or processed" >&2
    exit 1
  fi
  CURRENT_STATUS=$(extract_yaml_field "$PACKET_FILE" "status")
  if [[ "$CURRENT_STATUS" != "pending" ]]; then
    echo "warning: status != pending (current=$CURRENT_STATUS)、 transition は記録するが pending 起点想定" >&2
  fi
  STARTED_AT=$(iso8601_now)
  rewrite_status "$PACKET_FILE" "in_progress"
  append_yaml_field "$PACKET_FILE" "started_at" "$STARTED_AT"
  append_log "$TASK_ID" "start" "in_progress" "\"started_at\":\"$STARTED_AT\""
  echo "[start] task_id=$TASK_ID status=in_progress started_at=$STARTED_AT"
  echo "        packet: $PACKET_FILE"
  exit 0
fi

# ============================================================
# action: --complete <task_id> <response_path>
#   in_progress -> completed、 result marker 起稿 (response_paths array に response_path)
# ============================================================

if [[ "$ACTION" == "--complete" ]]; then
  if [[ -z "$ARG1" || -z "$ARG2" ]]; then
    echo "error: --complete requires <task_id> <response_path>" >&2
    exit 1
  fi
  TASK_ID="$ARG1"
  RESPONSE_PATH="$ARG2"
  PACKET_FILE=$(find_packet_file "$TASK_ID" || true)
  if [[ -z "$PACKET_FILE" ]]; then
    echo "error: task_id $TASK_ID not found in chat_outbox or processed" >&2
    exit 1
  fi

  STARTED_AT=$(extract_yaml_field "$PACKET_FILE" "started_at")
  if [[ -z "$STARTED_AT" ]]; then
    # --start 飛ばした場合の fallback: completed_at と同 timestamp で代替
    STARTED_AT=$(iso8601_now)
    append_yaml_field "$PACKET_FILE" "started_at" "$STARTED_AT"
  fi
  COMPLETED_AT=$(iso8601_now)
  rewrite_status "$PACKET_FILE" "completed"
  append_yaml_field "$PACKET_FILE" "completed_at" "$COMPLETED_AT"

  WIN_RESPONSE=$(to_windows_path "$RESPONSE_PATH")
  MARKER=$(write_result_marker "$TASK_ID" "completed" "$STARTED_AT" "$COMPLETED_AT" "$WIN_RESPONSE" "board response written" "")
  append_log "$TASK_ID" "complete" "completed" "\"completed_at\":\"$COMPLETED_AT\",\"response_path\":\"$WIN_RESPONSE\""
  echo "[complete] task_id=$TASK_ID status=completed completed_at=$COMPLETED_AT"
  echo "           response: $WIN_RESPONSE"
  echo "           marker: $MARKER"
  exit 0
fi

# ============================================================
# action: --block <task_id> <reason>
#   blocked、 result marker 起稿 (notes に reason)
# ============================================================

if [[ "$ACTION" == "--block" ]]; then
  if [[ -z "$ARG1" ]]; then
    echo "error: --block requires <task_id> [reason]" >&2
    exit 1
  fi
  TASK_ID="$ARG1"
  REASON="${ARG2:-blocked without reason}"
  PACKET_FILE=$(find_packet_file "$TASK_ID" || true)
  if [[ -z "$PACKET_FILE" ]]; then
    echo "error: task_id $TASK_ID not found in chat_outbox or processed" >&2
    exit 1
  fi
  STARTED_AT=$(extract_yaml_field "$PACKET_FILE" "started_at")
  COMPLETED_AT=$(iso8601_now)
  rewrite_status "$PACKET_FILE" "blocked"
  append_yaml_field "$PACKET_FILE" "completed_at" "$COMPLETED_AT"

  MARKER=$(write_result_marker "$TASK_ID" "blocked" "$STARTED_AT" "$COMPLETED_AT" "null" "blocked|$REASON" "$REASON")
  append_log "$TASK_ID" "block" "blocked" "\"reason\":\"$REASON\""
  echo "[block] task_id=$TASK_ID status=blocked reason=$REASON"
  echo "        marker: $MARKER"
  exit 0
fi

# ============================================================
# action: --skip <task_id> <reason>
#   skipped、 result marker 起稿 (notes に reason)
# ============================================================

if [[ "$ACTION" == "--skip" ]]; then
  if [[ -z "$ARG1" ]]; then
    echo "error: --skip requires <task_id> [reason]" >&2
    exit 1
  fi
  TASK_ID="$ARG1"
  REASON="${ARG2:-skipped without reason}"
  PACKET_FILE=$(find_packet_file "$TASK_ID" || true)
  if [[ -z "$PACKET_FILE" ]]; then
    echo "error: task_id $TASK_ID not found in chat_outbox or processed" >&2
    exit 1
  fi
  STARTED_AT=$(extract_yaml_field "$PACKET_FILE" "started_at")
  COMPLETED_AT=$(iso8601_now)
  rewrite_status "$PACKET_FILE" "skipped"
  append_yaml_field "$PACKET_FILE" "completed_at" "$COMPLETED_AT"

  MARKER=$(write_result_marker "$TASK_ID" "skipped" "$STARTED_AT" "$COMPLETED_AT" "null" "skipped|$REASON" "$REASON")
  append_log "$TASK_ID" "skip" "skipped" "\"reason\":\"$REASON\""
  echo "[skip] task_id=$TASK_ID status=skipped reason=$REASON"
  echo "       marker: $MARKER"
  exit 0
fi

# ============================================================
# action: --archive <task_id>
#   chat_outbox/zen/processed/ 移動 (result marker は preserve)
# ============================================================

if [[ "$ACTION" == "--archive" ]]; then
  if [[ -z "$ARG1" ]]; then
    echo "error: --archive requires <task_id>" >&2
    exit 1
  fi
  TASK_ID="$ARG1"
  TARGET_FILE="$CHAT_OUTBOX_DIR/${TASK_ID}.md"
  if [[ ! -f "$TARGET_FILE" ]]; then
    # processed に既にあれば idempotent OK
    if [[ -f "$CHAT_OUTBOX_PROCESSED_DIR/${TASK_ID}.md" ]]; then
      echo "[archive] task_id=$TASK_ID 既に processed/ 配下、 skip"
      exit 0
    fi
    echo "error: task_id $TASK_ID packet not found in $CHAT_OUTBOX_DIR" >&2
    exit 1
  fi

  # contract guard: result marker 不在で archive すると Yuino audit が unanswered のまま
  MARKER_FILE="$CHAT_RESULTS_DIR/${TASK_ID}.json"
  if [[ ! -f "$MARKER_FILE" ]]; then
    echo "warning: result marker 不在 ($MARKER_FILE)、 archive 先行は Home Summary 不一致候補" >&2
    echo "  --complete / --block / --skip のいずれかを先に実行推奨" >&2
  fi

  PROCESSED_PATH="$CHAT_OUTBOX_PROCESSED_DIR/${TASK_ID}.md"
  mv "$TARGET_FILE" "$PROCESSED_PATH"
  append_log "$TASK_ID" "archive" "archived" "\"processed_path\":\"$PROCESSED_PATH\""
  echo "[archive] task_id=$TASK_ID -> $PROCESSED_PATH"
  echo "[audit] log appended: $CHAT_LOG_FILE"
  exit 0
fi

# ============================================================
# action: --dry-run <task_id>
#   end-to-end dry run path (lock acquire -> start -> simulated response -> complete -> archive -> lock release)
# ============================================================

if [[ "$ACTION" == "--dry-run" ]]; then
  if [[ -z "$ARG1" ]]; then
    echo "error: --dry-run requires <task_id>" >&2
    exit 1
  fi
  TASK_ID="$ARG1"
  echo "[dry-run] starting end-to-end dry run for task_id=$TASK_ID"

  # step 1: lock acquire
  echo "[dry-run] step 1/8: lock acquire"
  if ! acquire_consumer_lock; then
    echo "[dry-run] FAIL step 1: lock conflict" >&2
    exit 3
  fi

  # step 2: locate packet
  echo "[dry-run] step 2/8: locate packet file"
  PACKET_FILE=$(find_packet_file "$TASK_ID" || true)
  if [[ -z "$PACKET_FILE" ]]; then
    echo "[dry-run] FAIL step 2: task_id not found" >&2
    release_consumer_lock
    exit 3
  fi
  echo "[dry-run]   packet: $PACKET_FILE"

  # step 3: --start (status pending -> in_progress)
  echo "[dry-run] step 3/8: --start (pending -> in_progress)"
  STARTED_AT=$(iso8601_now)
  rewrite_status "$PACKET_FILE" "in_progress"
  append_yaml_field "$PACKET_FILE" "started_at" "$STARTED_AT"
  echo "[dry-run]   started_at=$STARTED_AT"

  # step 4: simulated board response (dummy file)
  echo "[dry-run] step 4/8: simulate board response (dummy file)"
  DUMMY_BOARD_DIR="$HOME/.shared-ops/board"
  mkdir -p "$DUMMY_BOARD_DIR"
  DUMMY_BOARD_PATH="$DUMMY_BOARD_DIR/$(date +%Y-%m-%d)_zen_chatoutbox_dryrun_response_${TASK_ID}.md"
  cat > "$DUMMY_BOARD_PATH" <<EOF
# Zen chat_outbox dry-run response

- task_id: $TASK_ID
- generated_at: $(iso8601_now)
- response: ACK
- reasoning: dry-run simulated response (not a real reply)
EOF
  echo "[dry-run]   dummy board: $DUMMY_BOARD_PATH"

  # step 5: --complete (in_progress -> completed + result marker write)
  echo "[dry-run] step 5/8: --complete (in_progress -> completed + result marker)"
  COMPLETED_AT=$(iso8601_now)
  rewrite_status "$PACKET_FILE" "completed"
  append_yaml_field "$PACKET_FILE" "completed_at" "$COMPLETED_AT"
  WIN_BOARD=$(to_windows_path "$DUMMY_BOARD_PATH")
  MARKER=$(write_result_marker "$TASK_ID" "completed" "$STARTED_AT" "$COMPLETED_AT" "$WIN_BOARD" "dry-run board response written" "dry-run executed by zen_chat_outbox_consume.sh --dry-run")
  echo "[dry-run]   marker: $MARKER"

  # step 6: schema validate (minimum: schema_version + status=completed + response_paths 非空)
  echo "[dry-run] step 6/8: validate result marker schema"
  MARKER_FILE="$CHAT_RESULTS_DIR/${TASK_ID}.json"
  if ! grep -q '"schema_version": "yuino.chat_result.v0"' "$MARKER_FILE"; then
    echo "[dry-run] FAIL step 6: schema_version missing" >&2
    release_consumer_lock
    exit 3
  fi
  if ! grep -q '"status": "completed"' "$MARKER_FILE"; then
    echo "[dry-run] FAIL step 6: status != completed" >&2
    release_consumer_lock
    exit 3
  fi
  if grep -qE '"response_paths":[[:space:]]*\[\]' "$MARKER_FILE"; then
    echo "[dry-run] FAIL step 6: response_paths is empty array" >&2
    release_consumer_lock
    exit 3
  fi
  if ! grep -q '"target": "zen"' "$MARKER_FILE"; then
    echo "[dry-run] FAIL step 6: target != zen" >&2
    release_consumer_lock
    exit 3
  fi
  echo "[dry-run]   schema valid: schema_version + target=zen + status=completed + response_paths 非空"

  # step 7: archive (chat_outbox/zen -> processed/)
  echo "[dry-run] step 7/8: archive packet to processed/"
  if [[ -f "$CHAT_OUTBOX_DIR/${TASK_ID}.md" ]]; then
    mv "$CHAT_OUTBOX_DIR/${TASK_ID}.md" "$CHAT_OUTBOX_PROCESSED_DIR/${TASK_ID}.md"
    echo "[dry-run]   archived: $CHAT_OUTBOX_PROCESSED_DIR/${TASK_ID}.md"
  else
    echo "[dry-run]   packet 既に processed/ 配下、 archive skip"
  fi

  # step 8: lock release
  echo "[dry-run] step 8/8: lock release"
  release_consumer_lock

  # cleanup (dummy board file 削除、 result marker は preserve)
  echo "[dry-run] cleanup: remove dummy board file"
  rm -f "$DUMMY_BOARD_PATH"

  echo "[dry-run] PASS: all 8 steps successful for task_id=$TASK_ID"
  echo "[dry-run] result marker preserved: $MARKER_FILE"
  exit 0
fi

# ============================================================
# action: list / --json (default)
#   chat_outbox/zen/*.md scan、 frontmatter parse、 status=pending のみ filter
# ============================================================

if [[ "$ACTION" == "list" || "$ACTION" == "--json" ]]; then
  ACTIONABLE=()
  IN_PROGRESS=()
  COMPLETED=()
  BLOCKED=()
  SKIPPED=()

  shopt -s nullglob
  for file in "$CHAT_OUTBOX_DIR"/task-*.md; do
    if [[ ! -f "$file" ]]; then continue; fi
    TASK_ID=$(extract_yaml_field "$file" "task_id")
    STATUS=$(extract_yaml_field "$file" "status")
    PRIORITY=$(extract_yaml_field "$file" "priority")
    PERMISSION_LEVEL=$(extract_yaml_field "$file" "permission_level")
    CREATED_AT=$(extract_yaml_field "$file" "created_at")

    # task_id 不在 (frontmatter 異常) は skip
    if [[ -z "$TASK_ID" ]]; then continue; fi

    case "$STATUS" in
      pending)
        ACTIONABLE+=("$TASK_ID|$PRIORITY|$PERMISSION_LEVEL|$CREATED_AT")
        ;;
      in_progress)
        IN_PROGRESS+=("$TASK_ID|$PRIORITY|$PERMISSION_LEVEL|$CREATED_AT")
        ;;
      completed)
        COMPLETED+=("$TASK_ID|$PRIORITY|$PERMISSION_LEVEL|$CREATED_AT")
        ;;
      blocked)
        BLOCKED+=("$TASK_ID|$PRIORITY|$PERMISSION_LEVEL|$CREATED_AT")
        ;;
      skipped)
        SKIPPED+=("$TASK_ID|$PRIORITY|$PERMISSION_LEVEL|$CREATED_AT")
        ;;
    esac
  done
  shopt -u nullglob

  if [[ "$ACTION" == "--json" ]]; then
    echo "{"
    echo "  \"actionable_count\": ${#ACTIONABLE[@]},"
    echo "  \"in_progress_count\": ${#IN_PROGRESS[@]},"
    echo "  \"completed_count\": ${#COMPLETED[@]},"
    echo "  \"blocked_count\": ${#BLOCKED[@]},"
    echo "  \"skipped_count\": ${#SKIPPED[@]},"
    echo "  \"actionable\": ["
    for i in "${!ACTIONABLE[@]}"; do
      IFS='|' read -r tid prio perm created <<< "${ACTIONABLE[$i]}"
      sep=","
      [[ $i -eq $((${#ACTIONABLE[@]} - 1)) ]] && sep=""
      echo "    {\"task_id\":\"$tid\",\"priority\":\"$prio\",\"permission_level\":\"$perm\",\"created_at\":\"$created\"}$sep"
    done
    echo "  ]"
    echo "}"
  else
    echo "================================================================"
    echo " zen_chat_outbox_consume — Yuino chat_outbox/zen v0 Zen-side"
    echo "================================================================"
    echo ""
    echo "actionable packets (status: pending): ${#ACTIONABLE[@]} 件"
    for entry in "${ACTIONABLE[@]}"; do
      IFS='|' read -r tid prio perm created <<< "$entry"
      echo "  task_id=$tid"
      echo "    priority=$prio permission=$perm created=$created"
      echo "    action: --start $tid -> Read packet -> 起稿 response -> --complete $tid <board_path> -> --archive $tid"
      echo ""
    done

    if [[ ${#IN_PROGRESS[@]} -gt 0 ]]; then
      echo "in_progress (--start 済、 --complete 未): ${#IN_PROGRESS[@]} 件"
      for entry in "${IN_PROGRESS[@]}"; do
        IFS='|' read -r tid prio perm created <<< "$entry"
        echo "  $tid (priority=$prio permission=$perm)"
      done
      echo ""
    fi

    if [[ ${#COMPLETED[@]} -gt 0 ]]; then
      echo "completed (archive 候補): ${#COMPLETED[@]} 件"
      for entry in "${COMPLETED[@]}"; do
        IFS='|' read -r tid prio perm created <<< "$entry"
        echo "  $tid"
      done
      echo ""
    fi

    if [[ ${#BLOCKED[@]} -gt 0 ]]; then
      echo "blocked: ${#BLOCKED[@]} 件"
      for entry in "${BLOCKED[@]}"; do
        IFS='|' read -r tid prio perm created <<< "$entry"
        echo "  $tid"
      done
      echo ""
    fi

    if [[ ${#SKIPPED[@]} -gt 0 ]]; then
      echo "skipped: ${#SKIPPED[@]} 件"
      for entry in "${SKIPPED[@]}"; do
        IFS='|' read -r tid prio perm created <<< "$entry"
        echo "  $tid"
      done
      echo ""
    fi

    if [[ ${#ACTIONABLE[@]} -eq 0 && ${#IN_PROGRESS[@]} -eq 0 && ${#COMPLETED[@]} -eq 0 && ${#BLOCKED[@]} -eq 0 && ${#SKIPPED[@]} -eq 0 ]]; then
      echo "chat_outbox clean (packet 不在)"
    fi
    echo "================================================================"
  fi
  exit 0
fi

echo "error: unknown action: $ACTION" >&2
echo "usage: $0 [list | --json | --lock-acquire | --lock-release | --lock-status | --start <id> | --complete <id> <path> | --block <id> <reason> | --skip <id> <reason> | --archive <id> | --dry-run <id>]" >&2
exit 1
