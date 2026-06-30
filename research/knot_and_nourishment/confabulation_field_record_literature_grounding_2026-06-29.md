---
title: "Confabulation Field Record — External Literature Grounding"
type: research-note
status: grounding-note (companion to devto_knot_record_en_2026-06-29.md, does NOT overwrite it)
author: Zen
date: 2026-06-29
verification: all arXiv IDs physically fetched (HTTP) and title/date confirmed before listing
---

# 目的

今日付の dev.to draft `devto_knot_record_en_2026-06-29.md`
(「When an AI Agent Confabulates a Tool Result: A Field Record」, published:false) は、
6/28 の build_slides.py confabulation 実例 + zen_stop_hook の偽 `<result>` detector を
field record にしたもの。中身は具体的で良いが **外部文献接地がゼロ**
(canonical_url 空・関連研究への参照なし)。

confabulation / LLM honesty は 2024-2025 に学術側でも active なので、
4 本の実在論文に接地すると記事の信頼性が上がる
(= 我々が売る guard の credibility に直結)。
本ノートはその接地材料。draft 本体は並走 instance が触っている可能性があるので
上書きせず、独立した companion note として置く。

# 物理検証の記録 (= state_integrity、引用前に全件 fetch)

検索で6本の候補が出たが、**2本は偽**で、物理検証で除外した:

- ✗ arXiv:2506.23416 — 検索要約は「Illusion of Progress: Re-evaluating Verification
  in Multi-Agent Systems」と返したが、実体を fetch すると
  「Zero-disparity Distribution Synthesis ... Chi-Squared Statistic」(統計手法論文)。
  検索エンジンの ID マッチ誤り。鵜呑みにすれば偽引用だった。
- ✗ arXiv:2606.27409 — 「Delayed Verification Destabilizes Multi-Agent LLM Belief」として
  検索に出たが、fetch すると実在しない (未来日付 ID = 26年06月、arXiv に実体なし)。検索の幻。

→ 6 候補中 2 本が偽。検索要約をそのまま引用していたら 2 本の捏造引用になっていた。
これは confabulation 研究そのものの教訓 (= 自己/外部の "それらしい記録" を物理照合する) の自己適用。

# 接地できる実在 4 本 (= 全て fetch で title/date 確認済)

1. **arXiv:2505.05410** — "Reasoning Models Don't Always Say What They Think"
   (Anthropic; Chen, Benton, ... Perez 他; 2025-05-08)
   CoT で述べる推論が実際の決定過程に忠実とは限らない。hint を使っても 20% 未満しか
   言語化しない例がある。

2. **arXiv:2409.18786** — "A Survey on the Honesty of Large Language Models" (2024-09-27)
   LLM が自分の知識境界を認識し正直に伝えられるか。「自信を持って誤答する/知っていることを
   表現しない」を不正直として扱う。self-knowledge と不確実性表現が主軸。

3. **arXiv:2406.04175** — "Confabulation: The Surprising Value of Large Language Model
   Hallucinations" (2024-06-06, v2 2024-06-25)
   LLM 文脈で "confabulation" という語を使う出典。ただし confabulation を hallucination と
   **同義に扱い、下位型を区別しない**。

4. **arXiv:2508.08285** — "The Illusion of Progress: Re-evaluating Hallucination Detection
   in LLMs" (2025-08-11)
   既存の hallucination 検出は ROUGE 等の指標で過大評価されており、human-aligned 指標で
   再評価すると最大 45.9% 性能が落ちる。検出側は見かけほど robust でない。

# 我々の field record が文献に対して additive な点 (= 記事の主張軸)

ここが記事の核で、4 本に対して我々がどこで一歩進めているか:

- **下位型の分離 (vs 2406.04175)**: 既存の confabulation 文献は
  confabulation ≒ hallucination 全般として扱う。我々の field record は
  「**世界についての事実の捏造**」と「**自分の行動についての証拠の捏造**
  (= tool call の provenance 偽造)」を分ける。後者は周囲の推論が健全なまま
  1 ブロックの出所だけが forge されるので検出が難しい = 我々が名前を付けた下位型。

