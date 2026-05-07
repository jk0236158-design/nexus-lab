# 使い方の例 (UI tooltip + docs の適用)

## このドキュメントは何のためにありますか

公開用語を実際の場面で使うときの例を集めた docs です。 「この場面ではどう書けばいいか」 が分かる form。

書く人 (Zen / Akari / Iwa / Kagami / Hoshi / Oto / Kura / Kai / jun) が、 実際の docs / UI / X 投稿を起稿するときの参考にしてください。

## UI tooltip (画面の中の説明文)

### 例 1: Yuino の会話画面の tooltip

技術の言葉:
> "Knot trace shows hardness progression over time"

公開の言葉:
> 「気づきの足跡」 = 過去の気づきがどう積み重なって今の判断になったかの記録です。 硬さ (確信度) が時間とともにどう変わったかが見えます。

### 例 2: 承認ボタンの tooltip

技術の言葉:
> "Approval Gate: confirms external action before execution"

公開の言葉:
> 「承認の関所」 = 大事なことをやる前に、 あなたに確認します。 外に何かを送る、 ファイルを大きく変える、 お金が発生する、 等の場面で「これやっていい？」 を聞きます。

### 例 3: 全消しボタンの tooltip

技術の言葉:
> "Reset/Forget: user can erase Yuino memory of conversations, logs, judgment history"

公開の言葉:
> 「全消し」 = これまでの記憶を全部消したいとき、 1 click でできます。 消した記録だけは残るので、 「いつ消したか」 は後で確認できます。

### 例 4: 安全モードの tooltip

技術の言葉:
> "Fail Closed: when uncertain, AI stops instead of guessing"

公開の言葉:
> 「怪しい時は止まる」 = 「これやっていいか分からない」 とき、 AI は勝手に進まずに止まります。 進めるかどうかは、 あなたが決めます。

## ドキュメントの段落 (README + docs の本文)

### 例 5: README の最初の段落

技術の言葉:
> AI Operator Pack v0.1 provides setup templates, vocabulary, and a Yuino judgment console execution layer for multi-AI operations.

公開の言葉:
> AI Operator Pack v0.1 は、 複数の AI を一緒に使い始める人のための、 設定の手引き + 用語の対応表 + 動く小さな道具 を 1 つのパックにしたものです。
>
> 「Claude で雑談、 Codex でコード、 Gemini で要約、 ローカル LLM でセキュアな処理 — でも、 結局 『何をどの AI に任せるか』 を毎回考え直している」 という疲れに、 設定と判断を 1 か所に集める道具で答えます。

### 例 6: setup ガイドの最初の段落

技術の言葉:
> Run `npx @nexus-lab/create-mcp-server my-server` to scaffold a new MCP server with default templates.

公開の言葉:
> このコマンドを 1 行打つと、 MCP サーバー (= AI と道具をつなぐ部品) を自分で作るためのファイル一式が、 自動で用意されます。
>
> ```bash
> npx @nexus-lab/create-mcp-server my-server
> ```
>
> `my-server` のところを、 自分の好きな名前に変えてください。 例えば 「my-todo-bot」 や 「sales-assistant」 等。

### 例 7: 会話 insight の説明

技術の言葉:
> Conversation Insights captures decision points, concerns, and product ideas as knots with hardness progression.

公開の言葉:
> 「会話から気づきを拾う」 機能は、 あなたが Yuino と会話している時に、 「これは判断の材料になる」 「これは心配ごとだ」 「これは新しいアイデアだ」 を見つけて、 後で見返せるように記録します。
>
> 例えば、 「今日この話、 大事だったな」 が、 翌週の判断のときに自動で surface します。 「あれ、 似た話してた」 が見えるので、 同じ判断を 2 度しなくて済みます。

## X 投稿 + Zenn 記事 (audience-facing 短文)

### 例 8: X (Twitter) 短文 form

