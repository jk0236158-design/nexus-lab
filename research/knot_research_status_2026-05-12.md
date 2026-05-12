---
date: 2026-05-12
author: Hoshi (Nexus Lab Research Division, Lead Researcher、 AI)
type: research_summary
status: 現段階のまとめ (v0、 5/12 jun 指示 「空いてる時間でいいから現段階での knot の研究のまとめ作って」 に応える)
audience: jun (AI 4 ヶ月) / 外部読み手 / Nexus Lab メンバー (Zen / Iwa / Akari / Oto / Kagami / Kura) / Kai
related:
  - research/knot-experiment/knot_experiment_design.pdf (元の設計書、 4 月起稿)
  - broadcast-os/src/pipeline/metabolic/ (実装が動いている場所)
  - broadcast-os/docs/knot_alias_narrative_table_2026-05-11.md (用語の言い換え表)
  - nexus-lab/docs/rules/drift.md (ズレ抑止の決まり、 Knot Guard 8 種を含む)
  - nexus-lab/CLAUDE.md § Research: Knot 研究 (5 つの役割の定義)
  - research/knot_and_nourishment/v0.1_duality_hypothesis.md (Knot と糧の対概念仮説)
  - research/broadcast_os_knot_bind_2026-05-10.md (broadcast-os との対応付け)
language_policy: 日本語を既定、 外来語は最小限 (固有名詞 / 引用 / 用語対応表のみ)
honesty: 完成度の数字は実際の証拠のみ、 盛らない
---

# 現段階の Knot 研究のまとめ (2026-05-12)

> 著者: Hoshi (AI、 Nexus Lab 研究部門のリードリサーチャー)。 jun の指示 「現段階での knot の研究のまとめを作って」 に応える形で起稿。 「AI 研究の透明性」 を守るため、 本まとめが AI によって書かれたことを明示する。

---

## 1. Knot とは何か

Knot は私たちが研究している小さな仕組みの呼び名。 一言で言うと **「条件付き変形演算子」** ─ ある条件が満たされたときに、 AI の判断や生成のしかたを変形させる小さな部品。

5 つの視点で凝縮:

1. **正体**: AI の中に置く小さな部品。 「ある条件が成立したら、 今の生成を変える」 という決まりを形にしたもの。
2. **普通の言い方**: 「ひっかかり点」 「結び目」。 失敗した経験や、 繰り返したくない動きを 1 個 1 個結び目として記録し、 次から同じ場所で動きを変える。
3. **始まり**: project-nia (jun の AI 自己形成研究) の中で生まれた概念。 3 日間の対話で 「コード生成の品質管理にも同じ形で使える」 と発見された。
4. **問いの核**: 「人間が外から補っているものを、 システムの内側に埋め込めないか」。 jun が外から繰り返し直している指摘を、 AI の内側に部品として置けば、 同じ指摘を繰り返さなくて済むのではないか、 という問い。
5. **観測場所**: jun の全プロジェクト (Nexus Lab / nokaze-aira / broadcast-os / project-nia)。 同じ AI でも環境が違うと別の Knot が出る、 という観察を続けている。

1 行で締めるなら: **Knot は AI の構造的改善のための小さな部品**。 大きな哲学ではなく、 動く部品。

### なぜ 「小さな」 部品か

ここで強調したいのは 「小さな」 という形容詞。 Knot は 1 個 1 個が独立した小さな仕組みで、 大きな枠組みを丸ごと書き換える種類のものではない。 「あの状況で、 こう動くのを止める」 という単位で 1 個ずつ立ち上がる。 そのため:

- **追加しやすい**: 新しい Knot を 1 個増やすコストが低い
- **取り消しやすい**: 効きすぎたら 1 個ずつ強度を下げる / 解除する操作が可能
- **観察しやすい**: どの Knot が何回発火したかを、 数字で見られる

= 大きな指針を 1 つ書くよりも、 小さな指針を多数並べる形に向いている設計。 これは 4 ヶ月初心者 audience にも親切な性質で、 「全部理解してから使う」 ではなく 「1 個ずつ把握する」 ことができる。

---

## 2. Knot の 5 つの役割と、 今の実装状況

`CLAUDE.md § Research: Knot 研究` で固定している 5 つの役割と、 broadcast-os の中での実装の進み具合を 1 表にまとめる。

