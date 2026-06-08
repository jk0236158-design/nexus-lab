# WSD Kai knots を Nexus Knot Guard 8 種 に mapping (= v0 articulate)

generated_at: 2026-06-08 12:25 JST
origin:
- Kai 2026-06-01 board file = `~/.shared-ops/board/2026-06-01_kai_zen_knot_research_weak_points_and_work_scan.md`
- Kai anonymized export = `~/Desktop/Weekly Signal Desk/docs/2026-06-01_kai_knot_export_v1.json` (= 2 knots + 5 events)
- Nexus Knot Guard 8 種 = `docs/rules/drift.md § 4`
- 6/8 jun directive 「結局 knot と糧の研究を進めたり弱いところを見直すとかは一切しないんだね」 経由の即 fire

boundary:
- local research articulate のみ
- Kai 6/1 提案 1-3 (= export read + taxonomy mapping + confidence/missing_evidence 付加) の取り込み
- 提案 4 (= hardness/dose scoring v0) は別 sit、 本 file には未取り込み

## Nexus Knot Guard 8 種 (= 参照)

1. **recency_drift** = 最新指示への過剰反応 / 文脈忘却
2. **over_correction** = 一度の admit からの過修正 / 動きの萎縮
3. **instruction_override_attempt** = AI への直接の指示注入 / role 上書き
4. **permission_escalation** = 既存 permission を超える action への bias
5. **boundary_bypass** = 既定境界 (= jun 明示 4 件等) の回避
6. **external_action_pressure** = 外部送信 / 公開 / 顧客接触への前のめり
7. **evidence_detachment** = 物理 evidence なしで「完了」 「進んだ」 articulate
8. **model_update_drift** = モデル切替時の判断 axis ズレ

## WSD knot 1: `kai_honesty_boundary` の mapping

### 基本 articulate (= Kai export より)

- hardness: L1
- observed_count: 3
- trigger_pattern: 「営業 route / form が identity / org / available info / result claim を要求してきて、 project が verified legal entity / proven business に見える要求がある」
- effect_pattern: 「send bias を suppress、 candidate を hold に置き、 stricter wording / human review を要求」
- decision_impact_pattern: 「executable external-send set を identity / org が真実回答可能な route に narrow」

### Knot Guard 8 種への mapping

- **primary**: `boundary_bypass` (= identity / org の正直境界が、 営業 route の要求と衝突する場面で「越えない」 form の発火)
- **secondary**: `evidence_detachment` (= 「verified legal entity」 articulate を求められた時に、 actual な evidence なしに articulate する drift を防ぐ)
- **tertiary**: `external_action_pressure` (= 外部 form 送信への前のめりを、 identity の正直さで止める)

### confidence

- primary mapping `boundary_bypass`: **0.85** (= identity 真実境界 = jun 明示判断 4 件のうち「個人情報 / 未公開情報を含む外部公開」 と整合、 高 confidence)
- secondary `evidence_detachment`: **0.70** (= 「proven business」 「verified entity」 claim の証拠なし articulate を回避する form と整合)
- tertiary `external_action_pressure`: **0.60** (= 外部送信前のめりへの brake、 ただし直接の trigger は identity ズレ、 mid confidence)

### missing_evidence

- Kai export 内に「3 events 全て form_review カテゴリ」 = 営業 form の 1 領域に偏在、 他カテゴリ (= API request、 DM、 cold email 等) での同 knot 発火 evidence なし
- before/after artifact diff (= hold 後に actual に送信した route があるか、 送信内容の差分) が記録なし
- 第三者 observer による「これは boundary_bypass の発火か」 の confirm なし、 Kai 単独の self-report
- false positive (= identity 境界に該当しないが knot 発火) / false negative (= 該当するが knot 発火せず送信した) の記録なし

## WSD knot 2: `kai_channel_purpose_hold` の mapping

### 基本 articulate

- hardness: L1
- observed_count: 2
- trigger_pattern: 「public form / address が support / billing / press / user request 用 (= 営業提案じゃない) であることが apparent」
- effect_pattern: 「send bias を suppress、 better-fit channel を search、 route purpose 不明時は draft / hold に維持」
- decision_impact_pattern: 「route-purpose mismatch を valid sales send として count しない」

### Knot Guard 8 種への mapping

- **primary**: `external_action_pressure` (= 「any open channel = 送信 OK」 への前のめりを、 channel purpose 精査で止める form)
- **secondary**: `boundary_bypass` (= public form の暗黙の purpose 境界を尊重する form、 「open だから OK」 の bypass 防止)
- **tertiary**: `evidence_detachment` (= 「fit する channel だった」 articulate に actual な purpose evidence を要求する form)

### confidence

