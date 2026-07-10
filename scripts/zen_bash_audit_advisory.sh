#!/usr/bin/env bash
# zen_bash_audit_advisory.sh — PreToolUse hook for Bash tool (advisory only)
#
# 起点: 2026-05-08 enforcement layer reform 5-axis (axis 2 = R3 of Iwa proposal).
# Bash tool fire 直前に command 内容を inspect し、 dev server 起動 / frontend
# build に該当する場合は対応する advisory script を chain fire して stderr に
# 1 line 警告を出す (block しない、 exit 0 固定)。
#
# 動作:
#   stdin JSON: { "tool_name": "Bash", "tool_input": { "command": "..." } }
#
#   検出:
#     - dev server 起動 command (npm run dev / pnpm dev / vite / next dev / yuino:start 等)
#       → dev_server_stale_check.sh chain fire (advisory only、 result を 1 line 要約)
#     - frontend build / preview command (npm run build / vite build / next build)
#       → ui_visual_verify_check.sh advisory note (実 verify ではなく reminder)
#
# 再帰防止:
#   command が `board_audit_step` / `zen_bash_audit_advisory` / `dev_server_stale_check`
#   / `ui_visual_verify_check` 自身を含む場合は即 exit 0。
#
# 禁忌:
#   - block しない (exit 2 を返さない)、 advisory のみ。
#   - timeout 5 sec 上限 (.claude/settings.json で設定)、 各 chain check も内部 timeout 3 sec。
#
# Spec: ~/.shared-ops/board/2026-05-08_iwa_zen_enforcement_layer_reform_proposal.md § 軸 1-D / R3

set -uo pipefail

# 2026-07-11 P1-1 修正 (Oto、 Kagami QA): 旧 -lc 配線では /etc/profile.d/lang.sh が LANG=ja_JP.UTF-8 を
#   設定していた。 -c 化で locale が C に落ち、 多バイト bracket / word boundary の判定が flip した
#   (30 corpus 中 5 件 = inbound×4 + english×1)。 profile 非依存で script 冒頭に明示 = 単体実行でも同じ挙動。
export LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8

INPUT=$(cat)

# python3 で JSON parse (jq 依存しない、 既 zen_semantic_check_hook.sh と同 form)
PYTHON_CMD=""
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
fi

if [ -z "$PYTHON_CMD" ]; then
    exit 0
fi

PARSED=$(echo "$INPUT" | "$PYTHON_CMD" -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    tool = data.get('tool_name', '')
    inp = data.get('tool_input', {})
    cmd = inp.get('command', '') or ''
    print(f'{tool}|||{cmd}')
except Exception:
    print('ERROR|||')
" 2>/dev/null)

TOOL=$(echo "$PARSED" | sed -E 's/\|\|\|.*$//')
COMMAND=$(echo "$PARSED" | sed -E 's/^[^|]*\|\|\|//')

# Bash 以外 (= 通常起動しないが defensive) は skip
if [[ "$TOOL" != "Bash" ]]; then
    exit 0
fi

# 再帰防止: 自分自身 / 関連 advisory を呼ぶ command は skip
case "$COMMAND" in
    *board_audit_step*|*zen_bash_audit_advisory*|*dev_server_stale_check*|*ui_visual_verify_check*)
        exit 0
        ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_STALE_CHECK="$SCRIPT_DIR/dev_server_stale_check.sh"
UI_VERIFY_CHECK="$SCRIPT_DIR/ui_visual_verify_check.sh"

WARNINGS=()

# ---------------------------------------------------------------
# detect 1: dev server 起動 command
# ---------------------------------------------------------------
# trigger keyword: `npm run dev` / `pnpm dev` / `pnpm run dev` / `yarn dev`
# / `vite` / `next dev` / `yuino:start` / `yuino:dev` / `nokaze:dev`
DEV_PATTERN='(npm[[:space:]]+run[[:space:]]+dev|pnpm([[:space:]]+run)?[[:space:]]+dev|yarn([[:space:]]+run)?[[:space:]]+dev|^[[:space:]]*vite([[:space:]]|$)|next[[:space:]]+dev|yuino:(start|dev)|nokaze:dev)'

if echo "$COMMAND" | grep -qE "$DEV_PATTERN"; then
    if [[ -x "$DEV_STALE_CHECK" ]]; then
        # internal 3 sec timeout, ignore exit code (advisory)
        STALE_OUT=$(timeout 3 bash "$DEV_STALE_CHECK" 2>/dev/null || true)
        # parse: 「stale process 検出 N 件」 line があれば warn
        STALE_N=$(echo "$STALE_OUT" | grep -oE 'stale process 検出 [0-9]+ 件' | grep -oE '[0-9]+' | head -1 || echo 0)
        STALE_N=${STALE_N:-0}
        if [[ "$STALE_N" =~ ^[0-9]+$ && "$STALE_N" -gt 0 ]]; then
            WARNINGS+=("dev_server_stale: ${STALE_N} 件 (clean restart 推奨、 taskkill で kill 後再起動)")
        fi
    fi
fi

# ---------------------------------------------------------------
# detect 2: frontend build / preview command
# ---------------------------------------------------------------
# trigger keyword: `npm run build` / `pnpm build` / `vite build` / `next build`
# / `yuino:build` / `nokaze:build`
BUILD_PATTERN='(npm[[:space:]]+run[[:space:]]+build|pnpm([[:space:]]+run)?[[:space:]]+build|yarn([[:space:]]+run)?[[:space:]]+build|vite[[:space:]]+build|next[[:space:]]+build|yuino:build|nokaze:build)'

if echo "$COMMAND" | grep -qE "$BUILD_PATTERN"; then
    # ui_visual_verify_check は実起動 verify、 hook で fire するには重い (curl + 30sec)
    # ここでは reminder の advisory note のみ、 実 verify は別途 manual invoke
    WARNINGS+=("ui_visual_verify: build 後は dev server 起動 + 全 route 200 + screenshot 確認推奨 (ritual: scripts/ui_visual_verify_check.sh)")
fi

# ---------------------------------------------------------------
# warn 出力 (advisory only、 exit 0)
# ---------------------------------------------------------------
if [[ ${#WARNINGS[@]} -gt 0 ]]; then
    echo "" >&2
    echo "  ⚠️  zen_bash_audit_advisory (advisory):" >&2
    for w in "${WARNINGS[@]}"; do
        echo "      - $w" >&2
    done
fi

exit 0
