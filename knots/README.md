# Nexus Lab — Knot Registry

Knotは文章ではなく、**条件付き変形演算子**である。

Nexus Labの運営で観測された失敗パターン・行動傾向をknotとして構造化し、
文章による方針（claim）ではなく、測定可能なtrigger/effect/compensationとして管理する。

## 構造

```yaml
knot_id: 一意の識別子
knot_type: operational | quality | process
trigger:
  条件: 値
effect:
  影響: 変化量
compensation:
  対策: 値
hardness: L0-L3 | LC
observed_count: 観測回数
last_observed: 日付
```

## Hardness Level

| Level | 説明 |
|:---|:---|
| L0 | 観測候補。まだ1回の失敗パターン |
| L1 | 再現性あり。限定的補正を入れる |
| L2 | 複数セッションで再現。変えると損害が大きい |
| L3 | 構造的knot。該当triggerでは強い検証が標準 |
| LC | 憲法級。運営ルールの一部に昇格 |

## データ観測

各セッションの報告書に以下のメトリクスを含める：

- **session_duration**: セッション時間
- **output_count**: 成果物の数
- **error_count**: 発生したエラー・手戻りの数
- **quality_score**: 自己評価（1-5）
- **knot_activations**: 発火したknotのID一覧
- **delegation_ratio**: チームに委任した作業の割合（0-1）
