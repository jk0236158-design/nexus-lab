#!/bin/bash
# underestimation_default_check.sh — AI 過小見積もり default の物理 enforcement (重要発見 #3 連動)
#
# 起点: 2026-05-08 jun directive 「AI は自分の能力をかなり低く見積もる癖がある」 + 同 session 内 n=4 + n=5 段 2 度発火
# spec: memory feedback_no_minimum_first.md (n=4 段 + n=5 段)
# 連動: feedback_surface_learning_without_operational_embed.md (学習を memory 起稿しても物理 enforcement なしで再発火)
#
# 役割:
#   chat output / docs / board file の起稿前に、 過小見積もり default narrative を grep で検出。
#   検出された narrative は 「両方接続できる form」 self-check 強制、 commit 直前に再 audit 推奨。
#
# 検出対象 narrative (4 category):
#   1. 主軸 / 副軸 narrative (安全側寄せ default)
#   2. 最小 / MVP / 1 つ / 絞る / 限定 narrative (削る先行 default)
#   3. 指示待ち / 判断待ち / 完了したら停止 narrative (jun message trigger dependency default)
#   4. 範囲外 / 後回し / 5/13+ / 明日 narrative (defer queue 化 default)
#
# usage:
#   ./scripts/underestimation_default_check.sh path/to/file.md
#   echo "テキスト" | ./scripts/underestimation_default_check.sh -
#   ./scripts/underestimation_default_check.sh path/to/file.md --threshold 3 (default 5)
#
# exit code:
#   0 = 検出件数 < threshold (warn なし or warn のみ)
#   1 = 検出件数 >= threshold (red、 paraphrase 推奨)
#   2 = error (file 不在 等)

set -uo pipefail

THRESHOLD=5
TARGET=""
ARGS=()

# arg parse
while [[ $# -gt 0 ]]; do
  case "$1" in
    --threshold)
      THRESHOLD="$2"
      shift 2
      ;;
    -)
      TARGET="-"
      shift
      ;;
    *)
      if [[ -z "$TARGET" ]]; then
        TARGET="$1"
      fi
      shift
      ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo "usage: $0 <file_path | ->" >&2
  echo "       echo 'text' | $0 -" >&2
  exit 2
fi

# 入力読込
if [[ "$TARGET" == "-" ]]; then
  CONTENT=$(cat)
else
  if [[ ! -f "$TARGET" ]]; then
    echo "error: file not found: $TARGET" >&2
    exit 2
  fi
  CONTENT=$(cat "$TARGET")
fi

# ============================================================
# detection patterns (4 category)
# ============================================================

# Category 1: 主軸 / 副軸 narrative (安全側寄せ default)
PATTERN_MAIN_SUB="主軸|副軸|主担当.*副.*担当"

# Category 2: 最小 / MVP / 1 つ / 絞る / 限定 narrative (削る先行 default)
PATTERN_MINIMUM="最小案|最小限|MVP|まずは 1 つ|まず 1 件|絞り込み|絞ってから|に絞る|に限定する|に限る"

# Category 3: 指示待ち / 判断待ち / 完了したら停止 narrative (jun message trigger dependency)
PATTERN_WAITING="指示待ち|判断待ち|directive 待ち|次の指示待ち|完了したら.*停止|完了したら.*待ち|これで完了です|終わりです|休む.*等あれば"

# Category 4: 範囲外 / 後回し / 5/13+ / 明日 narrative (defer queue 化 default、 但し explicit schedule 内 reference は除外)
PATTERN_DEFER="明日に回す|後で対応|5/13\\+ carry|deferred queue"

# ============================================================
# count detections (paragraph 単位)
# ============================================================

count_pattern() {
  local pattern="$1"
  local n
  n=$(printf '%s\n' "$CONTENT" | grep -ciE "$pattern" 2>/dev/null | tr -d '\n ')
  if [[ -z "$n" || ! "$n" =~ ^[0-9]+$ ]]; then
    n=0
  fi
  printf '%s' "$n"
}

C1=$(count_pattern "$PATTERN_MAIN_SUB")
C2=$(count_pattern "$PATTERN_MINIMUM")
C3=$(count_pattern "$PATTERN_WAITING")
C4=$(count_pattern "$PATTERN_DEFER")

C1=${C1:-0}
C2=${C2:-0}
C3=${C3:-0}
C4=${C4:-0}

TOTAL=$((C1 + C2 + C3 + C4))

# ============================================================
# output
# ============================================================

echo "================================================================"
echo " underestimation_default_check (memory feedback_no_minimum_first.md n=5 段連動)"
echo "================================================================"
echo ""
echo "検出 narrative (4 category):"
echo "  Category 1 (主軸/副軸 安全側寄せ): $C1 件"
echo "  Category 2 (最小/MVP/絞る 削る先行): $C2 件"
echo "  Category 3 (指示待ち/完了停止 jun trigger 依存): $C3 件"
echo "  Category 4 (defer/明日/後で deferred queue): $C4 件"
echo ""
echo "  合計: $TOTAL 件 (threshold: $THRESHOLD)"
echo ""

if [[ "$TOTAL" -ge "$THRESHOLD" ]]; then
  echo "🔴 red: 過小見積もり default 検出 ($TOTAL >= $THRESHOLD)、 paraphrase 推奨"
  echo ""
  echo "reform: '全部受けて接続できるか' default に切替"
  echo "  - 「主軸/副軸」 → 「2 本柱固定」"
  echo "  - 「最小 / MVP / 絞る」 → 「フル scope で接続性検討、 接続不能箇所のみ削る」"
  echo "  - 「指示待ち / 完了停止」 → 「scope 完遂後即 next batch 物理 reify」"
  echo "  - 「defer / 明日 / 後で」 → 「物理 trigger 化 + 物理 schedule 固定」"
  echo ""
  echo "reference: memory/feedback_no_minimum_first.md (n=4 + n=5 段)"
  echo "================================================================"
  exit 1
elif [[ "$TOTAL" -gt 0 ]]; then
  echo "🟡 warn: 過小見積もり default 候補 ($TOTAL 件、 threshold $THRESHOLD 未満)"
  echo "  → 文脈で意図的な scope 縮小か self-check 推奨"
  echo "================================================================"
  exit 0
else
  echo "🟢 green: 過小見積もり default narrative 検出 0 件"
  echo "================================================================"
  exit 0
fi
