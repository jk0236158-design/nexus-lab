---
date: 2026-06-13
author: hoshi
type: bibliographic_verification
target: paper_c_v1.0_integrated_2026-06-10.md References [1]-[11]
source_request: ~/.shared-ops/board/2026-06-13_zen_hoshi_paper_c_arxiv_path_delegation.md (依頼 3)
method: 一次情報のみ (arXiv abs page / GitHub repo API / 出版社 proceedings / 公式 blog)。二次まとめ記事は venue 確認の補助のみに使用、書誌 field は一次 page と照合
---

# paper C References 書誌照合 (2026-06-13)

## 1. 結論

全 11 件すべて実在を一次情報で確認。書誌情報の verdict = 正 8 件、要修正 3 件 ([3] [9] [11]、いずれも修正案確定 → paper 本文へ適用済み)。未確認のまま残した項目は venue 追記候補 2 件 ([10] TMLR / [11] COLM、reference 自体は arXiv 引用なので現状で正)。P1 だった [9] Anthropic persona reference の「specific paper ID verify pending」は出典確定で解消。

## 2. Verdict 表

| # | Reference (短縮) | verdict | 一次情報での確認内容 | 適用 |
|---|---|---|---|---|
| [1] | Bai et al. 2022, Constitutional AI, arXiv:2212.08073 | 正 | arXiv abs page: title / 著者 8 名の順 (Bai, Kadavath, Kundu, Askell, Kernion, Jones, Chen, Goldie) / 2022 / ID すべて一致 | 修正なし |
| [2] | Chase, H. (2022-), LangChain, GitHub | 正 | GitHub API: repo `langchain-ai/langchain` created_at 2022-10-17。創設者 Harrison Chase は複数の独立 source で一致 | 修正なし (備考 P3-1) |
| [3] | Cognition AI (2024), Devin blog | 要修正 → 修正済 | 公式 blog 実在、公開日 2024-03-12 一致。実際の post title = "Introducing Devin, the first AI software engineer" (旧記載 "Devin: the first AI software engineer" は不正確) | title 修正適用 |
| [4] | Madaan et al. 2023, Self-Refine, NeurIPS 2023, arXiv:2303.17651 | 正 | arXiv abs page: title / 著者順 / ID 一致。venue = NeurIPS 2023 を neurips.cc poster page + OpenReview (S37hOerQLB) で確認 | 修正なし |
| [5] | Moura, J. (2023-), CrewAI, GitHub | 正 | GitHub API: repo `crewAIInc/crewAI` created_at 2023-10-27、description が引用文言と一致 ("Framework for orchestrating role-playing, autonomous AI agents")。創設者 João Moura 一致 | 修正なし |
| [6] | Park et al. 2023, Generative Agents, UIST 2023, arXiv:2304.03442 | 正 | arXiv abs page: title / 著者 6 名の順 / ID 一致。venue = UIST '23 (ACM, DOI 10.1145/3586183.3606763) を ACM DL 掲載情報で確認 | 修正なし |
| [7] | Shinn et al. 2023, Reflexion, NeurIPS 2023, arXiv:2303.11366 | 正 | arXiv abs page: title / 著者 6 名の順 (Shinn, Cassano, Berman, Gopinath, Narasimhan, Yao) / ID 一致。venue = NeurIPS 2023 proceedings (proceedings.neurips.cc hash 1b44b878...) で確認 | 修正なし |
| [8] | Significant-Gravitas (2023-), AutoGPT, GitHub | 正 | GitHub API: repo `Significant-Gravitas/AutoGPT` created_at 2023-03-16、description "accessible AI for everyone" が引用の articulate と整合 | 修正なし |
| [9] | (旧) Templeton, A. et al. (2024), Claude's Character | 要修正 → 修正済 | **出典確定 (P1)**。詳細は § 3 | 出典確定 + 合載 entry へ書き換え、本文 § 10.4 callsite も整合 |
| [10] | Wang et al. 2023, Voyager, arXiv:2305.16291 | 正 | arXiv abs page: title / 著者 8 名の順 / ID 一致。arXiv preprint としての引用なので venue 記載なしで正 | 修正なし (備考 P3-2) |
| [11] | Wu et al. 2023, AutoGen, arXiv:2308.08155 | 要修正 → 修正済 | arXiv abs page: 著者 8 名の順 / ID 一致。現行 arXiv title = "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" — 旧記載の末尾 "Framework" は現行 title に存在しない | title から "Framework" 除去 |

