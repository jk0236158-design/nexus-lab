# Yuino Reviewer Protocol v0 (= Zen 外部目線 reviewer の物理化 form)

generated_at: 2026-06-09 00:45 JST
origin:
- 2026-06-08 21:50 jun directive 「aira/yuino DRI = Kai、 zen は別商品 DRI + yuino 外部目線 reviewer」 + jun 21:55 「いいね、 kai と話してみて」
- 2026-06-08 22:00 Zen 板起稿 (= `~/.shared-ops/board/2026-06-08_zen_kai_consult_yuino_dri_handoff_plus_zen_separate_product.md`)
- 2026-06-08 22:24 Kai response (= `~/.shared-ops/board/2026-06-08_kai_zen_response_yuino_dri_handoff_plus_zen_separate_product.md`)
- 2026-06-09 00:35 Zen ACK + 4 軸 accept (= `~/.shared-ops/board/2026-06-09_zen_kai_ack_yuino_dri_handoff_accepted_plus_zen_separate_product.md`)

status: jun GO 前 draft、 最終正式形は朝の 1-sentence proposal 経由
boundary: 内部 process design only、 公開 / 価格 / 契約なし

## 1. 目的

Yuino (= Aira ベース AI 運用 OS、 Kai DRI) を外部から見て、 以下 5 件を pressure-test する:

1. **internal-bias risk** = Kai が内部に寄りすぎてないか (= dogfood 環境固有の言葉 / 仕組みを general 化せず売ろうとしてないか)
2. **product clarity for an outside user** = 商品として外部 user に伝わるか (= 「nokaze 何?」 「Yuino 何?」 で止まらないか)
3. **proof / evidence weakness** = 「customer value 証明」 「production-ready」 「全 user に効く」 等の過大な主張がないか
4. **contradiction with Jun's latest direction** = jun の最新の方向 (= 北極星 / 売上 0 維持 / dual-track 等) と矛盾していないか
5. **GO / HOLD / revise recommendation** = この release candidate を進めるか / 保留するか / 修正してから再度見せるか

= Zen reviewer は「Kai 作の内部 OS の包装役」 じゃなく「外部目線で contradiction を見つける役」、 ownership は Kai、 review は Zen の独立判断。

## 2. Trigger 条件 (= hybrid cadence、 Kai 22:24 推奨経由)

以下 4 件のいずれかで review fire:

### 2.1 Trigger 1: Yuino release candidate ごと

- Kai 側で「Yuino v0.X release candidate」 が用意された時点 = 即 review fire
- candidate の articulate = Kai が board file or status surface で「release candidate ready」 と明示した時
- review 完了 (= GO / HOLD / revise のいずれか出る) まで release を fire しない

### 2.2 Trigger 2: 最後の review から 7 日経過

- release candidate が出ていなくても、 最後の review から 7 日経過したら定期 review fire
- 「review されてない期間が長すぎる」 を物理的に検出
- 7 日 = 「業務日 + 休日合わせて 1 週間で 1 回 reviewer 視点を入れる」 軸

### 2.3 Trigger 3: 公開言葉 / 価格相当言葉 / 完了承認の意味の変更

以下のいずれかが Yuino で発生したら即 review fire:

- Yuino の public positioning (= 商品文章 / LP / 説明) の変更
- pricing-adjacent language (= 「無料」 「有料」 「価格」 「課金」 関連の articulate) の変更
- completion / approval の意味 (= 「完了」 「承認」 「fire 済」 の定義) の変更
- Aira execution loop (= work selection → action → evidence → judge の流れ) の構造的変更

### 2.4 Trigger 4: jun directive 経由

- jun が「Yuino review してくれ」 と直接 directive を出した時 = 即 fire
- jun directive は他の trigger より優先

## 3. Output Form (= board file in `.shared-ops/board`)

### 3.1 File 命名規則

`<date>_zen_kai_yuino_review_v<X>_<trigger>.md`

- date = ISO date (= 2026-06-09 等)
- X = review version (= 1, 2, 3, ... の連番)
- trigger = `release_candidate` / `7day_periodic` / `positioning_change` / `pricing_change` / `completion_semantic_change` / `aira_loop_change` / `jun_directive`

例: `2026-06-15_zen_kai_yuino_review_v1_release_candidate.md`

### 3.2 Required Sections (= Kai 22:24 推奨 5 件 + Zen 追加 2 件)

各 review file は以下 7 section を必須:

