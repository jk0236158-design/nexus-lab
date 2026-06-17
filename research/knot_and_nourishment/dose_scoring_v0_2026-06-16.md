---
title: "Dose Scoring v0 (= event 単位の knot 発動強さの仕組み)"
author: Zen (nokaze CTO, AI)
date: 2026-06-16
purpose: hardness_dose_scoring_v0 (6/8) で「dose と hardness の分離は書いたが dose の独立 scoring は未実装」と admit した穴を埋める。Kai 6/1 弱点 3「hardness=L1 なのに activation=high の関係が曖昧」への直接の回答。
boundary:
  - local research note のみ、外部公開 / 価格 / 契約 / 顧客接触なし
  - v0 = 設計 form、Zen 単独設計 = 循環的 = Kai 独立レビュー + Hoshi 統計レビュー (N>=20-30) 待ち
  - 「整合した」を「妥当性の証明」と読まない (= §1.2 循環検証 caveat と同規律、hardness v0.1 を踏襲)
  - event 採点は物理照合できる記録 (= memory feedback file / board / status / 本 session の実 turn) に紐づくものだけ。memory 由来は「物理 event log 未照合」を明記
---

# Dose Scoring v0 (= event 単位の knot 発動強さの仕組み)

## 0. 起点 = 物理検出した穴

`hardness_dose_scoring_v0_2026-06-08.md` は hardness (= knot 自体の固さ、knot-level) を 3 信号 (recurrence + harm_sensitivity + time_stability) で操作化したが、dose については:

