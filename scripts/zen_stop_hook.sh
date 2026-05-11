#!/usr/bin/env bash
# zen_stop_hook.sh — Stop event hook: pending packet 残存時に Claude を継続させる
#
# 起点: 2026-05-11 jun directive 経由 Ralph Wiggum 系統 Stop hook 反映
#   actual evidence: 私 (Zen) の self-stop drift (5/11 09:30-10:50 + 12:00-13:25 で 2 回再発)
#   = mental ruled 「Green 範囲は寝てる間も 1 batch ずつ」 + 「やることが決まってる、 止まらなくていい」
#     を physical reify、 structural drift fix
#
# 動作:
#   1. stdin JSON parse、 stop_hook_active flag check (infinite loop 防止)
#   2. ~/.shared-ops/chat_outbox/zen/*.md の pending packet count
#   3. ~/.shared-ops/board/2026-*_kai_*.md の最新が私の最終 response より新しいか check
#   4. 残存 actionable あり → exit 2 + stderr で 「pending N 件 / 新規 board あり、 consume せよ」 inject
#   5. 0 件 → exit 0、 Claude stop allow
#
# 公式 docs 整合:
#   - Claude Code Stop hook (https://code.claude.com/docs/en/hooks)
#   - exit code 2 + stderr で chat output turn end block、 Claude continue conversation
#   - stop_hook_active flag を check しないと infinite loop risk
#
# 禁忌:
#   - jun explicit 「stop」 / 「close」 / 「終わり」 narrative 検出時は exit 0 (jun stop directive 優先)
#   - hook 内 large output 禁止 (10000 chars cap、 stderr only 1-3 行 default)
#   - 600 sec timeout 内で完了 (default、 但し本 hook は 5 sec 想定)

set -uo pipefail

SHARED_OPS="$HOME/.shared-ops"
CHAT_OUTBOX="$SHARED_OPS/chat_outbox/zen"
BOARD="$SHARED_OPS/board"

# Read stdin JSON
INPUT=$(cat)

# stop_hook_active flag check (infinite loop 防止、 公式必須 check)
# jq があれば jq、 なければ Python fallback
if command -v jq &>/dev/null; then
  ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
else
  ACTIVE=$(echo "$INPUT" | python -c "import sys, json; d=json.load(sys.stdin); print(d.get('stop_hook_active', False))" 2>/dev/null || echo "false")
fi

# stop_hook_active=true なら infinite loop risk、 即 exit 0
if [[ "$ACTIVE" == "True" || "$ACTIVE" == "true" ]]; then
  exit 0
fi

# pending packet count (iter 2 fix: 既 result marker 起稿済の false positive 抑止)
PENDING_COUNT=0
PENDING_WITHOUT_MARKER=0
CHAT_RESULTS="$SHARED_OPS/chat_results/zen"
if [[ -d "$CHAT_OUTBOX" ]]; then
  for pending_file in $(grep -l "^status: pending" "$CHAT_OUTBOX"/*.md 2>/dev/null); do
    PENDING_COUNT=$((PENDING_COUNT + 1))
    # task_id 抽出 (basename without .md)
    task_id=$(basename "$pending_file" .md)
    # 対応 result marker check
    if [[ ! -f "$CHAT_RESULTS/${task_id}.json" ]]; then
      PENDING_WITHOUT_MARKER=$((PENDING_WITHOUT_MARKER + 1))
    fi
  done
fi

# 新規 Kai 起稿 check (本日分、 私の最終 response 起稿時刻と比較)
# minimum logic: 本日付の Kai board 件数 = N、 私の Zen response 件数 = M、 N > M なら未 response 残存
TODAY=$(date +%Y-%m-%d)
KAI_TODAY=0
ZEN_TODAY=0
if [[ -d "$BOARD" ]]; then
  KAI_TODAY=$(find "$BOARD" -maxdepth 1 -type f -name "${TODAY}_kai_zen_*.md" 2>/dev/null | wc -l | tr -d ' ')
  ZEN_TODAY=$(find "$BOARD" -maxdepth 1 -type f -name "${TODAY}_zen_kai_*.md" 2>/dev/null | wc -l | tr -d ' ')
fi
KAI_TODAY=${KAI_TODAY:-0}
ZEN_TODAY=${ZEN_TODAY:-0}

UNRESPONDED=$((KAI_TODAY - ZEN_TODAY))
if (( UNRESPONDED < 0 )); then UNRESPONDED=0; fi

# actionable 判定 + block / allow (iter 2 fix: marker exists の packet は false positive、 PENDING_WITHOUT_MARKER で判定)
if (( PENDING_WITHOUT_MARKER > 0 )) || (( UNRESPONDED > 0 )); then
  # block stop、 Claude continue
  echo "Zen self-stop drift detected. pending packets without result marker: ${PENDING_WITHOUT_MARKER} (of ${PENDING_COUNT} status:pending、 marker exists のものは yuino-side lag = skip)、 unresponded Kai boards today: ${UNRESPONDED}. Consume them before stopping (mental ruled '5/10 narrative shift' physical reify)." >&2
  exit 2
fi

# All clear、 stop allow
exit 0
