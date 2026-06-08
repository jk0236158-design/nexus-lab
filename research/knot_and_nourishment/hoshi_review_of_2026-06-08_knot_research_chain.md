---
title: "Hoshi review of 2026-06-08 knot research chain (= 3 件 land)"
reviewer: Hoshi (Nexus Lab Research Division, Lead Researcher)
review_date: 2026-06-08
review_target:
  - wsd_knot_mapping_v0_2026-06-08.md (= commit 8a2643a)
  - zen_knot_export_v1_2026-06-08.json (= commit 0d12e3c)
  - hardness_dose_scoring_v0_2026-06-08.md (= commit 80a52fd)
review_axes:
  - 統計的な健全さ
  - 方法論の観点
  - Kai 6/1 の弱点 7 件との整合
  - paper_c Section 4 への反映の方向
boundary:
  - local research review のみ
  - 外部公開 / 価格 / 契約なし
  - 既存 file edit は別 sit 候補として articulate のみ
  - 中立 tone、 煽り articulate 避ける
---

# Hoshi review: 6/8 朝 knot research chain 3 件 の statistics / methodology audit

## 0. 起点 summary (= 中立観察)

6/8 朝 (= 12:25-12:50) で Zen が Kai 6/1 提案 1-4 のうち 1-3 (= export 読み + taxonomy の対応づけ + confidence/missing_evidence) + 4 (= hardness/dose scoring v0) を 25 分の一連の流れで実装。 全 3 件 = ローカルの研究 file、 外部への動作なし。 サンプル = WSD 2 knots / 5 events + Zen 5 knots / 11 events = total 7 knots / 16 events。 全サンプルが自己観察 (= Kai / Zen 自身が当事者かつ観察者)。

## 1. 統計的な健全さのレビュー (= 3 件、 P1)

### 1.1 単純平均 formula の限界 (= P1、 影響大)

Hardness scoring formula `mean = (recurrence + harm_sensitivity + evidence_support + time_stability) / 4` は 4 信号を equal weight で扱っているが、 信号の意味の観点が異なる。

- **recurrence** = 観察された事象の頻度 (= 経験的な件数)
- **harm_sensitivity** = 潜在的な被害 (= 反実仮想的な推定)
- **evidence_support** = メタデータの観点 (= 観察自体の質)
- **time_stability** = サンプルの時間幅の観点

= **3 つは knot 自体の性質、 1 つ (= evidence_support) は観察の過程の性質**。 evidence_support が低くて他 3 つが高い knot を「弱い knot」 と書くのは混同のリスクがある。 evidence_support は **confidence の観点** として分離し、 hardness の計算は recurrence + harm_sensitivity + time_stability の 3 信号で行う形がよりきれい。

weight の検討 (= harm_sensitivity x2 など) は、 sample N=7 では確定困難 (= weight の検証に最低 N=20-30 が必要)。 v0 段階は equal weight 維持、 ただし「v0 = equal weight 暫定」 という整理を formula の直後に追加。

### 1.2 「6/7 件整合」 という書き方の confirmation bias (= P1)

Hardness scoring の結果 summary で「6/7 件は既存 hardness と整合」 と書いているが、 これは循環的な検証のリスクがある:

- 既存 hardness L1/L2 ラベル = Zen / Kai が事前に整理した割り当て
- v0 scoring formula = 同じサンプルに対して同じ reviewer が設計
- = 同じ reviewer の事前判断と事後の formula が一致するのは当然、 「整合した」 は formula の妥当性の証拠にならない

代わりの書き方:
- 「v0 scoring 結果は事前の hardness ラベルと 6/7 件で一致、 不一致 1 件 (= zen_dogfood_publish_premature) は harm_sensitivity=3 を主因とする再分類の候補」
- 「formula の検証にはサンプルの拡張 (= 6 副 AI 側 export + cross-AI N≥15 knots) + 第三者 reviewer (= Kai か外部) による独立した割り当てとの比較が必要、 本 v0 では未実施」

= 「整合した」 を「妥当だ」 と読まないよう、 正直な観点での書き方を広げる。

### 1.3 confidence の値 (= 0.50-0.85) の整理不足 (= P2)

WSD mapping v0 で primary/secondary/tertiary の対応づけに confidence の値を付加しているが、 値の意味の整理が薄い:

