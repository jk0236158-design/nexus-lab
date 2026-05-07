#!/bin/bash
# zen_continuous_active_loop.sh — continuous active continue protocol 物理 trigger 化 (minimum viable subset)
#
# 起点: 2026-05-08 jun directive 「介入なくても大丈夫だって思えるとこまで設定」
# spec: team_memory/zen/zen_autonomous_behavior_unified_spec_2026-05-08.md
# 連動: memory feedback_jun_message_trigger_dependency_default.md (5/04 evening 起票) + feedback_no_minimum_first.md n=5 段
#
# 役割:
#   batch 完遂後に Zen 主 session が next batch 候補を pull する form で
#   continuous active continue protocol を物理 trigger 化。
#   Aira observer + work generator (nokaze-aira/ 側 Kai 主担当、 cron 化未完で現状不在 default)
#   からの fire signal pull が main path、 不在時は fallback で自己 generate。
#
# 用途:
#   1. batch 完遂後の chat 出力 末尾で本 script invoke
#   2. cron / Task Scheduler で定期 fire (5/13+ Phase B carry、 nokaze-aira/ Aira observer cron 化と統合)
#   3. ad-hoc invoke (jun 「他やって」 directive 受領時等)
#
# usage:
#   ./scripts/zen_continuous_active_loop.sh           # next batch 候補 surface
#   ./scripts/zen_continuous_active_loop.sh --json    # JSON form output (script 連携用)
#   ./scripts/zen_continuous_active_loop.sh --quiet   # 候補のみ output (header skip)

set -uo pipefail

OUTPUT_FORMAT="${1:-text}"

# ============================================================
# main path: Aira observer + work generator output pull
# ============================================================

AIRA_PROPOSALS="$HOME/.shared-ops/state/aira_work_generator_proposals.md"
AIRA_LOG="$HOME/.shared-ops/_daemon/aira_observer.log"

# fallback path: zen_today.md + Phase B carry list + 議題 30 priority A
ZEN_TODAY="$HOME/.shared-ops/status/zen_today.md"
ZEN_AUTONOMOUS_SPEC="$HOME/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/zen_autonomous_behavior_unified_spec_2026-05-08.md"
PRODUCT_V01_SCHEDULE="$HOME/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/product_v0_1_scope_and_14day_schedule_2026-05-08.md"
ITEM_30_PROPOSAL="$HOME/.shared-ops/proposals/2026-05-08_zen_item_30_review_priority_a_proposal.md"

# ============================================================
# main: Aira proposals が存在するか check
# ============================================================

if [[ -f "$AIRA_PROPOSALS" ]]; then
  AIRA_PROPOSALS_AGE_HOUR=$(( ( $(date +%s) - $(stat -c %Y "$AIRA_PROPOSALS" 2>/dev/null || echo 0) ) / 3600 ))
else
  AIRA_PROPOSALS_AGE_HOUR=999
fi

if [[ "$OUTPUT_FORMAT" != "--quiet" ]]; then
  echo "================================================================"
  echo " continuous active continue protocol (zen_continuous_active_loop)"
  echo "================================================================"
fi

# ============================================================
# path A: Aira observer fire signal pull (nokaze-aira/ 連動、 5/13+ main path)
# ============================================================

if [[ -f "$AIRA_PROPOSALS" && $AIRA_PROPOSALS_AGE_HOUR -lt 24 ]]; then
  if [[ "$OUTPUT_FORMAT" != "--quiet" ]]; then
    echo ""
    echo "[main] Aira proposals 受領 (age: ${AIRA_PROPOSALS_AGE_HOUR}h)"
    echo ""
  fi

  # 最新 proposal 3 件を抽出 (markdown form)
  awk '/^## proposal/{count++} count<=3 && /^## proposal/,/^---$/' "$AIRA_PROPOSALS" 2>/dev/null | head -100

  if [[ "$OUTPUT_FORMAT" != "--quiet" ]]; then
    echo ""
    echo "  → priority 1 件選択 + batch 着手 推奨"
    echo "  → source: $AIRA_PROPOSALS"
  fi

  exit 0
fi

# ============================================================
# path B: fallback (Aira proposals 不在 or stale、 自己 generate)
# ============================================================

