#!/usr/bin/env bash
# zen_posttooluse_outcome.sh — PostToolUse event hook: Bash command outcome 検証 + feedback inject
#
# 起点: 2026-05-11 jun directive 経由
#   既 zen_bash_audit_advisory.sh は PreToolUse advisory only、 PostToolUse で actual outcome 検証
#   公式 docs 推奨: PostToolUse(Bash) で test/build/push 等の exit code 検証 + Claude feedback
#
# 動作:
#   1. stdin JSON parse、 tool_input.command + tool_response (exit code / stdout / stderr) 抽出
#   2. test / build / push 等の critical command を pattern match
#   3. exit code 非 0 detect → stderr に 1 行 summary inject (Claude が次 turn で fix candidate)
#   4. それ以外 → silent (exit 0)
#
# 公式 docs 整合:
#   - Claude Code PostToolUse hook、 tool execution 直後 fire
#   - exit code 0 で execution continue、 stderr は Claude context に inject
#   - 既 PreToolUse(Bash) advisory と並列で fire (別 axis)
#
# 禁忌:
#   - 全 Bash command で fire = noise、 critical command (npm test / npm run build / git push) のみ pattern match
#   - exit code 2 で block すると workflow 阻害、 exit 0 + stderr feedback form
#   - 1-3 行 summary のみ、 large output 禁止

set -uo pipefail

# 2026-07-11 P1-1 修正 (Oto、 Kagami QA): 旧 -lc 配線では /etc/profile.d/lang.sh が LANG=ja_JP.UTF-8 を
#   設定していた。 -c 化で locale が C に落ち、 多バイト bracket / word boundary の判定が flip した
#   (30 corpus 中 5 件 = inbound×4 + english×1)。 profile 非依存で script 冒頭に明示 = 単体実行でも同じ挙動。
export LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8

# Read stdin JSON
INPUT=$(cat)

# command + exit_code 抽出
if command -v jq &>/dev/null; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
  EXIT_CODE=$(echo "$INPUT" | jq -r '.tool_response.exit_code // .tool_response.exitCode // 0' 2>/dev/null)
else
  COMMAND=$(echo "$INPUT" | python -c "import sys, json; d=json.load(sys.stdin); print(d.get('tool_input', {}).get('command', ''))" 2>/dev/null || echo "")
  EXIT_CODE=$(echo "$INPUT" | python -c "import sys, json; d=json.load(sys.stdin); tr=d.get('tool_response', {}); print(tr.get('exit_code') or tr.get('exitCode') or 0)" 2>/dev/null || echo "0")
fi

# 再帰防止: 本 hook 自身を含む command は skip
if [[ "$COMMAND" =~ zen_posttooluse_outcome ]]; then
  exit 0
fi

# critical command pattern match
CRITICAL_PATTERN='npm (test|run build|run typecheck|run lint|publish)|git push|pytest|mypy|ruff check|tsc'
if ! echo "$COMMAND" | grep -qE "$CRITICAL_PATTERN" 2>/dev/null; then
  # 非 critical command = silent
  exit 0
fi

# exit code 非 0 detect
if [[ "$EXIT_CODE" != "0" ]]; then
  # 1 行 summary stderr (Claude context inject)
  CMD_SHORT=$(echo "$COMMAND" | head -c 80)
  echo "PostToolUse outcome FAIL: exit_code=${EXIT_CODE} cmd='${CMD_SHORT}' → 次 turn で fix candidate" >&2
fi

# always exit 0 (block しない、 advisory only)
exit 0
