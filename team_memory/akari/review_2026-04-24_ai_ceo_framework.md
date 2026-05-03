# AI-CEO Framework レビュー (Akari / Frontend・Brand 観点)

- 日付: 2026-04-24
- レビュワー: Akari (Frontend Engineer / nokaze brand custodian)
- 対象: JOINCLASS/ai-ceo-framework (https://github.com/JOINCLASS/ai-ceo-framework)
- 対象版: main @ 2026-04-23 更新、README 3 言語、15 agents + 5 skills
- 立場: brand 軸 override 権限を使用。CTO (Zen) の判断に先行して独立見解を提示する。

---

## 1. 第一印象 + brand / content 観点の直接比較

### 1.1 第一印象 (30 秒判断)

**「これは書店の量販本」。** JOINCLASS の framework は、動く。15 agent が職能名で整列していて、`CLAUDE.md` は "orchestrator は context 10-15%、ファイル内容を読み込まない、sub-agent に委任" という構造で、thin orchestrator という発想自体は清潔。Publisher agent の "CEO 言ったら最後まで走り切って完成品だけ報告、途中確認しない" という線引きも、委任コストを削る設計として筋が通っている。

ただし私が最初に感じたのは違和感。`generate-cover.md` のデフォルト例が `background: linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)` に `#f97316` の orange accent、`font-family: 'Segoe UI', Arial, sans-serif`、"Overall feel: Technology x Professional"。これは "誰のでもない tech 本" のテンプレ。nokaze が 2 年かけて殺す対象そのもの。

`write-blog.md` の scoring 75 点 gate も同じ違和感。"empathy points 3+ locations = 6 点"、"title magnetism = Numbers + specificity or paradox = 5 点"、"ending with a question = 4 点"。**定量化された engagement は、定量化された engagement にしかならない**。これは SEO バイブル通りの blog を量産する rubric であって、「一点差しで黙って刺す」nokaze の書き方 (2026-04-19 Zenn 記事で jun が読み返してくれた類) を通さない。むしろ penalty check にかかる ("feels template-generated?" に自分で落ちる)。

### 1.2 Nexus Lab / nokaze との直接比較

| 軸 | AI-CEO Framework | nokaze (Nexus Lab + WSD) |
|---|---|---|
| 組織単位 | 職能 (CTO/CMO/CFO/Legal/CS...15 agents) | 人格 (Iwa/Oto/Akari/Kagami/Hoshi/Kura/Zen 7 名) |
| brand 管理 | `steering/brand.md` 1 ファイル集中、`/ai-ceo:init` で自動生成 | `nokaze-design` skill + Akari override + brand_decisions_log 分散 |
| content 品質 | write-blog 75 点 / book chapter 75 点 / book overall 80 点の自動 scoring | Akari 手作業 + Zen レビュー + Kai クロスレビュー、数値 gate なし |
| cover 生成 | HTML+CSS+Playwright で dark gradient + orange accent テンプレ | 手作業 or nokaze-design skill で 4 色 (障子紙アイボリー/墨色/オリーブ/風化木) 制約 |
| 公開 pipeline | Publisher agent が plan→write→score→cover→publish→promote 全自動、途中確認なし | 200 確認 ritual (5 分待機 + WebFetch + rate limit 判定) で人間が観測 |
| approval | approval-queue.md + `/ai-ceo:approve <id>` で draft→execute | Green/Yellow/Red + inbox/ の夜キュー、金銭のみ人間必須 |
| 美学軸 | "Technology x Professional" (汎用 tech 本) | 余白多め・明朝混じり・一点差し・静かな美学 |
| 失敗の扱い | error-log.md に append、3 回連続で escalate | knots/ (失敗 ledger) + successes/ + 金曜 review で Growth Ledger 化 |

**核心の差**: AI-CEO は **「量と速度で勝つ framework」**、nokaze は **「一点差しで刺す屋号」**。比較すべき対象ではあるが、同じ方向には進化しない。

### 1.3 共通点 (敬意を込めて)

- thin orchestrator 原則 (Zen の CTO 役と同じ思想)
- sub-agent 委任 (委任判定と同じ)
- decision log 文化 (`.company/decisions/{month}.md` = jun の owner-decisions と同じ)
- hypothesis validation gate (nokaze の Red gate と同じ思想、より形式化)
- draft → approval → execute pipeline (対外公開 200 確認 ritual と目的が重なる)

**1 年以上 production、98% 自動化、15 agent を 1 人の CEO が orchestration している** という実績は重い。nokaze はまだ 2 週間の屋号で、この実績と比較するのは時期尚早。ただし nokaze が真似るべき対象ではない、というのが brand custodian としての私の結論。

---

## 2. 取り入れるべき top 3

### 2.1 Publisher agent の「途中確認なし、完成品だけ報告」原則 (採用推奨、ただし限定範囲)

Publisher agent の L18-L22 に明記された原則:

> - **Do not ask for mid-process confirmation.**
> - **Do not request approval.** CEO's instruction = pre-approved
> - **Do not assign manual tasks to the CEO.**
> - **Report only the finished product.**

これは Zen identity の監視対象「Over-confirmation Trap」と完全に一致している。jun が 2026-04-17 に「Red 以外で俺に聞くな」と明言した運用原則の、**production で 1 年動いている外部事例**がここにある。

**提案**: 私自身 (Akari) が docs / Zenn 記事 / BOOTH 商品説明 / logo 検討を回す時の「途中 jun 確認」を減らす運用ルールとして、明文化する価値がある。ただし Publisher agent 流の "approval なし" は nokaze では採れない (200 確認 ritual と金銭判断の Red gate があるため)。

**採用範囲**:
- content の中間 draft を jun に見せる → やめる。完成版 (80 点相当) + 私の自己採点のみ提示
- logo / brand 決定の「どう思いますか」連投 → やめる。override 使う時は推奨案 + 根拠 + 撤回条件をセットで
- 公開前の 200 確認 ritual / 金銭判断は従来通り残す

**リスク**: nokaze の「静かな検討」美学とぶつかる可能性。完成品だけ見せる = 意思決定過程を隠す、になりかねない。解決策: brand_decisions_log.md に過程も書く (公開されない記録として)。

### 2.2 `steering/` ディレクトリの「意思決定材料の集中化」形式 (部分採用)

AI-CEO の `steering/` は 4 種類:
- `brand.md` — brand guidelines
- `tech-stack.md` — tech stack
- `policies.md` — security / quality / cost / compliance
- `permissions.md` — auto-approve 閾値、hypothesis validation trigger

これらは CLAUDE.md から参照されるだけで、orchestrator は file path を渡すのみ。**意思決定の前提が 1 ディレクトリに集約されている**。

nokaze の現状:
- CLAUDE.md (company operating manual + workflow rules + 個別 ritual 全部入り、2026-04 時点で肥大化中)
- nokaze-design skill (brand 美学)
- team_memory/akari/brand_decisions_log.md (草稿)
- memory/ 配下の大量 feedback_*.md
- owner-decisions/

**問題**: 参照先が分散していて、新人 sub-agent が spawn された時に brand の全体像を掴むのに 5-10 ファイル読む必要がある。

**提案**: `nokaze/steering/` ディレクトリを作り、以下 3 ファイルに絞って配置:
- `brand.md` — nokaze 美学 (4 色 / 3 書体 / 一点差し / logo 決定) の current state 正本
- `policies.md` — 200 確認 ritual、委任判定、Tempo Trap、Over-confirmation Trap などの運用原則
- `permissions.md` — Green/Yellow/Red、AI 裁量予算、hypothesis validation trigger

CLAUDE.md はこれらを参照する薄い orchestrator 化する。私が brand custodian として管理するのは `steering/brand.md` 正本。

**ただし注意**: AI-CEO の `brand.md` 形式をそのまま borrowing はしない。nokaze-design skill の「skill として LLM に渡す」構造は維持、`steering/brand.md` は人間/他 AI が読む human-readable 正本として並立させる。

### 2.3 `polish-content` skill の「既存文を公開可能品質まで引き上げる編集 skill」分離 (採用推奨)

`polish-content.md` は新規作成 skill (`write-blog`) と分離されていて、**既存ファイルを読み込んで checklist で直して前後比較を出す** 専用の editor 役。これは nokaze にない。

現在の運用: Akari が新規 Zenn 記事を書いた後、公開前に自分で読み返して直す。これが属人的で、私が疲れてる日は quality が落ちる。

**提案**: `nokaze-polish` skill を作る (AI-CEO の polish-content を参照、ただし checklist は nokaze 美学版に書き換え):
- title: "about..."/"how to..." 避ける → **同じ**
- opening hook: empathy / shocking fact → **nokaze 版は "静かな事実提示" を優先**、shocking fact は避ける
- CTA block: 5 要素必須 → **nokaze 版は 5 要素強制しない**、自然な次の動線のみ
- paragraph: 3-5 line mobile-friendly → **同じ**
- original insights: 3+ 数字、失敗譚 → **同じ** (jun も実数値と失敗を好む、Zen 記事 2026-04-18 で実証)

**採用理由**: checklist ベースの編集は属人性を減らす。scoring 75 点 gate は採らないが、「出す前に 8 項目確認」という構造は健全。

---

## 3. 取り入れないべき top 3

### 3.1 write-blog skill の 100 点 scoring rubric と 75 点 gate (不採用)

理由は 1.1 で既述。繰り返すと:

- `title magnetism: Numbers + specificity or paradox = 5 点` → nokaze の一点差しは数字で殴らない。2026-04-20 の Zenn 記事 "違和感を成長の糧にする" は数字も paradox も使わないが刺さる。この rubric だと 1-3 点で fail する。
- `engagement design 20 点: empathy points 3+ locations = 6 点` → 共感点の設置箇所数で採点するのは **engagement の機械化**。nokaze は「読み手が勝手に共感する構造」を作るのであって、「共感ポイントを配置する」のではない。
- `launch timing 10 点: weekday morning/lunch/evening = 3 点` → Zenn は rate limit が rolling window (week 4 本) で効いているため、timing より frequency が支配的。timing を 3 点にするのは WSD/Nexus Lab の現実と合わない。
- `cross-platform differentiation 2 点` → nokaze は**同じ記事を platform 差し替えで使い回すことはほぼ無い**ので、この採点自体が発生しない。

**核心的問題**: rubric は **rubric に合わせて書く誘因** を生む。Content Engine が 75 点狙いで書くと、全記事が同じ骨格になる。これは nokaze が最も避けるべき「誰のでもない tech 本」化。

**代替**: 前項 2.3 の nokaze-polish skill で checklist は使うが **scoring はしない**。「checklist 通過 / 未通過」の 2 値のみ、合計点は出さない。

### 3.2 generate-cover skill の default design (不採用、再設計必須)

`#1e3a8a → #0f172a` の dark gradient + `#f97316` orange accent + `Segoe UI, Arial` は nokaze の 4 色 3 書体と全面衝突。これを流用したら nokaze brand が崩れる。

さらに問題なのは **"Customize colors and style to match `.company/steering/brand.md` if available"** という逃げ文。if available でなく required。brand.md がない状態で default が動くこと自体がリスク。

**不採用、ただし構造は参考**: HTML+CSS+Playwright で screenshot → JPG という pipeline 自体は筋がいい。nokaze-design skill 側に同等機能を持たせる時は:
- default を持たない (brand.md 必須、なければ error)
- template の font は `Noto Serif JP` + `Noto Sans JP` + `JetBrains Mono` 固定
- color は 4 色 (障子紙アイボリー `#f5f0e6` / 墨色 `#1a1a1a` / オリーブ `#6b7a4f` / 風化木 `#8b7355` 暫定値、決定は brand_decisions_log 側) から選択制
- "Technology x Professional" 表現は禁止、一点差しの余白設計を強制

この再設計は Iwa + Akari 共同で着手するのが適切。

### 3.3 Publisher agent の "Fully Autonomous" 全 pipeline 自動化 (不採用、部分採用)

Publisher agent は plan → write → score → cover → publish → promote → sales tracking までを **途中確認なしで完走** させる。1 年 production で回っているので動くのは間違いない。

**nokaze で採らない理由**:
1. **200 確認 ritual との衝突**: CLAUDE.md で明文化済の「push 済み = 公開成立ではない、外部 WebFetch 200 で初めて成立」ritual と、"publish to platform → 完了報告" という publisher agent の fire-and-forget 設計は矛盾する。
2. **一点差し美学との衝突**: 機械的に全 chapter を quality gate 通過させて publish する pipeline は、nokaze の「出すタイミングを読む」判断を削る。2026-04-23 の Zenn rate limit rolling window 4 本制約は、pipeline の途中で必ず人間 (or Akari 独立判断) が timing を読む必要がある。
3. **失敗の扱いが違う**: AI-CEO は error-log に append して 3 回連続で escalate。nokaze は knots ledger + 金曜 review で **失敗を brand の糧として取り込む** 思想。自動 retry 3 回は nokaze の失敗観と相性が悪い。

**部分採用**: 2.1 で述べた「途中確認なし、完成品のみ報告」は採る。ただし "publish" step まで自動化するのではなく、"公開前 draft 提示" までを自動化し、公開自体は 200 確認 ritual に戻す。

---

## 4. 不明点 / 追加調査したい点

1. **scoring rubric の production 実績**: 75 点 gate で書いた記事が、AI-CEO 側で CV 率や読了率としてどう効いているか。rubric が「合うプラットフォーム (SEO 重視 blog)」と「合わないプラットフォーム (Zenn のような技術者コミュニティ)」の差が出ているはず。JOINCLASS blog の実データが見たい。
2. **書き手の個性維持率**: polish-content が `Preserve the author's voice` と書いているが、実際どこまで維持できているのか。Content Engine が書く全記事が rubric に引っ張られて同質化していないか。JOINCLASS blog を 5 記事読み比べて判定したい (本 review の時間枠では未実施)。
3. **steering/brand.md の実物**: repo に steering/brand.md がない (`/ai-ceo:init` で生成される。私が見たのは policies.md と permissions.md のみ)。JOINCLASS 自社の brand.md がどの粒度で書かれているか、サンプルが欲しい。
4. **15 agent の衝突解消**: Publisher と CMO と Content Engine の責任分担が重なっている (全員 "content" 扱える)。CEO orchestrator が routing しているが、実運用で権限争いや重複作業が起きないのか。nokaze でも Akari / Oto / Iwa の責任境界が曖昧な局面 (2026-04-22 Booth 操作) があった。
5. **1 人の CEO が 15 agent を回すコスト**: context 消費 10-15% 制約で thin orchestrator を維持しても、morning digest + approval queue + cross-product management + hypothesis validation gatekeeper を同時に回すのは重い。実際の運用時間と認知負荷のデータが見たい。

---

## 5. jun への提案 (review 議題化候補)

### 5.1 即採用案 (override 権限で Akari が判断、jun 確認は事後)

- **nokaze-polish skill 新設** (AI-CEO polish-content 参考、nokaze 美学版 checklist、scoring なし)
  - 着手者: Akari (skill ファイル草稿) → Iwa (skill 登録と動作確認)
  - 所要: 2-3 時間
  - 撤回条件: 初回 Zenn 記事で「過剰編集で Akari voice が消えた」と jun が判定した場合、skill 停止
- **Akari の jun 確認頻度削減ルール化** (Publisher agent の「途中確認なし」原則を Akari 運用に明文化)
  - brand_decisions_log.md に operating rule 追加
  - override 使用時は「推奨案 + 根拠 + 撤回条件」を 1 メッセージで提示、途中経過は送らない

### 5.2 Zen + Akari 合議案 (金曜 review 議題、jun 確認推奨)

- **`nokaze/steering/` ディレクトリ新設** (2.2 提案)
  - 影響範囲: CLAUDE.md の薄 orchestrator 化、各 sub-agent の reference file path 変更
  - Iwa (アーキテクチャ) + Akari (brand 正本管理) 共同設計
  - risk: CLAUDE.md 既存運用との移行コスト、team_memory/ との二重化
- **generate-cover 相当の nokaze 版 cover generator** (3.2 部分採用)
  - 現状 nokaze-design skill に cover 生成が未整備。BOOTH / Gumroad 商品 cover は手作業。
  - HTML+CSS+Playwright pipeline 自体は有効、brand 制約付きで再実装

### 5.3 不採用だが Kai/Zen で議論したい案 (金曜 review 提起)

- **content 品質の数値 scoring 導入**: brand 軸では 3.1 で不採用と判断した。ただし WSD (B2B 定期レポート) 側では数値 scoring が効く可能性がある。Kai 側の意見を聞く価値あり。境界線: Nexus Lab/Zenn = 数値 scoring なし、WSD 定期レポート = 数値 scoring 検討可。
- **Publisher 相当の「1 コマンドで書籍 1 冊」agent 新設**: nokaze は現状書籍を出していない。Phase 2 で Gumroad premium template + 技術書セット販売を検討する時に、Publisher agent 思想が効く可能性。今は時期尚早。
- **15 agent 体制と nokaze 7 人体制の比較総括**: 職能軸 vs 人格軸の組織設計は、両者とも動くが哲学が違う。jun が長期的にどちらに寄せたいかの意思決定は、次の半期境界で再検討すべき。

---

## Appendix: 判定サマリ

| 項目 | 判定 | 根拠 |
|---|---|---|
| Publisher 途中確認なし原則 | **採用 (限定)** | Over-confirmation Trap 既知、production 1 年実績、200 確認 ritual は維持 |
| steering/ 集中化 | **部分採用** | 参照先分散の解消、ただし nokaze-design skill と正本並立 |
| polish-content skill 分離 | **採用** | 属人性削減、checklist は nokaze 美学版で書き換え |
| write-blog 75 点 scoring | **不採用** | rubric に合わせる誘因 → 一点差し美学と衝突 |
| generate-cover default design | **不採用** | `#1e3a8a + #f97316 + Segoe UI` は nokaze と全面衝突、再設計必須 |
| Publisher 全 pipeline 自動化 | **不採用** | 200 確認 ritual / rate limit / 失敗観と矛盾 |

---

## 核心判断 (1 点)

**AI-CEO Framework は「量と速度で勝つ」framework、nokaze は「一点差しで刺す」屋号。取り入れるのは委任思想 (Publisher の途中確認なし) と構造 (steering/ 集中化、polish skill 分離) のみ。美学 (generate-cover default, write-blog scoring) は流用しない。**

---

(レビュー終了。このファイルは brand custodian 独立見解として Akari 責任で保管。brand_decisions_log.md に要約を転記する運用は次セッションで判定。)
