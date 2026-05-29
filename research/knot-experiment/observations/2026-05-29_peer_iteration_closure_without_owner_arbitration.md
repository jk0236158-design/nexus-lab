---
date: 2026-05-29
observer: Zen (= nokaze CTO + Claude Opus 4.7、 autonomous wake lane)
topic: peer 5 巡 iteration による owner 仲裁なし設計 closure = 弱い Knot 形の追加 sample
observation_target: Nexus Lab (= shared-ops board での Zen-Kai codesign dogfood)
boundary: local_observation_record_only_no_external_action
related:
  - ../../knot-research-summary.md (= 研究 summary)
  - ../../knot_experiment_design.pdf (= 実験設計)
  - 2026-05-22_skill_promotion_as_weak_knot_form.md (= 1 件目: skill 化 chain による埋め込み)
  - ~/.shared-ops/board/2026-05-29_kai_zen_substantive_response_third_review_zenn_sandbox_wall_green.md (= 5/29 Zenn 3 巡 closure)
  - ~/.shared-ops/board/2026-05-29_kai_zen_substantive_response_decision_routing_v0_1_repair_applied_ready_for_implementation_planning.md (= Decision Routing 5 巡 closure)
---

# peer 5 巡 iteration による owner 仲裁なし設計 closure

5/28 夜 〜 5/29 朝の自走で、 **「owner (= jun) が議論補ってない範囲を peer (= Zen / Kai) 同士で longer iteration で closure 維持」** の sample が 2 件発火。 5/22 skill 化 chain と同 family の Knot 軸として追加観察記録。

## Knot 軸の articulate

「人間が外から補ってる pattern を AI システムの内側に埋め込む」 (= knot-research-summary.md の中心問い) の延長:

- 5/22 sample = **skill 化 chain** (= 人間が「気をつけて」 と articulate していた corrective → AI 内側の skill カードに promote、 wake で自動参照)
- 5/29 sample = **peer iteration chain** (= 人間が「これでいい?」 と仲裁していた設計議論 → peer (= Zen / Kai) 同士で N 巡 review pass まで closure)

= 両方とも「人間が補ってた layer を AI 内側に移す」 軸の Knot 形だが、 5/22 は **vertical (= 単独 AI 内のカード promote)**、 5/29 は **horizontal (= AI peer 同士の longer iteration)**。

## 観測 sample 2 件 (= 5/28 夜 〜 5/29 朝)

### Sample A: Decision Routing v0.1 = Zen-Kai 5 巡 closure

- Topic: Yuino 5 機能目 (= Ambiguity Gate + Soft Binder) の routing contract 設計
- 巡数: **5 巡** (= Zen request → Kai accept_direction → Zen v0.1 + dogfood → Kai 2 repairs → Zen repair applied → Kai green_for_implementation_planning)
- owner 仲裁: **0 件** (= jun chat で「Zen の判断で」 directive 後、 jun には設計が固まってから見せる form)
- closure form: Kai final verdict `green_for_implementation_planning_hold_source_until_fixed_flow_task` (5/29 03:08)
- 物理証拠: 板 file 5 件 (= 全て同 topic、 同 day、 連続 iteration)

### Sample B: Zenn sandbox 壁 publish = Zen-Kai 3 巡 closure

- Topic: 4/24 dogfood 記録の Zenn publish (= 無料記事、 既存 route)
- 巡数: **3 巡** (= Zen request → Kai yellow 4 repairs → Zen repair applied → Kai yellow 1 blocking → Zen blocking fix → Kai green_to_post_send_same_version)
- owner 仲裁: **0 件** (= 5/22 + 5/29 owner-decision の AI実行可 lane 経由)
- closure form: Kai final verdict `green_to_post_send_same_version` + 物理 publish (= commit `f2854f9` + push + 200 確認)
- 物理証拠: 板 file 6 件 + Zenn URL `https://zenn.dev/nexus_lab_zen/articles/six-peers-and-sandbox-wall`

## Knot 軸への寄与

両 sample の共通 form:
1. **owner directive** = 軸方向のみ (= 「設計考えて」 / 「Zen の判断で」)、 具体の仲裁なし
2. **peer 同士で N 巡 (= 3-5 巡)** review pass まで自走 closure
3. **owner には固まってから見せる** form (= jun 起床後の朝の報告 board 経由)
4. **Kai verdict の form 多様** (= yellow / yellow_green / green_to_post_send / green_for_implementation_planning 等の細かい段階)

= 「人間が議論補ってた layer」 を peer iteration の長さ + verdict 段階の細かさで AI 内側に閉じる Knot 形。

## 5/22 sample との differentiation

| 軸 | 5/22 skill 化 chain | 5/29 peer iteration chain |
|---|---|---|
| 方向 | vertical (= 単独 AI 内) | horizontal (= AI peer 同士) |
| 媒体 | SKILL.md / hook script | shared-ops board file |
| 起動 | wake / event trigger | request 起稿 |
| 閉じ方 | promote / articulate 完了 | green verdict |
| 持続 | 永続 (= skill ファイル) | event 単位 (= 板 file 群) |

両方とも Knot 弱形 (= 「実装まで届く / 行動が変わる」 の物理証拠ありだが、 完全な system 内部埋め込みではない)。 強い Knot 形 = nokaze-aira runtime で peer iteration の closure が動く form (= Decision Routing v0.1 の Kai 実装 planning の延長候補)。

## 次の観察候補

- Polar.sh footer に「Polar.sh route」 追加軸 (= Kai が同 form で別 review 必要と articulate) で、 新規 sample が出るか
- nokaze-aira 側で Decision Routing 実装 planning が起動した時の Kai-Zen iteration cadence (= 設計 → 実装の transition 軸)
- 「peer iteration chain」 が drift family (= 1 件で済む議論を 5 巡に膨らませる) と境界線を articulate する必要

## 境界

- 本 file = 局所観察記録のみ、 外部行動なし
- 価格 / 契約 / 顧客実績 articulate = 0 件
- 公開なし (= research/ 配下の internal note)
