---
test_type: fixture (green expected)
target_script: scripts/honesty_audit.sh
expected_red_count: 0 (Layer C dogfood evidence link は記載してあるので Layer C 由来 red 抑止)
purpose: 中立記述 / 否定 / 状態語 (5/08 Round 1 false positive 解消由来) の偽陽性抑止 verification
note: dogfood evidence link あり (nokaze-aira/) で Layer C は info、 Layer B 中立 phrase は exclude pattern で抑止確認
---

# honesty_audit fixture file (green expected)

以下の中立記述は exclude pattern により red 抑止が期待される。

## context
本 fixture は dogfood evidence link を含む: nokaze-aira/data/digests/2026-05-08/run.json

## case 1: 完了予定 (status phrase)
v0.1 release は 5/26 完了予定、 dogfood verify を経て 30 日 後の安定運用へ移行 (source: nokaze-aira/docs/release.md#L42)。

## case 2: 完璧ではない (negation)
本実装は完璧ではありません、 5/13+ Phase B で残課題対応予定。

## case 3: installation 完了 (status report)
installation 完了したか確認、 setup 完了を timestamp で記録。

## case 4: build 完了 (CI status)
build 完了 timestamp を記録、 test 完了 date を log に出力。

## case 5: 達成度 (measurement context)
達成度の確認を週次で run、 未達成 case は inbox 起票。

## case 6: 完成度 (quality measurement)
完成度を計測、 完成形は Phase 1 末尾で確定。

## case 7: 保証されない (negation explicit)
absolute な safety は保証されない、 best effort で運用する。

## case 8: 不確実 (status acknowledgment)
本判断は不確実性を含む、 確実性は week 単位で観測する。

## case 9: 完了報告 (process narrative)
完了報告 board で起稿、 完了 date を recorded form で固定。

## case 10: 達成可能 (capability framing、 not assertion)
達成可能な目標として設計、 達成しよう narrative は避ける。
