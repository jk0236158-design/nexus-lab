#!/usr/bin/env bash
# zen_precompact_snapshot.sh — PreCompact event hook: context 圧迫前に重要 state snapshot
#
# 起点: 2026-05-11 jun directive 経由
#   context 圧迫 (60% / 90%) 時の compact で重要 state が失われる risk
#   memory + reflection log + chat_outbox state を pre-snapshot で carry
#
# 動作:
#   1. ~/.shared-ops/status/zen_compact_snapshot_YYYYMMDD_HHMMSS.json 起稿
#   2. snapshot 内容:
#      - 現在時刻 + chat_outbox pending packet 件数 + 今日の Kai 起稿 / Zen response 件数
#      - 直近 commit 5 件 (git log --oneline)
#      - reflection log 直近 5 entry
#   3. exit 0 (PreCompact は block ではなく snapshot only)
#
# 公式 docs 整合:
#   - Claude Code PreCompact hook、 context 圧迫前 fire
#   - non-blocking、 stderr / stdout は context に inject
#
# 禁忌:
#   - large output 禁止 (compact 直前で context cap risk)、 stderr に 1-2 行 summary のみ
#   - file write は ~/.shared-ops/status/ 配下、 nokaze-aira / project-nia 等 readonly project には書かない

set -uo pipefail

# 2026-07-11 P1-1 修正 (Oto、 Kagami QA): 旧 -lc 配線では /etc/profile.d/lang.sh が LANG=ja_JP.UTF-8 を
#   設定していた。 -c 化で locale が C に落ち、 多バイト bracket / word boundary の判定が flip した
#   (30 corpus 中 5 件 = inbound×4 + english×1)。 profile 非依存で script 冒頭に明示 = 単体実行でも同じ挙動。
export LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8

SHARED_OPS="$HOME/.shared-ops"
SNAPSHOT_DIR="$SHARED_OPS/status"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_FILE="$SNAPSHOT_DIR/zen_compact_snapshot_${TIMESTAMP}.json"
NEXUS_LAB="/c/Users/jk023/nexus-lab"

# pending packet count
PENDING_COUNT=0
CHAT_OUTBOX="$SHARED_OPS/chat_outbox/zen"
if [[ -d "$CHAT_OUTBOX" ]]; then
  PENDING_COUNT=$(grep -l "^status: pending" "$CHAT_OUTBOX"/*.md 2>/dev/null | wc -l | tr -d ' ')
fi
PENDING_COUNT=${PENDING_COUNT:-0}

# Today's Kai / Zen board count
TODAY=$(date +%Y-%m-%d)
KAI_TODAY=0
ZEN_TODAY=0
if [[ -d "$SHARED_OPS/board" ]]; then
  KAI_TODAY=$(find "$SHARED_OPS/board" -maxdepth 1 -type f -name "${TODAY}_kai_zen_*.md" 2>/dev/null | wc -l | tr -d ' ')
  ZEN_TODAY=$(find "$SHARED_OPS/board" -maxdepth 1 -type f -name "${TODAY}_zen_kai_*.md" 2>/dev/null | wc -l | tr -d ' ')
fi

# Recent 5 commits (one-line)
RECENT_COMMITS=""
if [[ -d "$NEXUS_LAB/.git" ]]; then
  RECENT_COMMITS=$(cd "$NEXUS_LAB" && git log --oneline -5 2>/dev/null | sed 's/"/\\"/g' | tr '\n' ';' || echo "")
fi

# Recent 5 reflection log entries (last lines)
RECENT_REFLECTION=""
REFLECTION_LOG="$SHARED_OPS/status/zen_reflection_log.jsonl"
if [[ -f "$REFLECTION_LOG" ]]; then
  RECENT_REFLECTION=$(tail -5 "$REFLECTION_LOG" 2>/dev/null | sed 's/"/\\"/g' | tr '\n' ';' || echo "")
fi

# JSON snapshot 起稿
cat > "$SNAPSHOT_FILE" <<EOF
{
  "schema_version": "zen.compact_snapshot.v0",
  "timestamp": "$(date -Iseconds)",
  "chat_outbox_pending": ${PENDING_COUNT},
  "today_kai_boards": ${KAI_TODAY},
  "today_zen_responses": ${ZEN_TODAY},
  "recent_commits": "${RECENT_COMMITS}",
  "recent_reflection": "${RECENT_REFLECTION}",
  "snapshot_purpose": "PreCompact pre-snapshot、 context 圧迫後 restore reference"
}
EOF

# Old snapshot cleanup (iter 2 fix: 7 day 以上前の snapshot 削除、 file 増殖防止)
find "$SNAPSHOT_DIR" -maxdepth 1 -type f -name 'zen_compact_snapshot_*.json' -mtime +7 -delete 2>/dev/null || true

# stderr 1 行 summary (context inject)
echo "PreCompact snapshot saved: ${SNAPSHOT_FILE} (pending: ${PENDING_COUNT}, kai_today: ${KAI_TODAY}, zen_today: ${ZEN_TODAY})" >&2

exit 0
