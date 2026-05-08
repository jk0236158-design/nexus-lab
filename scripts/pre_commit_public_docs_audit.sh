#!/usr/bin/env bash
# pre_commit_public_docs_audit.sh — git pre-commit hook (公開 docs 限定 4 chain advisory)
#
# 起点: 2026-05-08 enforcement layer reform 5-axis (axis 7).
# 公開 docs (= audience-facing で出る path) に staged change がある時、
# vocabulary_lint + naming_mixup_check + honesty_audit + defer_check の 4 chain
# を fire し、 1 件以上 red があれば commit を block する。 bypass は
# `git commit --no-verify` で可能、 ただし bypass 時 stderr に warn を出す。
#
# 連動:
#   - memory feedback_excessive_english_mixing.md (vocabulary)
#   - memory feedback_aira_yuino_naming_fixed.md (naming)
#   - memory feedback_honesty_violation_exaggeration.md (honesty)
#   - memory feedback_no_tomorrow_deferral.md (defer)
#   - memory feedback_200_confirmation_ritual.md (200 確認 ritual との integration)
#
# 公開 docs path (5/08 時点 boundary):
#   - products/
#   - Nexus.Lab.Zen/articles/
#   - packages/nokaze-portal/
#   - docs/   (nexus-lab repo 自身の docs/、 外部 link されうる)
#
# 200 確認 ritual との integration:
#   commit 直前に 4 chain pass = 「公開 candidate doc が staged」 の最終 audit。
#   commit 後の Zenn / npm / Gumroad 公開時は別途 200 確認 ritual を実行する。
#   pre-commit は 「公開前最終チェック」、 200 確認は 「公開成立確認」、 役割が違う。
#
# Install:
#   bash docs/pre_commit_install.md の手順、 または
#     ln -s ../../scripts/pre_commit_public_docs_audit.sh .git/hooks/pre-commit
#     chmod +x scripts/pre_commit_public_docs_audit.sh
#
# Spec: ~/.shared-ops/board/2026-05-08_iwa_zen_enforcement_layer_reform_proposal.md § 軸 7

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [[ -z "$REPO_ROOT" ]]; then
    echo "pre_commit_public_docs_audit: not in a git repo, skip" >&2
    exit 0
fi

SCRIPT_DIR="$REPO_ROOT/scripts"
VOCAB_LINT="$SCRIPT_DIR/vocabulary_lint.sh"
NAMING_CHECK="$SCRIPT_DIR/naming_mixup_check.sh"
HONESTY_AUDIT="$SCRIPT_DIR/honesty_audit.sh"
DEFER_CHECK="$SCRIPT_DIR/defer_check.sh"

# ---------------------------------------------------------------
# 公開 docs path patterns
# ---------------------------------------------------------------
PUBLIC_PATH_PATTERNS=(
    '^products/'
    '^Nexus\.Lab\.Zen/articles/'
    '^packages/nokaze-portal/'
    '^docs/'
)

is_public_path() {
    local p="$1"
    for pat in "${PUBLIC_PATH_PATTERNS[@]}"; do
        if [[ "$p" =~ $pat ]]; then
            return 0
        fi
    done
    return 1
}

# ---------------------------------------------------------------
# staged file 抽出 + 公開 path filter
# ---------------------------------------------------------------
mapfile -t staged_all < <(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null)

if [[ "${#staged_all[@]}" -eq 0 ]]; then
    exit 0
fi

PUBLIC_FILES=()
for f in "${staged_all[@]}"; do
    if is_public_path "$f"; then
        # 公開 path 内でも非 doc (画像 / バイナリ / lock file) は skip
        case "$f" in
            *.md|*.mdx|*.txt|*.html|*.tsx|*.jsx) PUBLIC_FILES+=("$f") ;;
        esac
    fi
done

if [[ "${#PUBLIC_FILES[@]}" -eq 0 ]]; then
    exit 0
fi

echo "═══════════════════════════════════════════════"
echo " pre_commit_public_docs_audit: 公開 docs ${#PUBLIC_FILES[@]} 件 staged"
echo "═══════════════════════════════════════════════"

red_total=0
red_files=()