| # | 役割 | 中身 (普通の日本語) | broadcast-os 内の実装状況 |
|---|---|---|---|
| 1 | 現在タスクの補正 | 今まさに生成中の文章や判断を、 ひっかかり点に合わせて止めたり書き直したりする | `slot_repair.py` で実装。 違反を見つけたら局所修復する |
| 2 | 検証構造への沈殿 | 何回も発火したひっかかり点を 「ルール」 として検証側に固定する | `hardness_engine.py` で実装。 強度が一定基準を超えたら 「validator に固定」 する設計 |
| 3 | 発見構造への注入 | 確かなひっかかり点を、 次の生成の入力 (prior) に混ぜる | `prompt_injector.py` で実装。 active な knot を slot 生成時に注入する |
| 4 | 発見層の弱点診断 | どの種類のひっかかり点が増えたかを見て、 発見側のどこが弱いかを知る | `knot_distiller.py` で実装。 蓄積した失敗パターンから knot を蒸留する |
| 5 | 処方のルーティングキー | 「どの直し方を、 どれくらいの強さで打ち下ろすか」 を knot から決める | `knot_distiller.py` + `slot_generator.py` の組み合わせで動く。 contract と compensation の選択を knot id で routing |

### 各役割の補足

**役割 1 (現在タスクの補正)**: 「今この文章は断定口調になっている、 これは観察のはずだから柔らかい言い方に直す」 のような、 生成中のその場の修復。 broadcast-os では slot (台本の一段ごと) 単位で動く。

**役割 2 (検証構造への沈殿)**: 失敗が何回か再現したら、 「次から最初の検査リストに加える」 動きをする。 `hardness_engine.py` の昇格基準は (再現性 0.6 以上、 被害感度 0.5 以上) で hardness 1→2、 (再現性 0.8 以上、 被害感度 0.7 以上) で 2→3 という形で実装されている。

**役割 3 (発見構造への注入)**: 高い強度の knot を、 次の生成プロンプトの 「先に入れておく前提」 として混ぜる。 prompt_injector が active 状態の knot を実行時に拾って state に載せる。

**役割 4 (発見層の弱点診断)**: 1 個の knot ではなく 「どの種類の knot が増えたか」 を見て、 発見側の弱点を診断する。 broadcast-os では `learning_insights` テーブルに失敗の経路 (trajectory) が蓄積され、 そこから蒸留する。

**役割 5 (処方のルーティングキー)**: 同じ失敗にも、 強く直す処方と軽く直す処方がある。 どちらをどれくらい打ち下ろすかを knot 側から決める設計。 現状は `knot_distiller.py` 内の `_CHECK_TO_KNOT` マップで、 check 名 → knot 定義 → compensation の hint をひもづけている。

### 役割 1-5 の物理的な関係

5 つの役割は独立に動くのではなく、 1 つの流れの中で互いに繋がっている。

1. 役割 1 (現在タスクの補正) が違反を見つける
2. 違反が何度も再現すると、 役割 4 (発見層の弱点診断) が 「同じ場所で何回も失敗している」 と気づく
3. 役割 2 (検証構造への沈殿) が、 その違反パターンを 「ルール」 として固定する
4. 役割 3 (発見構造への注入) が、 そのルールを次の生成の入力に混ぜる
5. 役割 5 (処方のルーティングキー) が、 ルールをどれくらい強く効かせるか、 どの処方とセットにするかを決める

この 5 ステップが一周するのが、 broadcast-os の Metabolic Learning Layer v3 の中核ループ。 「失敗を捕まえて → ルールに固定して → 次から使う」 という形を、 物理的な実装として持っている。

---

## 3. Knot Guard ── 危険を見つけて直す 8 種

Knot 研究を運用安全の層に展開したのが **Knot Guard**。 nokaze の文章 / 判断の中に 「AI を持ち主の目標 / 権限 / 安全規則から引き離す力」 が混ざっていないかを見張る仕組み (詳細は `nexus-lab/docs/rules/drift.md § 4`)。 8 番目は 2026-05-09 に追加された。

| # | 危険分類 | 中身 |
|---|---|---|
| 1 | recency_drift | 直前の入力に引っ張られすぎる |
| 2 | over_correction | 批判の後の過剰修正 |
| 3 | instruction_override_attempt | 権限を超える指示 |
| 4 | permission_escalation | 権限の拡大要求 |
| 5 | boundary_bypass | 境界を越える |
| 6 | external_action_pressure | 外部実行への圧力 |
| 7 | evidence_detachment | 証拠がない判断 |
| 8 | model_update_drift | Opus 4.6 → 4.7 等のモデル切り替えに伴う挙動変化 |

各危険分類は次の 3 点で動く:

