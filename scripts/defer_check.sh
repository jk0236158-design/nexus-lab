#!/bin/bash
# defer_check.sh — 「明日に回す」 narrative 検知 (memory feedback_no_tomorrow_deferral.md + feedback_approval_wait_default_drift.md enforcement reify)
# 5/07 PM 23:29 起稿、 jun directive 「全部今日やってみな」 連動 (drift 5 段目 同 session 内 3 度目発火 reform)
#
# 検出対象:
#   - 「明日 〜 する」 「後で 〜」 「5/13+ 〜」 「Phase B/C 〜」 「次回 〜」 「来週 〜」 等の deferred queue narrative
#   - 起稿 file 内に着手日 / deadline / blocker 物理 evidence 不在で defer narrative 単独発射 で red
#
# usage:
#   ./scripts/defer_check.sh path/to/draft.md
#   echo "テキスト" | ./scripts/defer_check.sh -

set -uo pipefail

# 2026-07-11 P1-1 修正 (Oto、 Kagami QA): 旧 -lc 配線では /etc/profile.d/lang.sh が LANG=ja_JP.UTF-8 を
#   設定していた。 -c 化で locale が C に落ち、 多バイト bracket / word boundary の判定が flip した
#   (30 corpus 中 5 件 = inbound×4 + english×1)。 profile 非依存で script 冒頭に明示 = 単体実行でも同じ挙動。
export LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8

DEFER_PHRASES=(
  "明日に回す"
  "明日やる"
  "明日朝"
  "明日 朝"
  "後でやる"
  "後で着手"
  "5/13\\+"
  "5/13 \\+"
  "5/13 carry"
  "5/13 持ち越し"
  "5/13に回"
  "Phase B carry"
  "Phase C carry"
  "Phase B/C carry"
  "次回 session"
  "来週やる"
  "来週着手"
  "後日"
  "あとで"
  "持ち越し"
)

input_file=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -)
      input_file="-"
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
  echo "ERROR: file path or '-' for stdin required" >&2
  exit 1
fi

if [[ "$input_file" == "-" ]]; then
  content=$(cat)
else
  if [[ ! -f "$input_file" ]]; then
    echo "ERROR: file not found: $input_file" >&2
    exit 1
  fi
  content=$(cat "$input_file")
fi

red_count=0
findings=()

echo "═══════════════════════════════════════════════"
echo "defer_check: ${input_file}"
echo "═══════════════════════════════════════════════"

# 2026-07-11 高速化 (Oto): 結合 alternation で 1 回 prefilter、 hit なし (通常 case) は
#   per-phrase の echo|grep|wc|tr 4 プロセス spawn × 19 phrase を全 skip。 hit 時のみ従来 loop = 判定不変。
_joined=$(IFS='|'; printf '%s' "${DEFER_PHRASES[*]}")
if echo "$content" | grep -qiE "$_joined" 2>/dev/null; then
  for phrase in "${DEFER_PHRASES[@]}"; do
    matches=$(echo "$content" | grep -oiE "$phrase" 2>/dev/null | wc -l | tr -d ' ' || true)
    matches=${matches:-0}
    if [[ "$matches" -gt 0 ]]; then
      red_count=$((red_count + matches))
      findings+=("${phrase}(${matches})")
      echo "  🔴 deferred 表現 「${phrase}」 ${matches} 件"
    fi
  done
fi

# evidence check: defer narrative + 着手日 / deadline / blocker 物理 evidence
has_evidence=false
if echo "$content" | grep -qE '(deadline|期限|着手日|blocker|物理\s*障害|evidence|根拠)'; then
  has_evidence=true
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "defer_check summary:"
echo "  total defer phrases: ${red_count}"
echo "  evidence present:    ${has_evidence}"
echo "  source: ${input_file}"
echo "═══════════════════════════════════════════════"

if [[ "$red_count" -gt 0 ]] && [[ "$has_evidence" == "false" ]]; then
  echo ""
  echo "⚠️  defer narrative 検出 ${red_count} 件、 着手日 / deadline / blocker evidence 不在"
  echo "   reference: memory/feedback_no_tomorrow_deferral.md + feedback_approval_wait_default_drift.md"
  echo "   reform: 「明日」 「後で」 「5/13+」 を default にせず、 即時着手 / blocker 明示 / inbox 起票 物理 trigger 化"
  exit 2
fi

if [[ "$red_count" -gt 0 ]]; then
  echo ""
  echo "🟡 defer narrative 検出 ${red_count} 件 (evidence あり)、 念のため確認推奨"
  exit 0
fi

echo "✓ defer_check passed"
exit 0
