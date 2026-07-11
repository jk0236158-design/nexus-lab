#!/usr/bin/env bash
# zen_session_lock_touch.sh — Stop hook: zen_session.lock の mtime heartbeat
#
# 2026-07-11 新設 (rebuild-20260711 契約 §10 session identity guard、Z-V4):
#   watcher は lock mtime を「Zen session active」の heartbeat として読むため、
#   非 main session (Agent tool subagent / QA session) の touch は false-active /
#   wake late-fire (7/9 incident と同型) を再生産する。
# 2026-07-11 Kai cross-review RETURN 対応 (P1 + P2-2/P2-4):
#   - fail-closed 反転 = 「main session の証拠が構造的に揃った時だけ touch」。
#     空/壊れた stdin・field 欠落・python 不在は全て skip (旧: main 扱いで touch)。
#   - 判別は raw 文字列 match をやめ、共通 helper (zen_session_identity_check.py)
#     で decoded top-level field のみを見る (prompt 本文の字面に反応しない)。
#   - ASCII 操作のみのため LC_ALL=C (ja locale 不要、警告リスク 0)。
#   - test 用に path を env override 可能に (hermetic test、P2-3)。
export LC_ALL=C LANG=C

LOCK="${ZEN_LOCK_PATH:-/c/Users/jk023/.shared-ops/_daemon/zen_session.lock}"
GUARD_LOG="${ZEN_GUARD_LOG:-/c/Users/jk023/.shared-ops/_daemon/zen_session_guard_skips.log}"
CHECKER="${ZEN_IDENTITY_CHECKER:-/c/Users/jk023/nexus-lab/scripts/zen_session_identity_check.py}"

INPUT=$(cat 2>/dev/null || true)

PYTHON_CMD=""
if command -v python3 &>/dev/null; then PYTHON_CMD="python3";
elif command -v python &>/dev/null; then PYTHON_CMD="python"; fi

if [ -z "$PYTHON_CMD" ]; then
  VERDICT="skip:no_python_fail_closed"
else
  VERDICT=$(printf '%s' "$INPUT" | "$PYTHON_CMD" "$CHECKER" 2>/dev/null || echo "skip:checker_failed")
fi

if [ "$VERDICT" != "main" ]; then
  # ブロックで包む: リダイレクト先が作れない場合のエラーは 2>/dev/null 単体では
  # 抑制されず hook ノイズになる (Kagami T6 と同型)
  { echo "$(date +%Y-%m-%dT%H:%M:%S) skip=lock_touch reason=${VERDICT#skip:}" >> "$GUARD_LOG"; } 2>/dev/null || true
  exit 0
fi

touch "$LOCK" 2>/dev/null || true
exit 0
