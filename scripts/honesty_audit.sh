#!/bin/bash
# honesty_audit.sh — 誇張表現の自動検知 (memory feedback_honesty_violation_exaggeration + feedback_publish_before_dogfood_premature enforcement reify、 5/07 PM 23:05 起稿)
# 既存 src/lib/honesty/audit.ts (commit d1f40b8) と同 logic を bash で reify (CLI 用、 lint chain 連動)
#
# 3 layer audit:
#   Layer A: literal verification (数字 token + source link annotation)
#   Layer B: 誇張 phrase blocklist (「完成」 「達成」 「Done」 「世界初」 等)
#   Layer C: dogfood evidence link check
#
# usage:
#   ./scripts/honesty_audit.sh path/to/draft.md
#   ./scripts/honesty_audit.sh path/to/draft.md --strict (red 1 件で exit 2)

set -euo pipefail

STRICT=false
input_file=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict)
      STRICT=true
      shift
      ;;
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
info_count=0

echo "═══════════════════════════════════════════════"
echo "honesty_audit: ${input_file}"
echo "═══════════════════════════════════════════════"

# Layer A: 数字 token + source annotation check
echo ""
echo "── Layer A: literal verification (数字 token + source link) ──"
number_tokens=$(echo "$content" | grep -oE '[0-9]+(\.[0-9]+)?\s*(day|日|時間|ヶ月|月|週間?|分|秒|件|名|円|¥|%|連続|回)' | head -20)

if [[ -n "$number_tokens" ]]; then
  while IFS= read -r token; do
    # 該当 token 周辺 200 文字に source: link annotation あるか確認
    if echo "$content" | grep -B 2 -A 2 -F "$token" 2>/dev/null | grep -qE 'source:\s*\S+\.md(#L[0-9]+)?'; then
      info_count=$((info_count + 1))
    else
      yellow_count=$((yellow_count + 1))
      echo "  🟡 数字 token 「${token}」 の source link annotation 不在"
    fi
  done <<<"$number_tokens"
else
  echo "  (数字 token 検出なし)"
fi

# Layer B: 誇張 phrase blocklist (context-aware regex 化、 5/08 false positive 解消対応)
echo ""
echo "── Layer B: 誇張 phrase block ──"

# 煽り / 絶対表現 main blocklist
EXAGGERATION_BLOCKLIST=(
  "完成"
  "達成"
  "Done"
  "完了"
  "成功確実"
  "必ず"
  "間違いなく"
  "世界初"
  "業界初"
  "革命"
  "完璧"
  "急成長"
  "次世代"
  "突破"
  "保証"
  "確実"
)

# 文脈中立 phrase exclude list (5/08 Kagami QA Round 1 false positive 解消)
# これらの phrase が match した行は red にしない (中立 / 否定 / 質問形 / status)
EXCLUDE_PATTERNS=(
  "完了予定"
  "完了する予定"
  "完了見込み"
  "完了したか"
  "完了済み"
  "完了報告"
  "完了 timestamp"
  "完了 date"
  "installation 完了"
  "setup 完了"
  "build 完了"
  "test 完了"
  "完璧ではない"
  "完璧ではありません"
  "完璧でない"
  "完璧を求めない"
  "完成度"
  "完成形"
  "達成度"
  "達成可能"
  "未達成"
  "達成してい?ない"
  "達成しよう"
  "確実性"
  "不確実"
  "保証されない"
  "保証はない"
)

# 「reify (北極星未達)」 narrative 不在 + 誇張 phrase 単独使用 で red
has_reify_narrative=false
if echo "$content" | grep -qE 'reify\s*\(\s*北極星未達\s*\)'; then
  has_reify_narrative=true
fi

# 行単位で評価: line に blocklist phrase が含まれ、かつ exclude pattern に該当しない場合のみ count
for phrase in "${EXAGGERATION_BLOCKLIST[@]}"; do
  # 該当 phrase を含む行を抽出
  matched_lines=$(echo "$content" | grep -nF "$phrase" || true)
  if [[ -z "$matched_lines" ]]; then
    continue
  fi

  effective_matches=0
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    # exclude pattern check
    is_excluded=false
    for excl in "${EXCLUDE_PATTERNS[@]}"; do
      if echo "$line" | grep -qE "$excl"; then
        is_excluded=true
        break
      fi
    done
    if [[ "$is_excluded" == "false" ]]; then
      effective_matches=$((effective_matches + 1))
    fi
  done <<<"$matched_lines"

  if [[ "$effective_matches" -gt 0 ]]; then
    if [[ "$has_reify_narrative" == "true" ]]; then
      info_count=$((info_count + effective_matches))
    else
      red_count=$((red_count + effective_matches))
      echo "  🔴 誇張 phrase 「${phrase}」 ${effective_matches} 件 (中立 phrase exclude 後)、 「reify (北極星未達)」 form を期待"
    fi
  fi
done

# Layer C: dogfood evidence link check
echo ""
echo "── Layer C: dogfood evidence link ──"
if echo "$content" | grep -qE 'dogfood\s*(evidence|run|verify)|aira/data/digests/|nokaze-aira/'; then
  info_count=$((info_count + 1))
  echo "  ✓ dogfood evidence link 検出"
else
  red_count=$((red_count + 1))
  echo "  🔴 dogfood evidence file path link 不在 (memory feedback_publish_before_dogfood_premature 連動)"
fi

# summary
echo ""
echo "═══════════════════════════════════════════════"
echo "honesty_audit summary:"
echo "  red:    ${red_count}"
echo "  yellow: ${yellow_count}"
echo "  info:   ${info_count}"
echo "  source: ${input_file}"
echo "═══════════════════════════════════════════════"

if [[ "$red_count" -gt 0 ]]; then
  echo ""
  echo "⚠️  red finding 検出 ${red_count} 件、 Fail Closed (memory feedback_publish_before_dogfood_premature 連動)"
  if [[ "$STRICT" == "true" ]]; then
    exit 2
  fi
  exit 1
fi

if [[ "$yellow_count" -gt 0 ]]; then
  echo ""
  echo "🟡 yellow finding 検出 ${yellow_count} 件、 source link annotation 推奨"
  exit 0
fi

echo "✓ honesty_audit passed"
exit 0
