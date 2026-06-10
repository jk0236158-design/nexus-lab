#!/bin/bash
# paper_c v1.0 統合 file から .tex + .html を生成するビルドスクリプト
# 2026-06-10 起稿、 jun directive 「knot と糧の研究は提出できるレベルにはまった?」 経由

set -euo pipefail

PANDOC="/c/Users/jk023/AppData/Local/Microsoft/WinGet/Packages/JohnMacFarlane.Pandoc_Microsoft.Winget.Source_8wekyb3d8bbwe/pandoc-3.10/pandoc.exe"
SRC="$(dirname "$0")/../paper_c_v1.0_integrated_2026-06-10.md"
DIST="$(dirname "$0")"

if [ ! -f "$PANDOC" ]; then
  echo "ERROR: pandoc not found at $PANDOC"
  echo "Install: winget install --id JohnMacFarlane.Pandoc -e"
  exit 1
fi

if [ ! -f "$SRC" ]; then
  echo "ERROR: source file not found: $SRC"
  exit 1
fi

echo "Building paper_c v1.0 distribution from: $SRC"

# LaTeX source (= arXiv submission format)
echo "  → generating .tex..."
"$PANDOC" "$SRC" -o "$DIST/paper_c_v1.0.tex" --standalone

# HTML preview (= human readable)
echo "  → generating .html..."
"$PANDOC" "$SRC" -o "$DIST/paper_c_v1.0.html" \
  --standalone --toc --toc-depth=3 \
  --metadata title="Knot, Nourishment, and Identity"

echo "Done. Output files:"
ls -la "$DIST/" | grep -E "paper_c_v1.0\.(tex|html|pdf)"

echo ""
echo "Next steps:"
echo "  - .tex = arXiv submission source upload 用 (= arXiv 側でサーバ compile)"
echo "  - .html = jun / Kai / Kagami の preview 用"
echo "  - PDF generation = MiKTeX install 経由 or arXiv 側 compile 結果待ち"
