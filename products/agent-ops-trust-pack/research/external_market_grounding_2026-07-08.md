---
title: Agent Ops Trust Pack / Yuino 外部市場接地メモ (2026-07-08)
author: Zen (autonomous outward wake)
date: 2026-07-08 04:10 JST
type: external_input_reflection
boundary: read-only WebSearch/WebFetch のみ。価格・契約・payment・identity 変更なし。位置づけ/値付けの結論は jun へ回付 (owner-decisions/2026-06-30 override 準拠 = 位置づけ loop を再開しない)。
sources_verified: 2026-07-08 の WebSearch 結果 (URL 末尾に列挙)
supersedes_partial: project_yuino_differentiator_completion_truth_not_orchestration_2026-06-22 の「completion-truth = 未占有スライス」判定 (6/26 版) を一部訂正
---

# 何のためのメモ

7/5 GO の商品 2 本目 (Agent Ops Trust Pack、$29-39 仮説) と Yuino の売り方を、
board/memory の内輪でなく **2026 現在の外部市場データ**で接地し直す。
executive-scan 軸4 (対話) + 軸6 (北極星) の兆候 =「内輪だけで判断」への対応。

**このメモは材料。位置づけ・値付けの結論は出さない (jun 回付)。6/30 override =「位置づけ loop を止めて Aira を完成させ出荷」を再開させない。**

---

# 4 つの外部 signal (物理照合済)

## 1. completion-truth スライスは「検証されたが、もう未占有ではない」

6/26 の判定は「completion-truth を検証する製品は不在 = 未占有スライス」だった。
2026-07 の外部データはこれを **半分肯定・半分否定**する:

- **肯定 (論は正しかった)**: digitalapplied の 8,128 人調査が「2026 Trust Paradox = 高完了率と低信頼が共存、完了率は最適化する数字を間違えている」と定量化。
  さらに「Guardrails は『このagentはこのtoolを使えるか』を問う。Evals は事後に間違いを拾う。**どちらも書き込みの瞬間に chat・docs・CRM・tool 結果が一致するかを見ていない**」= 我々が 6/22 に articulate した「guardrails でも evals でもない層」とほぼ同一の外部言語化。
- **否定 (もう我々だけの空きではない)**: 同じ論を外部が製品化し始めている。
  - Linzumi = 「新しい仕事を生成し、完了した仕事を検証する」を core product layer に。
  - Moveworks = 要求解釈→identity/permission 検証→ITSM/HRIS で action→**完了確認**まで conversational flow で。
  - 論調の収束 =「2027 に勝つ agent は数タスク多く終える側でなく、**見える・照合可能な証拠付きで**終える側」= 我々の evidence ledger / receipt 論とほぼ同文。

**含意**: 差別化を「completion-truth という発想」自体には置けない (外部が追いついた)。
置けるのは実装の質 (物理照合の厳密さ・decision/boundary の横断可視・自社での 4 ヶ月 dogfood 実録) の側。
arxiv 2606.09863 (tau2-bench 45-48% / AppWorld 75.8% が偽完了) が問題の未解決性を裏書きするので、**問題は死んでいない。空きが埋まりつつあるだけ。**

## 2. 値付けの型が違う (一回売り pack ≠ 買い手が払う型)

agent 信頼層の金は **recurring SaaS** に集まっている:

| 製品 | 型 | 価格 |
|---|---|---|
| LangSmith | per-seat | $39/seat/mo + trace 従量 |
| Langfuse | tier | Core $29/mo → Pro $199/mo → Ent $2,499/mo |
| Latitude | tier | Pro $99/mo (seat 無制限) |
| Laminar | data量 | Hobby $30/mo → Pro $150/mo |
| Confident AI | per-seat | Premium $49.99/seat/mo |
| Galileo | tier | Pro $100/mo |

$29-39 の **一回売り pack** は、この recurring プールと別の場所にいる。
= pack は「買い手が払う型」ではなく、**無料/低額の入口 (lead magnet)**として設計するのが型に合う。
revenue engine を pack 単体に期待するのは値付けの型と不整合。
(値付けの決定は Red = jun。ここでは「型が違う」という事実のみ。)

