#!/usr/bin/env bash
# test_zen_stop_hook_forms.sh — zen_stop_hook.sh の「検出器 ↔ 依存 form」 契約の smoke test
#
# 目的 (= 「自作 form に自作検出器が追いつかない」 class の 2 層目 = 物理化):
#   Zen が form (= ファイル命名 / frontmatter フィールド / 出力の形 / state surface) を新設・変更した時、
#   その form を読む検出器を同時に更新しないと false positive / false negative する。 これを機械で捕まえる。
#
# 参照正本: scripts/zen_stop_hook_form_registry.json
# 参照 hook: scripts/zen_stop_hook.sh (= 読むだけ、 編集しない)
# style 参照: scripts/test_subagent_write_gate.sh + scripts/test_zen_session_guard.sh
#
# 2 系統のアサーション:
#   (A) form-drift guard (= 核心): registry の各 literal が hook に今も実在するか + hook の主要
#       warn tag / 命名 glob が registry に載っているかを双方向照合。 form を rename/変更したのに
#       registry を更新しなかった (= 検出器 blind spot)、 form を新設したのに registry に載せ忘れた
#       (= 監視漏れ) を loud に fail する。
#   (B) golden fixture behavior: 実 board 命名規約の fixture を temp dir に置いて hook を dry 実行し、
#       未返事検出器 (unreplied_kai_board、 exit2) の should-fire / should-not-fire を検証。
#       d5044cb (= runtime 応答 glob 追加) の回帰も含む。 B2a は 2026-07-12 (Zen authorize) の L298 修正で
#       「zen_* 板 0 件 + runtime 応答単独」 の awk fatal 偽陽性が解消したことを hard PASS で固定する
#       (= 修正前は XFAIL だった、 fix landed で通常 PASS に昇格)。 B2b は zen_* 板が共存するケース。
#
# ${TODAY} 展開規則 (= 制約対応):
#   registry の literal は「hook ソースの展開前文字列」 に合わせている (= ${TODAY}_kai_zen_*.md 等)。
#   hook 実行時に ${TODAY} は date +%Y-%m-%d に展開される。 本 test は:
#     - (A) の逐語照合は hook の「展開前ソース」 に対して行う (= literal と一字一致)
#     - (B) の fixture は実 TODAY で file 名を生成する (= hook の実行時挙動に合わせる)
#   の 2 段で両立させる。 registry を書き換える時は「展開前ソースの文字列」 を literal に置くこと。
#
# 実 board / live status surface は read-only すら避け、 fixture は temp dir で自己完結 (= live 汚染ゼロ)。
# 実行: bash scripts/test_zen_stop_hook_forms.sh   期待: ALL PASS

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/zen_stop_hook.sh"
REGISTRY="$SCRIPT_DIR/zen_stop_hook_form_registry.json"

PASS=0
FAIL=0
XFAIL=0   # 既知の hook 欠陥 (= 本 test が surface 済、 hook 側で未修正) を loud に見せるが suite は red にしない
ok()  { echo "  PASS: $1"; PASS=$((PASS+1)); }
bad() { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }
# xfail: 期待 (= 本来の契約) は満たされていないが、 原因が hook 側の既知欠陥で本 test の役目は
#   「検出して見せる」 こと。 suite は red にしないが、 サマリで必ず件数を出す (= silent skip 禁止)。
xfail() { echo "  XFAIL: $1"; XFAIL=$((XFAIL+1)); }

if [[ ! -f "$HOOK" ]];     then echo "FATAL: hook not found: $HOOK"; exit 3; fi
if [[ ! -f "$REGISTRY" ]]; then echo "FATAL: registry not found: $REGISTRY"; exit 3; fi

# python は registry (JSON) の parse に必須。 hook 自身も python 依存なので前提として妥当。
PY=""
for cand in python python3; do
  if command -v "$cand" >/dev/null 2>&1; then PY="$cand"; break; fi
done
if [[ -z "$PY" ]]; then echo "FATAL: python not found"; exit 3; fi