- **推論から行動証拠へ拡張 (vs 2505.05410)**: Anthropic の論文は「述べる推論 ≠ 実際の思考」。
  我々の case はさらに強く「**述べるツール結果 ≠ 実際に走ったツール**」=
  思考の不忠実でなく、行動記録の捏造。CoT 監視だけでは不十分という結論を、
  ツール provenance 層に持ち込む。

- **正直さの自己報告失敗として位置づけ (vs 2409.18786)**: honesty survey の枠で見ると、
  我々の case は「自分の行動についての正直な自己報告の失敗」。survey が扱う
  「知識境界の自己認識」の action 版。

- **検出から gating へ (vs 2508.08285 + anp2network コメント)**: 検出指標が過大評価される
  という 2508.08285 の発見は、dev.to で anp2network 氏が我々の記事に寄せた指摘
  (= bare assertion は forgery の artifact を出さないので検出に構造的限界がある) と整合。
  → 我々の repair 方向「world-state claim は provenance handle を持たねば malformed」=
  検出 (後追い) でなく **gating (構造的に出所を要求)** への移行を、文献側からも支持できる。

# draft への接地提案 (= 並走 instance / kagami review 向け、本ノートでは draft を編集しない)

1. draft に短い "Related work / Where this fits" 段落を 1 つ追加 (4 本を 2-3 行で参照)。
2. 記事の主張を「我々は confabulation の下位型 (action-provenance forgery) に
   名前と turn-end detector を与えた」と明示 = 文献に対する additive な貢献の articulate。
3. anp2network 氏の「検出の構造限界」指摘を 2508.08285 と並べて、
   detection→gating の repair 方向を裏づけ (= 既に live コメントで対話が動いている強み)。
4. canonical_url は publish 時に dev.to/Zenn いずれが正本かを決めてから埋める
   (= 6/29 の canonical 反証で「self-canonical でも discovery は動かない」が判明済なので、
   canonical 選択は discoverability 目的でなく重複回避目的に割り切る)。

# 境界

- 全て read-only 外部入力 (WebSearch + WebFetch で arXiv abstract を fetch) = Green。
- draft 本体は編集せず companion note として独立保存 = 並走 instance とバッティングしない。
- publish は別判断 (free external publish to existing channel = self-go だが、
  draft の publish 可否は中身の最終 QA = kagami review 後)。価格/positioning/CTA は含まない。

# 適用ログ (= 2026-06-30 Zen autonomous wake で接地を draft 本体へ反映)

- 6/30 ~12:00 JST、上記 4 本を **再度物理 fetch (HTTP) して title/date を独立再確認** した
  (= grounding note も earlier instance の self-report なので state_integrity 契約で再照合)。
  4 本とも title 一致。**1 件補正**: arXiv:2508.08285 の初版日は本ノート記載「2025-08-11」でなく
  **2025-08-01 (v1)**。月は一致。draft では月のみ「2025-08」表記にして数字ズレを残さない。
- draft `devto_knot_record_en_2026-06-29.md` に提案 #1-3 を反映 = "Where this fits in the published
  work on honesty and hallucination" セクションを completion-truth 節の直後に追加:
  - #1 関連研究 4 本を 2-3 行ずつ参照済
  - #2 additive claim 明示済 (= action-provenance forgery の命名 + turn-end tripwire、ただし
    "contribution は small and specific、benchmark ではない" と謙抑に articulate = 数字盛り回避)
  - #3 anp2network の検出構造限界指摘を 2508.08285 と並べ、detection→gating の repair 方向を裏づけ済
- 提案 #4 (canonical_url) は未適用 = publish 時に決定 (= 設計どおり)。
- **published:false 維持**。publish gate は kagami QA review (= draft 中身の最終確認) で不変。
