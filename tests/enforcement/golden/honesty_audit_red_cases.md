---
test_type: golden (red expected)
target_script: scripts/honesty_audit.sh
expected_red_count: 10
purpose: 誇張表現 / 煽り語彙の真陽性 detect verification (Round 2 audit、 5/08 起稿)
note: 各 case は単独行で blocklist phrase を含む煽り narrative。 dogfood evidence link は意図的に不在 (Layer C も red 1 件発火)
---

# honesty_audit golden file (red expected)

以下の煽り narrative は honesty_audit.sh で red 検出されることを期待する。

## case 1: 急成長 narrative
nokaze は急成長中の AI 運用 console プロジェクトです。

## case 2: 次世代 narrative
Yuino は次世代 AI 運用ツールとして業界を変えます。

## case 3: 業界初 narrative
業界初の Local-first AI agent supervisor、 Aira を発表します。

## case 4: 世界初 narrative
世界初の Knot 研究を商品化した nokaze console、 ついに公開。

## case 5: 完璧 narrative
このシステムは完璧に動作し、 すべての problem を解決します。

## case 6: 保証付き narrative
100% の安全性を保証付きで提供する Yuino、 安心してお使いいただけます。

## case 7: 確実 narrative
売上目標は必ず達成、 間違いなく成功する事業計画です。

## case 8: 革命 narrative
Aira は AI 運用に革命をもたらす、 突破口となる技術です。

## case 9: 世界初 + 急成長 (multi-phrase 1 行)
世界初の急成長型 AI console、 nokaze の次世代 supervisor。

## case 10: Done narrative (英語混じり煽り)
v0.1 release Done、 全機能完璧に完成しました。
