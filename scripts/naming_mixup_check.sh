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

# 2026-07-11 P1-1 修正 (Oto、 Kagami QA): 旧 -lc 配線では /etc/profile.d/lang.sh が LANG=ja_JP.UTF-8 を
#   設定していた。 -c 化で locale が C に落ち、 多バイト bracket / word boundary の判定が flip した
#   (30 corpus 中 5 件 = inbound×4 + english×1)。 profile 非依存で script 冒頭に明示 = 単体実行でも同じ挙動。
export LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8

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

# Layer A: 「2 entity 別物」 narrative (red、 context-aware regex 化、 5/08 false positive 解消対応)
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

# 否定 / 同一性肯定 context exclude (1 entity 2 narrative ruled 遵守の記述は red 不要)
# 例: 「Aira と Yuino は別の道具ではない」 「別物ではなく同じ」 等
NAMING_EXCLUDE_PATTERNS=(
  "別の道具ではない"
  "別の存在ではない"
  "別物ではない"
  "別物ではなく"
  "別のものではない"
  "別entity ではない"
  "別 entity ではない"
  "2 entity ではない"
  "2 つの product ではない"
  "別 product ではない"
  "別ではない"
  "Yuino ではない"
  "Aira と Yuino は同じ"
  "Yuino と Aira は同じ"
  "1 entity"
  "1 entity 2 narrative"
  "同じ 1 つの道具"
  "同じ実体"
  "同じ entity"
)

# pattern が match した行を抽出、 exclude pattern に該当する行は red にしない
# Note: bash glob match (case ... esac) を使用して Git Bash で grep -q SIGPIPE の job control noise 回避
# 2026-07-11 高速化 (Oto): 結合 alternation で 1 回 prefilter、 hit なし (通常 case) は
#   per-pattern の echo|grep 2 プロセス spawn × 12 pattern を全 skip。 hit 時のみ従来 loop = 判定不変。
_red_joined=$(IFS='|'; printf '%s' "${RED_PATTERNS[*]}")
if ! echo "$content" | grep -qiE "$_red_joined" 2>/dev/null; then
  RED_PATTERNS=()
fi
for pattern in "${RED_PATTERNS[@]}"; do
  matched_lines=$(echo "$content" | grep -niE "$pattern" 2>/dev/null || true)
  if [[ -z "$matched_lines" ]]; then
    continue
  fi

  effective_matches=0
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    is_excluded=false
    for excl in "${NAMING_EXCLUDE_PATTERNS[@]}"; do
      # bash glob match (* で挟む)、 case insensitive は shopt nocasematch で実現
      shopt -s nocasematch
      if [[ "$line" == *"$excl"* ]]; then
        is_excluded=true
        shopt -u nocasematch
        break
      fi
      shopt -u nocasematch
    done
    if [[ "$is_excluded" == "false" ]]; then
      effective_matches=$((effective_matches + 1))
    fi
  done <<<"$matched_lines"

  if [[ "$effective_matches" -gt 0 ]]; then
    red_count=$((red_count + effective_matches))
    echo "  🔴 「2 entity 別物」 narrative 「${pattern}」 ${effective_matches} 件 (否定 context exclude 後)"
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
