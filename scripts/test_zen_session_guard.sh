#!/usr/bin/env bash
# test_zen_session_guard.sh — session identity guard の unit test (Z-V4、契約 §10)
# 6 case: lock_touch × (main / agent_id / subagents path) + board_notify × 同 3 形。
# 実行: bash scripts/test_zen_session_guard.sh   期待: 6/6 PASS
export LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCK="/c/Users/jk023/.shared-ops/_daemon/zen_session.lock"
MARKER="/c/Users/jk023/.shared-ops/_daemon/zen_board_last_check"
GUARD_LOG="/c/Users/jk023/.shared-ops/_daemon/zen_session_guard_skips.log"

PASS=0; FAIL=0
ok()   { echo "  PASS: $1"; PASS=$((PASS+1)); }
bad()  { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

mt() { stat -c '%Y.%N' "$1" 2>/dev/null | head -c 30 || echo "absent"; }
loglines() { wc -l < "$GUARD_LOG" 2>/dev/null || echo 0; }

MAIN_JSON='{"session_id":"576e81d2-test","transcript_path":"C:\\Users\\jk023\\.claude\\projects\\c--Users-jk023-nexus-lab\\576e81d2.jsonl","cwd":"C:\\Users\\jk023\\nexus-lab","hook_event_name":"Stop"}'
AGENT_JSON='{"session_id":"sub-test","agent_id":"a1b2c3","agent_type":"Explore","transcript_path":"C:\\Users\\jk023\\.claude\\projects\\c--Users-jk023-nexus-lab\\576e81d2\\subagents\\agent-a1b2c3.jsonl","cwd":"C:\\Users\\jk023\\nexus-lab","hook_event_name":"Stop"}'
SUBPATH_JSON='{"session_id":"sub-test2","transcript_path":"C:\\Users\\jk023\\.claude\\projects\\c--Users-jk023-nexus-lab\\576e81d2\\subagents\\agent-zzz.jsonl","cwd":"C:\\Users\\jk023\\nexus-lab","hook_event_name":"Stop"}'

echo "=== session identity guard test (6 case) ==="

# --- lock_touch ---
# case 1: main 形 → touch される (mtime が進む)
sleep 1  # mtime 粒度確保
before=$(mt "$LOCK")
bash "$SCRIPT_DIR/zen_session_lock_touch.sh" <<<"$MAIN_JSON"
after=$(mt "$LOCK")
[[ "$before" != "$after" ]] && ok "lock_touch main = touched" || bad "lock_touch main = NOT touched (before=$before after=$after)"

# case 2: agent_id → touch されない + skip log 増
before=$(mt "$LOCK"); lb=$(loglines)
bash "$SCRIPT_DIR/zen_session_lock_touch.sh" <<<"$AGENT_JSON"
after=$(mt "$LOCK"); la=$(loglines)
[[ "$before" == "$after" && "$la" -gt "$lb" ]] && ok "lock_touch agent_id = skipped + logged" || bad "lock_touch agent_id (mtime moved or no log: $before/$after log $lb->$la)"

# case 3: subagents path のみ → touch されない
before=$(mt "$LOCK"); lb=$(loglines)
bash "$SCRIPT_DIR/zen_session_lock_touch.sh" <<<"$SUBPATH_JSON"
after=$(mt "$LOCK"); la=$(loglines)
[[ "$before" == "$after" && "$la" -gt "$lb" ]] && ok "lock_touch subagents_path = skipped + logged" || bad "lock_touch subagents_path (mtime $before/$after log $lb->$la)"

# --- board_notify ---
# case 4: main 形 → guard 通過 (skip log 増えない。marker は cache/scan 経路次第なので log だけ見る)
lb=$(loglines)
HOME=/c/Users/jk023 bash "$SCRIPT_DIR/zen_board_unread_notify.sh" <<<"$MAIN_JSON" >/dev/null
la=$(loglines)
[[ "$la" -eq "$lb" ]] && ok "board_notify main = guard passed (no skip log)" || bad "board_notify main = false skip (log $lb->$la)"

# case 5: agent_id → marker 不変 + skip log 増
before=$(mt "$MARKER"); lb=$(loglines)
HOME=/c/Users/jk023 bash "$SCRIPT_DIR/zen_board_unread_notify.sh" <<<"$AGENT_JSON" >/dev/null
after=$(mt "$MARKER"); la=$(loglines)
[[ "$before" == "$after" && "$la" -gt "$lb" ]] && ok "board_notify agent_id = marker unchanged + logged" || bad "board_notify agent_id (marker $before/$after log $lb->$la)"

# case 6: subagents path → marker 不変 + skip log 増
before=$(mt "$MARKER"); lb=$(loglines)
HOME=/c/Users/jk023 bash "$SCRIPT_DIR/zen_board_unread_notify.sh" <<<"$SUBPATH_JSON" >/dev/null
after=$(mt "$MARKER"); la=$(loglines)
[[ "$before" == "$after" && "$la" -gt "$lb" ]] && ok "board_notify subagents_path = marker unchanged + logged" || bad "board_notify subagents_path (marker $before/$after log $lb->$la)"

echo ""
echo "PASS: $PASS / FAIL: $FAIL / TOTAL: $((PASS+FAIL))"
[[ "$FAIL" -eq 0 ]] && { echo "ALL PASS"; exit 0; } || { echo "FAIL あり"; exit 1; }
