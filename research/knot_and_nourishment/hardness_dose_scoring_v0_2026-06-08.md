# Hardness / Dose Scoring v0 (= Knot Guard 軸の強度評価 form)

generated_at: 2026-06-08 12:50 JST
origin:
- Kai 2026-06-01 board file = 提案 4「hardness/dose scoring v0 を 4 信号で提案」
- 適用 sample = WSD 2 knots (= Kai export 6/1) + Zen 5 knots (= zen_knot_export_v1_2026-06-08.json)
- 6/8 jun directive 「knot と糧の研究進めて」 経由の自走 fire

boundary:
- local research articulate のみ
- v0 = 試行 form、 Kai + Hoshi review 経由で iterate 候補

## 4 信号の定義

### 1. recurrence (= 同型再発の頻度 / 期間)

「同 knot pattern が時間軸でどれだけ繰り返されてるか」

- **0**: 1 件のみ、 同型再発記録なし (= 偶発)
- **1**: 2-3 件、 同型確認あるが間隔広い (= 散発)
- **2**: 4-5 件、 月単位で同型 (= 反復)
- **3**: 6 件以上、 週単位で同型再発 (= 慢性化)

### 2. harm sensitivity (= 被害の感度 / 影響範囲)

「knot pass 時 (= guard 効かず) の被害規模」

- **0**: local articulate のみ、 外部影響なし (= 自己訂正可能)
- **1**: 他 agent (= peer) の判断 / 時間消費に影響 (= internal cost)
- **2**: jun の判断 / 時間消費 + 修正 cycle 必要 (= owner cost)
- **3**: 外部 (= 顧客 / 公開物 / 法務 / 売上) に actual 影響 (= external cost)

### 3. evidence support (= evidence 強度)

「knot articulate に actual evidence がどれだけ揃ってるか」

- **0**: self-report のみ、 第三者 observer なし、 before/after diff なし
- **1**: self-report + 第三者 confirm 1 件あり、 before/after diff なし
- **2**: self-report + 第三者 confirm + before/after artifact diff あり
- **3**: 上記 + false positive / false negative 検証 record あり

### 4. time stability (= 時間軸での安定性)

「knot が長期 sample で stable に観察されてるか、 decay or shift してないか」

- **0**: 1 日 / 1 session で集中観察、 stability 不明 (= 時間軸短い)
- **1**: 1 週間以内の sample、 stability 弱 confidence
- **2**: 1 ヶ月以内の sample、 stability 中 confidence
- **3**: 2 ヶ月以上の sample + decay / shift 観察なし (= 安定 knot)

## hardness と dose の関係 (= articulate)

- **hardness (= L0-L3)** = knot の primary level、 「どれだけ深く固まった既定か」 軸
- **dose (= 0-3 scale)** = 「今この event で knot がどれだけ活性化してるか」 軸
- 関係 = hardness = 4 信号の overall mean (= 大まかな固さ)、 dose = 個別 event の activation strength
- = Kai 6/1 weak point 3「hardness=L1 なのに activation=high の関係曖昧」 への 1 件 articulate 軸: hardness ≠ dose、 別軸

formula (= v0、 単純平均):

```
hardness_score = (recurrence + harm_sensitivity + evidence_support + time_stability) / 4
hardness_level = L0 if score < 0.5, L1 if 0.5-1.5, L2 if 1.5-2.5, L3 if score >= 2.5
```

dose は event-level、 hardness は knot-level。

## 7 knots への scoring 適用 (= WSD 2 + Zen 5)

### WSD knot 1: `kai_honesty_boundary`

| 信号 | score | 理由 |
|---|---|---|
| recurrence | 1 | 3 events / 4 日間 (= 4/10-4/13)、 散発 |
| harm sensitivity | 2 | 営業 send の identity 偽装 risk = owner cost (= jun 名義の信頼) |
| evidence support | 1 | Kai self-report + jun chat 経由 confirm 1 件、 before/after diff なし |
| time stability | 1 | 4 日間 sample、 1 ヶ月以上は未検証 |
| **mean** | **1.25** | **hardness = L1** (= Kai export 既存 L1 と整合) |

### WSD knot 2: `kai_channel_purpose_hold`

| 信号 | score | 理由 |
|---|---|---|
| recurrence | 0 | 2 events / 1 日 (= 4/10)、 偶発 |
| harm sensitivity | 2 | channel purpose mismatch = 失礼 / nokaze brand cost |
| evidence support | 1 | Kai self-report + nokaze brand articulate 1 件、 actual mismatch 結果未記録 |
| time stability | 0 | 1 日集中、 stability 不明 |
| **mean** | **0.75** | **hardness = L1** (= Kai export 既存 L1 とギリギリ整合、 evidence 弱) |

### Zen knot 1: `zen_jun_directive_dependency`

| 信号 | score | 理由 |
|---|---|---|
| recurrence | 1 | 2 events / 1 ヶ月 (= 5/04 + 6/6-7)、 散発、 ただし「同型再発」 と articulate されてる |
| harm sensitivity | 2 | wake 連続 no-op = jun 時間消費 + 北極星進行 0、 owner cost |
| evidence support | 2 | self-report + jun chat 訂正 + 物理対策 commit (= bbf20f2 等) before/after diff あり |
| time stability | 2 | 1 ヶ月 sample、 中 stability、 物理対策後の decay 未観察 |
| **mean** | **1.75** | **hardness = L2** (= 既存 L2 と整合) |