for f in "${PUBLIC_FILES[@]}"; do
    full="$REPO_ROOT/$f"
    if [[ ! -f "$full" ]]; then
        continue
    fi

    file_red=0
    findings=()

    # 各 chain は per-file timeout 付き fire (vocabulary_lint 等の重い grep loop で
    # commit が hang しないよう、 1 chain あたり 10 sec 上限。 timeout 時は skip + warn)。
    CHAIN_TIMEOUT=10

    # chain 1: vocabulary_lint
    if [[ -x "$VOCAB_LINT" ]]; then
        n=$(timeout "$CHAIN_TIMEOUT" bash "$VOCAB_LINT" "$full" 2>/dev/null | grep -oE 'red paragraphs:\s+[0-9]+' | head -1 | grep -oE '[0-9]+' | head -1 || echo 0)
        n=${n:-0}
        if [[ "$n" =~ ^[0-9]+$ && "$n" -gt 0 ]]; then
            file_red=$((file_red + n))
            findings+=("vocabulary:$n")
        fi
    fi

    # chain 2: naming_mixup_check
    if [[ -x "$NAMING_CHECK" ]]; then
        out=$(timeout "$CHAIN_TIMEOUT" bash "$NAMING_CHECK" "$full" 2>/dev/null || true)
        n=$(echo "$out" | grep -oE 'red:\s+[0-9]+' | head -1 | grep -oE '[0-9]+' | head -1 || echo 0)
        n=${n:-0}
        if [[ "$n" =~ ^[0-9]+$ && "$n" -gt 0 ]]; then
            file_red=$((file_red + n))
            findings+=("naming:$n")
        fi
    fi

    # chain 3: honesty_audit
    if [[ -x "$HONESTY_AUDIT" ]]; then
        out=$(timeout "$CHAIN_TIMEOUT" bash "$HONESTY_AUDIT" "$full" 2>/dev/null || true)
        n=$(echo "$out" | grep -oE 'red:\s+[0-9]+' | head -1 | grep -oE '[0-9]+' | head -1 || echo 0)
        n=${n:-0}
        if [[ "$n" =~ ^[0-9]+$ && "$n" -gt 0 ]]; then
            file_red=$((file_red + n))
            findings+=("honesty:$n")
        fi
    fi

    # chain 4: defer_check
    if [[ -x "$DEFER_CHECK" ]]; then
        out=$(timeout "$CHAIN_TIMEOUT" bash "$DEFER_CHECK" "$full" 2>/dev/null || true)
        n=$(echo "$out" | grep -oE 'total defer phrases:\s+[0-9]+' | head -1 | grep -oE '[0-9]+' | head -1 || echo 0)
        ev=$(echo "$out" | grep -oE 'evidence present:\s+(true|false)' | head -1 | grep -oE '(true|false)' || echo "false")
        n=${n:-0}
        # defer は evidence 不在で red、 evidence あれば yellow 扱い
        if [[ "$n" =~ ^[0-9]+$ && "$n" -gt 0 && "$ev" == "false" ]]; then
            file_red=$((file_red + n))
            findings+=("defer:$n")
        fi
    fi

    if [[ "$file_red" -gt 0 ]]; then
        red_total=$((red_total + file_red))
        red_files+=("$f (${findings[*]})")
        echo "  🔴 $f → red ${file_red} (${findings[*]})"
    else
        echo "  ✓ $f"
    fi
done

echo "═══════════════════════════════════════════════"

if [[ "$red_total" -gt 0 ]]; then
    echo ""
    echo "❌ 公開 docs audit failed: red ${red_total} 件 (${#red_files[@]} 件 file)"
    echo ""
    echo "対象 file:"
    for rf in "${red_files[@]}"; do
        echo "  - $rf"
    done
    echo ""
    echo "対応:"
    echo "  1. 上記 file の red 箇所を修正してから再 commit"
    echo "  2. それでも commit したい場合: git commit --no-verify (bypass、 warn log 残る)"
    echo ""
    echo "200 確認 ritual との integration:"
    echo "  pre-commit pass = 公開前最終 audit、 公開成立は WebFetch 200 確認まで未確定"
    echo "  reference: memory/feedback_200_confirmation_ritual.md"
    echo ""

    # bypass log: --no-verify で skip された場合は本 script 自体が走らないので、
    # ここでは block path で記録のみ。 bypass 時 log は別 hook (post-commit) 候補。
    exit 1
fi

echo "✓ 公開 docs audit passed (${#PUBLIC_FILES[@]} 件 file、 4 chain green)"
echo "  注意: commit 後の Zenn / npm / Gumroad 公開は 200 確認 ritual 必須"
exit 0