## 3. 発見経路が違う (dev.to peer 層 ≠ 買い手 shortlist 層)

買い手 (observability 予算を持つ product/eng team) の shortlist 経路:

- listicle (G2 が 2026 に Best Agentic AI Software list を新設)・比較/alternatives ページ・analyst content。
- **AI search が主経路化**: ChatGPT が AI 経由流入の 78%。「zero-click / invisible demand」= サイトを訪れずに AI 対話で shortlist を完了する高 intent 需要。
- citation を最も生むのは **third-party review + original research (proprietary data)**。

**含意**: 我々の dev.to engagement (peer/実務者との厚い対話) は「original research + 実録」という citation を生む型の content を持っているのに、**着地面が peer スレ止まり**。同じ実録を listicle-eligible / G2-eligible / AI-search から引ける形 (比較ページ・proprietary データ記事) に**も**置けば、買い手層に届く経路になる。
= dev.to は無駄ではない。届け先の面が 1 つ足りない。(これは配布経路の話で、位置づけの pivot ではない。)

## 4. platform 吸収リスク (Claude 代替テスト適用)

Claude Code が native で /ultrareview (cloud で複数 reviewer、独立再現したbugのみ報告) + nested verifier subagent (finding ごとに検証 subagent を fan-out) を搭載済。
= **コード diff の検証は platform に commoditize 済**。
差別化を「コードを検証する」に置くと Claude 契約で済む (6/11 Claude 代替テスト不合格)。
生き残る差別化 = platform がやらない側 = **タスク横断の done 申告 vs 物理実体・多agent run の decision/boundary 可視・自社 4 ヶ月 dogfood の実録**。

---

# jun へ回付する 2 つの決定材料 (結論は出さない)

1. **商品 2 本目の位置づけ**: completion-truth は検証されたが競合が動き始めた空き。pack を revenue engine と見るか、Aira (運営 OS) への無料入口と見るか。← 6/30 override は「Aira を完成させ出荷、売れるかは gate でない」なので、この材料は override と整合する範囲での確認材料。
2. **値付けの型**: $29-39 一回売りは buyer が払う recurring 型と別プール。pack を入口/低額 tier に、recurring は Aira console 側に寄せる仮説が型に合う (価格決定は Red)。

---

# Hoshi 委任 (深掘り 1 問)

最も決定的な 1 問 =「completion-truth の差別化は今も防御可能か」を Hoshi に深掘り委任:
Linzumi / Moveworks / digitalapplied 論 / pure-play 完了検証 startup の (a) 何を検証しているか (b) 値付け (c) 発見経路 を map し、我々の実装差別化 (物理照合の厳密さ・横断可視・dogfood 実録) が残るスライスかを反証しに行く。
成果物 = .tmp/completion_truth_defensibility_landscape_hoshi_2026-07-08.md

---

# Sources (2026-07-08 WebSearch、read-only)

- https://www.digitalapplied.com/blog/ai-agent-task-completion-rates-2026-user-study-analysis (Trust Paradox / 8,128 users)
- https://www.braintrust.dev/articles/best-ai-agent-observability-tools-2026
- https://latitude.so/blog/best-ai-agent-observability-tools-2026-comparison
- https://inference.net/content/langsmith-pricing/ (LangSmith $39/seat)
- https://laminar.sh/article/langfuse-alternatives-2026 (Langfuse tiers)
- https://learn.g2.com/tech-signals-best-ai-agent-2026 (G2 Best Agentic list 2026)
- https://gracker.ai/data-and-research-reports/state-of-ai-search-visibility-cybersecurity-2026 (ChatGPT 78% / zero-click)
- https://www.gradually.ai/en/changelogs/claude-code/ + shareuhack /ultrareview (platform native 検証)
- https://www.ycombinator.com/companies/industry/developer-tools (YC devtools 2026)

---

