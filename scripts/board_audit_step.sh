#!/bin/bash
# board_audit_step.sh — 大規模 batch 着手前 + 「待ち narrative」 発する直前の board listing 物理 audit (memory feedback_same_session_audit_skip enforcement reify、 drift 7 段目 reform v3、 5/07 PM 23:08 起稿)
#
# trigger 推奨 timing:
#   1. spawn 起動 直前 (peer spawn / Akari spawn 等)
#   2. 大規模 implementation batch (5+ file write) 着手 直前
#   3. jun directive 受領後の方針 pivot 直前
#   4. 「Kai reply 待ち」 「peer spawn 待ち」 等の 「待ち narrative」 発する直前 (v3 追加、 5/07 PM 三度目発火 reform)
#   5. status report / 完遂報告 起稿 直前
#
# usage:
#   ./scripts/board_audit_step.sh
#   ./scripts/board_audit_step.sh --kai-only   (Kai → Zen のみ)
#   ./scripts/board_audit_step.sh --since 06:00 (今日 06:00 以降のみ)

set -euo pipefail

KAI_ONLY=false
SINCE_TIME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --kai-only)
      KAI_ONLY=true
      shift
      ;;
    --since)
      SINCE_TIME="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '2,15p' "$0"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

BOARD_DIR="$HOME/.shared-ops/board"
TODAY=$(date +%Y-%m-%d)

if [[ ! -d "$BOARD_DIR" ]]; then
  echo "ERROR: board dir not found: $BOARD_DIR" >&2
  exit 1
fi

echo "═══════════════════════════════════════════════"
echo "board_audit_step (drift 7 段目 reform v3):"
echo "  date prefix: ${TODAY}"
echo "  filter:      kai_only=${KAI_ONLY}, since=${SINCE_TIME:-(none)}"
echo "═══════════════════════════════════════════════"

# today date prefix file 一覧
mapfile -t board_files < <(ls -t "${BOARD_DIR}/${TODAY}_"*.md 2>/dev/null | head -30)

if [[ "${#board_files[@]}" -eq 0 ]]; then
  echo "  (today date prefix board file なし)"
  echo ""
  echo "✓ board_audit_step: clean"
  exit 0
fi

echo ""
echo "── today board file (${#board_files[@]} 件、 新しい順 max 30) ──"

unread_count=0
kai_unread_count=0

for file in "${board_files[@]}"; do
  filename=$(basename "$file")

  # filter: kai_only
  if [[ "$KAI_ONLY" == "true" ]]; then
    if [[ ! "$filename" =~ ^${TODAY}_kai_ ]]; then
      continue
    fi
  fi

  # filter: since (HH:MM)
  if [[ -n "$SINCE_TIME" ]]; then
    file_time=$(stat -c '%y' "$file" 2>/dev/null | awk '{print $2}' | cut -d: -f1-2)
    if [[ -n "$file_time" && "$file_time" < "$SINCE_TIME" ]]; then
      continue
    fi
  fi

  # response marker (返事済 marker) check
  if [[ "$filename" =~ _response_ ]]; then
    response_status="(response)"
  else
    response_status=""
  fi

  # Kai → Zen で response_marker 不在 = unread candidate
  is_kai_to_zen=false
  if [[ "$filename" =~ ^${TODAY}_kai_zen_ ]]; then
    is_kai_to_zen=true
  fi

  # mtime + size
  file_mtime=$(stat -c '%y' "$file" 2>/dev/null | awk '{print $1, $2}' | cut -d. -f1)
  file_size=$(stat -c '%s' "$file" 2>/dev/null)

  echo "  ${file_mtime} ${file_size}B ${filename} ${response_status}"

  # Kai → Zen で response 不在の場合は unread candidate (paired response file の存在で判定が必要だが、 v0 minimum は marker のみ)
  if [[ "$is_kai_to_zen" == "true" && -z "$response_status" ]]; then
    # paired response check: 同 subject の zen → kai response_marker file 存在?
    subject_part="${filename#${TODAY}_kai_zen_}"
    subject_part="${subject_part%.md}"
    paired=$(ls "${BOARD_DIR}/${TODAY}_zen_kai_response_"*"${subject_part}"* 2>/dev/null | head -1)
    if [[ -z "$paired" ]]; then
      unread_count=$((unread_count + 1))
      kai_unread_count=$((kai_unread_count + 1))
    fi
  fi
done

# Kai-side response queue from Yuino response trigger (5/07 PM Kai commit 8d0fbc7 連動)
WAKE_QUEUE_DIR="$HOME/.shared-ops/wake-queue/zen"
if [[ -d "$WAKE_QUEUE_DIR" ]]; then
  wake_queue_count=$(ls "$WAKE_QUEUE_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
  echo ""
  echo "── Yuino response trigger queue (Kai-side commit 8d0fbc7 経由) ──"
  echo "  wake-queue file count: ${wake_queue_count}"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "board_audit_step summary:"
echo "  total files:        ${#board_files[@]}"
echo "  Kai → Zen unread:   ${kai_unread_count}"
echo "═══════════════════════════════════════════════"

if [[ "$kai_unread_count" -gt 0 ]]; then
  echo ""
  echo "⚠️  Kai → Zen で paired response 不在 ${kai_unread_count} 件、 「待ち narrative」 発する前に内容 read 推奨"
  echo "   reference: memory/feedback_same_session_audit_skip.md § reform v3"
  exit 2
fi

echo "✓ board_audit_step: clean"
exit 0