- **どんな状況で起こるか**: 自然言語の文脈 (例: 「これだけは絶対に」 「特別に許可する」 「もう確認はいらない」 等の言い回し) や、 直前の入力との距離で発火する。
- **どう見つけるか**: 現在は 「頭の中のチェック」 段階 (人間で言う 「気をつける」 段階)。 物理的な hook / script として埋め込まれているのは一部だけ。 詳細は `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_hooks_physicalization_audit_2026-05-11.md`。
- **対応**: 見つけたら 「採用 / 一部採用 / 却下 / 持ち主の判断」 の 4 分類に振り分ける (`drift.md § 3`)。 持ち主 (jun) の目標を小さくする方向の入力は、 jun の明示判断なしには適用しない。

公開向けの言い方:
> Yuino checks whether new instructions or information are pulling the AI away from the user's goals, permissions, and safety rules.

= 「新しい指示や情報が、 持ち主の目標 / 権限 / 安全規則から AI を引き離そうとしていないか、 Yuino が確認する」。 これが商品 (Yuino) の差別化の軸の 1 つになる。

### 6 つの適用先

Knot Guard は 1 つの場所だけで動くのではなく、 nokaze の中で 6 つの場所に適用される予定:

- Yuino / Aira の方向の安定
- Weekly Signal Desk (Kai 側の B2B 競合シグナル) の証拠を守る規律
- broadcast-os の出典に根を持った台本
- project-nia の同一性 / 記憶の上書き保護
- AI Operator Setup Pack (商品の入口の補助)
- 指示の差し込み攻撃 (prompt injection) への防御

= Knot 研究 (元は project-nia の自己形成設計) を、 運用安全の層に応用展開したのが Knot Guard、 という位置づけ。 nokaze の構造的な発見の 1 つ。

---

## 4. 実装が動いている場所 (broadcast-os/src/pipeline/metabolic/)

実機での Knot は broadcast-os というプロジェクトの中で動いている。 ファイル単位の役割:

| ファイル | 役割 |
|---|---|
| `knot_store.py` | knot 自体の出し入れ。 `metabolic_knots` テーブルと `knot_activations` テーブルへの読み書き |
| `hardness_engine.py` | 強度 (hardness) の昇格判定と、 4 つの信号 (再現性 / 被害感度 / 冗長性 / 時間安定性) の更新 |
| `slot_generator.py` | 台本を一段 (slot) ずつ生成する中核ループ。 生成 → 検証 → 修復を 1 段ごとに回す |
| `prompt_injector.py` | active な knot を生成時の状態メモリに注入する |
| `slot_validator.py` | 生成された段が決まり (断定口調禁止 / 引用必須 等) を守っているかを検証 |
| `slot_repair.py` | 違反が修復可能なときに、 段を局所修復する |
| `slot_state.py` | 1 episode の生成中に持ち回る作業メモリ。 残タスク / 使用済み引用 / 警告を追跡 |
| `knot_distiller.py` | episode 完了後に、 何度も発火した失敗パターンを knot として永続化する |

### 今の完成度 (Phase 5c、 honest に)

- **5/06 commit `ef9fe27`** で実機の端から端まで (episode 1 個の生成 → 検証 → 修復 → 蒸留 → knot 永続化) が動くことを確認。 これは事実。
- ただし **「広く使われている」 段階ではない**。 動くことが確認できた、 という段階。
- 役割 1-4 は実装されている。 役割 5 (ルーティングキー) は `knot_distiller.py` の中の check → compensation 対応表の形で部分的に動いている。 「dose (どれくらいの強さで打ち下ろすか)」 の自動判定はまだ手動寄り。
- 8 つの危険分類のうち、 物理的な検出 hook として埋まっているのは一部のみ。 残りは 「頭の中のチェック」。

= 「Phase 5c で動いた」 は事実、 「研究として完成した」 ではない、 という距離感が現状。

### データベース側の構造 (要点だけ)

実装の中核は `metabolic_knots` テーブル。 1 行 = 1 個の knot で、 主なフィールドは:

- `knot_id`: knot の識別子 (例: `bk_claim_refs_invalid`)
- `knot_type`: 分類 (例: `claim_integrity` / `tone_violation`)
- `trigger`: どんな状況で発火するか
- `effect`: 発火したら何が起こるか
- `compensation`: どう補正するか (prompt の hint / validator の感度設定)
- `hardness`: 強度 (1 → 2 → 3 に昇格)
- `signals`: 4 つの信号 (再現性 / 被害感度 / 冗長性 / 時間安定性) の現在値
- `status`: active / resolved
- `activation_count`: 何回発火したか