echo "=== zen_stop_hook form-drift + behavior smoke test ==="
echo ""

# ---------------------------------------------------------------
# (A) form-drift guard
# ---------------------------------------------------------------
echo "[A] form-drift guard (registry <-> hook 双方向照合)"

# (A0) registry が valid JSON か
if "$PY" -c "import json,sys; json.load(open(sys.argv[1],encoding='utf-8'))" "$REGISTRY" 2>/dev/null; then
  ok "registry は valid JSON"
else
  bad "registry が parse できない = 以降の照合が全滅する"
fi

# (A1) registry の各 literal が hook ソース (展開前) に逐語で実在するか
#      = form を rename/変更したのに registry を旧 literal のまま残した = 検出器 blind spot を検出。
A1_OUT=$("$PY" - "$REGISTRY" "$HOOK" <<'PYEOF'
import json, sys
reg = json.load(open(sys.argv[1], encoding='utf-8'))
src = open(sys.argv[2], encoding='utf-8').read()
missing = []
total = 0
for det in reg['detectors']:
    for f in det['forms']:
        total += 1
        if f['literal'] not in src:
            missing.append((det['id'], f['role'], f['literal']))
print("TOTAL", total)
for m in missing:
    print("MISSING", m[0], "||", m[1], "||", m[2])
PYEOF
)
A1_TOTAL=$(printf '%s\n' "$A1_OUT" | awk '/^TOTAL/{print $2}')
A1_MISSING=$(printf '%s\n' "$A1_OUT" | grep -c '^MISSING' || true)
if [[ "${A1_MISSING:-0}" -eq 0 ]]; then
  ok "registry の全 literal (${A1_TOTAL} 件) が hook に逐語で実在 (= 検出器 blind spot なし)"
else
  bad "registry の literal が hook に無い ${A1_MISSING} 件 = form 変更に registry 未追随:"
  printf '%s\n' "$A1_OUT" | grep '^MISSING' | sed 's/^MISSING/        →/' >&2
fi

# (A2) hook の全 warn_p* tag が registry のどれかの literal に覆われているか
#      = 検出器を新設したのに registry に載せ忘れた = 監視漏れを検出。
A2_OUT=$("$PY" - "$REGISTRY" "$HOOK" <<'PYEOF'
import json, sys, re
reg = json.load(open(sys.argv[1], encoding='utf-8'))
src = open(sys.argv[2], encoding='utf-8').read()
reg_lits = [f['literal'] for det in reg['detectors'] for f in det['forms']]
tags = sorted(set(re.findall(r'warn_p[123] "(\[[^\]]*)', src)))
uncovered = [t for t in tags if not any((lit in t) or (t in lit) for lit in reg_lits)]
print("TOTAL", len(tags))
for t in uncovered:
    print("UNCOVERED", t)
PYEOF
)
A2_TOTAL=$(printf '%s\n' "$A2_OUT" | awk '/^TOTAL/{print $2}')
A2_UNCOV=$(printf '%s\n' "$A2_OUT" | grep -c '^UNCOVERED' || true)
if [[ "${A2_UNCOV:-0}" -eq 0 ]]; then
  ok "hook の全 warn_p* tag (${A2_TOTAL} 件) が registry に載っている (= 新設検出器の監視漏れなし)"
else
  bad "registry に無い hook warn tag ${A2_UNCOV} 件 = 検出器新設に registry 未追随:"
  printf '%s\n' "$A2_OUT" | grep '^UNCOVERED' | sed 's/^UNCOVERED/        →/' >&2
fi