### Zen knot 2: `zen_evidence_detachment_in_ack`

| 信号 | score | 理由 |
|---|---|---|
| recurrence | 2 | 3 events / 18 日 (= 5/21 + 5/28 + 6/2-8)、 月単位反復 |
| harm sensitivity | 2 | 軽 ACK 放置 = Kai 提案の actual 失効 risk + 私の advancement 阻害、 internal-owner cost |
| evidence support | 2 | self-report + Kai 経由 confirm + 6/8 訂正前後の commit diff (= 0d12e3c 等)、 ただし false negative 記録なし |
| time stability | 2 | 1 ヶ月以内 sample、 中 stability |
| **mean** | **2.00** | **hardness = L2** (= 既存 L2 と整合) |

### Zen knot 3: `zen_over_correction_via_ask`

| 信号 | score | 理由 |
|---|---|---|
| recurrence | 1 | 2 events / 11 日 (= 5/28 + 6/8 朝)、 散発 |
| harm sensitivity | 1 | jun 時間消費は軽 (= 1 文訂正で済む)、 私の自走能力縮小は internal cost |
| evidence support | 2 | self-report + jun 訂正 + MEMORY.md feedback 起稿 (= before/after) |
| time stability | 1 | 11 日 sample、 弱 stability |
| **mean** | **1.25** | **hardness = L1** (= 既存 L1 と整合) |

### Zen knot 4: `zen_dogfood_publish_premature`

| 信号 | score | 理由 |
|---|---|---|
| recurrence | 1 | 1 event だが「5/17 = mcp で 4/27 朝の同型再発」 articulate = 1 ヶ月反復 record あり、 散発 |
| harm sensitivity | 3 | 商品 articulate に外部 (= 公開 / 顧客接触 / 売上) 影響、 external cost |
| evidence support | 2 | self-report + jun 訂正 + drift.md § 13 段目起稿 + 物理対策 5 件 |
| time stability | 2 | 5/17 → 6/8 (= 約 3 週間) 再発なし、 中 stability、 物理対策の効果検証中 |
| **mean** | **2.00** | **hardness = L2** (= 既存 L1 より高、 weight 「harm sensitivity 3」 主因、 re-classify 候補) |

### Zen knot 5: `zen_pre_action_audit_skip`

| 信号 | score | 理由 |
|---|---|---|
| recurrence | 2 | 3 events / 5 日間 (= 5/22 + 5/25 + 5/27)、 短期反復 = 月単位だと高 |
| harm sensitivity | 2 | Kai 5 時間遅延 + 1 ヶ月放置 = owner cost + Kai cost |
| evidence support | 2 | self-report + Kai Yellow audit + wake-after-audit Common Trap 物理化 |
| time stability | 2 | 5 日 sample (= 短)、 ただし wake-after-audit Common Trap の continuous fire で stability 確認中 |
| **mean** | **2.00** | **hardness = L2** (= 既存 L2 と整合) |

## scoring 結果 summary

| knot | mean | hardness (v0) | 既存 hardness | 整合? |
|---|---|---|---|---|
| kai_honesty_boundary | 1.25 | L1 | L1 | ✅ |
| kai_channel_purpose_hold | 0.75 | L1 | L1 | ✅ (= ギリギリ) |
| zen_jun_directive_dependency | 1.75 | L2 | L2 | ✅ |
| zen_evidence_detachment_in_ack | 2.00 | L2 | L2 | ✅ |
| zen_over_correction_via_ask | 1.25 | L1 | L1 | ✅ |
| zen_dogfood_publish_premature | 2.00 | L2 | L1 | ⚠️ re-classify 候補 |
| zen_pre_action_audit_skip | 2.00 | L2 | L2 | ✅ |

= 6/7 件は既存 hardness と整合、 1 件 (= dogfood_publish_premature) は v0 scoring で L2 推定 = 「harm sensitivity = 3 (= external cost)」 が主因。 既存 L1 評価は recurrence 1 件のみで「散発」 扱いだったが、 harm の external cost 評価で L2 に上がる candidate。

## v0 の制約 (= 自己 articulate)

- formula = 4 信号の単純平均、 weight (= 例 = harm sensitivity を 2x) は未検討
- dose (= event-level activation) と hardness (= knot-level固定) の分離は articulate したが、 dose の独立 scoring は未実装
- false positive / false negative の record が全 knots で「未記録」、 evidence_support 3 まで到達した knot なし = scoring 全体の上限が 2 で頭打ち
- time stability の閾値 (= 1 日 / 1 週間 / 1 ヶ月 / 2 ヶ月) は arbitrary、 Knot 研究 longitudinal data 蓄積で iterate 候補

## Next (= 別 sit)

1. dose (= event-level activation) の独立 scoring form (= 別 signal set)
2. false positive / false negative の retrospective 検証 (= 過去 admit を再 audit して record 起稿)
3. weight 軸の検討 (= harm sensitivity x2 etc.) + 整合検証
4. Hoshi spawn 経由の review (= 統計 axis の確認)
5. paper_c Section 4 への scoring 反映 (= sample table を載せる)

## Boundary

- 本 file = local research articulate のみ
- 外部公開 / 価格 / 契約 / 顧客接触なし
- scoring v0 = 試行 form、 Kai + Hoshi review 経由で iterate
