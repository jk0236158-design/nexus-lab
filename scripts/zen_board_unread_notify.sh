#!/usr/bin/env bash
# zen_board_unread_notify.sh — UserPromptSubmit hook
#
# 目的: jun の発話ごとに「前回 check 以降に来た Kai → Zen board file」を私(zen)の視界 (context) に出す。
# 起点: 2026-06-22 jun 承認。root cause = FileChanged hook (zen_board_filechanged.sh) が
#   外部 (Kai 環境) + 作業フォルダ外 (~/.shared-ops/) の書き込みに live session 中 発火・到達せず、
#   手動 board_audit_step も report 前に skip した結果、12:44 の Kai 連絡を 5h 見逃した。
#
# 動作:
#   1. marker (前回 check 時刻) を基準にする。marker 不在 = 初回 → baseline 確立して silent。
#   2. 今日 + 昨日の kai_zen_*.md で marker より新しいもの (auto_ack noise 除外) を stdout に列挙。
#   3. marker を now に更新。
#   4. 常に exit 0 (UserPromptSubmit で exit 2 は prompt を block するため厳禁)。
#
# 注: stdout は UserPromptSubmit で context に注入される。large output 禁止なので件数 cap。
#
# 2026-07-11 高速化 (Oto、 hook p50 4.3 秒対策):
#   board dir の状態 (= dir mtime + 対象 file の最新 mtime) が前回チェック時と同一なら早期 exit。
#   状態が変わった時は従来どおりフルチェック (= Zen 宛新 request の flag 機能は不変)。
#   dir mtime だけだと「既存 file の内容編集」(dir mtime が動かない) を取りこぼすため、
#   file 側の最新 mtime も state に含める。
set -uo pipefail

# 2026-07-11 P1-1 修正 (Oto、 Kagami QA): 旧 -lc 配線では /etc/profile.d/lang.sh が LANG=ja_JP.UTF-8 を
#   設定していた。 -c 化で locale が C に落ち、 多バイト bracket / word boundary の判定が flip した
#   (30 corpus 中 5 件 = inbound×4 + english×1)。 profile 非依存で script 冒頭に明示 = 単体実行でも同じ挙動。
export LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8

BOARD_DIR="$HOME/.shared-ops/board"
MARKER="$HOME/.shared-ops/_daemon/zen_board_last_check"
STATE_CACHE="$HOME/.shared-ops/_daemon/zen_board_dirstate_cache"
[[ -d "$BOARD_DIR" ]] || exit 0

# --- session identity guard (2026-07-11、rebuild-20260711 契約 §10 / Z-V4) ---
# marker (zen_board_last_check) は「Zen 本人が board を見た時刻」の正本。subagent /
# QA session がこの script を発火させて marker を進めると、Zen main session への
# 新着通知が silent に消える (7/11 04:25 実測 leak)。mutate + 通知は main のみ。
# 判別は二重 (fail toward skip): stdin の subagent 限定 field / subagents path。
# 偽 skip の害 = その turn だけ通知が出ない (marker 不変なので次 turn で再検出)。
GUARD_LOG="$HOME/.shared-ops/_daemon/zen_session_guard_skips.log"
HOOK_INPUT=$(cat 2>/dev/null || true)
if [[ "$HOOK_INPUT" == *'"agent_id"'* ]]; then
  echo "$(date +%Y-%m-%dT%H:%M:%S) skip=board_notify reason=agent_id_present" >> "$GUARD_LOG" 2>/dev/null
  exit 0
fi
if [[ "$HOOK_INPUT" == *'/subagents/'* || "$HOOK_INPUT" == *'\\subagents\\'* ]]; then
  echo "$(date +%Y-%m-%dT%H:%M:%S) skip=board_notify reason=subagents_transcript_path" >> "$GUARD_LOG" 2>/dev/null
  exit 0
fi

# 初回 = baseline 確立のみ (既存の大量 file を誤って未読 dump しない)
if [[ ! -f "$MARKER" ]]; then
  mkdir -p "$(dirname "$MARKER")" 2>/dev/null || true
  touch "$MARKER" 2>/dev/null || true
  exit 0
fi

# --- 早期 exit gate (2026-07-11): board の状態が前回と同一なら full scan を skip ---
dir_mtime=$(stat -c '%Y' "$BOARD_DIR" 2>/dev/null || echo 0)
latest_file_mtime=$(find "$BOARD_DIR" -maxdepth 1 -name '*_kai_zen_*.md' -printf '%T@\n' 2>/dev/null | sort -rn | head -1)
BOARD_STATE="${dir_mtime}:${latest_file_mtime:-none}"
# cache 読みは subshell 内で stderr を捨てる (= 破損 cache に null byte が混ざると bash が
#   「ignored null byte」警告を吐き hook ノイズになる、 Kagami QA T6 で検出。 不一致 = full scan は不変)
cached_state=""
if [[ -f "$STATE_CACHE" ]]; then
  cached_state=$( { exec 2>/dev/null; printf '%s' "$(<"$STATE_CACHE")"; } )
fi
if [[ -n "$cached_state" && "$cached_state" == "$BOARD_STATE" ]]; then
  exit 0
fi
# 状態が変わっている → 従来どおりフルチェック (以下は 2026-06-22 実装のまま)

ref=$(stat -c '%Y' "$MARKER" 2>/dev/null || echo 0)

TODAY=$(date +%Y-%m-%d)
YDAY=$(date -d 'yesterday' +%Y-%m-%d 2>/dev/null || echo "$TODAY")

newer=()
for f in "$BOARD_DIR/${TODAY}_kai_zen_"*.md "$BOARD_DIR/${YDAY}_kai_zen_"*.md; do
  [[ -e "$f" ]] || continue
  [[ "$f" == *_response_auto_ack_* ]] && continue   # 自動受領 noise は除外
  m=$(stat -c '%Y' "$f" 2>/dev/null || echo 0)
  if [[ "$m" -gt "$ref" ]]; then
    newer+=("$(basename "$f")")
  fi
done

# 次回の基準を now に更新
touch "$MARKER" 2>/dev/null || true
# 早期 exit gate 用の state cache を更新 (2026-07-11)
printf '%s' "$BOARD_STATE" > "$STATE_CACHE" 2>/dev/null || true

if [[ "${#newer[@]}" -gt 0 ]]; then
  echo "[board-check] 前回 check 以降の Kai → Zen board ${#newer[@]} 件 — 応答前に read すること:"
  count=0
  for n in "${newer[@]}"; do
    echo "  - $n"
    count=$((count + 1))
    if [[ "$count" -ge 15 ]]; then
      echo "  ... (他 $(( ${#newer[@]} - 15 )) 件、 board_audit_step で全件確認)"
      break
    fi
  done
fi
exit 0
