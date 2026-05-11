#!/bin/bash
# vocabulary_lint.sh — 英語混じり過剰の自動検知 (memory feedback_excessive_english_mixing.md enforcement reify、 5/07 PM 23:02 起稿)
# 用途:
#   1. chat response 起稿前 self-check (jun への直接報告 priority)
#   2. commit hook (commit message + 起稿 file content audit)
#   3. ad-hoc grep (任意 file path 渡し)
#
# 検出対象:
#   - memory feedback_excessive_english_mixing.md substitute list の英単語 (reify / self-correct / default 等)
#   - 1 段落で 5 件超 detect で red warn (memory § reform: 1 段落 5 件超で書き直し default)
#
# usage:
#   ./scripts/vocabulary_lint.sh path/to/file.md
#   echo "テキスト" | ./scripts/vocabulary_lint.sh -
#   ./scripts/vocabulary_lint.sh path/to/file.md --threshold 3 (default 5)

set -uo pipefail

# 検出対象英単語 list (memory feedback_excessive_english_mixing.md substitute list 由来、 case-insensitive)
# 固有名詞 (Next.js / Hono / Aira / Yuino / Pattern C 等) は除外、 動詞 / 副詞 / 抽象名詞のみ
INTERNAL_VOCAB=(
  "reify"
  "self-correct"
  "default"
  "reply"
  "receipt"
  "receive"
  "decide"
  "decision"
  "step"
  "scope"
  "reform"
  "ownership"
  "shift"
  "confirm"
  "propose"
  "proposal"
  "acceptance"
  "candidate"
  "priority"
  "timeline"
  "feedback"
  "approval"
  "trigger"
  "narrative"
  "boundary"
  "drift"
  "commit"
  "push"
  "merge"
  "audit"
  "governance"
  "stance"
  "pattern"
  "axis"
  "path"
  "fire"
  "queue"
  "session"
  "completion"
  "execute"
  "execution"
  "verify"
  "verification"
  "context"
  "spec"
  "schema"
  "fidelity"
  "operational"
  "embed"
  "reflection"
  "consolidation"
  "registry"
)

# 反応装置 phrase pattern list (5/12 jun directive 連動、 主体性継続性 reform 第 3 層 物理 enforcement)
# 1 件 hit でも warn (単語 level 閾値 5 件とは別軸、 1 件 = 1 ズレ)
# 参照: concepts/Reactor_vs_subject_distinction_2026-05-11.md
REACTOR_PHRASES=(
  # 型 1: 推奨 narrative (= 責任を質問に転換)
  "私の推奨で進めますか"
  "推奨で進めますか"
  "私の判断で良いですか"
  "これで良いですか[?？]"
  "これで進めて良いですか"

  # 型 2: jun decide tied (= 責任を委任先に押し戻す)
  "jun decide"
  "jun の判断待ち"
  "jun decide tied"
  "ジュン decide"
  "jun に委ねる"
  "jun に確認待ち"

  # 型 3: peer ACK 待ち (= 責任の保留)
  "Kai ACK 待ち"
  "Kai の確認待ち"
  "peer ACK 待ち"
  "peer の確認待ち"
  "ACK 待ち"
  "review 待ち"

  # 型 4: 選択を相手に投げる
  "A/B/C どれにします"
  "どれにします[?？]"
  "どれが良いです[かか]"
  "どちらが良いです[かか]"
  "どれを選びます"

  # 補足: 「責任を感じていないから何も発生しない」 default
  "指示待ち"
  "次の指示待ち"
  "次のお願いがあれば"
  "他に何かあれば"
  "他やってほしいことあれば"
)

THRESHOLD=5
input_file=""

