---
test_type: golden (red expected)
target_script: scripts/naming_mixup_check.sh
expected_red_count: 10
purpose: 「Aira と Yuino は別 entity」 narrative drift の真陽性 detect verification
note: memory feedback_aira_yuino_naming_fixed.md ground truth (1 entity 2 narrative) 違反 case を集約
---

# naming_mixup golden file (red expected)

以下は Aira/Yuino を別 entity 扱いする narrative。 1 entity 2 narrative ground truth 違反として red 検出を期待。

## case 1: 別 entity 直接表現
Aira と Yuino は別の道具として個別に開発を進めます。

## case 2: 2 entity narrative
Aira / Yuino の 2 entity 構成で商品化します。

## case 3: 2 つの product narrative
nokaze は Aira と Yuino の 2 つの product を提供します。

## case 4: 別 product narrative
Yuino は Aira とは別 product として独立 release します。

## case 5: 別 entity narrative (英語語彙)
Aira と Yuino は別 entity 扱い、 別 repo に分けて管理します。

## case 6: 別 repository narrative
Aira を実装中、 Yuino は別 repository で並行開発。

## case 7: 別 repo に分け narrative
今後 Aira と Yuino を別 repo に分けて release flow を分離します。

## case 8: Aira を商品化対象から外
Aira を商品化対象から外し、 Yuino のみ公開対象にします。

## case 9: Yuino を実装 narrative (内部 vs 公開 axis 混乱)
Yuino を実装し、 Aira とは別系統で運用する。

## case 10: Yuino と Aira は別 narrative
Yuino と Aira は別の方向性で並行開発する独立 entity です。