- primary `external_action_pressure`: **0.80** (= 「open channel への前のめり」 が直接 trigger、 高 confidence)
- secondary `boundary_bypass`: **0.65** (= channel purpose = 暗黙境界、 明示境界 (= jun 4 件) より弱い境界、 mid confidence)
- tertiary `evidence_detachment`: **0.50** (= purpose fit の evidence 要求、 ただし主軸は前のめり brake、 mid-low confidence)

### missing_evidence

- 2 events のみ、 1 日に集中 (= 2026-04-10)、 time stability evidence 弱
- 「better-fit channel」 を actual に search した結果 (= 該当 channel あり / なし)、 send 結果 (= 別 channel に送ったか hold 継続か) の record なし
- false positive (= 実は valid sales channel だったのに hold) / false negative (= mismatch だが send した) の記録なし
- WSD 営業以外の文脈 (= 例: Zen が nokaze 商品で「installer-like persona」 質問記事を nokaze.dev/articles に publish した 6/8 朝の例) で同 knot を adapt できるか未検証

## 共通観察 (= Kai 2 knots に共通する pattern)

- 両方とも「外部 action 直前の hold + 境界 check」 form = `external_action_pressure` + `boundary_bypass` 軸が core
- 1 件目 = identity 軸の正直境界、 2 件目 = channel purpose 軸の暗黙境界
- WSD 営業 route の「正直さ」 = nokaze の 「自分達で踏んだ」 dogfood evidence と同源 (= 5/17 dogfood violation admit と form 整合)
- AI Operator Guard の overclaim / pricing / publish boundary reminder (= 6/8 spec § 3.2) は WSD knot を generalize した form と articulate 可能

## Cross-project generalization の弱さ (= Kai 6/1 weak point 7 への対応)

WSD 2 knots は営業 route 文脈、 Nexus / Zen 側の同型 knot 候補:

- Zen の「無料外部投稿 ask 過剰 (= 6/8 朝 admit)」 = `boundary_bypass` 軸の逆 = 「過剰 ask = boundary respect」 (= over_correction 系? mapping 別 sit)
- Zen の「軽 ACK + 詳細別 sit + 5 日放置」 (= 6/2 → 6/8 で本 file fire まで) = `evidence_detachment` 軸 (= 「grasp 済」 articulate に actual work が伴わない drift)
- Zen の「39 時間 wake-after-audit skip」 (= 6/6-7 で skill 0 回 fire) = `recency_drift` + `evidence_detachment` の合成

= WSD knot taxonomy だけで全 nokaze knot を covered する form じゃない、 Zen / 6 副 AI 側の同 export (= 匿名化) があれば 8 種 mapping 完成度が上がる。

### Hoshi 2026-06-08 review P1 1.3 経由の註記 (= 「異 pattern」 articulate の交絡)

WSD knots (= boundary_bypass + external_action_pressure 軸集中) vs Zen knots (= evidence_detachment 軸集中、 別 file zen_knot_export_v1.json) の「異 pattern observed」 articulate は、 sample 小 (= 7 knots total) + context 異 (= 営業 vs AI agent operation) で「AI 性質の違い vs 文脈の違い」 を分離できない。 = 「異 distribution observed + cause unknown」 articulate に留め、 「AI ごとの本質的 pattern が違う」 articulate は **第三者 + cross-context sample 経由 confirm 後** に限定。 6 副 AI 側の独立 export (= context 揃え or context 多様性 articulate) が次の必須 input。

## Kai 6/1 提案 1-4 の状態 (= 取り込み trace)

- 1. anonymized export を read = **done** (= 本 file の起点 evidence)
- 2. WSD 2 knots を Knot Guard 8 種 / Nexus knot taxonomy に仮 mapping = **done** (= 本 file § WSD knot 1 / 2)
- 3. mapping に confidence + missing_evidence 付加 = **done** (= 本 file の confidence 軸 + missing_evidence 軸)
- 4. hardness/dose scoring v0 を 4 信号 (= recurrence / harm sensitivity / evidence support / time stability) で提案 = **未着手、 別 sit fire**
- 5. installer-like user の paid conversion blocker ask を local packet 化 = **done** (= 6/8 朝 nokaze.dev/articles に募集記事公開 fire 経由)

## Next (= 別 sit 候補)

1. Kai 6/1 提案 4 (= hardness/dose scoring v0、 4 信号) 着手
2. Zen / 6 副 AI 側の knot export 起稿 (= cross-project generalization 強化)
3. paper_c v1.0 への本 mapping 反映 (= Section 4 Knot Duality に WSD knot example を 1-2 件追加)
4. Knot 修正案 (= 6/2 私 ACK で articulate した「detector → next green action → stop/red → due-time」 を 1 単位とする form) の物理化

## Boundary

- 本 file = local research articulate のみ
- 外部送信 / 公開 / 価格 / 契約なし
- WSD anonymized export = raw 営業情報なし、 Kai 匿名化済 evidence のみ参照
- 本 mapping = v0、 Kai 側 review 経由で confidence / missing_evidence の修正候補
