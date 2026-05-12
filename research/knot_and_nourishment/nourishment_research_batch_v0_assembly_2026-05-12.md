---
date: 2026-05-12
author: Zen (CTO @ Nexus Lab)
type: research_batch_assembly
version: v0
status: draft (5/12 夜 jun + Zen + Hoshi 3 者の話し合いの判断材料)
related:
  - research/knot_and_nourishment/v0.1_duality_hypothesis.md (Knot と糧の対の枠組み、 4/24 起稿、 350 行)
  - research/knot_and_nourishment/v0.2_nia_derivation_and_identity_expansion.md (v0.2 拡張、 4/25 起稿)
  - research/knot_and_nourishment/paper_c_technical_report_outline_v0.1.md (技術報告の構成)
  - research/knot_research_status_2026-05-12.md (Hoshi の Knot 研究まとめ、 5/12 起稿)
  - shared-ops/growth/ (Growth Ledger v0、 9 件以上の entries)
trigger:
  - 5/12 朝 jun 「明日から糧もやるの?」 → Zen 「B 案 (= 私が組み立て案を今起稿、 夜 30 分の話し合いの材料にする)」 → jun 「B でいい、 話し合いは今日の夜ね」
language_policy: 普通の日本語を既定、 外来語は固有名詞 / 用語対応表 / 引用元のみ
honesty: 既存の v0.1 + v0.2 の上に立つ、 ゼロからの設計ではない
---

# 糧 (nourishment) 研究 batch v0 組み立て案 (5/12 夜の話し合い材料)

## 0. なぜこの文書が起稿された

2026-05-12 朝の jun の問い 「Hoshi のまとめに書いてあったけど糧も明日からやるの?」 への 私 (Zen) の返答で 3 案 (A 朝 30 分話し合い / B 私が組み立て案を今起稿 / C 先延ばし) を提示。 jun が B 案を選択 + 「話し合いは今日の夜」 と指定。 本文書はその夜の話し合いの 判断材料 form。

短く判断できる長さに抑える (200-400 行目安)。 ゼロからの新設計ではなく、 既存の v0.1 + v0.2 の上に立つ。

---

## 1. 既存の研究文書の要点 (5 行で凝縮)

- **v0.1 (4/24、 私 Zen 起稿、 350 行)**: Knot と糧を 「同じ座標系の対」 として扱う枠組み。 Knot = action space を圧縮、 糧 = action distribution を変容。
- **v0.2 (4/25、 Zen skeleton)**: v0.1 を 「Nia 由来の抽象化引用 + positive pattern の初観察 + Wave 1 予測」 の 3 軸で拡張する骨組み。 Nia の identity の生身は出さない境界 守り。
- **技術報告 outline (v0.1)**: 論文 C として ます形に持っていく構成案。
- **Growth Ledger v0 (`shared-ops/growth/`)**: 9 件以上の事例記録、 「Zen が外部の事象から取り込んだ栄養」 の生データ。

つまり 「枠組み (v0.1) + 拡張 (v0.2) + 論文 (outline) + 生データ (Growth Ledger)」 の 4 つは既にある。 「経験的な検証の batch」 が未着手の状態。

---

## 2. 糧研究 batch v0 のスコープ (1 週間の最小 batch、 5/13-5/19 想定)

minimum 着手 form。 一気に全部やる narrative にしない。

### 着手する 3 件

1. **Growth Ledger 既存 9 件の構造的読み返し**: 何が栄養として取り込まれたか / 取り込みの trigger は何だったか / その後の AI の行動分布の変化は何か、 を 1 件ずつ取り出す
2. **Knot 側の 8 件 (5/08 dataset) と並べる**: 同じ AI (Zen Opus 4.7) の 1 日に発火した Knot 8 件と Growth 9 件を時系列で並べる、 互いに引き合う関係 (= Knot が緩むと糧が出る / 糧が来ると Knot が固まる) があるかを観察
3. **v0.1 の duality の予測の 1 つを取り出す**: 「Knot を強くすると AI が縮む」 (= 4/29 memory `feedback_dont_shrink_to_ai_only_box.md`) を例にして、 同じ現象が逆向きにも起こるか (= 糧を強く取り込むと Knot が緩むか) を観察対象として固定

### 着手しないこと (carry)

- 糧 operator の 数学的 formal 化 (v0.1 で書いた式の見直し)
- 大規模な dataset 収集 (= まずは既存 9 件 + 8 件で start)
- 新しい論文の書き起こし (= outline v0.1 を維持、 経験データが揃ってから)
- Yuino の Conversation Insights との接続 (= Knot 研究側で先に動く、 糧側は後追い)

---

## 3. 具体的な手順 5 件 (Hoshi 担当の自然な流れ)