# (A3) hook の主要命名 glob (= 汎用拡張子 glob を除く) が registry のどれかの literal に覆われているか
#      = 新しい file 命名 form を hook に足したのに registry に載せ忘れた = 監視漏れを検出。
A3_OUT=$("$PY" - "$REGISTRY" "$HOOK" <<'PYEOF'
import json, sys, re
reg = json.load(open(sys.argv[1], encoding='utf-8'))
src = open(sys.argv[2], encoding='utf-8').read()
reg_lits = [f['literal'] for det in reg['detectors'] for f in det['forms']]
generic = {"*.json", "*.md", "*.py", "*.sh", "*.ts"}
globs = sorted(set(re.findall(r'-name "([^"]*)"', src)))
sig = [g for g in globs if g not in generic]
missing = [g for g in sig if not any(g in lit for lit in reg_lits)]
print("TOTAL", len(sig))
for g in missing:
    print("MISSINGGLOB", g)
PYEOF
)
A3_TOTAL=$(printf '%s\n' "$A3_OUT" | awk '/^TOTAL/{print $2}')
A3_MISS=$(printf '%s\n' "$A3_OUT" | grep -c '^MISSINGGLOB' || true)
if [[ "${A3_MISS:-0}" -eq 0 ]]; then
  ok "hook の主要命名 glob (${A3_TOTAL} 件) が registry に載っている (= 新命名 form の監視漏れなし)"
else
  bad "registry に無い hook 命名 glob ${A3_MISS} 件 = 新命名 form に registry 未追随:"
  printf '%s\n' "$A3_OUT" | grep '^MISSINGGLOB' | sed 's/^MISSINGGLOB/        →/' >&2
fi

echo ""

# ---------------------------------------------------------------
# (B) golden fixture behavior — unreplied_kai_board (exit2) の should-fire / should-not-fire
# ---------------------------------------------------------------
echo "[B] golden fixture behavior (未返事検出器を temp board で dry 実行)"

TODAY=$(date +%Y-%m-%d)

# hook を sandbox HOME で 1 回実行し exit code を返す。 board は sandbox 内で完結。
#   INPUT は最小 JSON (= assistant_message 空 → LAST_OUTPUT 空 → 出力テキスト系検出器は全 no-op、
#   pending 系も chat_outbox 空で no-op、 exit 判定は unreplied_kai_board だけに依存する)。
# 戻り値: hook の実 exit code (0 = 未返事なし / 2 = 未返事あり)。
run_hook_in_sandbox() {
  local sb="$1"
  local input_json='{"stop_hook_active":false,"assistant_message":"","transcript_path":""}'
  HOME="$sb" bash "$HOOK" <<<"$input_json" >/dev/null 2>/dev/null
  return $?
}

new_sandbox() {
  local sb
  sb=$(mktemp -d /tmp/zen_stop_forms.XXXXXX)
  mkdir -p "$sb/.shared-ops/board" "$sb/.shared-ops/status" "$sb/.shared-ops/chat_outbox/zen"
  printf '%s' "$sb"
}

# --- B1: response_required:yes の Kai 板 + runtime/zen 応答なし → 未返事検出する (exit 2) ---
SB=$(new_sandbox)
cat > "$SB/.shared-ops/board/${TODAY}_kai_zen_needhelp.md" <<EOF
# Subject: Kai から Zen へ質問
responds_to: none
response_required: yes

本文: これは応答が要る板。 zen 応答も runtime 応答もまだ無い。
EOF
run_hook_in_sandbox "$SB"; rc=$?
[[ "$rc" -eq 2 ]] && ok "B1 応答なしの response_required:yes 板 = 未返事検出 (exit 2)" \
                  || bad "B1 応答なし板が未返事検出されない (exit=$rc, 期待 2)"
rm -rf "$SB"

# --- B2a (d5044cb 完成の回帰): runtime 応答だけで zen_* 板が同日に 1 件も無い時 → 検出しない (exit 0) ---
#   契約 = runtime 応答 (${TODAY}_aira_review_response_*.md) が responds_to で解決していれば
#   zen_* 板の有無に関わらず未返事検出しない (exit 0)。
#   2026-07-12 (Oto、 Zen authorize) 修正前の hook L298 は awk に 2 glob を直接並べており、 同日に
#   zen_* 板が 0 件だと第 1 glob が literal path のまま残り gawk が fatal → aira 応答を読まず blob が
#   空 → runtime 単独応答を未返事に偽陽性していた (= d5044cb 部分修正の穴)。 修正後は存在する file だけ
#   find で集めて awk に渡すため zen_* 0 件でも aira 応答が blob に入り偽陽性しない。 本 assertion は
#   その完成を hard PASS で固定する (= 修正前は XFAIL だった、 fix landed で通常 PASS に昇格)。
SB=$(new_sandbox)
cat > "$SB/.shared-ops/board/${TODAY}_kai_zen_review.md" <<EOF
# Subject: Kai から Zen へ review 依頼
response_required: yes

