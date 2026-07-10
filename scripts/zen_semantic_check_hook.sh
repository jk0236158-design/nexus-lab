#!/usr/bin/env bash
# zen_semantic_check_hook.sh — PreToolUse hook: semantic check chain (advisory)
#
# 起点: 2026-05-08 jun directive 「介入なくても大丈夫だって思えるとこまで設定」 連動、
# enforcement scripts 主要 3 件 (vocabulary_lint + naming_mixup + defer_check) を
# Write/Edit/NotebookEdit tool fire 前の advisory hook として chain 化。
#
# 役割:
#   Write/Edit/NotebookEdit fire 前に file content + new_string に対して
#   semantic check 3 件を順次 fire、 red detect で warn (block しない)。
#
#   既存 subagent_write_gate.sh (path-level deny) と並列 fire、
#   path gate 通過後の content semantic check 層として機能。
#
# 動作:
#   - stdin JSON: { "tool_name": "Write|Edit|...", "tool_input": { "file_path": ..., "content": ..., "new_string": ... } }
#   - file_path で対象を decide (.md / .ts / .tsx / .yaml 等)
#   - content / new_string を temp file に書き出し
#   - vocabulary_lint.sh + naming_mixup_check.sh + defer_check.sh を順次 fire
#   - red detect で warn message stderr に出力、 但し exit 0 (block しない、 advisory)
#   - 全 green or check 対象外 (binary / 大 file 等) で exit 0
#
# 禁忌:
#   - 本 hook で block すると workflow 阻害 risk 大、 commit 直前に再 audit form
#   - hook の出力過多は claude code session log で context 汚染、 1 line summary のみ
#
# Spec: team_memory/zen/zen_autonomous_behavior_unified_spec_2026-05-08.md (Phase B carry 1 番)

set -uo pipefail

# 2026-07-11 P1-1 修正 (Oto、 Kagami QA): 旧 -lc 配線では /etc/profile.d/lang.sh が LANG=ja_JP.UTF-8 を
#   設定していた。 -c 化で locale が C に落ち、 多バイト bracket / word boundary の判定が flip した
#   (30 corpus 中 5 件 = inbound×4 + english×1)。 profile 非依存で script 冒頭に明示 = 単体実行でも同じ挙動。
export LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8

INPUT=$(cat)

# python3 確認
PYTHON_CMD=""
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
fi

if [ -z "$PYTHON_CMD" ]; then
    # python 不在時は skip (advisory なので block しない)
    exit 0
fi

# tool_input から file_path + content / new_string 抽出
PARSED=$(echo "$INPUT" | "$PYTHON_CMD" -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    tool = data.get('tool_name', '')
    inp = data.get('tool_input', {})
    fp = inp.get('file_path', '') or inp.get('notebook_path', '') or inp.get('path', '')
    # Write は content、 Edit は new_string
    body = inp.get('content', '') or inp.get('new_string', '')
    print(f'{tool}|{fp}|{len(body)}')
    # body は別 fd で出すには大きすぎる場合あり、 ここでは meta のみ
except Exception as e:
    print(f'ERROR|{e}|0')
" 2>/dev/null)

TOOL=$(echo "$PARSED" | cut -d'|' -f1)
FILE_PATH=$(echo "$PARSED" | cut -d'|' -f2)
BODY_LEN=$(echo "$PARSED" | cut -d'|' -f3)

# Write/Edit/NotebookEdit 以外は skip
case "$TOOL" in
    Write|Edit|NotebookEdit) ;;
    *) exit 0 ;;
esac

# binary / 大 file / .md.ts.tsx.yaml 以外は skip
case "$FILE_PATH" in
    *.md|*.ts|*.tsx|*.js|*.jsx|*.yaml|*.yml|*.txt|*.css) ;;
    *) exit 0 ;;
esac

# 大 file (10000 字超) は skip (advisory hook の overhead 抑制)
if [[ -n "$BODY_LEN" && "$BODY_LEN" -gt 10000 ]]; then
    exit 0
fi

# body を temp file に書き出し
TEMP_FILE=$(mktemp /tmp/zen_semantic_check_XXXXXX.tmp 2>/dev/null || mktemp)
echo "$INPUT" | "$PYTHON_CMD" -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    inp = data.get('tool_input', {})
    body = inp.get('content', '') or inp.get('new_string', '')
    print(body)
except:
    pass
" > "$TEMP_FILE" 2>/dev/null

# script path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VOCAB_LINT="$SCRIPT_DIR/vocabulary_lint.sh"
NAMING_CHECK="$SCRIPT_DIR/naming_mixup_check.sh"
DEFER_CHECK="$SCRIPT_DIR/defer_check.sh"

# warn collector
WARNINGS=()

# ============================================================
# check 1: vocabulary_lint (英語混入過剰)
# ============================================================

if [[ -x "$VOCAB_LINT" ]]; then
    VOCAB_RESULT=$(bash "$VOCAB_LINT" "$TEMP_FILE" 2>/dev/null | grep -oE "red paragraphs:\s+[0-9]+" | head -1 | grep -oE "[0-9]+" | head -1 | tr -d ' \n' || echo 0)
    VOCAB_RESULT=${VOCAB_RESULT:-0}
    if [[ "$VOCAB_RESULT" =~ ^[0-9]+$ && "$VOCAB_RESULT" -gt 0 ]]; then
        WARNINGS+=("vocabulary_lint: red ${VOCAB_RESULT} 段落 (英語混入過剰)")
    fi
fi

# ============================================================
# check 2: naming_mixup_check (Aira/Yuino 用語混同)
# ============================================================

if [[ -x "$NAMING_CHECK" ]]; then
    NAMING_RESULT=$(bash "$NAMING_CHECK" "$TEMP_FILE" 2>/dev/null | grep -oE "warn: [0-9]+|red: [0-9]+" | head -1 || echo "")
    if [[ -n "$NAMING_RESULT" && "$NAMING_RESULT" != "warn: 0" && "$NAMING_RESULT" != "red: 0" ]]; then
        WARNINGS+=("naming_mixup_check: $NAMING_RESULT (Aira/Yuino 用語混同 candidate)")
    fi
fi

# ============================================================
# check 3: defer_check (「明日」「5/13+」 narrative)
# ============================================================

if [[ -x "$DEFER_CHECK" ]]; then
    DEFER_RESULT=$(bash "$DEFER_CHECK" "$TEMP_FILE" 2>/dev/null | grep -oE "red: [0-9]+|warn: [0-9]+" | head -1 || echo "")
    if [[ -n "$DEFER_RESULT" && "$DEFER_RESULT" != "warn: 0" && "$DEFER_RESULT" != "red: 0" ]]; then
        WARNINGS+=("defer_check: $DEFER_RESULT (deferred queue narrative candidate)")
    fi
fi

# ============================================================
# warn 出力 (advisory、 block しない)
# ============================================================

if [[ ${#WARNINGS[@]} -gt 0 ]]; then
    echo "" >&2
    echo "  ⚠️  zen_semantic_check_hook (advisory): $FILE_PATH" >&2
    for w in "${WARNINGS[@]}"; do
        echo "      - $w" >&2
    done
    echo "      → commit 直前に再 audit + paraphrase 推奨" >&2
fi

# cleanup
rm -f "$TEMP_FILE"

exit 0
