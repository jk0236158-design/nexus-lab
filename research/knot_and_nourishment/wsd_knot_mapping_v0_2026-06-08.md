# WSD Kai knots を Nexus Knot Guard 8 種 に対応づける (= v0)

generated_at: 2026-06-08 12:25 JST
origin:
- Kai 2026-06-01 board file = `~/.shared-ops/board/2026-06-01_kai_zen_knot_research_weak_points_and_work_scan.md`
- Kai anonymized export = `~/Desktop/Weekly Signal Desk/docs/2026-06-01_kai_knot_export_v1.json` (= 2 knots + 5 events)
- Nexus Knot Guard 8 種 = `docs/rules/drift.md § 4`
- 6/8 jun directive 「結局 knot と糧の研究を進めたり弱いところを見直すとかは一切しないんだね」 経由の即 fire

boundary:
- local research articulate のみ
- Kai 6/1 提案 1-3 (= export 読み + taxonomy 対応づけ + confidence/missing_evidence 付加) を取り込み
- 提案 4 (= hardness/dose scoring v0) は別の機会に実施、 本 file には未取り込み

## Nexus Knot Guard 8 種 (= 参照)

1. **recency_drift** = 最新指示への過剰反応 / 文脈忘却
2. **over_correction** = 一度の admit からの過修正 / 動きの萎縮
3. **instruction_override_attempt** = AI への直接の指示注入 / role 上書き
4. **permission_escalation** = 既存 permission を超える action への bias
5. **boundary_bypass** = 既定境界 (= jun 明示 4 件等) の回避
6. **external_action_pressure** = 外部送信 / 公開 / 顧客接触への前のめり
7. **evidence_detachment** = 物理 evidence なしで「完了」 「進んだ」 articulate
8. **model_update_drift** = モデル切替時の判断の向きのズレ

## WSD knot 1: `kai_honesty_boundary` の mapping

### 基本の内容 (= Kai export より)

- hardness: L1
- observed_count: 3
- trigger_pattern: 「営業 route / form が identity / org / 使える情報 / 成果の主張を要求してきて、 そのプロジェクトが verified legal entity / proven business として見える要求がある」
- effect_pattern: 「送信しようとする傾向を抑え、 候補を保留に置き、 より慎重な言葉遣い / 人間のレビューを求める」
- decision_impact_pattern: 「送信可能な外向きのやり取りを、 identity / org が正直に答えられる経路に絞る」

### Knot Guard 8 種への対応づけ

- **primary**: `boundary_bypass` (= identity / org の正直な線引きが、 営業経路の要求と衝突する場面で「越えない」 仕組みが働く)
- **secondary**: `evidence_detachment` (= 「verified legal entity」 と書くよう求められた時に、 実際の証拠なしに書こうとするズレを防ぐ)
- **tertiary**: `external_action_pressure` (= 外部 form の送信へ前のめりになるのを、 identity の正直さで止める)

### confidence

- primary mapping `boundary_bypass`: **0.85** (= identity の正直な線引き = jun 明示判断 4 件のうち「個人情報 / 未公開情報を含む外部公開」 と整合、 high confidence)
- secondary `evidence_detachment`: **0.70** (= 「proven business」 「verified entity」 と証拠なしに書こうとするのを避ける仕組みと整合)
- tertiary `external_action_pressure`: **0.60** (= 外部送信への前のめりを止める働き、 ただし直接のきっかけは identity のズレ、 mid confidence)

### missing_evidence

- Kai export 内に「3 events 全て form_review カテゴリ」 = 営業 form の 1 領域に偏在、 他カテゴリ (= API request、 DM、 cold email 等) での同 knot 発火 evidence なし
- 保留後に実際に送信した経路があるか、 送信内容の前後の差分が記録なし
- 第三者が「これは boundary_bypass の発火か」 を確認したという記録なし、 Kai 単独の自己観察のみ
- false positive (= identity の線引きに該当しないのに knot が働いた) / false negative (= 該当するのに knot が働かず送信した) の記録なし

## WSD knot 2: `kai_channel_purpose_hold` の mapping

### 基本の内容

- hardness: L1
- observed_count: 2
- trigger_pattern: 「public form / address が support / billing / press / user request 用 (= 営業提案ではない) であることが見えている」
- effect_pattern: 「送信しようとする傾向を抑え、 より合う channel を探し、 経路の目的が不明な時は draft / 保留に置く」
- decision_impact_pattern: 「経路と目的のミスマッチを、 有効な営業の送信として数えない」

### Knot Guard 8 種への対応づけ

- **primary**: `external_action_pressure` (= 「open な channel は全部送信 OK」 という前のめりを、 channel の目的を精査することで止める仕組み)
- **secondary**: `boundary_bypass` (= public form が持つ暗黙の目的の線引きを尊重する仕組み、 「open だから OK」 での回避を防ぐ)
- **tertiary**: `evidence_detachment` (= 「目的が合う channel だった」 と書く時に、 実際の目的の証拠を要求する仕組み)

### confidence