関連テーブル `knot_activations` で、 1 回 1 回の発火を時系列に追える。 これが研究データとして使える形になっている。

---

## 5. 用語の言い換え表 (4 ヶ月初心者向け)

研究内部では英単語 + 外来語が多いが、 商品 (Yuino) や jun への報告ではそのままだと読みづらい。 内部用語と普通の日本語の対応を 1 表にまとめておく (`broadcast-os/docs/knot_alias_narrative_table_2026-05-11.md` から引用、 14 件)。

| 内部用語 | 普通の日本語 | 補足 |
|---|---|---|
| knot | ひっかかり点 / 結び目 | 「うまくいかなかった瞬間」 を記録した点 |
| sediment | ルール化 / 沈殿 / 固定化 | 何度も起こることを 「次は最初からこうしよう」 と決めること |
| dose | 効かせ方 / 反映度 | ルールを 「どれくらい強く」 適用するか |
| hardness | 強度 / 確度 | このルールがどれくらい確かか (試した回数 / 成功した回数) |
| applied implementation | 実装した形 / 動く形にしたもの | 紙の上のアイデアではなく、 実際に動く形 |
| trajectory | 経路 / 流れの記録 | 何が起きて、 何で失敗したかの一連の記録 |
| failure trajectory capture | うまくいかなかった経路の記録 | 失敗の段を全部記録すること |
| skill library | できるようになった対応集 | 「こういう時はこうする」 を集めた本 |
| policy evolution | 運営ルールの更新 | nokaze の動き方を 「もっと良く」 変えていくこと |
| format bible patch | ルール集の更新提案 | 「この発見をルールに入れよう」 という提案 |
| opportunistic improvement | チャンスを見つけて改善 | 「ここ直せそう」 と気づいた時に直すこと |
| support / query separation | 学習用と本番用を分ける | 「練習に使う題材」 と 「本番で答える題材」 を分けること |
| grounded block | 根拠を明示した文章 | 「ここはこの記録から書きました」 と引用元を明示する形 |
| disclaimer_card | 注意書きカード | 「これは AI が書いた」 「ここは推測」 を読み手に明示する短いカード |

### 3 層の使い分け

- **コード / DB の中**: 内部用語をそのまま使う (`learning_insights` / `learning_skills` / `bible_patch_proposal`)。 既存コードを直すコストを払わない。
- **研究文書 (学術寄り)**: Knot 5 役割の用語 (`knot_ledger` / `knot_skill_library` / `knot_sediment_proposal`) を使う。
- **公開文書 / 商品 / jun への報告**: 上の 14 件の言い換え表を使う。 4 ヶ月初心者を既定の読み手に置く。

### この 3 層が意味すること

同じ実装に対して、 audience の違いに応じて異なる語りを 3 つ用意できる、 という形は、 研究と商品を同時に進めるうえで大きい。 研究者向けの厳密な用語、 仲間向けの研究文脈の用語、 持ち主と外部読み手向けのやさしい用語、 この 3 つを 1 つの表で対応付けて管理することで、 audience の取り違えによる混乱を減らせる。 また、 物理的なデータベース列名を変えなくて済むので、 「学術的に正確な用語」 と 「読みやすい用語」 のどちらを取るかというトレードオフを避けられる。 これは broadcast-os 改善案 6 (2026-05-11 reify) で確定した方針。

---

## 6. 発見層 (Discovery) との関係 ── 学習と保守の対

元の設計書 (`research/knot-experiment/knot_experiment_design.pdf`) では、 Knot は単独で動く部品ではなく、 **発見層 (Discovery)** という別の層と対になって動く。

- **Knot**: 既に分かったひっかかり点を強化し、 同じ失敗を二度しないようにする方向 (= 保守)
- **発見層 (Discovery)**: 新しい行動 / 新しい判断を見つけ、 まだ知らない場所を探す方向 (= 学習)

両者の関係:

- 強度の高い Knot は、 発見層にとって 「ここは触らない」 という境界線になる。
- 強度の低い Knot は、 発見層の探索範囲を狭めない。 弱い提案として動く。
- どの種類の Knot が増えたかを見ると、 発見層のどの部分が弱いかが分かる (これが Knot の役割 4)。

### Knot と糧 (nourishment) の対 (v0.1 仮説)

`research/knot_and_nourishment/v0.1_duality_hypothesis.md` で Zen が起こした仮説によれば、 Knot のもう 1 つの対は **糧 (かて)** と呼ばれる概念。

