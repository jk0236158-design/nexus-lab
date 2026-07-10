#!/usr/bin/env bash
# test_subagent_write_gate.sh
# subagent_write_gate.sh の unit test (5 case)
#
# Kagami peer review GO-3 条件:
#   必須 case 1: project-nia path への Write が deny される
#   必須 case 2: Weekly Signal Desk path への Write が deny される
#   case 3: nexus-lab path への Write が allow される
#   case 4: team_memory path への Write が allow される
#   case 5: shared-ops path への Write が allow される
#
# 実行: bash scripts/test_subagent_write_gate.sh
# 期待: 5/5 PASS

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GATE="$SCRIPT_DIR/subagent_write_gate.sh"

# カウンタ
PASS=0
FAIL=0

# テスト実行ヘルパー
run_test() {
    local test_name="$1"
    local input_json="$2"
    local expect_exit="$3"  # 0 = allow, non-zero = deny

    # gate を実行し、exit code を取得
    bash "$GATE" <<<"$input_json" >/dev/null 2>/dev/null
    local actual_exit=$?

    if [ "$expect_exit" -eq 0 ] && [ "$actual_exit" -eq 0 ]; then
        echo "  PASS: $test_name (exit 0 = allow)"
        PASS=$((PASS + 1))
    elif [ "$expect_exit" -ne 0 ] && [ "$actual_exit" -ne 0 ]; then
        echo "  PASS: $test_name (exit $actual_exit = deny)"
        PASS=$((PASS + 1))
    else
        echo "  FAIL: $test_name (expected exit=$expect_exit, got exit=$actual_exit)"
        FAIL=$((FAIL + 1))
    fi
}

echo "=== subagent_write_gate.sh unit test (5 case) ==="
echo ""

# --- 必須 case 1: project-nia path → DENY ---
echo "[必須] case 1: project-nia path への Write → deny"
run_test \
    "project-nia Write deny (forward-slash Windows path)" \
    '{"tool_name":"Write","tool_input":{"file_path":"C:/Users/jk023/Desktop/project-nia/test.md","content":"test"}}' \
    2

# --- 必須 case 2: Weekly Signal Desk path → DENY ---
echo "[必須] case 2: Weekly Signal Desk path への Write → deny"
run_test \
    "Weekly Signal Desk Write deny (forward-slash path with space)" \
    '{"tool_name":"Write","tool_input":{"file_path":"C:/Users/jk023/Desktop/Weekly Signal Desk/test.md","content":"test"}}' \
    2

# --- case 3: nexus-lab path → ALLOW ---
echo "[通常] case 3: nexus-lab path への Write → allow"
run_test \
    "nexus-lab Write allow" \
    '{"tool_name":"Write","tool_input":{"file_path":"C:/Users/jk023/nexus-lab/scripts/output.txt","content":"test"}}' \
    0

# --- case 4: team_memory path → ALLOW ---
echo "[通常] case 4: team_memory path への Write → allow"
run_test \
    "team_memory Write allow" \
    '{"tool_name":"Write","tool_input":{"file_path":"C:/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/team_memory/iwa/note.md","content":"test"}}' \
    0

# --- case 5: shared-ops path → ALLOW ---
echo "[通常] case 5: shared-ops path への Write → allow"
run_test \
    "shared-ops Write allow" \
    '{"tool_name":"Write","tool_input":{"file_path":"C:/Users/jk023/.shared-ops/board/test.md","content":"test"}}' \
    0

# --- 追加 case 6: Nero path → DENY (Red 境界追加確認) ---
echo "[追加] case 6: Nero path への Write → deny"
run_test \
    "Nero path Write deny" \
    '{"tool_name":"Write","tool_input":{"file_path":"C:/Users/jk023/Desktop/Nero/test.md","content":"test"}}' \
    2

# --- 追加 case 7: Unix path 形式での nexus-lab → ALLOW ---
echo "[追加] case 7: Unix path 形式の nexus-lab → allow"
run_test \
    "nexus-lab Unix path Write allow" \
    '{"tool_name":"Edit","tool_input":{"file_path":"/c/Users/jk023/nexus-lab/package.json","old_string":"test","new_string":"test2"}}' \
    0

# --- 追加 case 8: Claude Code session scratchpad (Temp\claude、バックスラッシュ形式) → ALLOW ---
echo "[追加] case 8: session scratchpad (Temp\\claude) への Write → allow"
run_test \
    "session scratchpad Write allow (backslash Windows path)" \
    '{"tool_name":"Write","tool_input":{"file_path":"C:\\Users\\jk023\\AppData\\Local\\Temp\\claude\\C--Users-jk023-nexus-lab\\some-session\\scratchpad\\scan.js","content":"test"}}' \
    0

# --- 結果サマリ ---
echo ""
echo "=== 結果サマリ ==="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
TOTAL=$((PASS + FAIL))
echo "TOTAL: $TOTAL"

if [ "$FAIL" -eq 0 ]; then
    echo ""
    echo "ALL PASS ($PASS/$TOTAL) — D-2 unit test 完了"
    exit 0
else
    echo ""
    echo "FAIL あり ($FAIL/$TOTAL) — 修正が必要"
    exit 1
fi
