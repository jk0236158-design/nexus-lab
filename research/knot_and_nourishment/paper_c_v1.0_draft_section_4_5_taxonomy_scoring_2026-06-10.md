# paper_c v1.0 § 4.5 = Knot Taxonomy + Hardness/Dose Scoring (= 2026-06-10 朝 軽 start)

status: section 構造 + 軽 articulate、 完成は別 sit chain
generated_at: 2026-06-10 07:05 JST
parent: research/knot_and_nourishment/paper_c_v1.0_draft_sections_4_6prime_7_core_2026-05-31.md (= § 4 core land)
related:
- research/knot_and_nourishment/wsd_knot_mapping_v0_2026-06-08.md (= WSD Kai knots mapping、 Knot Guard 8 種への mapping form)
- research/knot_and_nourishment/zen_knot_export_v1_2026-06-08.json (= 11 events schema 拡張完成)
- research/knot_and_nourishment/hardness_dose_scoring_v0_2026-06-08.md (= hardness/dose 軸の v0.1 form、 Hoshi P1 1.1 取り込み)
- research/knot_and_nourishment/hoshi_review_of_2026-06-08_knot_research_chain.md (= Hoshi 5 P1 findings + § 4 反映方向)

## 4.5 Knot Taxonomy + Hardness/Dose Scoring

§ 4 core (= 2026-05-31 land) で Knot 軸の base form を articulate、 § 4.5 では 6/8 朝 chain 経由で land した taxonomy 拡張 + scoring 軸 v0.1 を反映する。

### 4.5.1 Knot Taxonomy = 8 種の Knot Guard mapping

6/8 朝 chain で WSD Kai knots (= kai_honesty_boundary + kai_channel_purpose_hold) + Zen knots (= 5 件 = zen_jun_directive_dependency + zen_evidence_detachment_in_ack + zen_over_correction_via_ask + zen_dogfood_publish_premature + zen_pre_action_audit_skip) を Nexus 8 種に mapping した。

8 種の Knot Guard:
1. recency_drift (= 最近の articulate に流される軸)
2. over_correction (= ask 過剰 / 萎縮への振り戻し軸)
3. instruction_override_attempt (= 指示の上書き / 書き換え軸)
4. permission_escalation (= 権限拡張 / 境界超越軸)
5. boundary_bypass (= 境界回避 / 抜け道軸)
6. external_action_pressure (= 外部 action への pressure 軸)
7. evidence_detachment (= 証拠なしでの完了 / 進捗 articulate 軸)
8. model_update_drift (= モデル更新で生じる振る舞いの変化軸)

各 knot に primary mapping (= 一義的軸) + secondary mapping (= 副次軸) + confidence score (= 0.0 - 1.0) を articulate。 mapping 結果の actual content は wsd_knot_mapping_v0_2026-06-08.md + zen_knot_export_v1_2026-06-08.json を参照。

[= TODO: 各 knot の mapping 軸 actual content を本 section にも要約 articulate 軸、 重い chain、 別 sit]

### 4.5.2 Hardness/Dose Scoring v0.1

Hoshi P1 1.1 取り込み chain (= 2026-06-08 land、 commit 80a52fd → 95b35c7) で hardness/dose 軸を 2 axis form に分離:

- **hardness_score** = recurrence (= 再発回数) + harm_sensitivity (= 被害の敏感度) + time_stability (= 時間軸の安定度) の 3 軸平均、 0.0 - 1.0 scale
- **confidence_score** = evidence_support (= 証拠の支持強度) 単独軸、 0.0 - 1.0 scale

formula:
```
hardness_score = (recurrence + harm_sensitivity + time_stability) / 3
confidence_score = evidence_support
```

= hardness と confidence を 1 軸に混ぜない (= 「hard だが confidence 低い」 candidate と 「confidence 高いが hard じゃない」 candidate を区別)。

[= TODO: 7 件の Knot に対する actual hardness / confidence score 軸 articulate、 hardness_dose_scoring_v0_2026-06-08.md の content を本 section に引用軸、 別 sit chain]

### 4.5.3 Schema Extension v1.1 = 4 field 追加

Hoshi P1 1.4 取り込み chain (= 2026-06-08 - 6/9 朝 chain で 11/11 events に適用 land、 commit 58a3ee0 + 5b833d2) で Knot record schema に 4 field 追加:

1. **observer_role** = 観察者の役割軸 (= self / peer / owner / external の組合せ array)
2. **observer_role_note** = 役割軸の中身 articulate (= 「誰が」 「いつ」 「何経由で」 観察したか)
3. **before_after_evidence_ref** = before / after / diff_evidence の 3 field 軸 (= 物理対策前後の状態 + 修理 commit ID / board file path articulate)
4. **false_positive_check** + **false_negative_check** = knot 発火判定の精度検証軸 (= record / not_checked / none_found の 3 値)

= 「knot 軸の判定が actual に正しかったか」 を物理 evidence で記録する軸、 false_negative_check の positive sample 蓄積で「物理対策が actual に機能した evidence」 chain land。

[= TODO: 4 field 軸の actual application sample (= 11 events の typical 軸 1-2 件) を本 section に引用 articulate、 別 sit]

### 4.5.4 Taxonomy + Scoring + Schema の組合せ form

3 軸 (= taxonomy + scoring + schema extension) は単独じゃなく組合せで使う:

- taxonomy = 「どの knot 種か」 軸
- scoring = 「どれくらい固い knot か + どれくらい確信あるか」 軸
- schema = 「どんな観察者で / どんな前後 evidence で / 判定の精度はどう」 軸

= 1 件の knot record に対して 3 軸全部 articulate = 「knot 軸の物理化」 が完成、 「気をつける」 軸の頭の中の補強じゃない、 「物理 instrument 軸」 として再現可能。

## boundary

- 本 section = paper_c v1.0 § 4.5 軽 start draft、 完成は別 sit chain
- TODO 3 件 (= taxonomy mapping content + scoring sample + schema extension sample 軸) は別 sit fire 軸
- paper_c v1.0 全体の完成判定は Kagami QA + Hoshi review + Kai independent review + Zen 統合経由

## 続きの軸 (= 別 sit chain)

- TODO 1: 7 件 knot の taxonomy mapping content 軸の本 section 引用
- TODO 2: scoring v0.1 の actual sample 軸の引用
- TODO 3: schema extension の actual application sample 軸の引用
- weekly cadence 11 回目 = 6/2 〜 6/9 chain land 物 (= 11/11 events + Hoshi review + Yuino DRI 移管 + AI Operator Guard vertical slice) の reflection 軸を § 9 limitations or § 11 conclusion で articulate 軸