if [[ "$OUTPUT_FORMAT" != "--quiet" ]]; then
  echo ""
  echo "[fallback] Aira proposals 不在 or stale (age: ${AIRA_PROPOSALS_AGE_HOUR}h、 24h+ stale)"
  echo "  → fallback: zen_today.md 進捗 log + Phase B carry list + 議題 30 priority A から自己 generate"
  echo ""
fi

# fallback source 1: zen_today.md の "(続く)" or "(続き)" marker
if [[ -f "$ZEN_TODAY" ]]; then
  CONTINUE_MARKER=$(grep -E "^\s*-\s+\(続く\)|^\s*-\s+\(続き\)" "$ZEN_TODAY" | head -1)
  if [[ -n "$CONTINUE_MARKER" ]]; then
    if [[ "$OUTPUT_FORMAT" != "--quiet" ]]; then
      echo "[fallback source 1] zen_today.md 進捗 log の続行 marker:"
      echo "  $CONTINUE_MARKER"
      echo ""
    fi
  fi
fi

# fallback source 2: Phase B carry list (zen_autonomous_behavior_unified_spec)
if [[ -f "$ZEN_AUTONOMOUS_SPEC" ]]; then
  if [[ "$OUTPUT_FORMAT" != "--quiet" ]]; then
    echo "[fallback source 2] 5/13+ Phase B carry list (8 candidate):"
    awk '/^### 5\/13\+ Phase B carry/,/^### |^## /' "$ZEN_AUTONOMOUS_SPEC" 2>/dev/null | grep -E "^\| [0-9]" | head -8
    echo ""
  fi
fi

# fallback source 3: 議題 30 priority A 準備案
if [[ -f "$ITEM_30_PROPOSAL" ]]; then
  if [[ "$OUTPUT_FORMAT" != "--quiet" ]]; then
    echo "[fallback source 3] 議題 30 priority A 準備案 (3 軸 + 5 carry):"
    grep -E "^### 軸 [0-9]:|^### Section " "$ITEM_30_PROPOSAL" 2>/dev/null | head -8
    echo ""
  fi
fi

# fallback source 4: 商品 v0.1 14 day schedule (5/13-5/26)
if [[ -f "$PRODUCT_V01_SCHEDULE" ]]; then
  TODAY=$(date +%Y-%m-%d)
  if [[ "$OUTPUT_FORMAT" != "--quiet" ]]; then
    echo "[fallback source 4] 商品 v0.1 14 day schedule (today=${TODAY}):"
    # 今日 / 直近 day の task を抽出
    grep -E "^### Day [0-9]+: 5/" "$PRODUCT_V01_SCHEDULE" 2>/dev/null | head -3
    echo ""
  fi
fi

# ============================================================
# next batch candidate suggestion
# ============================================================

if [[ "$OUTPUT_FORMAT" != "--quiet" ]]; then
  echo "================================================================"
  echo " next batch candidate suggestion"
  echo "================================================================"
  cat <<'EOF'

continuous active continue protocol = batch 完遂後即 next batch 物理 reify 着手 default。
jun directive trigger 不在時の自走 path:

優先度 1: zen_today.md 進捗 log の続行 marker (最 immediate)
優先度 2: 商品 v0.1 14 day schedule の today / 直近 day task (5/13-5/26)
優先度 3: Phase B carry list 8 candidate (議題 30 priority A 連動)
優先度 4: 5/08 朝 batch 完遂後の next batch (例: enforcement hook chain 化 / lockfile / 商品 v0.1 Base layer skeleton)

緊急停止 trigger (自走 → 一時停止 + jun 通知):
- Red boundary 該当 task 検出 (subagent_write_gate.sh exit 2)
- 金銭発生 task
- 5 連続 spawn fail
- jun 直接 directive 受領 (manual override)
- memory feedback 同型 default 4 連発火

reform candidate (5/13+ Phase B):
- nokaze-aira/ Aira observer cron 化 (10 min interval) で path A main 化
- 本 script を cron / Task Scheduler 化 (ZenAutonomousWake 縮小判定 = 議題 30 軸 1 B 案 と統合)
- Zen 主 session の startup ritual に本 script invoke 追加 (zen_startup_sweep.sh の末尾に chain)

EOF
fi

exit 0
