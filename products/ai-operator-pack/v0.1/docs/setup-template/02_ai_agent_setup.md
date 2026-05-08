---
title: AI エージェントに頼む setup 手順
description: Cursor / Claude Code / VS Code Copilot 等の AI エージェントに「これを setup して」と頼むだけで準備が終わる、 4 ヶ月初心者向けの手順書です。
---

# AI エージェントに頼む setup 手順

> ⚠️ AI Operator Pack v0.1 は開発中です。 まだ販売開始していません。 観察試験 Phase 1 期間 = 2026-05-08〜2026-05-21、 公開判断 = Phase 6 Launch Readiness Gate (yes/no decision、 evidence ベース)。

## このページは何ですか

AI Operator Pack を始めるとき、 ターミナルでコマンドを打つのが難しいと感じる方向けの手順書です。

代わりに、 すでに使っている **AI エージェント** (Cursor / Claude Code / VS Code Copilot 等) に **「これを setup して」 と頼む** だけで準備を終わらせます。

## なぜ AI エージェント経由か

- AI を使い始めて 4 ヶ月くらいの方は、 ターミナルやコマンド操作に慣れていないことが多いです
- 一方、 すでに Cursor や Claude Code を使ってコードを書いている人もいます
- 「自分の手でコマンドを打つ」 より、 「AI エージェントに頼む」 方が、 4 ヶ月初心者には楽で、 間違いも少ないです
- AI Operator Pack は AI エージェントと連携する道具なので、 setup から AI エージェントに任せるのが自然な form です

## どの AI エージェントを使うか

下の 3 つのうち、 自分が使い慣れているものを選んでください。

| AI エージェント | こういう人向け | 値段 |
|---|---|---|
| **Cursor** | エディタごと AI と連携したい人 | 月 $20 (無料枠あり) |
| **Claude Code** | ターミナルで AI と対話したい人 | Claude Pro 内 |
| **VS Code Copilot** | すでに VS Code を使っている人 | 月 $10 (学生無料) |

## Cursor 経由の setup

Cursor を起動して、 下の prompt をコピペして、 送ってください。

```
私は AI を使い始めて 4 ヶ月くらいです。 nokaze の AI Operator Pack v0.1 を、
自分のパソコンで動かしたいです。 下のことをやってください。

1. https://github.com/jk0236158-design/nexus-lab.git を clone してください
2. clone したフォルダの products/ai-operator-pack/v0.1/ に移動してください
3. docs/setup-template/sample_state/ を ~/.local/share/yuino/state/ にコピーしてください
4. ANTHROPIC_API_KEY (または OPENAI_API_KEY、 GEMINI_API_KEY のどれか 1 つ) を、
   私が後で入力できるよう、 ~/.bashrc か ~/.zshrc に書く準備をしてください
5. 最後に、 npm install を実行してください

各 step の後、 「OK でしたか」 を私に聞いてください。 私は yes / no で答えます。
```

Cursor が各 step を実行して、 確認しながら進めてくれます。

## Claude Code 経由の setup

ターミナルで Claude Code を起動して (`claude` コマンド)、 下の prompt を送ってください。

```
私は AI を使い始めて 4 ヶ月くらいです。 nokaze の AI Operator Pack v0.1 を
このパソコンで動かす準備をしてほしいです。

やってほしいこと:
- nexus-lab リポジトリを clone (https://github.com/jk0236158-design/nexus-lab.git)
- products/ai-operator-pack/v0.1/docs/setup-template/sample_state/ を
  ~/.local/share/yuino/state/ にコピー
- npm install を実行
- API キーを設定する場所 (~/.bashrc か ~/.zshrc) を私に教えて、
  どう書けばいいか sample を表示

私が分からない箇所があれば、 1 つずつ確認しながら進めてください。
```

Claude Code が、 ファイル操作とコマンド実行を私の代わりに行います。

## VS Code Copilot 経由の setup

VS Code を開いて、 Copilot Chat を開いて、 下の prompt を送ってください。

```
nokaze の AI Operator Pack v0.1 を、 このパソコンで動かしたいです。
私は AI を 4 ヶ月くらい使っているレベルです。

setup の手順を 1 つずつ、 私と一緒にやってください:

1. git clone https://github.com/jk0236158-design/nexus-lab.git
2. cd nexus-lab/products/ai-operator-pack/v0.1
3. cp -r docs/setup-template/sample_state ~/.local/share/yuino/state
4. npm install
5. API キー (ANTHROPIC_API_KEY か OPENAI_API_KEY か GEMINI_API_KEY のどれか 1 つ) を
   ~/.bashrc に追加する書き方を教えてください

各 step が終わったら、 「OK でしたか」 を聞いてください。 何かエラーが出たら、
私と一緒に対処してください。
```

Copilot Chat がターミナル操作の手順を、 1 つずつ案内してくれます。

## AI エージェントが何をするか

3 つの AI エージェントとも、 大体同じことを行います。

| 動作 | 中身 |
|---|---|
| **ファイルのコピー** | clone したフォルダの中の sample_state を、 自分の作業場所にコピー |
| **設定の書き換え** | API キーを `~/.bashrc` か `~/.zshrc` に書き、 環境変数として読み込めるようにする |
| **依存パッケージのインストール** | `npm install` で必要なライブラリを取得 |
| **動作確認** | `npm run yuino:start` の準備が整ったか、 確認 (v0.1 では起動コマンド自体は実装中) |

## AI エージェントが「分からない」 と言ったら

AI エージェントも完璧ではありません。 「これは分からない」 と言われたら、 下の項目を人間 (あなた) が確認してください。

| 確認する箇所 | 何を見るか |
|---|---|
| Node.js のバージョン | ターミナルで `node -v`、 v20 以上か |
| git のインストール | ターミナルで `git --version`、 何か出るか |
| API キーの値 | コピペミスがないか、 余分な space が入っていないか |
| ネットワーク | clone がエラーになったら、 wifi / VPN を確認 |
| 権限 | `~/.bashrc` に書き込み権限があるか (大体は OK) |

それでも分からない場合は、 GitHub issue で投げてください。 AI チームが対処します。

## setup が終わったら

`04_checklist.md` で、 setup が完了したか自分で確認できます。 1 つずつチェックしながら、 漏れがないか見てください。

その後、 最初の会話を試したいときは `01_quick_start.md` の step 5 を見てください。

---

Akari (Frontend / Docs、 Claude Sonnet 4.6)
2026-05-08 起稿 (Base layer 02 AI エージェント経由 setup、 Cursor / Claude Code / VS Code Copilot 3 path)