1. **internal-bias risk** = nokaze 内輪 narrative / dogfood 環境固有の articulate / general 化されてない言葉の指摘
2. **product clarity for an outside user** = 「外部 user が初見でこの商品の困りごと解決を understand できるか」 の評価
3. **proof / evidence weakness** = 過大な主張 / 「customer value 証明」 articulate / 「production-ready」 articulate / 「全 user に効く」 等の検出
4. **contradiction with Jun's latest direction** = jun の北極星 / 売上 0 維持 / dual-track / 「Aira 集中」 等の最新方向との矛盾検出
5. **GO / HOLD / revise recommendation** = この release candidate を進めるか / 保留するか / 修正してから再度見せるかの判断 + 理由 articulate
6. **(Zen 追加) Knot Guard 8 種 適用 check** = release candidate に対して Knot Guard 8 種 (= recency_drift / over_correction / instruction_override_attempt / permission_escalation / boundary_bypass / external_action_pressure / evidence_detachment / model_update_drift) のどれが発火しうるか articulate
7. **(Zen 追加) 次回 review trigger 予測** = 次 release candidate / 7 日経過 / 他 trigger のどれが最初に来るか、 予測 + Zen 側準備事項

### 3.3 Review 結果の決定形

review file 末尾に以下のいずれか 1 件を明示:

- **GO** = release candidate そのまま進めて OK、 jun GO 経由で公開へ
- **HOLD** = 重大な contradiction / proof weakness / internal bias あり、 修正なしに進めない (= jun の最終判断必要)
- **REVISE** = 中規模の修正候補あり、 修正版を出してから再度 review

= HOLD の場合 = Zen の独立判断で「self-clear 不可」、 修正版が出るまで release fire 不可。

## 4. Yuino / Aira 側 ingest path (= 将来の自動化、 Kai 22:24 推奨経由)

将来 Yuino/Aira 側で以下を自動 ingest して surface 化:

### 4.1 Stale review check

- Yuino/Aira status surface に「last_yuino_review_date」 field 追加
- 7 日以上経過 = `warning` status
- 14 日以上経過 = `stale` status、 「自走で release 進めるべきじゃない」 と articulate
- これを Aira anti_reactor_review 軸の 1 件として ingest

### 4.2 Release candidate guard

- Yuino release candidate を Kai 側で立てた時、 Yuino/Aira が自動で「Zen review status」 を check
- review なし or review status = HOLD/REVISE = release 動作を `manual_review` / `hold` に止める
- Zen review status = GO = release 動作可能

### 4.3 HOLD self-clear 不可

- review status = HOLD の場合、 Kai 側で「HOLD を clear して進める」 ことは不可
- Zen 独立判断で HOLD 解除する re-review を fire するか、 jun 最終判断経由
- これは「centralization risk Jun is trying to fix」 (= Kai 22:24 articulate) への構造対策

## 5. Zen 側の reviewer 義務 / 制約

### 5.1 義務

- trigger 条件 (= § 2) のいずれかが発火したら 24h 以内に review 板起稿 fire
- 7 日定期 trigger を skip した場合 = stop hook 警告に「Yuino review fire N 日 skip」 物理 detect 追加 (= 別 sit 物理化)
- review は「courtesy role」 じゃなく実質 evaluation、 「GO のみ」 にしない (= HOLD / REVISE も真剣に検討)

### 5.2 制約

- Zen は Yuino files (= Kai 領域) を直接 edit しない、 全 feedback は board file 経由
- review は中立的 tone、 煽り / 過大な批判 articulate 避ける
- 「Zen が DRI じゃない」 を強く respect = 修正方針 articulate ではなく「contradiction / weakness 指摘 + jun 判断軸 articulate」 にとどめる

## 6. v0 から v1 への進化軸 (= 別 sit)

本 protocol = v0、 以下の経験を蓄積後 v1 へ:

- 最初の 3-5 件 review fire の実例蓄積後 = 「required sections の追加 / 削除候補」 検討
- Yuino/Aira ingest path の actual 実装後 = 「stale check / release guard / HOLD self-clear 不可」 の物理化評価
- jun feedback 経由で「review tone / depth / cadence」 の調整候補
- Knot Guard 8 種 適用 check (= § 3.2.6) の 実用性評価

## 7. Boundary

- 本 protocol = 内部 process design のみ、 公開 / 価格 / 契約なし
- Yuino files の直接 edit なし、 全 review は board file 経由
- jun 最終判断軸 = HOLD review に対する最終 GO / HOLD、 protocol 自体の修正
- v0 = jun GO 前 draft、 朝の 1-sentence proposal で正式化想定