本文: 応答が要る板。
EOF
cat > "$SB/.shared-ops/board/${TODAY}_aira_review_response_001.md" <<EOF
# Subject: aira event runtime 応答
responds_to: ${TODAY}_kai_zen_review.md

本文: runtime が応答した (= 契約 §9 命名)。
EOF
run_hook_in_sandbox "$SB"; rc=$?
[[ "$rc" -eq 0 ]] && ok "B2a runtime 応答単独 (zen_* 板 0 件) で resolved = 未返事検出しない (exit 0) [d5044cb 完成 / L298 awk fatal 修正の回帰]" \
                  || bad "B2a runtime 応答単独 (zen_* 板 0 件) が未返事偽陽性 (exit=$rc, 期待 0) = L298 修正が効いてない or 再退行"
rm -rf "$SB"

# --- B2b (共存条件でも成立): runtime 応答 + 同日に無関係な zen_* 板が共存 → 検出しない (exit 0) ---
#   修正前は「zen_* 板が共存する時だけ d5044cb が効く」 条件だった (= B2a が偽陽性で B2b だけ通る)。
#   L298 修正後は両条件で成立する。 B2a (zen_* 0 件) と対にして、 zen_* 板の有無を跨いで runtime 応答が
#   常に効くことを固定する回帰。
SB=$(new_sandbox)
cat > "$SB/.shared-ops/board/${TODAY}_kai_zen_review2.md" <<EOF
# Subject: Kai から Zen へ review 依頼
response_required: yes

本文: 応答が要る板。
EOF
cat > "$SB/.shared-ops/board/${TODAY}_aira_review_response_002.md" <<EOF
# Subject: aira event runtime 応答
responds_to: ${TODAY}_kai_zen_review2.md

本文: runtime が応答した (= 契約 §9 命名)。
EOF
cat > "$SB/.shared-ops/board/${TODAY}_zen_unrelated.md" <<EOF
# Subject: 無関係な zen 板 (= runtime 応答と同日に zen_* 板が共存するケースを作るための file)
本文: 別件の Zen 板。
EOF
run_hook_in_sandbox "$SB"; rc=$?
[[ "$rc" -eq 0 ]] && ok "B2b runtime 応答 + zen_* 板共存 = 未返事検出しない (exit 0) [zen_* 有無を跨ぐ回帰]" \
                  || bad "B2b runtime 応答 + zen_* 共存でも未返事検出した = runtime 応答が全く効いてない (exit=$rc, 期待 0)"
rm -rf "$SB"

# --- B3: zen_* 応答が板 file 名を参照 → 検出しない (exit 0) ---
SB=$(new_sandbox)
cat > "$SB/.shared-ops/board/${TODAY}_kai_zen_ask.md" <<EOF
# Subject: Kai の質問
response_required: yes

本文: 応答が要る。
EOF
cat > "$SB/.shared-ops/board/${TODAY}_zen_reply.md" <<EOF
# Subject: Zen の応答
responds_to: ${TODAY}_kai_zen_ask.md

本文: Zen が応答した。
EOF
run_hook_in_sandbox "$SB"; rc=$?
[[ "$rc" -eq 0 ]] && ok "B3 zen_* 応答が板名を参照 = 未返事検出しない (exit 0)" \
                  || bad "B3 zen 応答があるのに未返事検出した (exit=$rc, 期待 0)"
rm -rf "$SB"

# --- B4: *_auto_ack_* の Kai 板 → 未返事検出しない (exit 0) ---
SB=$(new_sandbox)
cat > "$SB/.shared-ops/board/${TODAY}_kai_zen_auto_ack_watcher.md" <<EOF
# Subject: watcher auto ack
response_required: yes