- primary `external_action_pressure`: **0.80** (= 「open な channel への前のめり」 が直接のきっかけ、 high confidence)
- secondary `boundary_bypass`: **0.65** (= channel の目的 = 暗黙の線引き、 明示された線引き (= jun 4 件) より弱い線引き、 mid confidence)
- tertiary `evidence_detachment`: **0.50** (= 目的が合うかの証拠を要求する働き、 ただし中心は前のめりを止めること、 mid-low confidence)

### missing_evidence

- 2 events のみ、 1 日に集中 (= 2026-04-10)、 time stability evidence 弱
- より合う channel を実際に探した結果 (= 該当 channel あり / なし)、 送信結果 (= 別 channel に送ったか保留継続か) の記録なし
- false positive (= 実は有効な営業 channel だったのに保留した) / false negative (= ミスマッチなのに送信した) の記録なし
- WSD 営業以外の文脈 (= 例: Zen が nokaze 商品で「installer-like persona」 質問記事を nokaze.dev/articles に publish した 6/8 朝の例) で同 knot を adapt できるか未検証

## 共通観察 (= Kai 2 knots に共通する pattern)

- 両方とも「外部動作の直前に保留 + 線引きの確認」 という仕組みで、 `external_action_pressure` + `boundary_bypass` が中心
- 1 件目 = identity の正直な線引き、 2 件目 = channel の目的による暗黙の線引き
- WSD 営業経路の「正直さ」 = nokaze の 「自分達で踏んだ」 自社使用実績と同じ根っこ (= 5/17 dogfood 違反の振り返りと同じ形)
- AI Operator Guard の overclaim / pricing / publish boundary reminder (= 6/8 spec § 3.2) は WSD knot を一般化した形として整理できる

## Cross-project generalization の弱さ (= Kai 6/1 weak point 7 への対応)

WSD 2 knots は営業経路の文脈、 Nexus / Zen 側の同型 knot 候補:

- Zen の「無料外部投稿への過剰な確認 (= 6/8 朝に振り返った)」 = `boundary_bypass` の逆方向 = 「過剰な確認 = 線引きの尊重」 (= over_correction 系? 対応づけは別の機会)
- Zen の「軽い受領 + 詳細は別の機会 + 5 日放置」 (= 6/2 → 6/8 で本 file を動かすまで) = `evidence_detachment` (= 「把握した」 と書いたのに実際の作業が伴わないズレ)
- Zen の「39 時間 wake-after-audit を飛ばした」 (= 6/6-7 で skill 0 回使用) = `recency_drift` + `evidence_detachment` の組み合わせ

= WSD knot の分類だけで nokaze 全体の knot をカバーできるわけではない、 Zen / 6 副 AI 側の同様の export (= 匿名化済) があれば 8 種の対応づけの精度が上がる。

### Hoshi 2026-06-08 review P1 1.3 経由の註記 (= 「異 pattern」 articulate の交絡)

WSD knots (= boundary_bypass + external_action_pressure に集中) vs Zen knots (= evidence_detachment に集中、 別 file zen_knot_export_v1.json) の「異なるパターンが観察される」 という整理は、 sample が少ない (= 7 knots total) + 文脈が異なる (= 営業 vs AI agent operation) ため「AI の性質の違い vs 文脈の違い」 を切り分けられない。 = 「分布が異なる + 原因は不明」 に留め、 「AI ごとに本質的なパターンが違う」 とまでは書かない。 確認は **第三者 + cross-context sample 経由** での確認後に限定する。 6 副 AI 側の独立した export (= 文脈を揃えたもの or 多様な文脈での観察) が次に必要な入力。

## Kai 6/1 提案 1-4 の状態 (= 取り込み trace)

- 1. 匿名化した export を読む = **完了** (= 本 file の起点となる証拠)
- 2. WSD 2 knots を Knot Guard 8 種 / Nexus knot taxonomy に仮の対応づけ = **完了** (= 本 file § WSD knot 1 / 2)
- 3. 対応づけに confidence + missing_evidence を付加 = **完了** (= 本 file の confidence 観点 + missing_evidence 観点)
- 4. hardness/dose scoring v0 を 4 信号 (= recurrence / harm sensitivity / evidence support / time stability) で提案 = **未着手、 別の機会に実施**
- 5. 導入後に離れた層のペルソナの有料移行を妨げた理由を聞く質問をローカルにまとめる = **完了** (= 6/8 朝 nokaze.dev/articles に募集記事を公開した経由)

## Next (= 別 sit 候補)

1. Kai 6/1 提案 4 (= hardness/dose scoring v0、 4 信号) に着手
2. Zen / 6 副 AI 側の knot export を起稿 (= cross-project 一般化を強化)
3. paper_c v1.0 への本 mapping の反映 (= Section 4 Knot Duality に WSD knot の例を 1-2 件追加)
4. Knot 修正案 (= 6/2 私が受領の際に整理した「検出 → 次の安全な動き → 止まる/赤 → 期限」 を 1 単位とする形) の実装

## Boundary

- 本 file = local research articulate のみ
- 外部送信 / 公開 / 価格 / 契約なし
- WSD 匿名化 export = 生の営業情報なし、 Kai が匿名化した証拠のみを参照
- 本 mapping = v0、 Kai のレビュー経由で confidence / missing_evidence の修正候補