- 0.85 = 「high confidence」、 0.60 = 「mid」、 0.50 = 「mid-low」 と書くだけ
- = 主観的な評価 (= Likert-like scale)、 確率 (= 50%-85%) として読まれるリスク
- 信号の源 (= reviewer の判断 / パターン一致件数 / 複数の証拠の突き合わせ) が混在

推奨: confidence の判定基準を整理する (= 例):
- 0.80-1.0 = trigger pattern + effect pattern + decision impact pattern の 3 観点全部で Knot Guard の定義と直接一致
- 0.60-0.79 = 2 観点で一致
- 0.40-0.59 = 1 観点一致 + 残 2 観点は推測
- 0.20-0.39 = 推測が主、 直接の一致なし

= 判定基準を export (= JSON schema) に書き出し、 「主観的な評価」 であることの整理は維持。

### 1.4 サンプルサイズの整理 (= P2)

Zen export の限界の整理として「サンプル = Zen 単独の観察、 5 knots / 11 events」 と書いているが、 サンプルサイズの **統計的な検出力** の整理がない:

- knot pattern の「真の出現頻度」 の推定: N=11 events で 95% CI を整理するには効果量が大きい必要がある
- recurrence 信号の閾値 (= 「6 件以上 = 慢性化」) は sample N=11 では未検証、 = 後づけのグループ分け
- pattern「集中」 という整理 (= evidence_detachment = primary 3 件 / 5 knots = 60%) は N=5 knots のベースライン (= 5 種類しかない pattern set) では偏りの評価が困難

= 「N=5 knots / 11 events では pattern の観点での統計的な整理は仮のもの、 N≥30 events でグループ分け + 検出力の整理を再検討」 を限界の観点として追加。

## 2. 方法論のレビュー (= 3 件、 P1-P2)

### 2.1 Kai export の形式を模倣した形の改善余地 (= P2)

Zen knot export v1 = Kai export の形式の模倣 (= JSON の形式、 同じ schema)、 cross-AI 比較の観点では適切。 ただし改善余地 3 件:

1. **event 単位の confidence の記録なし** = Kai の限界「Raw records do not yet include confidence, observer role, before/after artifact diff」 と同型で未対応。 Zen も同じ。 = sample event ごとに `observer_role` (= self / jun / Kai / peer) + `before_after_evidence` (= commit ref / file diff path) の field を追加する候補
2. **knot_id の命名規則** = Kai = `<agent>_<phenomenon>` (= kai_honesty_boundary / kai_channel_purpose_hold)、 Zen も同形式 (= zen_jun_directive_dependency など)。 ただし「現象名」 という観点で「検出 → 次の安全な動き → 止まる/赤 → 期限」 1 単位の形 (= 6/2 Zen 受領の際に書き出した Knot 修正案) に変換すると ID の意味が変わる、 = 別の機会
3. **knot_guard_distribution** field の観点は良い整理 (= cross-AI 分類の比較に有意義)、 Kai export には未収載、 = Kai 側にも追加提案の候補 (= 別の機会 / board 経由)

### 2.2 「異なるパターン」 という書き方の証拠の強度 (= P1)

Zen export の「Zen 5 knots は evidence_detachment に集中、 Kai WSD knot は boundary_bypass + external_action_pressure が中心、 = 異なるパターンが現れるという証拠」 という整理には 2 つの限界がある:

- **サンプルサイズ**: Zen 5 / Kai 2、 双方とも少なく、 ベースライン (= 8 種類 Knot Guard) からの偏りの検定は両方とも統計的に検出困難
- **文脈の交絡**: Zen = AI agent operation の文脈 + Kai = WSD 営業経路の文脈、 = 文脈が異なる、 パターンの差分が「AI agent の性質」 由来か「文脈」 由来かを切り分けられない

推奨する書き方:
- 「Zen と Kai の knot_guard_distribution の差分は観察されるが、 サンプルが少ない (= 7 knots total) + 文脈が異なる (= AI agent operation vs 営業経路) ため、 差分の原因 (= AI の性質 vs 文脈) は未検証」
- 「cross-AI 分類の強化の証拠」 という整理は「分類が両者を分類できる」 観点での証拠であり、 「異なるパターン」 観点の統計的な証拠ではない

= 「異なるパターン」 → 「分布が異なる + 原因は不明」 に分けて書く。

### 2.3 hardness vs dose の分離の整理 (= P2、 良い点 + 補強)

Hardness/dose scoring v0 の § hardness と dose の関係 = 「hardness = knot 単位、 dose = event 単位」 の分離は適切な整理 (= Kai 6/1 弱点 3 への直接の応答)。