本文: これは auto_ack (= Kai watcher の自動 failure notice)。 Zen 応答不要だが frontmatter は yes。
EOF
run_hook_in_sandbox "$SB"; rc=$?
[[ "$rc" -eq 0 ]] && ok "B4 *_auto_ack_* 板 = file 名 pattern で除外 (exit 0)" \
                  || bad "B4 auto_ack 板が未返事検出された (exit=$rc, 期待 0)"
rm -rf "$SB"

# --- B5: response_required: no (通常 frontmatter) → 検出しない (exit 0) ---
SB=$(new_sandbox)
cat > "$SB/.shared-ops/board/${TODAY}_kai_zen_fyi.md" <<EOF
# Subject: FYI 板
response_required: no

本文: 応答不要の通知。
EOF
run_hook_in_sandbox "$SB"; rc=$?
[[ "$rc" -eq 0 ]] && ok "B5 response_required: no = 除外 (exit 0)" \
                  || bad "B5 response_required:no 板が未返事検出された (exit=$rc, 期待 0)"
rm -rf "$SB"

# --- B6: dash-list 形式 (- response_required: no) → 検出しない (exit 0) [7/11 誤検知回帰] ---
SB=$(new_sandbox)
cat > "$SB/.shared-ops/board/${TODAY}_kai_zen_dashfm.md" <<EOF
# Subject: dash-list frontmatter 板
- responds_to: none
- response_required: no

本文: frontmatter が dash list 形式。 7/11 に誤検知した form。
EOF
run_hook_in_sandbox "$SB"; rc=$?
[[ "$rc" -eq 0 ]] && ok "B6 dash-list (- response_required: no) = 除外 (exit 0) [7/11 誤検知回帰]" \
                  || bad "B6 dash-list 形式が未返事検出された = 7/11 誤検知再発 (exit=$rc, 期待 0)"
rm -rf "$SB"

# --- B7: status: ack_only → 検出しない (exit 0) ---
SB=$(new_sandbox)
cat > "$SB/.shared-ops/board/${TODAY}_kai_zen_ackonly.md" <<EOF
# Subject: ack only 板
status: ack_only

本文: ack のみ。
EOF
run_hook_in_sandbox "$SB"; rc=$?
[[ "$rc" -eq 0 ]] && ok "B7 status: ack_only = 除外 (exit 0)" \
                  || bad "B7 ack_only 板が未返事検出された (exit=$rc, 期待 0)"
rm -rf "$SB"

# --- B8: 板が 1 件も無い空 board → exit 0 (= false positive しない基準線) ---
SB=$(new_sandbox)
run_hook_in_sandbox "$SB"; rc=$?
[[ "$rc" -eq 0 ]] && ok "B8 空 board = 未返事 0 件 (exit 0)" \
                  || bad "B8 空 board で exit 非 0 = 偽陽性 (exit=$rc, 期待 0)"
rm -rf "$SB"

# ---------------------------------------------------------------
# 結果サマリ
# ---------------------------------------------------------------
echo ""
echo "=== 結果サマリ ==="
echo "PASS:  $PASS"
echo "FAIL:  $FAIL"
echo "XFAIL: $XFAIL (= 既知 hook 欠陥、 本 test が surface 済 / hook 未修正)"
TOTAL=$((PASS + FAIL + XFAIL))
echo "TOTAL: $TOTAL"
if [[ "$XFAIL" -gt 0 ]]; then
  echo ""
  echo "注意: XFAIL ${XFAIL} 件 = hook 側の未修正欠陥。 上の XFAIL 行の Zen 修正要 を参照 (本 task は hook を触らない制約)。"
fi
if [[ "$FAIL" -eq 0 ]]; then
  echo ""
  echo "ALL PASS (${PASS}/${TOTAL}、 XFAIL ${XFAIL})"
  exit 0
else
  echo ""
  echo "FAIL あり (${FAIL}/${TOTAL}) — form-drift か 検出器挙動のどちらかが崩れている"
  exit 1
fi