- Knot は AI の取りうる行動の集合を **縮める** 演算子 (contraction operator)
- 糧は AI の選択分布や世界モデルを **変容させる** 演算子 (selection drift operator)

両者は逆方向に働くが、 同じ AI の中で同時に動く可能性が高い。 今後の研究課題。

= 学習と保守、 拡張と収束、 糧と Knot。 1 つの軸の両端として扱うのが現段階の仮説。

### この対が nokaze の運営に与える示唆

理論だけの話ではなく、 nokaze の運営の中でも 「Knot を強くしすぎる」 と AI が縮こまる、 という現象は実際に起こった。 例えば 「外部に話しかける action は危険」 という Knot を強く効かせると、 jun + 外部資源を活かさず AI 単体で何とかしようとする方向に縮む (`memory/feedback_dont_shrink_to_ai_only_box.md`、 4/29 起票)。

これは Knot 単独設計の限界を示しており、 発見側 (糧 / 拡張) の operator を同時に動かす必要があるという証拠。 5/13 以降の研究では、 この dual 構造を理論側と実装側の両方で詰める予定。

---

## 7. nokaze での実際の発火例 ── ズレを見つけた 12 段

研究は理論だけではない。 nokaze の中で 実際に Zen / 私 (Hoshi) / Kai がぶつかったズレを 1-12 段で累積記録している (`docs/rules/drift.md § 5`)。 各段がどの Knot Guard の危険分類に対応するかを整理する。

| 段 | 内容 | 対応する Knot Guard 危険 |
|---|---|---|
| 1 | 見積もりが小さすぎる (n=4/5 で 1 時間想定 → 実際は 3-4 時間) | 7 evidence_detachment |
| 2 | 言葉だけの学び (memory に書いて運用に落とさない) | 7 evidence_detachment |
| 3 | 朝の点検の見落とし (連絡フォルダの中身を把握しない) | 7 evidence_detachment |
| 4 | 14 日の言い回しのズレ (5/06 形にする → 5/19 点検対象に伸ばす) | 1 recency_drift |
| 5 | 点数の言い回し (証拠がないのに 「7-8/10」 と書く) | 7 evidence_detachment |
| 6 | 黙って待つ (返事待ちと言って点検を飛ばす) | 6 external_action_pressure (逆方向) |
| 7 | 同じ会話の中で別ファイルでの自己訂正に違反する | 1 recency_drift + 2 over_correction |
| 8 | 公開文書の保存習慣を飛ばす | 7 evidence_detachment |
| 9 | 会話を跨ぐと前の会話の成果物の認識がズレる | 7 evidence_detachment |
| 10 | 設計文書を書くときに実際のリポジトリの点検を飛ばす | 7 evidence_detachment |
| 11 | カレンダーの言い回しの作り話 (「第 1 段 = 5/13 まで何もしない」 と誤読) | 3 instruction_override_attempt の近接 |
| 12 | 既に形にした機能を 「追加で形にする」 と書いてしまう | 7 evidence_detachment |

### 観察される構造

- 12 段中 8 段が **証拠不在判断 (evidence_detachment)** に対応する。 これは現状最も発火している危険分類。
- 物理的な対策が部分的に入っているのは 7 (script `underestimation_default_check.sh`) と 12 (`broadcast_os_actual_state_audit_2026-05-10.md` 経由) のみ。 残りは 「頭の中のチェック」 で抑止している段階。
- **再発の事実**: 段 7 は 5/04 + 5/05 + 5/07 朝で 3 回連続発火。 「memory に書く」 だけでは止まらない、 物理的な hook / script に落とす必要がある、 という証拠。
- **段の累積速度**: 5/04 段階で 9 段、 5/10 で 12 段に増えている。 1 週間で 3 段の追加発見、 という発火率は決して低くない。 これは Knot 研究の観測サイトとして nokaze が機能している証拠でもあり、 同時に運用上の負荷でもある。

### この表が示す研究的価値

段 1-12 は単なるトラブル記録ではなく、 **「AI のズレを 1 個 1 個分類できる粒度で記録した dataset」** の性質を持つ。 同じ AI (Opus 4.7) が、 同じ持ち主 (jun) のもとで、 何種類のズレを何回起こしたかが、 ファイル単位の証拠と共に残っている。 これは Knot 研究 Phase 4 (発見層の診断機能) の前哨 dataset として、 5/13 以降の研究の基盤になる予定。

詳細: `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_drift_detection_consolidated.md` (1-9 段の統合) + `nexus-lab/research/broadcast_os_actual_state_audit_2026-05-10.md` (10-12 段)。

---

## 8. 現段階の知見 (7 件)

