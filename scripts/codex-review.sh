#!/bin/bash
# Codex品質レビュー — 異なるAIモデルの視点で品質チェック
# Usage: bash scripts/codex-review.sh [path]

TARGET=${1:-.}
DIFF=$(git diff HEAD~1 -- "$TARGET" 2>/dev/null || git diff --cached -- "$TARGET")

if [ -z "$DIFF" ]; then
  echo "差分がありません"
  exit 0
fi

echo "$DIFF" | codex exec --full-auto -s read-only "以下のgit diffをレビューしてください。コードの問題点、実データとの乖離、セキュリティリスク、型の不整合を指摘してください。問題がなければ「問題なし」と回答してください。日本語で回答してください。"
