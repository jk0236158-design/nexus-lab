#!/usr/bin/env bash
# zen_dogfood_preflight.sh — 商品 narrative articulate 前の dogfood evidence 物理 check
#
# 起点: 2026-05-17 jun admit 「dogfood してない商品を売れと articulate する structural violation」
# spec: ~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_dogfood_violation_repeat_2026-05-17.md
#       (= 物理化軸対策 A、 mental ritual layer ではなく物理 instrument 化)
#
# 役割:
#   商品 narrative (= 「販売開始 / publish / 売れと articulate」) を出す前の物理 check instrument。
#   ~/Desktop/nokaze/dogfood/<product>/ 配下の evidence file 存在 + 最新更新日 を確認し、
#   evidence なし → exit 1 (= narrative articulate 禁止)、
#   evidence 古い (= 30 日以上前) → stderr WARN + exit 0 (= advisory)、
#   evidence 新しい → exit 0 + stdout で evidence summary。
#
# 動作:
#   1. --product <name> argument 解析 (= yuino / create-mcp-server / setup-memo 等)
#   2. ~/Desktop/nokaze/dogfood/<product>/ 存在 check
#   3. 配下 .md evidence file 件数 count (= README.md は除外)
#   4. 最新 evidence file の last-modified date 取得 + 経過日数計算
#   5. 30 日以上前 = stale WARN (= exit 0、 advisory のみ)
#   6. 0 件 = red (= exit 1、 narrative 禁止)
#
# 出力先:
#   stdout = evidence summary (= file path + last-modified + 件数 + status field)
#   stderr = red / WARN narrative + 「articulate 禁止」 message
#
# 禁忌:
#   - 自動 evidence file 生成しない (= dogfood は actual fire の物理証拠、 偽造禁止)
#   - 数字盛らない narrative (= 件数 0 を 「進行中」 narrative 化禁止)
#   - 内部用語 paraphrase ritual 遵守 (= chat output narrative も同 axis)
#
# Usage:
#   bash scripts/zen_dogfood_preflight.sh --product yuino
#   bash scripts/zen_dogfood_preflight.sh --product create-mcp-server
#
# Exit code:
#   0 = green (= evidence あり、 narrative OK) もしくは stale advisory (= advisory のみ default)
#   1 = red (= evidence なし、 narrative 禁止)
#   2 = arg parse error (= --product 指定なし or product 名不正)
#
# Spec ref:
#   ~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_dogfood_violation_repeat_2026-05-17.md § 物理化軸対策 1
#   ~/Desktop/nokaze/dogfood/README.md § R-1 (= 商品 narrative articulate 前の dogfood evidence prerequisite)

set -uo pipefail

# ---------------------------------------------------------------
# block 1: arg parse (= --product <name>)
# ---------------------------------------------------------------
PRODUCT=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --product)
            PRODUCT="${2:-}"
            shift 2
            ;;
        --help|-h)
            sed -n '/^# Usage:/,/^# Exit code:/p' "$0" | sed 's/^# //;s/^#//'
            exit 0
            ;;
        *)
            echo "[zen_dogfood_preflight] ERROR: unknown arg '$1'。 --product <name> 形式で指定" >&2
            exit 2
            ;;
    esac
done

if [[ -z "$PRODUCT" ]]; then
    echo "[zen_dogfood_preflight] ERROR: --product <name> が必須 (= yuino / create-mcp-server 等)" >&2
    echo "  Usage: bash scripts/zen_dogfood_preflight.sh --product <name>" >&2
    exit 2
fi

