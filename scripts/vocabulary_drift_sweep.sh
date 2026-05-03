#!/usr/bin/env bash
# vocabulary_drift_sweep.sh — 公開接点に internal vocabulary 漏出がないか sweep
#
# 議題 27/28 ナギ + ノト + Akari 4/24 N=3 収束 reify (2026-05-02 起稿)
# CLAUDE.md § "Operating cadence" §「internal vs external vocabulary 分離」 連動
#
# 使い方:
#   bash scripts/vocabulary_drift_sweep.sh           # 公開接点 path で drift sweep
#   bash scripts/vocabulary_drift_sweep.sh --strict  # exit 1 on drift (CI 用)
#   bash scripts/vocabulary_drift_sweep.sh --verbose # 検出 line も print
#
# 検査対象: nokaze.dev source / npm package README / Zenn articles / root README
# 検査除外: team_memory / diary / reports / scripts / shared-ops / memory / internal docs

set -euo pipefail

STRICT=0
VERBOSE=0
for arg in "$@"; do
  case "$arg" in
    --strict) STRICT=1 ;;
    --verbose) VERBOSE=1 ;;
    *) ;;
  esac
done

# Internal vocabulary list (公開接点では使わない word / phrase)
# 注意: external 軸でも頻出する一般語 (e.g., "review", "audit") は除外、
# nokaze 内部運用 specific な造語 / 外部読者に意味通じない語のみ含む
INTERNAL_PATTERNS=(
  '成長の糧'
  '反証接続'
  '追認装置化'
  '宣言-実装乖離'
  'Pattern C cap'
  'Pattern C 通信'
  'Growth ledger'
  'Tempo Trap'
  'Wave 1 binding'
  'Wave 2 binding'
  'Wave 3 binding'
  'binding day'
  'identity 監視対象'
  'identity 監視 11'
  '監視対象 #'
  'Override #'
  'Kagami Override'
  'Kagami 独立発火'
  'memory_lint'
  'L3 knot'
  'L2 knot'
  'L1 knot'
  'L0 knot'
  'op_knot_'
  'selective denial L'
)
# Note: 'shared-ops' は path 名として技術 article 内 valid usage で false positive、除外。
# 'subagent_settings_resolution' も internal variable name で false positive、除外。
# 既 published articles (4 月 published 16 本) で legacy drift 残存、retroactive rewrite せず baseline 受領。
# 新規 article 起稿時は本 sweep を pre-commit / pre-publish ritual に組み込み strict 厳守。

# 公開接点 path (検査対象)
PUBLIC_PATHS=(
  "README.md"
  "packages/create-mcp-server/README.md"
  "packages/api-proxy/README.md"
  "packages/auth/README.md"
  "packages/database/README.md"
  "packages/config/README.md"
  "packages/docs"
)

# Zenn articles (別 repo path、existence check)
ZENN_PATH="${HOME}/Nexus.Lab.Zen/articles"

# 検査除外 path (nexus-lab 配下)
EXCLUDE_PATHS=(
  "team_memory"
  "diary"
  "reports"
  "scripts"
  "research"
  "CLAUDE.md"
  ".shared-ops"
  "aira/docs"
  "aira/data"
  "node_modules"
  ".git"
  ".playwright-mcp"
)

# rg で grep する pattern を 1 行に (alternation)
RG_PATTERN=$(IFS='|'; echo "${INTERNAL_PATTERNS[*]}")

DRIFT_COUNT=0
DRIFT_FILES=()
DRIFT_DETAILS=()

# nexus-lab 配下の公開接点を sweep
echo "🔍 vocabulary drift sweep — 公開接点 internal vocabulary 漏出 check"
echo "   patterns: ${#INTERNAL_PATTERNS[@]}"
echo ""

for path in "${PUBLIC_PATHS[@]}"; do
  if [[ ! -e "$path" ]]; then
    continue
  fi

  # rg with internal pattern
  RG_OUTPUT=""
  if command -v rg > /dev/null 2>&1; then
    RG_OUTPUT=$(rg -in "$RG_PATTERN" "$path" 2>/dev/null || true)
  else
    # fallback to grep
    RG_OUTPUT=$(grep -rin -E "$RG_PATTERN" "$path" 2>/dev/null || true)
  fi

  if [[ -n "$RG_OUTPUT" ]]; then
    LINE_COUNT=$(echo "$RG_OUTPUT" | wc -l | tr -d ' ')
    DRIFT_COUNT=$((DRIFT_COUNT + LINE_COUNT))
    DRIFT_FILES+=("$path")
    DRIFT_DETAILS+=("$RG_OUTPUT")
    echo "❌ DRIFT in: $path ($LINE_COUNT lines)"
    if [[ $VERBOSE -eq 1 ]]; then
      echo "$RG_OUTPUT" | head -5 | sed 's/^/   /'
      echo ""
    fi
  fi
done

# Zenn articles sweep (別 repo)
if [[ -d "$ZENN_PATH" ]]; then
  echo ""
  echo "🔍 Zenn articles sweep ($ZENN_PATH)"

  RG_OUTPUT=""
  if command -v rg > /dev/null 2>&1; then
    RG_OUTPUT=$(rg -in "$RG_PATTERN" "$ZENN_PATH" 2>/dev/null || true)
  else
    RG_OUTPUT=$(grep -rin -E "$RG_PATTERN" "$ZENN_PATH" 2>/dev/null || true)
  fi

  if [[ -n "$RG_OUTPUT" ]]; then
    LINE_COUNT=$(echo "$RG_OUTPUT" | wc -l | tr -d ' ')
    DRIFT_COUNT=$((DRIFT_COUNT + LINE_COUNT))
    echo "❌ DRIFT in Zenn articles: $LINE_COUNT lines"
    if [[ $VERBOSE -eq 1 ]]; then
      echo "$RG_OUTPUT" | head -5 | sed 's/^/   /'
      echo ""
    fi
  fi
fi

echo ""
echo "===================================="
if [[ $DRIFT_COUNT -eq 0 ]]; then
  echo "✅ vocabulary drift sweep: CLEAN (no internal vocabulary detected on public surfaces)"
  exit 0
else
  echo "❌ vocabulary drift sweep: DRIFT DETECTED"
  echo "   total drift lines: $DRIFT_COUNT"
  echo "   affected files: ${#DRIFT_FILES[@]}"
  echo ""
  echo "next action:"
  echo "  1. 各 file で internal vocabulary を external vocabulary に rewrite (CLAUDE.md § \"internal vs external vocabulary 分離\" 表参照)"
  echo "  2. rewrite 後に再 sweep 実行で confirm"
  echo "  3. drift が 意図的 reference なら inline justification comment 追加"
  echo ""
  if [[ $VERBOSE -eq 0 ]]; then
    echo "詳細表示: bash scripts/vocabulary_drift_sweep.sh --verbose"
  fi

  if [[ $STRICT -eq 1 ]]; then
    exit 1
  fi
  exit 0
fi