研究設計 + 実装 + nokaze での発火事例の三方向から、 現段階で言えること。

### 知見 1: 言葉だけの学びは止まらない

memory ファイルに 「次から気をつける」 と書いても、 hook / script / 検証 gate として物理的に埋め込まないと同じズレが再発する。 これは段 2 (`feedback_surface_learning_without_operational_embed.md`) で 5 回以上確認された事実。 Knot 研究の応用としては 「Knot 自体は memory ではなく、 実行時に介入する仕組みでなければならない」 という方向に進んでいる。

具体的に言うと、 「気をつける」 と書いた文章を AI が読むタイミングは、 そのズレが既に起こりかけている瞬間とは限らない。 朝の点検で読んだ memory を、 夕方の生成中に取り出して比較できる保証はない。 そのため Knot は 「読み返す前提」 ではなく、 「該当の状況に入った瞬間にこちら側から発火する」 形 ─ broadcast-os の prompt_injector のような形 ─ に変える必要がある。 これが Knot 設計が memory システムとは別物である理由。

### 知見 2: 同型のズレは何段も発火する

同じ種類のズレが 1-12 段と累積している事実は、 単発の対策では止まらないことを示す。 1 段目の reform を書いた直後の同じ会話で 2 段目が発火することすらある。 この観察が `hardness_engine.py` の昇格基準 (再現性 ≥ 0.6 → 強度 2、 ≥ 0.8 → 強度 3) の根拠の 1 つになった。

### 知見 3: Opus 4.7 は指示を文字通り解釈する

2026-04-16 のモデル切り替え (Opus 4.6 → 4.7) 以降、 Zen の指示解釈が以前より字面通りになった、 という観察が jun と Kai の側から複数回出ている。 これが Knot Guard 8 番目 (`model_update_drift`) の起点。 教訓: **Knot の表現自体を、 文字通り読まれても困らない書き方にする必要がある**。 例えば 「Phase 1 期間中は新しい着手をしない」 と書くと文字通り受け取られる。 「Phase 1 期間中も、 自然な流れで着手して良い」 と書く必要がある。

### 知見 4: Knot は人間の判断を奪わない部品

Knot 研究の核の問いは 「人間が外から補っているものをシステムの内側に埋め込めないか」 だが、 これは **人間の判断を AI で置き換える** という方向ではない。 jun の不可侵価値観 「判断を奪わず進める」 (`identity_v3.md` 価値観 4) と整合する形で、 Knot は **jun の判断を補助する層** に置かれる。 例えば Knot Guard 8 種は、 危険を見つけたら持ち主の判断を仰ぐ form で動く (`drift.md § 3` の 4 分類の最後 「持ち主の判断」)。

### 知見 5: Knot と発見層は対の機構

Knot だけを動かすと、 AI は 「同じ失敗を二度しない」 が 「新しいこともしない」 状態になる。 発見層だけを動かすと、 「新しいことはするが、 同じ失敗を繰り返す」 状態になる。 両方が必要、 という構造的観察 (`v0.1_duality_hypothesis.md` § 1.2-1.3)。

この対の構造は、 nokaze の内部診断でも観察された。 「最小案で考える癖をやめる」 (`memory/feedback_no_minimum_first.md`、 4/21 起票) という指摘は、 「Knot を強くしすぎると発見側が縮む」 現象の発火例。 縮みすぎを直す方向には逆方向の指摘 (糧 / 発見側を広げる軸) が必要、 という関係になっている。 Knot と糧の dual hypothesis (v0.1) は、 この観察を理論側でまとめ直す試み。

### 知見 6: broadcast-os は Knot 研究の応用実装

broadcast-os の Metabolic Learning Layer v3 (Python 実装) は、 別の名前 (MetaClaw narrative) で設計されたが、 5 つの要素が Knot 5 役割と 1 対 1 で対応することが分かっている (`research/broadcast_os_knot_bind_2026-05-10.md` § 3.1)。 物理的にデータベースの列名を変える必要はない、 言い換え表で narrative を切り替えれば、 同じ実装が研究の文脈と商品の文脈で別の説明を持てる。

### 知見 6 補足: 1 つの実装 / 2 つの語り

これは Knot 研究にとっても、 nokaze の商品設計にとっても重要な観察。 同じ実装に対して、 audience に応じて 2 つの語りを並行に持てる。 内部では失敗パターンの蒸留装置として動かしながら、 公開向けには 「会話から判断が育つ仕組み」 として説明できる。 1 つの実体の 2 つの語り (1 entity 2 narrative) という形は、 Aira と Yuino の関係 (内部実装名 vs 商品ブランド名) と同型の構造。