# product 名 validation (= 英数字 + ハイフン + 下線のみ、 path traversal 防止)
if ! [[ "$PRODUCT" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo "[zen_dogfood_preflight] ERROR: product 名 '$PRODUCT' に不正文字 (= 英数字 / ハイフン / 下線のみ許可)" >&2
    exit 2
fi

# ---------------------------------------------------------------
# block 2: dogfood folder 存在 check
# ---------------------------------------------------------------
DOGFOOD_ROOT="$HOME/Desktop/nokaze/dogfood"
PRODUCT_DIR="$DOGFOOD_ROOT/$PRODUCT"

if [[ ! -d "$DOGFOOD_ROOT" ]]; then
    echo "[zen_dogfood_preflight] ERROR: dogfood root 不在 ($DOGFOOD_ROOT)" >&2
    echo "  spec: ~/Desktop/nokaze/dogfood/README.md (= root 起稿 先)" >&2
    exit 1
fi

if [[ ! -d "$PRODUCT_DIR" ]]; then
    echo "═══════════════════════════════════════════════" >&2
    echo " ❌ dogfood preflight: red (= product folder 不在)" >&2
    echo "═══════════════════════════════════════════════" >&2
    echo "  product:        $PRODUCT" >&2
    echo "  expected dir:   $PRODUCT_DIR" >&2
    echo "  status:         RED (= 商品 narrative articulate 禁止)" >&2
    echo "" >&2
    echo "  対応:" >&2
    echo "  1. mkdir -p '$PRODUCT_DIR'" >&2
    echo "  2. 実際 dogfood セッションを fire" >&2
    echo "  3. ~/Desktop/nokaze/dogfood/README.md § file form に従い evidence file 起稿" >&2
    echo "  4. 本 preflight 再 fire で green 確認後 narrative articulate 可" >&2
    exit 1
fi

# ---------------------------------------------------------------
# block 3: evidence file count + 最新 last-modified date
# ---------------------------------------------------------------
# README.md は除外、 .md file のみ count
EVIDENCE_FILES=()
while IFS= read -r f; do
    [[ -n "$f" ]] && EVIDENCE_FILES+=("$f")
done < <(find "$PRODUCT_DIR" -maxdepth 1 -type f -name '*.md' ! -name 'README.md' 2>/dev/null)

EVIDENCE_COUNT=${#EVIDENCE_FILES[@]}

if [[ "$EVIDENCE_COUNT" -eq 0 ]]; then
    echo "═══════════════════════════════════════════════" >&2
    echo " ❌ dogfood preflight: red (= evidence file 0 件)" >&2
    echo "═══════════════════════════════════════════════" >&2
    echo "  product:        $PRODUCT" >&2
    echo "  product dir:    $PRODUCT_DIR" >&2
    echo "  evidence count: 0" >&2
    echo "  status:         RED (= 商品 narrative articulate 禁止)" >&2
    echo "" >&2
    echo "  対応:" >&2
    echo "  1. 実際 $PRODUCT を dogfood (= jun + Zen + Kai 何れかの actor が actual fire)" >&2
    echo "  2. ~/Desktop/nokaze/dogfood/README.md § file form に従い evidence file 起稿" >&2
    echo "     ($PRODUCT_DIR/YYYY-MM-DD.md form)" >&2
    echo "  3. 本 preflight 再 fire で green 確認後 narrative articulate 可" >&2
    echo "" >&2
    echo "  spec: ~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_dogfood_violation_repeat_2026-05-17.md" >&2
    exit 1
fi

# 最新 evidence file 取得 (= mtime 降順 sort)
LATEST_FILE=""
LATEST_MTIME=0
for f in "${EVIDENCE_FILES[@]}"; do
    mtime=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null || echo 0)
    if [[ "$mtime" -gt "$LATEST_MTIME" ]]; then
        LATEST_MTIME=$mtime
        LATEST_FILE=$f
    fi
done

# ---------------------------------------------------------------
# block 4: stale detection (= 30 日 threshold、 advisory のみ)
# ---------------------------------------------------------------
NOW_EPOCH=$(date +%s)
DAYS_SINCE=$(( (NOW_EPOCH - LATEST_MTIME) / 86400 ))
STALE_THRESHOLD=30

LATEST_DATE=$(date -d "@$LATEST_MTIME" +%Y-%m-%d 2>/dev/null || date -r "$LATEST_MTIME" +%Y-%m-%d 2>/dev/null || echo "unknown")

STALE_FLAG=""
if [[ "$DAYS_SINCE" -ge "$STALE_THRESHOLD" ]]; then
    STALE_FLAG="STALE"
fi

# ---------------------------------------------------------------
# block 5: output format (= stdout summary)
# ---------------------------------------------------------------
echo "═══════════════════════════════════════════════"
echo " ✓ dogfood preflight: green (= evidence あり)"
echo "═══════════════════════════════════════════════"
echo "  product:        $PRODUCT"
echo "  product dir:    $PRODUCT_DIR"
echo "  evidence count: $EVIDENCE_COUNT"
echo "  latest file:    $(basename "$LATEST_FILE")"
echo "  latest date:    $LATEST_DATE (= $DAYS_SINCE 日前)"
if [[ -n "$STALE_FLAG" ]]; then
    echo "  status:         GREEN (= advisory: stale、 $STALE_THRESHOLD 日以上前)"
else
    echo "  status:         GREEN"
fi
echo ""
echo "  evidence files:"
for f in "${EVIDENCE_FILES[@]}"; do
    echo "    - $(basename "$f")"
done
echo ""

if [[ -n "$STALE_FLAG" ]]; then
    echo "[zen_dogfood_preflight] WARN: 最新 evidence が $DAYS_SINCE 日前、 stale threshold ($STALE_THRESHOLD 日) 超過" >&2
    echo "  fresh dogfood セッション fire を推奨 (= advisory、 narrative articulate は可)" >&2
fi

echo "  narrative articulate OK (= 商品 narrative 出力前 preflight pass)"
echo "  注意: commit 時は pre_commit_public_docs_audit 5 chain (= dogfood link check) も fire"
exit 0