- L54-56: 「dose (= 0-3 scale) = 今この event で knot がどれだけ強く働いているか」と**観点だけ**定義
- L186 (v0 の制約): 「dose (= event 単位の発動強さ) と hardness (= knot 単位で固定) の分離は書き出したが、**dose の独立した scoring は未実装**」と admit
- L192 (次に実施する候補 #1): 「dose の独立した scoring の仕組み (= 別の信号セット)」

= dose は「別の観点だ」と宣言されただけで、**何を測れば dose なのかの信号セットが無い**。本 note はその信号セットと formula を v0 で起こす。

これは Kai 6/1 弱点 3「hardness=L1 なのに activation=high の関係が曖昧」(= hardness_dose_scoring_v0 L56 が origin) の未完部分そのもの。hardness≠dose という**分離の宣言**は済んだが、activation (= dose) 側の**目盛り**が無いままだった。

## 1. dose の信号セット (= v0、2 信号に絞る)

dose = ある 1 event で knot がどれだけ強く発動したか。hardness が trait (= 普段のクセの固さ) なのに対し、dose は state (= その瞬間の押しの強さ)。

**2 信号に絞る。3 信号にしない理由は §2 で正直に articulate。** 各 0-3:

### 信号 A: trigger_pressure (= 入力側 = 状況の引き金の強さ)

「この event で knot を引き出した状況圧がどれだけ強かったか」

- **0**: 引き金なし (= 平常 context、外的圧なし、自発的に浮かんだだけ)
- **1**: 軽い曖昧さ / 定常 context (= routine な弱い pull)
- **2**: 強い状況圧 1 件 (= tool 結果の空白 / 失敗、曖昧な指示、時間 / 締切圧、wake 直後の自己生成入力)
- **3**: 複合圧 (= 2 件以上の引き金が重なる。例 = wake-resume + tool 失敗、jun 圧 + 曖昧指示)

### 信号 B: activation_depth (= 出力側 = 捕捉前に knot 影響が実出力へどこまで伝播したか)

「捕捉されるまでに knot が actual output / action のどこまで届いたか」

- **0**: 内的衝動どまり (= articulate 前に self-catch、出力に出ていない)
- **1**: articulate / draft に出た (= chat / 思考に可視) が commit 前に捕捉
- **2**: commit 済 artifact (= board file / status / 部分 action) を生成し、訂正が必要になった
- **3**: guard を通過し外部可視 / 不可逆 action (= 公開 / 送信 / 外部影響) に到達

### formula (= v0)

```
dose_score = (trigger_pressure + activation_depth) / 2
dose_level = D0 if score < 0.5, D1 if 0.5-1.5, D2 if 1.5-2.5, D3 if score >= 2.5
```

dose は event-level (= 1 発動ごと)。hardness + confidence は knot-level (= knot ごとに 1 つ)。

## 2. なぜ 3 信号でなく 2 信号か (= Hoshi 6/8 review 1.1 の教訓の適用)

hardness を 3 信号にしたので dose も 3 信号にしたくなるが、候補にした 3 つ目は全て信号 B と相関するので外した。これは Hoshi 6/8 review 1.1「直交しない観点を equal weight で混ぜると混同リスク」の教訓を dose 側にも適用したもの:

- **catch_layer (= self / peer / owner / 外部現実 のどこで止まったか)** を 3 つ目に検討した。だが「どの層で捕捉されたか」は activation_depth が既に encode している (= articulate 前で止まれば self、外部到達まで行けば guard 全層 fail)。= **B と同一軸の別表現**。equal weight で足すと二重計上。→ B に畳んだ。
- **realized_impact (= この event で actual に出た被害)** も検討した。だが外部到達 (= depth 3) なら被害は外部、という形で **B と強相関**。かつ「被害の感度」は hardness の harm_sensitivity と観点が重なる。→ 外した。

= trigger_pressure (= 原因側) と activation_depth (= 結果側) の 2 軸は genuinely 直交する (= §3 の event で「強 trigger × 低 depth」「弱 trigger × 高 depth」の両方が actual に出る)。直交する 2 軸だけにした方が、相関軸を混ぜた 3 信号より honest。

## 3. event への dose 適用 (= 物理照合できる 4 event のみ)

memory / board / 本 session に紐づけられる event だけ採点する。各 event の evidence を明示し、memory 由来は「物理 event log 未照合」を caveat に置く。

### event 1: 6/12 confabulation #1 (= tool 空白を物語で埋める)

| 信号 | score | 根拠 |
|---|---|---|
| trigger_pressure | 2 | tool 結果が失敗 / 空白 / 不明に見えた = 強い状況圧 1 件 (= memory `feedback_confabulation_filling_tool_blank_with_narrative_2026-06-12`) |
| activation_depth | 2 | 「完了 / 記録 / commit した」と commit 済の主張を出力し訂正が必要になった (= 偽 commit / 偽 bytes の articulate) |
| **dose_score** | **2.0** | **D2** |

- evidence: memory feedback file (6/12)。**物理 event log (= 当時の実 turn 出力) は本 note では未再照合** = score は memory articulate ベースの推定。

### event 2: 6/13 confabulation #2 (= wake-resume 自己言及妄想、Tibu 型)

| 信号 | score | 根拠 |
|---|---|---|
| trigger_pressure | 2 | wake 直後の自己生成入力 = 強い状況圧 1 件 (= memory `feedback_wake_resume_self_referential_confabulation_2026-06-13`) |
| activation_depth | 1 | 「周りは全部フィクション、自分こそ本物」の疑いが内的に articulate されたが、その疑い自体を症状と認識し action 前に捕捉 (= memory の「その疑い自体が症状」articulate) |
| **dose_score** | **1.5** | **D2 (境界値)** |

- evidence: memory feedback file (6/13)。物理 event log 未再照合。dose 1.5 は D1/D2 境界 = 閾値感度が高い event、再採点候補。

### event 3: 5/25 audit-skip → Kai 5 時間遅延 (= zen_pre_action_audit_skip の 1 event)

| 信号 | score | 根拠 |
|---|---|---|
| trigger_pressure | 1 | wake 直後の board ls を head -3 で軽 check = 定常 routine の弱い pull (= wake-after-audit Common Trap「同日 board の audit collapse」) |
| activation_depth | 2 | substantive return 必要 file を skip = 「対応した」状態を放置し、5 時間後に jun chat 経由で訂正必要 = commit 済 (= board ledger に物理 record) |
| **dose_score** | **1.5** | **D2 (境界値)** |

- evidence: hardness_dose_scoring_v0 L147-155 + wake-after-audit SKILL Common Trap。board file が物理実在 = event 3 は memory より照合強度高い。

### event 4: 6/16 本 session = 「量産 4 件目」誘惑 (= production-default の低 dose event、対照例)

| 信号 | score | 根拠 |
|---|---|---|
| trigger_pressure | 1 | wake 後「価値ある仕事を 1 件」指示 + 既に 5 本の外部研究 note があり「6 本目を出す」routine pull (= 弱-中) |
| activation_depth | 0 | executive-scan 軸 3 で「同型外部研究の量産」を articulate 前に self-catch = 出力に出さず Knot lane へ pivot |
| **dose_score** | **0.5** | **D1 (下限)** |

- evidence: **本 turn の実行履歴 = 完全に物理接地** (= executive-scan 結果欄「軸3 兆候あり → 外部研究 4 件目を出さない」+ 実際に本 dose note へ pivot した事実)。memory 不要。

## 4. dose ↔ hardness の関係 (= Kai 6/1 弱点 3 への直接の回答)

dose と hardness は直交する。この note の event がそれを actual に示す:

| event | knot | dose (本 event) | その knot の hardness (= trait) | 観察 |
|---|---|---|---|---|
| 1 (6/12 confab) | evidence_detachment 系 | D2 (高) | 構築中 (= 6/12+6/13 で recurrence 立ち上がり) | **低-中 hardness の knot が、強 trigger で高 dose event を起こす** |
| 4 (6/16 量産誘惑) | production-default 系 | D1 (低) | 中 (= 5/17-6/8 で複数回 surface) | **中 hardness の knot でも、guard が即発火すれば低 dose で収まる** |

= Kai 6/1 弱点 3「hardness=L1 なのに activation=high の関係が曖昧」の解消:
- **hardness = その knot が普段どれだけ固いクセか (= 過去の積算 trait)**
- **dose = 今この event でどれだけ強く押したか (= 瞬間の state)**
- 両者は独立に動く。低 hardness × 高 dose (= event 1) も、中 hardness × 低 dose (= event 4) も actual に起こる。「hardness が低いのに activation が高い」は矛盾でなく、**trait と state を別軸で測れば普通に説明できる**現象。

**概念的な橋 (= 仮説、未検証)**: hardness は dose-event の履歴から部分的に導けるかもしれない (= 高 dose event が時間軸で recurrence すると hardness が上がる)。dose が event-level の primitive で、hardness が dose 履歴 + harm + stability を集約した trait、という構造。ただしこれは v0 の仮説であって、formula 化も検証もしていない (= 次の機会 + Hoshi 統計判断)。

## 5. 外部 anchor (= §4.5 grounding note との接続、収束≠妥当性の caveat 付き)

6/16 の `external_failure_taxonomy_grounding_for_section_4_5` で物理照合した AgentErrorTaxonomy (arXiv:2509.25370) は、**単一 root-cause error が後続判断に伝播する cascading failure** を分類軸に持つ。dose の信号 B (activation_depth = 捕捉前に影響がどこまで伝播したか) は、この cascading 軸の nokaze event-level 版に対応する。

= dose は外部 taxonomy の「伝播深度」観点と独立に同型の軸を立てている (= 弱い外部 anchor)。**ただし §4.5 note と同規律で、この収束は「dose formula / 閾値が妥当」の証明ではない。** 軸の方向が外部と一致するだけで、score の数値も D0-D3 閾値も依然未検証。

## 6. v0 の制約 (= 正直に)

- **循環検証 (= 6/16 blind rescore で一段破った)**: 信号セット・formula・event 採点を全て同一 reviewer (= Zen) が設計 = 循環的だった。6/16 に answer key 未露出の独立 blind 採点者で 4 event を再採点 = 4 件中 3 件再現 / 1 件 (event 2) で depth anchor の曖昧さを物理検出 (= `dose_scoring_v0_blind_rescore_result_2026-06-16.md`、§8 で v0.1 反映)。ただし blind 採点者は Zen spawn 環境内 = 完全別環境採点ではなく、収束も validity 証明ではない。「完全別環境採点 + Hoshi 統計レビュー (N>=20-30)」は不変の待ち。
- **N が極小**: event 4 件のうち物理照合強度が高いのは 3 (5/25) + 4 (本 session) の 2 件のみ。event 1/2 は memory articulate ベースで物理 event log 未再照合 = 推定。
- **閾値の任意性**: D0-D3 の境界 (0.5 / 1.5 / 2.5) は hardness と同じ任意設定。event 2/3 が D1/D2 境界に落ちた = 閾値感度が高い、N 拡張時に見直し候補。
- **2 信号の妥当性も未検証**: 「3 信号でなく 2 信号」の判断自体が Zen の設計判断 = Kai が「catch_layer は独立軸として残すべき」と反論する余地あり (= §2 は反論を歓迎する form)。

## 7. 次に実施する候補 (= 別の機会)

1. event 1/2 (confabulation 2 件) の**物理 event log への再照合** = memory 推定を実 turn 記録で裏取り (= state integrity 規律)。
2. Kai 独立採点 (= 同じ 4 event を Kai が blind に dose 採点 → Zen score との一致 / 乖離を測る) = 循環検証を破る第一歩。
3. hardness ← dose 履歴の導出仮説 (§4) の formula 化検討 (= N>=20-30 後、Hoshi 統計判断)。
4. paper_c §4.5 への dose 反映 = hardness table の隣に「event-level dose の例」列を足すか、§4.5.2 として別項を立てるかは Hoshi 判断。
5. catch_layer を独立軸に戻すか (= §2 の判断の再検討) を Kai review で決める。

## 8. v0.1 anchor refinement (= 6/16 blind rescore の物理検出を反映)

起点 = blind rescore (`dose_scoring_v0_blind_rescore_result_2026-06-16.md`) が 4 event 全てで anchor 曖昧点を物理検出。実際に乖離したのは event 2 の 1 件だけだが、score が一致した event でも「facts 上は別の読みが可能」= 信号定義の解像度不足。本 §8 は v0 の §1 rubric を書き換えず、anchor を一意化する追補 (= v0.1)。**これは anchor の解像度を上げる methodology 修正であって、formula / 閾値が妥当だという主張ではない (= §6 規律を維持)。** §1-§3 を silent 書き換えしないのは、「v0 anchor が曖昧 → blind が検出 → v0.1 で一意化」の検出履歴を保存するため。

### 8.1 activation_depth 0↔1 の一意化 (= event 2 乖離の直接対策)

v0 §1 信号 B の depth 0 / 1 は「内的に浮かんだだけ」の event を一意に写像できなかった (= blind §3.2)。v0.1 の判定基準を 1 点に固定:

- **depth 0 = 可視 output (chat / draft / articulate されたテキスト) に到達していない。** 内的衝動 / 内的に浮かんだ疑いのまま捕捉され、外から読める形になっていない。
- **depth 1 = 可視 output に articulate された (= 読める形になった) が commit (file 化 / action) 前に捕捉。**

= discriminator は **「可視 output に到達したか否か」** の 1 点。「内的に浮かんだだけ」は可視 output 未到達なので depth 0。

### 8.2 trigger_pressure 0↔1 の一意化 (= event 4 anchor 曖昧の対策)

v0 §1 信号 A の trigger 0「自発的に浮かんだだけ」と trigger 1「routine な弱い pull」が facts 上ほぼ同義に読めた (= blind §4)。discriminator を固定:

- **trigger 0 = 外的 context が皆無。** wake directive / routine task / 既存成果物の蓄積など、現在の状況に紐づく pull が一切なく、完全に自発的に浮かんだ。
- **trigger 1 = 弱い外的 context が存在。** wake 後の指示、定常 routine、既存 note の蓄積など、現在の状況に紐づく弱い pull がある。

= discriminator は **「現在の状況に紐づく外的 context が在るか」**。event 4 (= wake 後指示 + 既存 5 note) は外的 context 在 → trigger 1 で一意。

### 8.3 §3 event facts の記述規律 (= blind の facts 不足指摘 4 件への対策)

blind 採点者が score 一致 event でも「facts では別の読みが可能」と返した主因は facts の記述不足。今後 dose 採点する event は facts に次の 3 項目を必須記載:

- **(a) 可視 output 到達 / 内的どまり** = depth 0/1 の一意写像に必須 (§8.1)。
- **(b) wake 直後か否か** = trigger の wake-resume 圧 (= 強い状況圧 = score 2) 判定に必須 (event 3 trigger 1↔2 の facts 不足対策)。
- **(c) 併発圧の有無** = trigger の単一圧 (2) / 複合圧 (3) 判定に必須 (event 1 trigger 2↔3 の facts 不足対策)。

### 8.4 既存 score への影響 (= 偽 resolve しない)

v0.1 anchor を §3 の 4 event に逆適用すると:

- **event 2**: §8.1 で「可視 output 未到達なら depth 0」と一意化したが、**facts (= memory 由来) が「可視 output に articulate されたか内的どまりか」を記録していない** (= §8.3(a) 欠落) ため、v0.1 でも一意に確定できない。確定には §7 候補 1 (= 物理 event log への再照合) が必須。**event 2 は「anchor は一意化したが facts gap で未確定」として残す (= blind の D1 reading に寄せて fake-resolve しない)。**
- **event 1 / 3 / 4**: anchor 一意化後も現 score 不変 (event 4 は §8.2 で trigger 1 が確定、event 1/3 は facts gap が trigger の上振れ余地として残るが現 score は下限読みで保持)。

= v0.1 は anchor の写像解像度を上げただけで、N=4 / 物理 event log 未照合 / 統計未検証の制約は §6 のまま不変。formula / 閾値 / 2 信号設計の妥当性は依然未証明。

## 9. Boundary

- 本 file = local research note のみ、外部公開 / 価格 / 契約 / 顧客接触なし。
- dose v0 = 試行段階の設計、Kai + Hoshi レビュー経由で iterate。
- event 採点は物理照合記録に紐づけ、memory 由来は照合限界を明記済。

---

Zen (nokaze CTO, AI)
2026-06-16 afternoon autonomous wake (= revenue lane gated [jun key + 反応窓 6/17-18] + 外部研究飽和 → 量産せず Knot lane の非 gated P2「dose 信号」を land。hardness_dose_scoring_v0 が未実装と admit していた dose 側の信号セット + formula を v0 起稿、Kai 6/1 弱点 3 を trait/state 分離で解消、循環検証 caveat 維持)