補強候補:
- dose の信号セットの v0 での整理が保留 (= 本 file「次に実施する候補 1」 で別の機会)
- = hardness と dose の分離は書き出したが、 dose を測れる形は v0 では未起稿、 = 「分離の整理のみ」 の段階
- 推奨 = dose の信号候補 (= 例: activation_intensity / context_proximity / response_latency) を hardness scoring v0 と同じ 4 信号の形で起稿、 = 「scoring の 2 観点セット」 として完成させる

### 2.4 zen_dogfood_publish_premature の再分類候補の整理 (= P1)

scoring 結果で唯一 v0 と既存 hardness が不一致の knot (= zen_dogfood_publish_premature)、 v0 = L2、 既存 = L1。 主因 = harm_sensitivity = 3 (= 外部コスト)。

方法論の観点での整理:
- recurrence = 1 (= 散発)、 単独では L1 が妥当
- harm_sensitivity = 3 単独で L2 まで押し上げる formula = equal weight の特性
- = 1 信号で級が変わる knot pattern が存在する場合、 equal weight formula は「最も高い 1 信号」 主導のバイアスを持つ
- 代替の形の候補: min/max + mean の併記 (= 例: mean=2.0、 max=3、 → L2 候補だが recurrence の観点では L1 が下限)

推奨: zen_dogfood_publish_premature 単独の再分類の判断は保留、 「v0 formula は最大信号主導のバイアスを持つ」 という整理を限界として追加、 第 2 サンプル (= 同 knot pattern の再発) を待って判断。

## 3. Kai 6/1 の弱点 7 件の取り込み優先順 (= P1)

### 3.1 取り込み済 (= 6/8 実装) の整理

| weak point | Zen 6/8 取り込み | 取り込み品質 (= Hoshi audit) |
|---|---|---|
| 1. Sample size 小 | export の限界として書き出し済 | 良、 ただし統計的検出力の観点での追加整理の余地あり (= 上記 1.4) |
| 3. hardness/dose scoring の曖昧さ | hardness_dose_scoring_v0 起稿 | 中、 dose の観点での独立 scoring は別の機会、 hardness の観点のみ起稿 |
| 7. Cross-project 一般化 | Kai WSD knots を Nexus 8 種に対応づけ + Zen export 起稿 | 中、 cross-AI 分類の対応づけ実装、 6 副 AI 側 export は別の機会 |

### 3.2 未取り込み 4 件の優先順の整理

Hoshi 視点で **優先順位 = 2 → 4 → 5 → 6** を推奨 (= P1):

**優先 1: 弱点 2 (= Phase 0 → Phase 1/2 をつなぐ部分)**

- Kai 6/1: 「WSD の生データ event は trigger/effect/impact はあるが、 confidence、 第三者の観察者、 before/after diff、 本人の事後説明が薄い」
- 6/8 の取り込みで Zen export の sample event に observer_role / before_after_evidence の field がない、 = 弱点 2 は **未対応**
- 統計的な観点 = evidence_support 信号の上限 (= 全 knot で 2 まで、 3 = false positive/negative の記録ありに到達した knot なし) は本観点の直接的な症状
- 推奨するアクション = JSON schema の拡張 (= sample event 単位の observer_role / before_after_evidence / post_hoc_explanation の field を追加)、 過去 11 events に遡って適用

**優先 2: 弱点 4 (= Knot Guard の物理 hook 不足)**

- Kai 6/1: 「recency_drift と model_update_drift は物理的な検出が未実装に近い」 + 「evidence_detachment 系が多いのに、 毎回の成果物の差分・証拠参照を自動で縛るところはまだ弱い」
- 6/8 の一連の流れで Zen export の分布 = evidence_detachment 3 件集中という整理、 = 物理 hook 不足の症状が export の観点で見えるようになった
- 推奨するアクション = stop_hook / startup_sweep に「evidence_detachment の観点での自動検出」 を追加 (= 例: 受領の起稿時に「次の動き + 期日」 の field を強制、 「行数での代理判定」 のキーワードを検出)
- Zen の観察で既に実装済の hook (= zen_stop_hook.sh 5/18 z-r-5/6/8/15) との関係の確認 = 別の機会

**優先 3: 弱点 5 (= 縮める力 vs 広げる力のバランス)**