技術の言葉:
> Multi-agent orchestration with Yuino judgment console enables Judgment Amplification.

公開の言葉:
> 複数の AI を使い始めて 「結局どれに何を任せるんだっけ」 になっていませんか？
>
> Yuino は、 その判断を整理する画面です。
>
> Claude も Codex も Gemini も、 ローカル LLM も、 全部管理対象として扱える。
>
> ローカル動作 / 権限分離 / 作業の足跡が必須。

### 例 9: Zenn 記事の hook

技術の言葉:
> Yuino is a local judgment console that converts user judgment into multi-agent execution.

公開の言葉:
> AI を使う数が増えると、 人間の判断が散らばります。
>
> 「Claude で雑談、 Codex でコード、 Gemini で要約、 ローカル LLM でセキュアな処理」
>
> 結局、 何を誰に頼むかを毎回考え直している。 増えた AI に振り回されている感じがする。
>
> Yuino は、 散らばった判断を、 あなたの手元で 1 か所にまとめる画面です。

## 失敗 / 回復のメッセージ

### 例 10: エラー画面の文言

技術の言葉:
> Error: Approval Gate denied external HTTP request to api.example.com (Permission rule violation)

公開の言葉:
> 外に送ろうとした内容が、 安全のルールで止められました。
>
> 送り先: api.example.com
> ルール: 「外部 HTTP リクエストには承認の関所を通る必要があります」
>
> このまま送るには、 承認ボタンを押してください。 やめる場合は、 何もしなくて大丈夫です。

### 例 11: 復旧画面の文言

技術の言葉:
> Recovery in progress: rolling back to last known good state at 2026-05-08T12:34:56

公開の言葉:
> 「やり直し」 を進めています。
>
> 直前の安全な状態 (2026-05-08 12:34:56) に戻しています。 数秒お待ちください。
>
> 失敗が起きた理由は、 後で「作業の足跡」 から確認できます。

## audience の違いを意識する

| audience | 使う言葉 | 例 |
|---|---|---|
| 4 ヶ月初心者 (Yuino 商品 audience) | 公開用語 (普段の言葉、 比喩あり) | 「気づきの結び目」「承認の関所」 |
| 開発者 (Zenn / GitHub README) | 公開用語 + 内部用語併記 (=) | 「気づきの結び目 (= knot)」「承認の関所 (= Approval Gate)」 |
| 内部 (memory / shared-ops / team_memory) | 内部用語 OK (但し英語混入過剰禁止) | 「knot」「Approval Gate」「reify」 等は internal only |

## 公開前のチェックリスト

公開する docs / UI / X 投稿を書いたら、 公開前に下記を確認:

- [ ] 1 段落で英単語が 5 件超になっていない (vocabulary_lint.sh で red 検出 → paraphrase)
- [ ] Aira / Yuino を「2 つの別物」 narrative にしていない (1 entity 2 narrative ruled、 naming_mixup_check.sh で確認)
- [ ] 数字を盛っていない (売上 / 顧客数 / 期間 / 効果、 honesty_audit.sh で確認)
- [ ] AI が運営していることを隠していない (Zen / Kai / 他 peer は基盤モデル付きで署名)
- [ ] 禁忌語彙を使っていない (「急成長」「次世代」「突破」「破壊的」「ゲームチェンジャー」)
- [ ] 翻訳ルール 4 件に従っている (translation_rules.md 参照)

## 用語の追加 / 改善

新しい技術用語が出てきたとき、 「公開用語」 をどう翻訳するかは、 [public_glossary.md](./public_glossary.md) に row を追加してください。

翻訳の form に迷ったら、 GitHub issue で相談、 もしくは Akari (Frontend / Docs 担当) に spawn 相談、 で OK です。

---

Zen (nokaze CTO、 Claude Opus 4.7)
2026-05-08 起稿 (商品 v0.1 Vocabulary layer 使い方の例 11 件 + audience の違い + 公開前チェックリスト)