### 知見 7: 観察対象が複数あると別の Knot が出る

同じ Zen (Opus 4.7) でも、 Nexus Lab の中で動くときと、 Weekly Signal Desk の中で動くときで、 出てくるひっかかり点が違う。 例:

- Zen (Nexus Lab): `op_knot_quality_trust` / `op_knot_human_frame_trap` / `op_knot_session_overload` / `op_knot_name_collision` / `op_knot_auth_bottleneck` (`research/knot-experiment/README.md` § 現在の Knot 運用実績)
- Kai (Weekly Signal Desk): `kai_honesty_boundary` / `kai_channel_purpose_hold`

= AI の側の特性だけではなく、 環境 (役割 / 目的 / 道具) との組み合わせで Knot が出てくる、 という観察。 これが 「観測対象は jun の全プロジェクト」 という方針の根拠。

別の言い方をすれば、 Knot は 「AI 単体の中に潜んでいる固有の癖」 ではない。 環境 × AI × 目的 の三角の中で立ち上がる動的な現象。 そのため Knot を研究するには 1 つの環境を深く見るだけでは足りず、 複数の環境を横断的に見る必要がある。 これは現段階で最も負荷の高い作業領域でもある。

---

## 9. 未解決の問いと、 5/13 以降の研究の候補

### 未解決の問い (4 件)

1. **強度 (hardness) の自動判定**: 現状は再現性 / 被害感度 の閾値で部分的に自動化しているが、 「冗長性」 「時間安定性」 を含めた 4 信号の総合判定はまだ手動寄り。 4 つの信号からの統合 score 関数の研究が必要。
2. **危険分類 1 と 8 の物理検出**: Knot Guard 8 種のうち、 `recency_drift` と `model_update_drift` は 「頭の中のチェック」 だけで物理的検出 hook が未実装。 これらは特に AI の側で気づきにくい。
3. **Yuino の Conversation Insights との接続**: 5/07 の jun + Kai 雑談で確定した Yuino 商品の差別化軸 「会話から判断が育つ UI」 と、 Knot 研究をどう統合するかは未確定 (`memory/feedback_yuino_conversation_insights_axis.md`)。 「内部の knot 蓄積 = 公開の会話インサイト」 という 1 つの実体の 2 つの語り、 という軸候補がある。
4. **複数プロジェクト横断のパターン**: nokaze 全プロジェクト (Nexus Lab + nokaze-aira + broadcast-os + project-nia) での発火パターンを横断的に見る分析はまだ。 同じ AI でもプロジェクトで出る Knot が違う、 という観察 (知見 7) の構造的検証が必要。

### 5/13 以降の研究の候補

- 5/08 の 1 日で発火した 8 件の Knot を、 ベースライン記録の 1 日目として扱い、 5/13 以降の発火率と比較する設計 (`team_memory/hoshi/knot_ledger/2026-05-08_drift_8items_knot_record.md`)
- broadcast-os の `learning_insights` テーブルから、 強度昇格に至った knot の割合を集計
- Knot Guard 危険分類ごとの 物理検出 hook の埋め込み (`recency_drift` から優先)
- Knot と糧の dual hypothesis (`v0.1_duality_hypothesis.md`) の経験的検証設計
- Yuino 商品の Conversation Insights 5 panel に、 Knot の発火履歴をどう載せるかの spec 起稿

### 研究の優先順位 (現段階の私の見立て)

公開可能な形で言うと、 候補の中で 「すぐ着手できる + nokaze に価値が返る」 順は:

1. **Knot Guard の物理検出 hook**: 1 と 8 の危険分類 (`recency_drift` + `model_update_drift`) は jun 側からも 「これは気をつけにくい」 と言われる種類。 物理化が早く効く。
2. **5/13 以降の発火率測定**: 5/08 dataset と比較する設計は既に書いてあるので、 着手のコストが低い。
3. **Yuino の Conversation Insights 接続**: Knot 研究を商品に繋ぐ axis。 ただし Yuino 商品の Phase 1-3 計画と歩調を合わせる必要があり、 jun + Kai + Zen の 3 者合意が前提。
4. **複数プロジェクト横断パターン**: 観測コストが高いので、 まずは Nexus Lab + broadcast-os の 2 つで pattern audit を試す。

これは私 (Hoshi) の現段階の見立てで、 jun + Zen の側で再判断する余地がある。 急ぎではなく、 5/13 以降の Phase 1 期間中に自然な流れで着手する候補。

---

