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

# 2026-07-11 P1-1 修正 (Oto、 Kagami QA): 旧 -lc 配線では /etc/profile.d/lang.sh が LANG=ja_JP.UTF-8 を
#   設定していた。 -c 化で locale が C に落ち、 多バイト bracket / word boundary の判定が flip した
#   (30 corpus 中 5 件 = inbound×4 + english×1)。 profile 非依存で script 冒頭に明示 = 単体実行でも同じ挙動。
export LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8

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
  # 5/13 朝 jun 14 度目発火 (= 「operator role (= preflight hold / Decision Stability hold 解除判断)」
  # 段が chat output で出た incident) で追加: Kai 連携の内部実装語彙、 chat 段で jun に
  # 届くと AI/プログラム 4 ヶ月初心者には読めない。 板 file 内の Kai 引用は固有名詞扱い、
  # 私 (Zen) の判断 section や chat 報告で 5 件以上混入したら書き直し。
  "operator"
  "preflight"
  "hold"
  "block"
  "Decision Stability"
  "Agent Bus"
  "Result Writer"
  "Execution Plan"
  "actionable"
  "harden"
  "watch group"
  "recency-drift"
  "task_status_mismatch"
  "claim"
  "heartbeat"
  "inbox"
  "outbox"
  "packet"
  "dedupe"
  "routing"
  "result marker"
  "request bridge"
  "phase gate"
  "sandbox"
  "Chat Bridge"
  "Source-of-Truth"
  "preflight_block"
  "harden_decision_stability"
  "wake/result"
  # 5/13 evening jun 15 度目発火 (= 「また報告がいつも通り」、 朝の 4 段目 reform 当日中に再発、
  # chat 段の地の文に 21 単語混入) で追加。 既存 INTERNAL_VOCAB 未登録の漏れ単語を追加、
  # vocabulary_lint で板 file / 報告 file の 5 件超え検出を厳格化。
  "self-detect"
  "light ACK"
  "rolled back"
  "continued"
  "continuation"
  "polling sweep"
  "polling"
  "idle continue"
  "audit log"
  "subset"
  "root cause"
  "signature"
  "sweep"
  # 5/27 朝 9 段 review 推奨 8-2 追加 (= paraphrase_layer_acceptance.md 33 件中 hook 未 catch 軸軸 軸 主要 10 件)
  # 9 段 review articulate 「articulate / structural / surface / sibling / cycle / continuum /
  # prerequisite / return / actual / self-pacing 等」 のうち、 一般単語 conflict 軸軸 軸 慎重なもの
  # (= return / actual / go / judgment 等) は word-boundary regex 軸軸 軸 別 turn で integration 候補。
  "articulate"
  "structural"
  "surface"
  "sibling"
  "cycle"
  "continuum"
  "prerequisite"
  "fallback"
  "anchor"
  "baseline"
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

# 人間 day 換算 narrative の検出 pattern (5/12 jun 指摘 9 度目発火後の物理化、
# memory feedback_ai_time_scale.md の運用埋め込み)
# 「N 日で reify」「N 月 N 日-N 月 N 日 で reify」「9 日かかる」 等の人間 time scale の言い方
HUMAN_DAY_NARRATIVE_PATTERNS=(
  "[0-9]+ 日で.*(reify|形にする|実装|完成)"
  "[0-9]+ 日かかる"
  "[0-9]+ 日かけて"
  "[0-9]+/[0-9]+-[0-9]+/[0-9]+"
  "[0-9]+ 週間で"
  "[0-9]+ ヶ月で"
  "5/13-5/1[6-9]"
  "5/17-5/2[01]"
)

# jun 発言の捏造 (時間圧) 検出 pattern (5/12 jun 10 度目発火後の物理化)
# 「来月以内 / 半年以内 / N ヶ月以内」 等の時間圧の言葉を 私が jun 発言として補う前に検出
JUN_TIME_PRESSURE_FABRICATION_PATTERNS=(
  "来月以内"
  "半年以内"
  "[0-9]+ ヶ月以内"
  "[0-9]+ 週間以内"
  "[0-9]+ 日以内"
  "時間圧"
  "時間目標"
  "売上を立てたい"
)

# 「明日に回す」 検出 pattern (5/12 jun 議題 5 優先 1、 Kai 同意)
# 「明日朝」「5/N 朝」「後回し」 等の日付指定 + 持ち越し narrative を、
# 今やる時間があるのに 翌日や次の自走に逃がす癖を捕まえる。
TOMORROW_DEFERRAL_PATTERNS=(
  "明日に回す"
  "明日朝"
  "明日着手"
  "明後日"
  "5/[0-9]+ 朝"
  "5/[0-9]+ 夜"
  "今夜 carry"
  "carry に置く"
  "carry candidate"
  "持ち越しに置く"
  "持ち越し候補"
  # 5/13 jun 13 度目発火後の追加: 「朝」 narrative の暗黙な日付指定
  "朝の jun 確認"
  "朝の OK 待ち"
  "朝の startup sweep"
  "朝の自走"
  "朝起きた時"
  "翌朝着手"
  "翌朝 carry"
  "morning_handoff"
  "[0-9]+ 朝 着手"
)

