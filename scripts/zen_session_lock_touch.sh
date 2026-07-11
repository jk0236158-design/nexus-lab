#!/usr/bin/env bash
# zen_session_lock_touch.sh — Stop hook: zen_session.lock の mtime heartbeat
#
# 2026-07-11 新設 (rebuild-20260711 契約 §10 session identity guard、Z-V4):
#   従来は settings.json の inline `touch` で、project 内の全 session (Agent tool
#   の subagent / QA session 含む) が lock を touch していた。watcher は lock mtime
#   を「Zen session active」の heartbeat として読むため、非 main session の touch は
#   false-active / wake late-fire (7/9 incident と同型) を再生産する。
#   → mutate は Zen main session のみ。判別は二重 (どちらか hit で skip = fail
#   toward skip): (1) stdin JSON に subagent 限定 field `"agent_id"` が存在
#   (hooks-guide 準拠)、(2) transcript path に subagents segment。
#   偽 skip の害 = その turn の heartbeat 1 回分だけ (watcher ceiling 内で無害)。
export LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8

LOCK="/c/Users/jk023/.shared-ops/_daemon/zen_session.lock"
GUARD_LOG="/c/Users/jk023/.shared-ops/_daemon/zen_session_guard_skips.log"

INPUT=$(cat 2>/dev/null || true)

if [[ "$INPUT" == *'"agent_id"'* ]]; then
  echo "$(date +%Y-%m-%dT%H:%M:%S) skip=lock_touch reason=agent_id_present" >> "$GUARD_LOG" 2>/dev/null
  exit 0
fi
if [[ "$INPUT" == *'/subagents/'* || "$INPUT" == *'\\subagents\\'* ]]; then
  echo "$(date +%Y-%m-%dT%H:%M:%S) skip=lock_touch reason=subagents_transcript_path" >> "$GUARD_LOG" 2>/dev/null
  exit 0
fi

touch "$LOCK" 2>/dev/null || true
exit 0
