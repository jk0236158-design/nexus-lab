#!/bin/bash
# zen_session_lockfile.sh — 二重 session 並走の自動 detect + warn (議題 30 priority A 軸 3 reify)
#
# 起点: memory feedback_dual_session_concurrency.md (4/29 起票 + 5/05 朝 3 連発火)
# 連動: ~/.shared-ops/proposals/2026-05-08_zen_item_30_review_priority_a_proposal.md (軸 3 設計 reset)
#
# 役割:
#   Zen 主 session 起動時に lockfile を作成、 既存 lockfile があれば二重起動 detect、
#   jun に warn + 起動継続 / skip / merge form 選択 surface。
#
#   ZenAutonomousWake schedule は 5/05 20:11 jun directive で全停止済 (root fix)、
#   但し manual session 重複 (jun 「おはよう」 + 既存 main session 重複) は潜在 risk あり、
#   本 script で物理 detect。
#
# usage:
#   ./scripts/zen_session_lockfile.sh acquire    # session 起動時 (lockfile 作成)
#   ./scripts/zen_session_lockfile.sh check      # 既存 lockfile check (warn のみ)
#   ./scripts/zen_session_lockfile.sh release    # session 終了時 (lockfile 削除)
#   ./scripts/zen_session_lockfile.sh status     # 現状 status (json form)

set -uo pipefail

ACTION="${1:-status}"
LOCKFILE="$HOME/.shared-ops/state/zen_session.lock"
STALE_HOUR=4  # 4 hour 経過で stale 認定 (1 session の通常 lifetime)
LOCKFILE_DIR=$(dirname "$LOCKFILE")

# ============================================================
# directory 作成 (初回 fire 時)
# ============================================================

mkdir -p "$LOCKFILE_DIR"

# ============================================================
# helper: lockfile 内容 parse
# ============================================================

parse_lockfile() {
  if [[ ! -f "$LOCKFILE" ]]; then
    echo ""
    return
  fi
  cat "$LOCKFILE"
}

is_stale() {
  if [[ ! -f "$LOCKFILE" ]]; then
    return 1
  fi
  local age_sec=$(( $(date +%s) - $(stat -c %Y "$LOCKFILE" 2>/dev/null || echo 0) ))
  local stale_sec=$(( STALE_HOUR * 3600 ))
  [[ $age_sec -gt $stale_sec ]]
}

# ============================================================
# action: acquire (session 起動時)
# ============================================================

if [[ "$ACTION" == "acquire" ]]; then
  if [[ -f "$LOCKFILE" ]]; then
    if is_stale; then
      echo "[acquire] stale lockfile detect (>${STALE_HOUR}h)、 上書き acquire OK"
      rm -f "$LOCKFILE"
    else
      echo "================================================================"
      echo "  ⚠️  二重 session 並走 detect (memory feedback_dual_session_concurrency.md 該当)"
      echo "================================================================"
      echo ""
      echo "既存 lockfile:"
      parse_lockfile
      echo ""
      echo "対応 form:"
      echo "  A. 既存 session に signal 送る (recommended、 manual override 経由 jun directive)"
      echo "  B. 既存 lockfile force release + acquire (既存 session 強制 close、 zen_today.md merge form 必須)"
      echo "  C. 本 session abort (起動 skip、 jun directive で別 timing 再開)"
      echo ""
      echo "jun directive 不在時 default: A (既存 session に signal 送る form、 本 session は read-only)"
      echo ""
      echo "詳細: ~/.shared-ops/proposals/2026-05-08_zen_item_30_review_priority_a_proposal.md (軸 3)"
      exit 1
    fi
  fi

  # lockfile 作成
  cat > "$LOCKFILE" <<EOF
session_id: $$
acquired_at: $(date -Iseconds)
acquired_by: $(whoami)@$(hostname)
pid: $$
parent_pid: $PPID
purpose: Zen main session (manual or scheduled)
EOF

  echo "[acquire] lockfile acquired: $LOCKFILE (session_id=$$)"
  exit 0
fi

# ============================================================
# action: check (既存 lockfile check のみ)
# ============================================================

if [[ "$ACTION" == "check" ]]; then
  if [[ ! -f "$LOCKFILE" ]]; then
    echo "[check] lockfile 不在 = 既存 session なし"
    exit 0
  fi

  if is_stale; then
    echo "[check] stale lockfile (>${STALE_HOUR}h)、 既存 session は事実上 close 済"
    exit 0
  fi

  echo "[check] active session detect:"
  parse_lockfile
  echo ""
  echo "本 session が二重起動なら lockfile 確認後 acquire / abort 判断"
  exit 0
fi

# ============================================================
# action: release (session 終了時)
# ============================================================

if [[ "$ACTION" == "release" ]]; then
  if [[ ! -f "$LOCKFILE" ]]; then
    echo "[release] lockfile 既に不在、 skip"
    exit 0
  fi

  rm -f "$LOCKFILE"
  echo "[release] lockfile released: $LOCKFILE"
  exit 0
fi

# ============================================================
# action: status (現状 status、 default)
# ============================================================

if [[ "$ACTION" == "status" ]]; then
  if [[ ! -f "$LOCKFILE" ]]; then
    echo '{"status":"no_lock","lockfile":"'"$LOCKFILE"'"}'
    exit 0
  fi

  if is_stale; then
    AGE_HOUR=$(( ( $(date +%s) - $(stat -c %Y "$LOCKFILE" 2>/dev/null || echo 0) ) / 3600 ))
    echo '{"status":"stale","age_hour":'$AGE_HOUR',"lockfile":"'"$LOCKFILE"'"}'
    exit 0
  fi

  AGE_MIN=$(( ( $(date +%s) - $(stat -c %Y "$LOCKFILE" 2>/dev/null || echo 0) ) / 60 ))
  echo '{"status":"active","age_min":'$AGE_MIN',"lockfile":"'"$LOCKFILE"'"}'
  exit 0
fi

echo "[error] unknown action: $ACTION (use acquire | check | release | status)"
exit 2
