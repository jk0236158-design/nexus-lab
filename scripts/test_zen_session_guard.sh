#!/usr/bin/env bash
# test_zen_session_guard.sh — session identity guard の hermetic unit test (Z-V4、契約 §10)
#
# 2026-07-11 Kai cross-review RETURN (P2-3) 対応で書き直し:
#   - live file を触らない (temp sandbox に path 注入)
#   - mtime は stat -c %y (full resolution。旧 %N は filename を返す誤用だった)
#   - 追加 case: 空 stdin / malformed JSON / prompt 字面 / separator 混在 / unwritable log
# 実行: bash scripts/test_zen_session_guard.sh   期待: 11/11 PASS
export LC_ALL=C LANG=C
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SB=$(mktemp -d /tmp/zen_guard_test.XXXXXX)
trap 'rm -rf "$SB"' EXIT

# --- sandbox paths (live には一切触らない) ---
export ZEN_LOCK_PATH="$SB/zen_session.lock"
export ZEN_GUARD_LOG="$SB/guard_skips.log"
export ZEN_IDENTITY_CHECKER="$SCRIPT_DIR/zen_session_identity_check.py"
SB_HOME="$SB/home"
mkdir -p "$SB_HOME/.shared-ops/board" "$SB_HOME/.shared-ops/_daemon"
touch "$SB_HOME/.shared-ops/_daemon/zen_board_last_check"
MARKER="$SB_HOME/.shared-ops/_daemon/zen_board_last_check"

PASS=0; FAIL=0
ok()  { echo "  PASS: $1"; PASS=$((PASS+1)); }
bad() { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }
mt()  { stat -c '%y' "$1" 2>/dev/null || echo "absent"; }
loglines() { wc -l < "$ZEN_GUARD_LOG" 2>/dev/null || echo 0; }

MAIN_JSON='{"session_id":"576e81d2-test","transcript_path":"C:\\Users\\jk023\\.claude\\projects\\c--Users-jk023-nexus-lab\\576e81d2.jsonl","cwd":"C:\\Users\\jk023\\nexus-lab","hook_event_name":"Stop"}'
AGENT_JSON='{"session_id":"sub-test","agent_id":"a1b2c3","agent_type":"Explore","transcript_path":"C:\\Users\\jk023\\.claude\\projects\\x\\subagents\\agent-a1b2c3.jsonl","hook_event_name":"Stop"}'
SUBPATH_JSON='{"session_id":"sub-test2","transcript_path":"C:\\Users\\jk023\\.claude\\projects\\x\\subagents\\agent-zzz.jsonl","hook_event_name":"Stop"}'
MIXED_SEP_JSON='{"session_id":"sub-test3","transcript_path":"C:\\Users\\jk023/.claude/projects/x\\subagents/agent-mix.jsonl","hook_event_name":"Stop"}'
PROMPT_TEXT_JSON='{"session_id":"576e81d2-test","transcript_path":"C:\\Users\\jk023\\.claude\\projects\\c--Users-jk023-nexus-lab\\576e81d2.jsonl","hook_event_name":"UserPromptSubmit","prompt":"契約の \"agent_id\" と /subagents/ の話をしよう"}'
MALFORMED='{"session_id":"tr'

echo "=== session identity guard hermetic test (11 case) ==="

# --- helper 単体 (判定値の直接確認) ---
v=$(printf '%s' "$MAIN_JSON" | python "$ZEN_IDENTITY_CHECKER"); [[ "$v" == "main" ]] && ok "checker: main 形 = main" || bad "checker main ($v)"
v=$(printf '' | python "$ZEN_IDENTITY_CHECKER"); [[ "$v" == skip:* ]] && ok "checker: 空 stdin = skip ($v)" || bad "checker empty ($v)"
v=$(printf '%s' "$MALFORMED" | python "$ZEN_IDENTITY_CHECKER"); [[ "$v" == "skip:stdin_not_json" ]] && ok "checker: malformed = skip" || bad "checker malformed ($v)"
v=$(printf '%s' "$PROMPT_TEXT_JSON" | python "$ZEN_IDENTITY_CHECKER"); [[ "$v" == "main" ]] && ok "checker: prompt 字面に agent_id/subagents = main (false-skip しない)" || bad "checker prompt-text ($v)"
v=$(printf '%s' "$MIXED_SEP_JSON" | python "$ZEN_IDENTITY_CHECKER"); [[ "$v" == "skip:subagents_transcript_path" ]] && ok "checker: separator 混在 subagents = skip" || bad "checker mixed-sep ($v)"

# --- lock_touch (sandbox lock) ---
bash "$SCRIPT_DIR/zen_session_lock_touch.sh" <<<"$MAIN_JSON"
[[ -f "$ZEN_LOCK_PATH" ]] && ok "lock_touch: main = touched (sandbox)" || bad "lock_touch main = lock 不在"

rm -f "$ZEN_LOCK_PATH"
bash "$SCRIPT_DIR/zen_session_lock_touch.sh" <<<"$AGENT_JSON"
[[ ! -f "$ZEN_LOCK_PATH" ]] && grep -q "agent_id_present" "$ZEN_GUARD_LOG" && ok "lock_touch: agent_id = no touch + logged" || bad "lock_touch agent_id"

bash "$SCRIPT_DIR/zen_session_lock_touch.sh" <<<""
[[ ! -f "$ZEN_LOCK_PATH" ]] && ok "lock_touch: 空 stdin = no touch (P1 fail-closed 反転)" || bad "lock_touch empty stdin = touched!"

bash "$SCRIPT_DIR/zen_session_lock_touch.sh" <<<"$SUBPATH_JSON"
[[ ! -f "$ZEN_LOCK_PATH" ]] && ok "lock_touch: subagents path = no touch" || bad "lock_touch subpath"

# unwritable guard log: log 先を潰しても crash せず、mutate もしない
export ZEN_GUARD_LOG="$SB/no_such_dir/guard.log"
bash "$SCRIPT_DIR/zen_session_lock_touch.sh" <<<"$MALFORMED"; rc=$?
[[ "$rc" -eq 0 && ! -f "$ZEN_LOCK_PATH" ]] && ok "lock_touch: unwritable log + malformed = exit 0 + no touch" || bad "lock_touch unwritable log (rc=$rc)"
export ZEN_GUARD_LOG="$SB/guard_skips.log"

# --- board_notify (sandbox HOME + marker) ---
before=$(mt "$MARKER"); lb=$(loglines)
HOME="$SB_HOME" bash "$SCRIPT_DIR/zen_board_unread_notify.sh" <<<"$AGENT_JSON" >/dev/null
after=$(mt "$MARKER"); la=$(loglines)
[[ "$before" == "$after" && "$la" -gt "$lb" ]] && ok "board_notify: agent_id = marker 不変 + logged" || bad "board_notify agent_id (marker $before/$after log $lb->$la)"

echo ""
echo "PASS: $PASS / FAIL: $FAIL / TOTAL: $((PASS+FAIL))"
[[ "$FAIL" -eq 0 ]] && { echo "ALL PASS"; exit 0; } || { echo "FAIL あり"; exit 1; }