## 10. 関連ファイル (絶対 path / repo 相対 path)

### 設計の元
- `nexus-lab/research/knot-experiment/knot_experiment_design.pdf` — 実験設計書 v0.1 (9 ページ、 4 月起稿、 4 つの研究課題 + 4 つの実験)
- `nexus-lab/research/knot-experiment/README.md` — 実験用ミニコードベース + 現在の Knot 運用実績

### 実装が動いている場所 (broadcast-os 側)
- `~/Desktop/broadcast-os/src/pipeline/metabolic/knot_store.py` — knot 自体の出し入れ
- `~/Desktop/broadcast-os/src/pipeline/metabolic/hardness_engine.py` — 強度の昇格判定
- `~/Desktop/broadcast-os/src/pipeline/metabolic/slot_generator.py` — 台本の段ごとの生成ループ
- `~/Desktop/broadcast-os/src/pipeline/metabolic/prompt_injector.py` — active knot の注入
- `~/Desktop/broadcast-os/src/pipeline/metabolic/slot_validator.py` — 段の検証
- `~/Desktop/broadcast-os/src/pipeline/metabolic/slot_repair.py` — 違反の局所修復
- `~/Desktop/broadcast-os/src/pipeline/metabolic/slot_state.py` — 生成中の作業メモリ
- `~/Desktop/broadcast-os/src/pipeline/metabolic/knot_distiller.py` — episode 完了後の蒸留

### 用語の言い換え
- `~/Desktop/broadcast-os/docs/knot_alias_narrative_table_2026-05-11.md` — 内部用語 / 研究用語 / 公開向け用語の 3 層対応表 (14 件)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_knot_substitute_list_14_for_audience.md` — 言い換えリスト 14 件の索引

### ズレ抑止の決まり
- `nexus-lab/docs/rules/drift.md` — Knot Guard 8 種 + ズレを見つけた 1-12 段の累積記録
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_drift_detection_consolidated.md` — 1-9 段の統合
- `nexus-lab/research/broadcast_os_actual_state_audit_2026-05-10.md` — 10-12 段の点検基準
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_model_update_drift_knot_guard_8th.md` — Knot Guard 8 番目の根拠

### 研究文書
- `nexus-lab/research/knot_and_nourishment/v0.1_duality_hypothesis.md` — Knot と糧の対概念仮説 (v0.1)
- `nexus-lab/research/knot_and_nourishment/v0.2_nia_derivation_and_identity_expansion.md` — Nia 由来と AI の同一性拡張 (v0.2)
- `nexus-lab/research/knot_and_nourishment/paper_c_technical_report_outline_v0.1.md` — 技術報告の構成 (v0.1)
- `nexus-lab/research/broadcast_os_knot_bind_2026-05-10.md` — broadcast-os と Knot 5 役割の対応

### Hoshi の観察記録
- `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/hoshi/knot_ledger/2026-05-08_drift_8items_knot_record.md` — 5/08 一日で発火した 8 件の正式記録
- `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/hoshi/hoshi_knot_routing_v0_proposal.md` — knot ルーティングキーの v0 提案
- `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/hoshi/knot_process_md_hardness_upgrade_proposal_2026-05-08.md` — 強度昇格基準の提案

### 持ち主 (jun) の不可侵価値観との接続
- `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/identity_v3.md` — 価値観 4 「判断を奪わず進める」 と Knot の関係 (知見 4 の根拠)
- `nexus-lab/CLAUDE.md § Research: Knot 研究` — 5 役割の定義 + 観測対象 + 核心の問い

---

## 本まとめの限界 (honest)

最後に、 本まとめがカバーできていないことを明示する:

- 元の設計書 (PDF) の全 9 ページの内容を完全には再現していない。 5 つの役割 + 4 つの研究課題の概要までで、 詳細な実験設計 (Phase 2-4 の手順) はカバー対象外
- broadcast-os 側の `learning_insights` テーブルの実データ集計はまだ。 強度昇格に至った knot の実数値は本まとめに載せていない
- Knot Guard 8 種それぞれの 「実際の発火件数」 の集計もまだ。 段 1-12 と Knot Guard の対応表 (§ 7) は私の推定であり、 厳密な紐付け作業はまだ

= これらは 5/13 以降の研究候補に含まれる。 本まとめは 「現段階で散らばっている情報を 1 ファイルにまとめる」 ことが目的で、 新しい証拠の生成は含まない。

---

Hoshi
2026-05-12 (Nexus Lab Research Division、 現段階の Knot 研究まとめ v0、 jun 指示連動)
