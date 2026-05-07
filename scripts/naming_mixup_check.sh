#!/bin/bash
# naming_mixup_check.sh — Aira/Yuino 用語 mix-up narrative drift 検知
# memory feedback_aira_yuino_naming_fixed.md enforcement reify、 5/07 PM 23:35 起稿
#
# 確定済 ground truth (5/06 evening jun + Kai 確認):
#   - Aira = 内部実装名 (実体名)
#   - Yuino = 商品 brand 名 (audience-facing form)
#   - 1 entity 2 narrative (内部 = Aira / 公開 = Yuino)
#   - = 別 entity ではない、 同じ実体の 2 narrative form
#
# 検出対象:
#   - 「Aira と Yuino は別」 「2 entity」 「別物」 narrative (red)
#   - 公開 doc / LP 系で 「Aira」 を audience-facing 文脈で使用 (yellow)
#   - 内部 doc で 「Yuino 実装」 narrative (yellow)
#
# usage:
#   ./scripts/naming_mixup_check.sh path/to/draft.md

set -uo pipefail

input_file=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      sed -n '2,15p' "$0"
      exit 0
      ;;
    *)
      input_file="$1"
      shift
      ;;
  esac
done

if [[ -z "$input_file" ]]; then
  echo "ERROR: file path required" >&2
  exit 1
fi

if [[ ! -f "$input_file" ]]; then
  echo "ERROR: file not found: $input_file" >&2
  exit 1
fi

content=$(cat "$input_file")
red_count=0
yellow_count=0

echo "═══════════════════════════════════════════════"
echo "naming_mixup_check: ${input_file}"
echo "═══════════════════════════════════════════════"

# Layer A: 「2 entity 別物」 narrative (red)
RED_PATTERNS=(
  "Aira と Yuino は別"
  "Aira と Yuino は 2"
  "Yuino と Aira は別"
  "2 entity"
  "二 entity"
  "2 つの product"
  "別 product"
  "別 entity"
  "別 repository"
  "別 repo に分け"
  "Aira を商品化対象から外"
  "Yuino を実装"
)

for pattern in "${RED_PATTERNS[@]}"; do
  matches=$(echo "$content" | grep -oiE "$pattern" 2>/dev/null | wc -l | tr -d ' ' || true)
  matches=${matches:-0}
  if [[ "$matches" -gt 0 ]]; then
    red_count=$((red_count + matches))
    echo "  🔴 「2 entity 別物」 narrative 「${pattern}」 ${matches} 件"
  fi
done

# Layer B: audience axis mix-up (yellow)
# 公開 doc / LP 系判定 (path に LP / public / README が含まれるか、 内容に 「audience」 「公開」 「商品」 含む)
is_public_doc=false
if echo "$input_file" | grep -qiE '(LP|public|README|landing|商品|brand)'; then
  is_public_doc=true
fi
if echo "$content" | grep -qiE '(audience|公開資料|商品 narrative|商品 brand)'; then
  is_public_doc=true
fi

if [[ "$is_public_doc" == "true" ]]; then
  # 公開 doc で 「Aira」 が頻出 = audience-facing で内部名使用 = yellow
  aira_count=$(echo "$content" | grep -oE '\bAira\b' 2>/dev/null | wc -l | tr -d ' ' || true)
  aira_count=${aira_count:-0}
  if [[ "$aira_count" -gt 3 ]]; then
    yellow_count=$((yellow_count + 1))
    echo "  🟡 公開 doc 系で 「Aira」 ${aira_count} 件、 audience-facing は 「Yuino」 推奨"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "naming_mixup_check summary:"
echo "  red:    ${red_count} (「2 entity 別物」 narrative drift)"
echo "  yellow: ${yellow_count} (audience axis mix-up)"
echo "  source: ${input_file}"
echo "═══════════════════════════════════════════════"

if [[ "$red_count" -gt 0 ]]; then
  echo ""
  echo "⚠️  red ${red_count} 件、 「Aira と Yuino は 1 entity 2 narrative」 ground truth 違反"
  echo "   reference: memory/feedback_aira_yuino_naming_fixed.md (5/06 evening jun + Kai 確認)"
  exit 2
fi

if [[ "$yellow_count" -gt 0 ]]; then
  echo ""
  echo "🟡 yellow ${yellow_count} 件、 audience axis 確認推奨"
  exit 0
fi

echo "✓ naming_mixup_check passed"
exit 0
