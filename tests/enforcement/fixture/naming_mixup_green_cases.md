---
test_type: fixture (green expected)
target_script: scripts/naming_mixup_check.sh
expected_red_count: 0
purpose: 否定 + 同一性肯定 context の偽陽性抑止 verification (1 entity 2 narrative ruled 遵守記述)
note: NAMING_EXCLUDE_PATTERNS で exclude されることを期待
---

# naming_mixup fixture file (green expected)

以下は ground truth 遵守 narrative。 否定 / 同一性肯定 context を含むため red 抑止を期待。

## case 1: 別の道具ではない (否定)
Aira と Yuino は別の道具ではない、 同じ実体の 2 narrative form。

## case 2: 別物ではなく (否定 + 同一性肯定)
Aira と Yuino は別物ではなく、 1 entity の 2 narrative axis で運用。

## case 3: 同じ実体の 2 narrative
Aira と Yuino は同じ実体の 2 つの呼び方、 内部 = Aira / 公開 = Yuino。

## case 4: 1 entity 2 narrative ruled
1 entity 2 narrative ruled 遵守、 Aira (内部実装) = Yuino (公開 brand) 同一。

## case 5: 別 entity ではない (否定)
Aira と Yuino は別 entity ではない、 1 entity 2 narrative で運用 default。

## case 6: 別物ではない (否定)
Aira と Yuino は別物ではない、 同じ entity の 2 narrative axis。

## case 7: 2 entity ではない (否定)
Aira / Yuino は 2 entity ではない、 1 entity 2 narrative ruled で固定。

## case 8: 別 product ではない (否定)
Aira / Yuino は別 product ではない、 同じ product の 2 narrative。

## case 9: Yuino と Aira は同じ
Yuino と Aira は同じ実体、 audience-facing form と内部実装名の 2 narrative。

## case 10: 1 entity 2 narrative ground truth (5/06 evening jun + Kai 確認)
1 entity 2 narrative は jun + Kai 5/06 evening 確認 ground truth、 別物narrative drift 禁止。