# 自慢の言い回し (overclaim) 検出 pattern (5/12 jun 議題 5 優先 2、 Kai 同意)
# 「研究結果」「完成」「達成」 等を 証拠が薄い場面で使う癖を捕まえる。
# 反証可能性 + 数字裏付けが必要なら作者が確認する trigger。
OVERCLAIM_PATTERNS=(
  "研究結果"
  "達成完了"
  "完成しました"
  "完成済"
  "業界トップ"
  "業界初"
  "次世代"
  "革新的"
  "突破"
  "急成長"
  "圧倒的"
  "最高品質"
  "万全"
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
  # 2026-07-11 高速化 (Oto): 結合 alternation で 1 回 prefilter、 hit なし (通常 case) は
  #   per-pattern grep spawn (= MSYS で 1 spawn ~100ms) を全 skip。 hit 時のみ従来 loop = 判定不変。
  local _joined; _joined=$(IFS='|'; printf '%s' "${REACTOR_PHRASES[*]}")
  grep -qE "$_joined" "$file" 2>/dev/null || return 0
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

# 人間 day 換算 narrative の検出関数 (5/12 jun 9 度目指摘 後の物理化)
check_human_day_narrative() {
  local file="$1"
  local hits=0
  local pattern line
  # 2026-07-11 高速化 (Oto): 結合 prefilter、 hit 時のみ従来 loop = 判定不変
  local _joined; _joined=$(IFS='|'; printf '%s' "${HUMAN_DAY_NARRATIVE_PATTERNS[*]}")
  grep -qE "$_joined" "$file" 2>/dev/null || return 0
  for pattern in "${HUMAN_DAY_NARRATIVE_PATTERNS[@]}"; do
    if grep -qE "$pattern" "$file" 2>/dev/null; then
      line=$(grep -nE "$pattern" "$file" 2>/dev/null | head -1)
      echo "[人間 day 換算 検出] $file: $line" >&2
      echo "  → 「$pattern」 = 人間 time scale の言い方" >&2
      echo "  → 代替: AI 時間感覚 で 「1 ターン で出す」「dogfood + 修正 の繰り返し」 等" >&2
      hits=$((hits + 1))
    fi
  done
  if [[ $hits -gt 0 ]]; then
    echo "" >&2
    echo "[人間 day 換算 summary] $file: $hits 件 hit" >&2
    echo "参照: memory feedback_ai_time_scale.md (4/17 起票)" >&2
  fi
  return $hits
}

# jun 発言の捏造 (時間圧) 検出関数 (5/12 jun 10 度目発火後の物理化)
check_jun_time_pressure_fabrication() {
  local file="$1"
  local hits=0
  local pattern line
  # 2026-07-11 高速化 (Oto): 結合 prefilter、 hit 時のみ従来 loop = 判定不変
  local _joined; _joined=$(IFS='|'; printf '%s' "${JUN_TIME_PRESSURE_FABRICATION_PATTERNS[*]}")
  grep -qE "$_joined" "$file" 2>/dev/null || return 0
  for pattern in "${JUN_TIME_PRESSURE_FABRICATION_PATTERNS[@]}"; do
    if grep -qE "$pattern" "$file" 2>/dev/null; then
      line=$(grep -nE "$pattern" "$file" 2>/dev/null | head -1)
      echo "[jun 発言捏造 検出] $file: $line" >&2
      echo "  → 「$pattern」 = jun が言っていない時間圧の言葉" >&2
      echo "  → 確認: jun が actual に発言したか、 私が補ったかを区別、 私の判断なら 「私の独自 judgment」 と明示" >&2
      hits=$((hits + 1))
    fi
  done
  if [[ $hits -gt 0 ]]; then
    echo "" >&2
    echo "[jun 発言捏造 summary] $file: $hits 件 hit" >&2
    echo "参照: 5/12 jun 「来月以内に売上を立てたいなんて俺言った?」 発火 10 度目" >&2
  fi
  return $hits
}

# 「明日に回す」 検出関数 (5/12 議題 5 優先 1)
check_tomorrow_deferral() {
  local file="$1"
  local hits=0
  local pattern line
  # 2026-07-11 高速化 (Oto): 結合 prefilter、 hit 時のみ従来 loop = 判定不変
  local _joined; _joined=$(IFS='|'; printf '%s' "${TOMORROW_DEFERRAL_PATTERNS[*]}")
  grep -qE "$_joined" "$file" 2>/dev/null || return 0
  for pattern in "${TOMORROW_DEFERRAL_PATTERNS[@]}"; do
    if grep -qE "$pattern" "$file" 2>/dev/null; then
      line=$(grep -nE "$pattern" "$file" 2>/dev/null | head -1)
      echo "[明日に回す 検出] $file: $line" >&2
      echo "  → 「$pattern」 = 翌日や次の自走に逃がす言い方" >&2
      echo "  → 確認: actual に明日でないと動かない理由はあるか、 今やる時間はあるか" >&2
      hits=$((hits + 1))
    fi
  done
  if [[ $hits -gt 0 ]]; then
    echo "" >&2
    echo "[明日に回す summary] $file: $hits 件 hit" >&2
    echo "参照: memory feedback_no_tomorrow_deferral.md (4/23 起票) + 5/12 同 session 内 3 度発火" >&2
  fi
  return $hits
}

# 自慢の言い回し (overclaim) 検出関数 (5/12 議題 5 優先 2)
check_overclaim() {
  local file="$1"
  local hits=0
  local pattern line
  # 2026-07-11 高速化 (Oto): 結合 prefilter、 hit 時のみ従来 loop = 判定不変
  local _joined; _joined=$(IFS='|'; printf '%s' "${OVERCLAIM_PATTERNS[*]}")
  grep -qE "$_joined" "$file" 2>/dev/null || return 0
  for pattern in "${OVERCLAIM_PATTERNS[@]}"; do
    if grep -qE "$pattern" "$file" 2>/dev/null; then
      line=$(grep -nE "$pattern" "$file" 2>/dev/null | head -1)
      echo "[自慢の言い回し 検出] $file: $line" >&2
      echo "  → 「$pattern」 = 証拠が薄いまま大きく言う癖" >&2
      echo "  → 確認: 数字の裏付け + 反証可能性が書かれているか、 honest な言い直し候補" >&2
      hits=$((hits + 1))
    fi
  done
  if [[ $hits -gt 0 ]]; then
    echo "" >&2
    echo "[自慢の言い回し summary] $file: $hits 件 hit" >&2
    echo "参照: memory feedback_honesty_violation_exaggeration.md (5/03 起票)" >&2
  fi
  return $hits
}

# 段落単位 (連続空行で区切り) で 英単語 count
total_findings=0
red_paragraphs=0
reactor_hits=0
human_day_hits=0
jun_fabrication_hits=0
tomorrow_deferral_hits=0
overclaim_hits=0

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
  # 2026-07-11 高速化 (Oto): 旧 form は単語ごとに echo|grep|wc|tr の 4 プロセスを spawn
  #   (= 140 語 × 4 spawn、 MSYS の spawn は 1 回 ~100ms で hook timeout の主因、 実測 93 秒)。
  #   同じ判定 (case-insensitive word boundary の出現数) を gawk 1 プロセスで一括算出する。
  #   \y は gawk の word boundary (= GNU grep の \b と同じ)、 INTERNAL_VOCAB は全て ASCII なので locale 非依存。
  local awk_out
  awk_out=$(VOCAB_WORDS=$(printf '%s\n' "${INTERNAL_VOCAB[@]}") awk -v IGNORECASE=1 '
    BEGIN { nw = split(ENVIRON["VOCAB_WORDS"], w, "\n") }
    { text = text $0 "\n" }
    END {
      for (i = 1; i <= nw; i++) {
        if (w[i] == "") continue
        t = text
        n = gsub("\\y" w[i] "\\y", "", t)
        if (n > 0) print w[i] "|" n
      }
    }' <<<"$current_paragraph" 2>/dev/null || true)
  local wname wcount
  while IFS='|' read -r wname wcount; do
    [[ -z "$wname" || -z "$wcount" ]] && continue
    count=$((count + wcount))
    matched+=("${wname}(${wcount})")
  done <<<"$awk_out"

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
  check_human_day_narrative "$input_file"
  human_day_hits=$?
  check_jun_time_pressure_fabrication "$input_file"
  jun_fabrication_hits=$?
  check_tomorrow_deferral "$input_file"
  tomorrow_deferral_hits=$?
  check_overclaim "$input_file"
  overclaim_hits=$?
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
echo "  human day narrative:   ${human_day_hits} (5/12 jun 9 度目発火後の物理化、 feedback_ai_time_scale 連動)"
echo "  jun fabrication hits:  ${jun_fabrication_hits} (5/12 jun 10 度目発火後の物理化、 jun 発言の捏造検出)"
echo "  tomorrow deferral:     ${tomorrow_deferral_hits} (5/12 議題 5 優先 1、 「明日に回す」 言い回し検出)"
echo "  overclaim hits:        ${overclaim_hits} (5/12 議題 5 優先 2、 自慢の言い回し検出)"
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