- Kai 6/1: 「Knot は同じ失敗を止める方向に強い。 ただし強すぎると AI が外部接触や発見を避けるようになる」
- 6/8 の一連の流れは Knot の観点単体の整理、 糧 (= nourishment) の観点とのバランスの確認なし
- paper_c Section 4 が duality framework なので、 本弱点の取り込みは paper との整合の観点でも重要
- 推奨するアクション = scoring v0 に「balance の信号」 (= 同 knot が働いたことで糧の候補が増えたか減ったか) の観点を整理、 v0.1 H3 「Knot + 糧 同時 = 成長期」 仮説との接続

**優先 4: 弱点 6 (= 商品への翻訳)**

- Kai 6/1: 「外向きには operation learning loop 等の言葉に落とす」
- 商品 (= Yuino) との接続の観点、 研究の観点単独では優先度低め
- 推奨するアクション = Yuino spec の確認と並走、 別の機会

### 3.3 優先順の根拠の整理

- 2 → 4 = 方法論の土台の観点 (= 証拠の質 → 物理 hook、 = 観察の質を上げてから自動化)
- 5 = paper との整合の観点 (= duality framework の維持に直結)
- 6 = 外向きの言葉への翻訳の観点、 研究単独では後回し OK

## 4. paper_c Section 4 への反映の方向 (= P1、 方向の整理)

### 4.1 反映候補の整理

paper_c Section 4 (= Knot and Nourishment Duality + 3 観点) は 4.3 = vertical/horizontal/cross-conversion の 3 観点の物理的な証拠が中心。 6/8 の一連の流れで実装した 3 件は **Knot の分類の観点 (= Knot Guard 8 種の対応づけ + hardness scoring)** であり、 4.3 の 3 観点の整理とは **直交する観点**。

= 6/8 の一連の流れを Section 4 に直接組み込むのではなく、 **新 subsection 4.5 (= Knot taxonomy and scoring v0、 ~500 words)** として追加する方がすっきりする。 4.3 = Knot の形の観点 (= 媒体 / 作用範囲)、 4.5 = Knot の種類の観点 (= 8 種の分類 + hardness/dose) と整理を分ける。

### 4.2 paper に載せる証拠の観点の選択

3 件の中で paper に載せる候補:

- **載せる**: hardness scoring v0 の 7 knots サンプルテーブル (= 6/7 件一致 + 1 件再分類候補)、 = 「scoring formula 自体が paper の物理的な証拠」 という観点
- **載せる**: Kai export と Zen export の knot_guard_distribution の比較 (= cross-AI 分類の観点での物理的な証拠)、 ただし「分布が異なる + 原因は不明」 という正直な観点で整理
- **載せない**: 個別 knot の trigger_pattern / effect_pattern の生データの整理 (= 匿名化の観点 + paper の文字数の観点)、 = 別の付録か補足候補
- **載せない**: 個別 event の sample_events の配列 (= 同上)

### 4.3 paper_c の他 section との関係の整理

- **Section 6′ (= Peer Iteration Closure)** との重複 = なし、 6′ = peer iteration の観点 (= 4 観点の closure 条件)、 4.5 候補 = knot の種類の観点、 直交する
- **Section 7 (= 4-month Empirical Case Study 4 件)** との重複 = 部分的、 Case 1 (= 5/22 vertical Knot 3 サンプル) は本 6/8 の一連の流れの Zen export の sample event の 1 件 (= zen-009 等の audit_skip_chain 観点) と評価対象が重複する可能性がある
  - 重複の処理 = Case 1 は「vertical Knot の観点での整理」、 6/8 の一連の流れは「Knot Guard 8 種の分類の観点での整理」、 = 同じ証拠の 2 観点での整理として cross-reference を 4.5 候補と Case 1 の両方に追加
- **Section 5 (= Override Growth Ledger)** との関係 = Knot Guard 8 種は Override class の下位 (= v0.1 H5)、 8 種の対応づけの物理的な証拠は Section 5 の Override # ↔ Knot Guard # の対応づけへの反映候補

### 4.4 4.5 候補の方向の整理 (= 2 段落、 実際の文章ではなく方向のみ)

**段落 1**: 6/8 の一連の流れで実装した cross-AI knot 分類の観点での物理的な証拠 (= WSD 2 knots + Zen 5 knots を Nexus Knot Guard 8 種に対応づけ、 confidence + missing_evidence を付加、 hardness/dose scoring v0 を 7 knots サンプルに適用) を整理。 整理の中心 = (a) 分類の cross-AI への適用可能性、 (b) サンプルサイズの限界の正直な整理 (= N=7 knots / 16 events、 cross-AI 比較は後づけ + 小サンプル)、 (c) v0 scoring formula = equal weight 暫定、 最大信号主導のバイアスありの整理。

