#!/usr/bin/env bash
# test_board_new.sh — board_new.sh の回帰テスト
#   核心の保証を守る: ①date は $(date) 機械埋め = 実 mtime と同分一致 ②--date 手打ちは拒否
#   ③frontmatter form が stop_hook 検出器の読む field (response_required / responds_to / date /
#   from / to) と互換 (= form 追随 discipline の自己適用、helper の出力 form を検出器 form に固定)
#   ④必須引数不足 / 不正値 / 同名既存で fail-closed。
# temp BOARD で完結、実 board (~/.shared-ops/board) は不触。

set -uo pipefail
HELPER="$(dirname "$0")/board_new.sh"
PASS=0 FAIL=0
ok(){ echo "  PASS: $1"; PASS=$((PASS+1)); }
ng(){ echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

TMPB="$(mktemp -d)"
trap 'rm -rf "$TMPB"' EXIT

echo "[A] 構文 + 基本"
if bash -n "$HELPER"; then ok "bash 構文 OK"; else ng "bash 構文"; fi

echo "[B] date 機械埋め = 実 mtime 同分一致"
OUT="$(echo "body" | BOARD="$TMPB" bash "$HELPER" --from zen --to kai --subject "t1" --response-required no --slug t1 2>&1)"
FN="$TMPB/$(date '+%Y-%m-%d')_zen_kai_t1.md"
if [[ -f "$FN" ]]; then
  FM="$(grep '^date:' "$FN" | sed 's/^date: //; s/ JST$//')"
  MT="$(date -r "$FN" '+%Y-%m-%d %H:%M')"
  if [[ "$FM" == "$MT" ]]; then ok "frontmatter date ($FM) == 実 mtime ($MT)"; else ng "date 不一致: fm=$FM mtime=$MT"; fi
else ng "file 未生成: $FN"; fi

echo "[C] --date 系の手打ちは拒否 (exit 2)"
echo "b" | BOARD="$TMPB" bash "$HELPER" --from zen --to kai --subject "x" --response-required no --date "2020-01-01" >/dev/null 2>&1
[[ $? -eq 2 ]] && ok "--date 拒否 exit 2" || ng "--date が拒否されない"

echo "[D] frontmatter form が検出器読み取り field と互換"
# response_required / responds_to / from / to / date が想定形式で出るか
OUT2="$(echo "b" | BOARD="$TMPB" bash "$HELPER" --from zen --to kai --subject "x2" --response-required yes --responds-to "some_kai_file.md" --cc jun --slug t2 2>&1)"
FN2="$TMPB/$(date '+%Y-%m-%d')_zen_kai_t2.md"
need=0
grep -qE '^response_required: yes$' "$FN2" && need=$((need+1))
grep -qE '^responds_to: some_kai_file\.md$' "$FN2" && need=$((need+1))
grep -qE '^from: zen$' "$FN2" && need=$((need+1))
grep -qE '^to: kai$' "$FN2" && need=$((need+1))
grep -qE '^cc: jun$' "$FN2" && need=$((need+1))
grep -qE '^date: [0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2} JST$' "$FN2" && need=$((need+1))
[[ $need -eq 6 ]] && ok "frontmatter 6 field が検出器互換形式" || ng "frontmatter form 不整合 ($need/6)"
# stop_hook の EXCLUDE_PATTERN (response_required: no) が実際に効く形か
echo "b" | BOARD="$TMPB" bash "$HELPER" --from zen --to kai --subject "x3" --response-required no --slug t3 >/dev/null 2>&1
grep -qE '^(- )?(response_required|requires_response): no' "$TMPB/$(date '+%Y-%m-%d')_zen_kai_t3.md" && ok "response_required:no が EXCLUDE_PATTERN 互換" || ng "EXCLUDE_PATTERN 非互換"

echo "[E] fail-closed"
echo "" | BOARD="$TMPB" bash "$HELPER" --from zen --to kai >/dev/null 2>&1
[[ $? -eq 2 ]] && ok "必須引数不足 exit 2" || ng "必須不足が通った"
echo "" | BOARD="$TMPB" bash "$HELPER" --from zen --to kai --subject "x" --response-required maybe >/dev/null 2>&1
[[ $? -eq 2 ]] && ok "response-required 不正値 exit 2" || ng "不正値が通った"
# 同名既存は上書きしない
echo "" | BOARD="$TMPB" bash "$HELPER" --from zen --to kai --subject "dup" --response-required no --slug dup >/dev/null 2>&1
echo "" | BOARD="$TMPB" bash "$HELPER" --from zen --to kai --subject "dup" --response-required no --slug dup >/dev/null 2>&1
[[ $? -eq 1 ]] && ok "同名既存で上書き拒否 exit 1" || ng "同名を上書きした"

echo ""
echo "=== 結果 ==="
echo "PASS: $PASS / FAIL: $FAIL"
[[ $FAIL -eq 0 ]] && { echo "ALL PASS"; exit 0; } || { echo "FAILED"; exit 1; }
