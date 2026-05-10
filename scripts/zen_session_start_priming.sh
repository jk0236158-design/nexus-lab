#!/usr/bin/env bash
# zen_session_start_priming.sh — SessionStart hook: 4Q checklist + drift surface
#
# 起点: 2026-05-08 enforcement layer reform 5-axis (axis 3).
# 既存の zen_startup_sweep.sh は state audit を行うが、「session 内で chat output
# する直前に LLM の context に context inject する」 役割は持たなかった。 本 script
# は SessionStart hook chain の primer として、 4Q checklist + 直近 drift 8 件 +
# 自走 mode 状態 を stdout に並べて context priming に使う。
#
# 役割と sweep の違い:
#   sweep        = state audit (file count / replied / inbox pending) + zen_today.md 起稿
#   priming (本) = 4Q checklist 表示 + drift surface (LLM context 入力用、 file 起稿なし)
#
# 出力先:
#   stdout (claude-code SessionStart hook が context として吸収する想定)
#   stderr 側は使わない (hook chain noise を最小化、 primer は silent)
#
# 動作:
#   1. 4Q checklist (誰承認 / どの doc / いつ書く / drift 候補) を出力
#   2. 直近 drift 8 件 (memory feedback_*.md 抜粋) を 1 line ずつ要約
#   3. 自走 mode 状態 (controlled wake notify file 件数 / 通常 sweep / jun directive 連動)
#
# 禁忌:
#   - 大量出力禁止 (LLM context 圧迫)、 primer は 30 line 上限を目安
#   - 重い check (board sweep 等) は呼ばない (sweep 側で実行済)
#
# Spec: ~/.shared-ops/board/2026-05-08_iwa_zen_enforcement_layer_reform_proposal.md § 軸 2 / 案 a

set -uo pipefail

SHARED_OPS="$HOME/.shared-ops"
INBOX_DIR="$SHARED_OPS/inbox"
WAKE_QUEUE_DIR="$SHARED_OPS/wake-queue/zen"
TODAY_FILE="$SHARED_OPS/status/zen_today.md"

echo "=== Zen Session Priming ==="
echo ""

# ---------------------------------------------------------------
# block 1: 4Q checklist (chat output 起稿前 self-check default)
# ---------------------------------------------------------------
echo "■ 4Q checklist (chat output 起稿直前):"
echo "  Q1: 誰の承認待ちか? (jun / Kai / peer review / 物理障害なし)"
echo "  Q2: どの doc を ground truth にしているか? (memory / CLAUDE.md / inbox / status)"
echo "  Q3: いつ書く / いつ着手するか? (今 / 今日中 / 明日に回さない default)"
echo "  Q4: drift 候補に該当するか? (下記 8 件と照合)"
echo ""

# ---------------------------------------------------------------
# block 2: 今週の重点 1 件 (5/11 reform、 旧 8 件 drift list は cognitive overload で廃止)
# ---------------------------------------------------------------
# 旧: 30 行の drift list 注入 → 「自分はミスしがち」 認知強化 + 慎重さで遅くなる drift detect (5/10 Cowork 診断 § 2.10)
# 新: 今週の重点 1 件 (build action narrative) のみ surface
echo "■ 今週の重点:"
echo "  Phase 1 期間中 (5/08-5/21) = jun が一般 user として Yuino 試用、 reform action は organic 着手"
echo "  「明日に回す」 narrative 禁止、 Green 範囲は寝てる間も polling 内で 1 batch ずつ進める"
echo ""

# ---------------------------------------------------------------
# block 3: 自走 mode 状態
# ---------------------------------------------------------------
echo "■ 自走 mode 状態:"

# wake queue notify 件数
notify_count=0
if [[ -d "$INBOX_DIR" ]]; then
    notify_count=$(find "$INBOX_DIR" -maxdepth 1 -type f -name 'zen_wake_queue_pending_*.md' 2>/dev/null | wc -l | tr -d ' ')
fi
notify_count=${notify_count:-0}

# wake queue actionable 件数 (raw queue file 件数)
queue_count=0
if [[ -d "$WAKE_QUEUE_DIR" ]]; then
    queue_count=$(find "$WAKE_QUEUE_DIR" -maxdepth 1 -type f -name 'controlled_*.md' 2>/dev/null | wc -l | tr -d ' ')
fi
queue_count=${queue_count:-0}

if [[ "$notify_count" -gt 0 ]]; then
    echo "  - controlled wake notify: ${notify_count} 件 ($INBOX_DIR/zen_wake_queue_pending_*.md)"
fi
if [[ "$queue_count" -gt 0 ]]; then
    echo "  - wake-queue raw: ${queue_count} 件 (consume: scripts/zen_wake_queue_consume.sh)"
fi

# zen_today.md 「選んだ1件」 抜粋
if [[ -f "$TODAY_FILE" ]]; then
    chosen=$(grep -A1 '^## 選んだ1件' "$TODAY_FILE" 2>/dev/null | tail -1 | head -c 120 || true)
    if [[ -n "$chosen" ]]; then
        echo "  - zen_today.md 「選んだ1件」: ${chosen}"
    fi
fi

if [[ "$notify_count" -eq 0 && "$queue_count" -eq 0 ]]; then
    echo "  - controlled wake / wake-queue: clean"
fi

echo ""
echo "■ priming 完了、 sweep 結果と合わせて 「今日の1件」 へ"
echo "==========================="

exit 0
