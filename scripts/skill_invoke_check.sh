#!/bin/bash
# skill_invoke_check.sh — visual artifact 起稿前 skill 存在 check + invoke 強制
# memory feedback_nokaze_design_skill_skip_drift.md enforcement reify、 5/07 PM 23:30 起稿
#
# 検出対象:
#   - 起稿 file が UI / frontend / docs / LP / dashboard 系 (拡張子 .tsx / .css / .html / .md で keyword detect)
#   - 関連 skill (~/.claude/skills/<skill-name>/) 存在 check + 起稿 file 内 「skill 参照済」 evidence (例: nokaze-design / nokaze tokens の token 名 / SKILL.md 言及) 不在で red
#
# usage:
#   ./scripts/skill_invoke_check.sh path/to/component.tsx
#   ./scripts/skill_invoke_check.sh path/to/draft.md

set -uo pipefail

SKILLS_DIR="$HOME/.claude/skills"

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

ext="${input_file##*.}"
content=$(cat "$input_file")

echo "═══════════════════════════════════════════════"
echo "skill_invoke_check: ${input_file}"
echo "═══════════════════════════════════════════════"

# visual artifact detection
is_visual=false
case "$ext" in
  tsx|jsx|css|scss|html|svelte|vue)
    is_visual=true
    ;;
  md)
    if echo "$content" | grep -qiE 'LP|landing|公開|README|design|UI|ダッシュボード|console'; then
      is_visual=true
    fi
    ;;
esac

if [[ "$is_visual" == "false" ]]; then
  echo "  (visual artifact ではないため skip)"
  exit 0
fi

echo "  visual artifact 検出 (拡張子: ${ext})"

# 関連 skill 候補 (現状 nokaze-design 1 件、 拡張時はここに追記)
RELATED_SKILLS=("nokaze-design")

red_count=0

for skill in "${RELATED_SKILLS[@]}"; do
  skill_path="${SKILLS_DIR}/${skill}"
  if [[ ! -d "$skill_path" ]]; then
    echo "  ⚪ skill 「${skill}」 未 install (skip)"
    continue
  fi

  echo "  ✓ skill 「${skill}」 install 済 (${skill_path})"

  # skill 参照 evidence check
  has_evidence=false

  # token 名 (skill 内 colors_and_type.css / SKILL.md の token 名) を grep
  if [[ -f "${skill_path}/SKILL.md" ]] || [[ -f "${skill_path}/README.md" ]]; then
    # nokaze-design 特有 token (障子紙 / 墨色 / 風化木 / olive / nokaze-)
    if echo "$content" | grep -qiE '(障子紙|墨色|風化木|nokaze-|--nokaze|F5F3EE|1F1F1F|6B8E23|8AAF2E|C19A6B|Noto Serif JP|Noto Sans JP|JetBrains Mono)'; then
      has_evidence=true
      echo "    ✓ skill token 参照 evidence 検出"
    fi
  fi

  if [[ "$has_evidence" == "false" ]]; then
    red_count=$((red_count + 1))
    echo "    🔴 skill 「${skill}」 install 済だが file 内に参照 evidence 不在"
    echo "       → 着手前に skill 内容 read + asset 採用、 自分で再発明禁止"
  fi
done

echo ""
echo "═══════════════════════════════════════════════"
echo "skill_invoke_check summary:"
echo "  red:    ${red_count}"
echo "  source: ${input_file}"
echo "═══════════════════════════════════════════════"

if [[ "$red_count" -gt 0 ]]; then
  echo ""
  echo "⚠️  red ${red_count} 件、 visual artifact 起稿前 skill invoke 必須"
  echo "   reference: memory/feedback_nokaze_design_skill_skip_drift.md"
  exit 2
fi

echo "✓ skill_invoke_check passed"
exit 0