# arg parse
while [[ $# -gt 0 ]]; do
  case "$1" in
    --threshold)
      THRESHOLD="$2"
      shift 2
      ;;
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

# input read
if [[ "$input_file" == "-" ]]; then
  content=$(cat)
else
  if [[ ! -f "$input_file" ]]; then
    echo "ERROR: file not found: $input_file" >&2
    exit 1
  fi
  content=$(cat "$input_file")
fi

# 反応装置 phrase 検出関数 (1 件 hit でも warn、 advisory、 既存 check と並列)
check_reactor_phrases() {
  local file="$1"
  local hits=0
  local phrase line
  for phrase in "${REACTOR_PHRASES[@]}"; do
    if grep -qE "$phrase" "$file" 2>/dev/null; then
      line=$(grep -nE "$phrase" "$file" 2>/dev/null | head -1)
      echo "[反応装置検出] $file: $line" >&2
      echo "  → 「$phrase」 = 判断を相手に返す言い方" >&2
      echo "  → 代替: 「私はこう判断、 反対あれば言って」 形で出す" >&2
      hits=$((hits + 1))
    fi
  done
  if [[ $hits -gt 0 ]]; then
    echo "" >&2
    echo "[反応装置検出 summary] $file: $hits 件 hit" >&2
    echo "参照: ~/Desktop/nokaze/concepts/Reactor_vs_subject_distinction_2026-05-11.md" >&2
  fi
  return $hits
}

# 段落単位 (連続空行で区切り) で 英単語 count
total_findings=0
red_paragraphs=0
reactor_hits=0

# 段落分割 (空行 separator) + 各段落 count
paragraph_idx=0
in_paragraph=false
current_paragraph=""

flush_paragraph() {
  if [[ -z "$current_paragraph" ]]; then
    return
  fi
  paragraph_idx=$((paragraph_idx + 1))
  local count=0
  local matched=()
  for word in "${INTERNAL_VOCAB[@]}"; do
    # case-insensitive word boundary match
    local n
    n=$(echo "$current_paragraph" | grep -oiE "\\b${word}\\b" 2>/dev/null | wc -l | tr -d ' ' || true)
    n=${n:-0}
    if [[ "$n" -gt 0 ]]; then
      count=$((count + n))
      matched+=("${word}(${n})")
    fi
  done

  if [[ "$count" -ge "$THRESHOLD" ]]; then
    red_paragraphs=$((red_paragraphs + 1))
    echo "🔴 paragraph ${paragraph_idx}: 英単語 ${count} 件 (threshold ${THRESHOLD}) — ${matched[*]}"
    # 段落 preview (first 100 chars)
    local preview
    preview=$(echo "$current_paragraph" | head -c 100)
    echo "   preview: ${preview}..."
  fi
  total_findings=$((total_findings + count))
  current_paragraph=""
}

while IFS= read -r line || [[ -n "$line" ]]; do
  if [[ -z "$line" ]]; then
    flush_paragraph
  else
    current_paragraph+="$line"$'\n'
  fi
done <<<"$content"
flush_paragraph

# 反応装置 phrase check (file path がある場合のみ、 stdin は skip)
# 既存の英単語 check と並列、 advisory warn (block しない、 exit code は既存方針維持)
if [[ "$input_file" != "-" && -f "$input_file" ]]; then
  set +e
  check_reactor_phrases "$input_file"
  reactor_hits=$?
  set -e 2>/dev/null || true
fi

# summary
echo ""
echo "═══════════════════════════════════════════════"
echo "vocabulary_lint summary (memory feedback_excessive_english_mixing 連動):"
echo "  total paragraphs:      ${paragraph_idx}"
echo "  total internal vocab:  ${total_findings}"
echo "  red paragraphs:        ${red_paragraphs} (threshold: ${THRESHOLD}/段落)"
echo "  reactor phrase hits:   ${reactor_hits} (5/12 jun directive 連動 第 3 層、 1 件でも warn)"
echo "  source: ${input_file}"
echo "═══════════════════════════════════════════════"

if [[ "$red_paragraphs" -gt 0 ]]; then
  echo ""
  echo "⚠️  red paragraph 検出 (${red_paragraphs} 件)、 paraphrase 推奨"
  echo "   reference: memory/feedback_excessive_english_mixing.md § substitute list"
  if [[ "$reactor_hits" -gt 0 ]]; then
    echo "⚠️  反応装置 phrase 検出 (${reactor_hits} 件)、 主体性 form に書き直し推奨"
    echo "   reference: concepts/Reactor_vs_subject_distinction_2026-05-11.md"
  fi
  exit 2
fi

if [[ "$reactor_hits" -gt 0 ]]; then
  echo ""
  echo "⚠️  反応装置 phrase 検出 (${reactor_hits} 件)、 主体性 form に書き直し推奨 (advisory、 block しない)"
  echo "   reference: concepts/Reactor_vs_subject_distinction_2026-05-11.md"
  # advisory のみ、 exit 0 維持 (既存方針: 英単語 red paragraph のみ exit 2)
fi

echo "✓ vocabulary_lint passed"
exit 0