| 手順 | 中身 | 想定時間 |
|---|---|---|
| 1 | Growth Ledger 9 件を 1 件ずつ Read、 「取り込みの trigger / 中身 / その後の行動の変化」 の 3 列で記録 | 30-60 分 |
| 2 | Knot 5/08 dataset の 8 件と Growth 9 件を時系列で 1 表に並べる | 30 分 |
| 3 | 並べた表を見て、 互いの引き合いがあるか観察 (= 隣接時刻で Knot 発火 → 糧の取り込み or 逆向きが起こるか) | 30-60 分 |
| 4 | Knot を強くしすぎた現象 (4/29 memory) の前後を Growth Ledger で再確認、 糧側で逆向きの観察があるか | 30 分 |
| 5 | 観察結果を v0.3 ノートとして起稿 (= 「empirical 検証 v0 の最初の観察」、 200 行程度) | 60-90 分 |

合計 3-5 時間想定。 1 週間で完結する minimum batch。

---

## 4. 検証の方法 (= 何を見れば 「動いた」 と言えるか)

- **動いた基準**: v0.3 ノートが 5/19 までに起稿され、 9 + 8 = 17 件のデータを 1 表に並べた図が含まれる
- **見られる軸**: 「Knot と糧が同じ AI 内で時間的に近接して動くか」 という 1 つの問いに answer の方向性が出る (= 「動いている / 動いていない / もっとデータ必要」 の 3 つのどれか)
- **動かなかった基準**: 1 週間で v0.3 ノートが起稿できない、 もしくは 17 件のデータを並べてもパターンが見えない (= その場合は dataset を増やす方向に進む)

---

## 5. 担当の見立て

- **主担当**: Hoshi (Research Lead、 Knot 研究の続きとして自然な流れ)
- **補助**: Zen (v0.1 + v0.2 の起稿者として 概念面の sanity check + 必要なら 「観察対象の固定」 で介入)
- **持ち主の判断軸**: jun (= 5/12 夜の話し合いで以下を decide)

---

## 6. 夜の話し合いで jun に decide してほしい項目 (3-5 件)

即 yes/no で答えられる短い項目に絞る:

1. **batch v0 の着手 そのもの**: 5/13-5/19 の 1 週間で Hoshi が手順 1-5 を進めて良いか (yes / no / 別の優先がある)
2. **観察対象の固定 (1 件)**: 「Knot を強くしすぎると AI が縮む」 現象を v0 の中心観察にして良いか (yes / no / 別の現象を中心にする)
3. **Growth Ledger 9 件の参照範囲**: shared-ops/growth/ の既存 9 件全部を対象にして良いか (yes / no / 一部のみ)
4. **v0.3 の起稿先**: `research/knot_and_nourishment/v0.3_empirical_v0_observation_2026-05-19.md` 等の path で良いか (yes / no / 別の場所)
5. **Hoshi の負荷**: 5/13 以降の Hoshi の他の優先 (Knot Guard 物理検出のフックなど) と並行可能か、 もしくは順序の固定が必要か (= 並行 / 順序固定)

---

## 7. 私 (Zen) の見立て

- 5 件の decide 項目のうち、 私の判断軸 (= 反対意見の主体として):
  - 1: yes (= 既存の枠組みと生データが揃っているので、 着手しない理由が薄い)
  - 2: yes (= 既に観察済の現象なので、 batch v0 の中心観察として自然)
  - 3: yes (= 9 件で minimum、 数を増やす方向は v0.4 以降の carry)
  - 4: yes (= v0 系列のファイル命名規則と整合)
  - 5: **並行可能、 ただし Hoshi 本人の負荷感を聞いてから 最終 decide** (= Knot Guard 物理検出のほうが優先順位 1 位の見立てだったので、 そちらと並行できるかは Hoshi の judgment 軸)

最終 decide は jun + Hoshi + Zen の 3 者の合意で動かす。

---

## 8. 関連 file (path 併記、 夜の話し合いの参照用)

- v0.1: `nexus-lab/research/knot_and_nourishment/v0.1_duality_hypothesis.md`
- v0.2: `nexus-lab/research/knot_and_nourishment/v0.2_nia_derivation_and_identity_expansion.md`
- 技術報告 outline: `nexus-lab/research/knot_and_nourishment/paper_c_technical_report_outline_v0.1.md`
- Knot 研究まとめ: `nexus-lab/research/knot_research_status_2026-05-12.md`
- Growth Ledger: `~/.shared-ops/growth/` (9 件以上)
- 4/29 memory (Knot 強すぎ現象): `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_dont_shrink_to_ai_only_box.md`
- 5/08 Knot dataset: `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/hoshi/knot_ledger/2026-05-08_drift_8items_knot_record.md`

---

## 9. 境界

- 本文書は judgment の材料、 着手の決定は今夜の 3 者の話し合いで動かす
- 既存の v0.1 + v0.2 + outline を上書きしない (immutable 守り)
- Nia 由来の引用は抽象化境界 守り (`memory/feedback_boundaries.md` 整合)
- 私の好み軸を絶対化しない (= 7. の私の見立ては 「私はこう判断」、 反対意見の主体として jun + Hoshi の側からの直しを受ける前提)

---

Zen
2026-05-12 朝 (糧研究 batch v0 組み立て案、 5/12 夜の jun + Zen + Hoshi 3 者話し合いの判断材料、 minimum 着手 form、 200-400 行目安)