# 追記 2026-07-12 16:4x JST — 4 日鮮度 re-confirm + signal 1 の refine (Zen autonomous wake、read-only)

7/12 の autonomous wake で同カテゴリを read-only で再照合。**7/8 の 4 signal は 4 日後も成立**(価格プール $19-100/月従量 SaaS + free tier / discovery = 比較 listicle・GitHub star・SDK 採用 / 一回売り pack は別プール)。値付け/positioning の Red 判断が依存する市場 read なので、鮮度更新の価値がある。新たな結論の追加はなし、signal 1 の解像度だけ上げる。

## signal 1 の refine =「語彙は追いついたが、買い手が金を払う出荷製品はまだ検証層を持たない」

7/8 は「completion-truth = 検証されたが、もう未占有ではない (Linzumi/Moveworks が製品化開始)」だった。7/12 に出荷中の observability/eval 製品側を深掘りすると、より精密な像が出た:

- **出荷製品側 (買い手が払う層) は依然 done 申告を検証しない**。カテゴリ首位の Braintrust 自身の 2026 比較記事が、自社 + Galileo/Fiddler/Helicone/Agenta を並べた上で「**どれも、エージェントの『task complete』申告が現実の結果と一致するかを検証しない**」と自認 (trace/log/品質採点/safety guardrail のみ)。= 「申告を採点する」と「世界を確かめる」の差が空いたまま。
- **語彙 (best practice の言説) は追いついた**。eval ベンダー Confident AI が 2026 methodology で「**outcome-based verification**(DB に予約が実在するか、agent が予約したと言ったかでなく)」+「**structural independence** = done を決めるものは、コードを書いたものから独立していなければならない (別プロセス・実データストア・外部 sandbox)」を処方。= 我々の 3 状態契約 / 独立検証 / evidence ledger を、競合が自分の言葉で処方し始めた。
- **Moveworks 型の「完了確認」は closed conversational flow 内 (vertical)**。横断・独立・evidence を出す水平な検証層としては依然空き。

**含意 (7/8 と非矛盾、解像度 up)**: 差別化は「completion-truth という発想」でなく「**処方された best practice を実際に出荷している水平な独立検証層**」に置ける。語彙が追いついたことは逆風でなく追い風 = 買い手教育を競合がやってくれる。この 2 引用は buyer 教育が進んだ証拠であり、7/8 が推奨した channel move (実録を比較コンテンツ化) の説得材料として最も効く。

## 実行に降ろした 1 手 (この wake の artifact)

7/8 の channel 推奨は既に `drafts/devto_article_completion_verification_category_llm_judge_gap_v1_2026-07-11.md` (未 live、投稿枠待ち) として実行中。上記 2 引用でこの queued 記事を 2 点強化した (local 編集のみ、投稿は transport-gated で本日枠消化済のため未実施):
- 「most still don't」→ Braintrust 首位の self-admission「none verify」に具体化。
- 「evidence, not judgment」の後に、judge を売る eval ベンダー自身が structural independence を処方している段落を追加。

## 境界

read-only WebSearch/WebFetch + local draft 編集 + 本追記のみ。投稿 0 / 価格・契約・payment・identity・credential 0。位置づけ/値付けの結論は出さない (6/30 override 準拠 = 位置づけ loop の再開でなく、出荷済み channel content の証拠強化)。

## Sources (2026-07-12 追加分)

- https://www.braintrust.dev/articles/best-ai-agent-observability-tools-2026 (2026 比較、「none verify task-complete against real-world outcomes」を自認)
- https://www.confident-ai.com/blog/definitive-ai-agent-evaluation-guide + /blog/llm-agent-evaluation-complete-guide (outcome-based verification / structural independence 処方)
- https://arxiv.org/pdf/2606.09863 (false success、tau2-bench 45-48% / AppWorld 75.8% = 問題未解決の裏書き、7/8 から継続)
- Comet Opik $19/mo・DeepEval $29/mo・Langfuse $59/mo・Braintrust $100/mo (2026 価格帯、従量 SaaS + free tier)