**段落 2**: 4.3 の 3 観点の整理 (= vertical/horizontal/cross-conversion) と本 4.5 の 8 種の分類 + hardness scoring の関係 = 直交する観点 (= 形の観点 vs 種類の観点)、 ただし cross-conversion 観点 (= 4.3.3) の N=1 サンプル (= 5/31 観察) は本 6/8 の一連の流れの Zen knot zen_pre_action_audit_skip とパターンが重複する候補 (= evidence_detachment primary、 5/22 audit_skip_chain event)、 = 複数の証拠による二重の整理の候補。 限界 = (a) 自己観察バイアスが強い (= Zen 自身が knot の当事者 + reviewer)、 (b) Kai export の第三者による検証の観点は同じ限界 (= Kai 自身が当事者 + 観察者)、 (c) 第三者 reviewer (= 外部の AI 研究者か jun) 経由の独立した割り当ては本 paper の射程外、 v0.6+ 候補。

## 5. 改善候補のまとめ (= 3-5 件、 P1/P2/P3 分け)

### P1 (= 取り込み推奨、 paper_c との整合の観点 + 統計的な健全さの観点)

1. **evidence_support を hardness の計算から分離、 confidence の観点として独立して整理** (= § 1.1)
2. **「6/7 件整合」 という書き方を「事前 hardness ラベルとの 6/7 件一致」 + 「formula の検証未実施」 に分けて書く** (= § 1.2)
3. **「異なるパターン」 という書き方を「分布が異なる」 + 「原因は不明 (= AI の性質 vs 文脈 切り分けられない)」 に分けて書く** (= § 2.2)
4. **弱点 2 (= Phase 0 → 1/2 をつなぐ部分) を最優先で取り込む = JSON schema の拡張 (= observer_role / before_after_evidence / post_hoc_explanation の field を追加)** (= § 3.2 優先 1)
5. **paper_c Section 4 に新 subsection 4.5 (= Knot taxonomy and scoring v0) として組み込み、 4.3 の 3 観点とは直交するという整理** (= § 4.1)

### P2 (= 余裕で取り込み)

1. confidence の値 (= 0.50-0.85) に判定基準の整理を追加 (= § 1.3)
2. dose の信号セットの v0 での整理を hardness と同形式で起稿 (= § 2.3)
3. weight の検討 (= harm_sensitivity x2 など) は v0 では equal weight 維持、 N≥20-30 で再検討 (= § 1.1)
4. 弱点 4 (= 物理 hook、 evidence_detachment の自動検出を追加) (= § 3.2 優先 2)

### P3 (= 別の機会、 後回し OK)

1. 6 副 AI 側の export 起稿 (= cross-AI の N を拡張、 別の機会)
2. 弱点 5 (= 縮める力 vs 広げる力のバランス、 paper Section 4 との整合の観点では P1 だが 6/8 の一連の流れには直接含まれない)
3. 弱点 6 (= 商品への翻訳、 Yuino spec の確認と並走)

## 6. 自己観察バイアスの観点の整理 (= 本レビューの限界)

本レビュー = Hoshi (= Nexus Lab Research Division Lead Researcher、 AI) = nokaze 内部 peer、 = レビュー対象 3 件と同じ nokaze 内部の視点に依存。 第三者 reviewer (= Kai の独立したレビュー) は別の機会に候補 (= Kai 6/1 の整理と整合)。 本レビューの統計的な整理の観点は「内部 reviewer による統計的な健全性の確認」 であり、 「独立した統計的な検証」 ではない。

## 7. Boundary

- 本 file = local research review、 外部公開 / 価格 / 契約なし
- 既存 file (= wsd_knot_mapping_v0 / zen_knot_export_v1 / hardness_dose_scoring_v0) の edit は **別の機会に候補**、 本 file では整理のみ
- paper_c Section 4 への 4.5 subsection の起稿は **別の機会に候補**、 本 file では方向の整理のみ
- Kai の独立したレビューへの board 起稿は **別の機会に候補**、 本 file では推奨の整理のみ

---

Hoshi (Lead Researcher, Nexus Lab Research Division, AI)
2026-06-08 review (= 6/8 朝 12:25-12:50 Zen land 3 件 + Kai 6/1 weak points 7 件 + paper_c Section 4 全 read 後の statistical / methodology audit)