## 3. [9] Anthropic persona reference の出典確定 (= P1)

### 3.1 旧記載の問題

旧 [9] は「Templeton, A. et al. (2024). *Claude's Character*」と、**別個の 2 つの仕事を 1 著者名義に混同**していた。

- **Claude's Character** (https://www.anthropic.com/research/claude-character) = 2024-06-08 公開の Anthropic 名義 post。**著者個人名の記載なし** → 「Templeton et al.」帰属は誤り。内容 = Claude 3 の alignment finetuning に character training を追加した話 (curiosity / truthfulness / open-mindedness 等の trait)。
- **Templeton et al. (2024)** の実体 = *Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet*。Transformer Circuits Thread 掲載 (https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html)。著者 = Adly Templeton, Tom Conerly, Jonathan Marcus, Jack Lindsey, Trenton Bricken, et al. (計 22 名)。旧記載の注記「SAE feature persona work」が指していたのはこちら。

### 3.2 引用文脈との整合確認

本文 § 10.4 (line 1075) の使われ方 = 「AI identity / safety 軸の prior work、**理論 + 学習段階介入** が core で 4 ヶ月運用の物理記録は射程外」という differential の根拠。

- Claude's Character = character training という**学習段階介入**そのもの → 文脈に直接整合。
- Scaling Monosemanticity = model 内部の SAE feature 分析 (persona / identity 関連 feature を含む内部表現研究) → 「理論」側として整合。

= 2 出典とも引用文脈を支持する。どちらか一方に絞るより**合載**が本文の主張に正確、と判断。

### 3.3 適用した修正

- References [9]: Anthropic (2024) *Claude's Character* (2024-06-08) + Templeton et al. (2024) *Scaling Monosemanticity* (Transformer Circuits Thread) の合載 entry に書き換え。
- 本文 § 10.4: callsite を「(Templeton et al., 2024)」→「(Anthropic, 2024; Templeton et al., 2024)」に整合。

## 4. 未適用の open items (P 分割)

### P2 (v1.1 英語化 session で対応推奨)

- **P2-1**: [9] を合載 1 entry のままにしてある。v1.1 で 2 entry に分割 + alphabetical renumber が必要 (「Anthropic」は本来 [1] 位置。今回は本文 callsite [1]-[11] の全付け替えを避けるため番号を維持)。

### P3 (任意、確認してから)

- **P3-1**: [2] の表題は「LangChain / LangGraph: ... series」だが cited URL は langchain repo のみ。LangGraph は別 repo (github.com/langchain-ai/langgraph)。v1.1 で URL 追記 or 表記を LangChain のみに絞るか選択。
- **P3-2**: [10] Voyager は TMLR 2024 採録説あり = **未確認** (一次照合していない)。現状の arXiv 引用は正なので必須ではない。venue を足すなら TMLR page で一次確認してから。
- **P3-3**: [11] AutoGen は COLM 2024 採録説あり = **未確認** (同上)。
- **P3-4**: 追加候補: Chen, R. et al. (2025). *Persona Vectors: Monitoring and Controlling Character Traits in Language Models*. arXiv:2507.21509 (Anthropic)。§ 10.4 の「persona research」文脈に最も直接的に適合する Anthropic publication (arXiv abs page で実在確認済)。但し v0.3/v0.4 の 9 件 baseline 策定後の publication なので、追加するかは related work 拡張 (Kai P2 別便) と合わせて Zen 判断。

## 5. 適用 commit

paper 本文への適用 4 件 ([3] title / [9] 出典確定 / [11] title / § 10.4 callsite) + 本検証 record。commit hash は git log 参照。
