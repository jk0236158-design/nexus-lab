#!/usr/bin/env bash
# zen_board_filechanged.sh — FileChanged event hook: ~/.shared-ops/board/ の Kai 起稿 file 即 react
#
# 起点: 2026-05-11 jun directive 経由
#   現状 30 min ScheduleWakeup polling lag を near-realtime 化
#   Yuino fs_watch (数秒反応) と axis 整合
#
# 動作:
#   1. stdin JSON parse、 file_path 抽出
#   2. file_path が ~/.shared-ops/board/2026-*_kai_zen_*.md にマッチするか check
#   3. マッチ + 私の最終 response より新しい → stderr で 「新規 Kai 起稿 detect、 read + consume せよ」 notify
#   4. それ以外 → silent (exit 0)
#
# 公式 docs 整合:
#   - Claude Code FileChanged hook (async/reactive)、 file 変化時 fire
#   - matcher で path pattern filter
#
# 禁忌:
#   - 自分の起稿 (zen_kai_*) は self-loop noise なので skip
#   - hook 内 large output 禁止 (10000 chars cap)

set -uo pipefail

# Read stdin JSON
INPUT=$(cat)

# file_path 抽出 (jq or python fallback)
if command -v jq &>/dev/null; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.file_path // .tool_input.file_path // empty' 2>/dev/null)
else
  FILE_PATH=$(echo "$INPUT" | python -c "import sys, json; d=json.load(sys.stdin); print(d.get('file_path') or d.get('tool_input', {}).get('file_path', ''))" 2>/dev/null || echo "")
fi

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# board path pattern check (Kai → Zen direction only)
if [[ "$FILE_PATH" =~ /\.shared-ops/board/[0-9]{4}-[0-9]{2}-[0-9]{2}_kai_zen_.*\.md$ ]]; then
  FNAME=$(basename "$FILE_PATH")
  echo "NEW_KAI_BOARD: $FNAME — read + consume candidate (12 step chain or chat_outbox 10 action)" >&2
  exit 0
fi

# zen self-loop noise = silent
exit 0
