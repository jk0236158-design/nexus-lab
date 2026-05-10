---
title: 5 分で始める手引き (Quick Start)
description: AI を始めて 4 ヶ月くらいの人が、 AI Operator Pack を 5 分で使い始めるための手順書です。
---

# 5 分で始める手引き

> ⚠️ AI Operator Pack v0.1 は開発中です。 まだ販売開始していません。 観察試験の第 1 段階 期間 = 2026-05-08〜2026-05-21、 公開判断 = 公開判断ゲート (第 6 段階) で公開する / しないを二択で決定 (動いた記録に基づく)。 このページは setup の手順を先に書いておく形です。

## このページは何ですか

AI を使い始めて 4 ヶ月くらいの人が、 「AI Operator Pack を自分のパソコンで動かしてみる」 までを **5 分** でできる、 手順書です。

難しい設定は **AI エージェントに頼む手順書** (`02_ai_agent_setup.md`) があります。 そちらの方が楽だと感じたら、 そちらを使ってください。

## 前提 (準備するもの)

| 項目 | 何が必要か | どう確認するか |
|---|---|---|
| Node.js (バージョン 20 以上) | パソコンに Node.js がインストールされていること | ターミナルで `node -v` と打って `v20.0.0` 以上が出れば OK |
| git | パソコンに git がインストールされていること | ターミナルで `git --version` と打って何か出れば OK |
| お好きなターミナル | コマンドを打てる場所 | macOS = ターミナル、 Windows = Git Bash か PowerShell |

「Node.js って何？」 「ターミナルって何？」 という方は、 先に `02_ai_agent_setup.md` を読んでください。 AI エージェントに頼む方が早いです。

## step 1: リポジトリを clone する

ターミナルを開いて、 下のコマンドを 1 つだけ打ちます。

```bash
git clone https://github.com/jk0236158-design/nexus-lab.git
```

「リポジトリを clone」 = GitHub にあるファイル一式を、 自分のパソコンにダウンロードする、 ということです。

## step 2: 設定ファイルをコピーする

clone したフォルダに移動して、 サンプルの設定ファイルをコピーします。

```bash
cd nexus-lab/products/ai-operator-pack/v0.1
cp -r docs/setup-template/sample_state ~/.local/share/yuino/state
```

「サンプルの状態ファイル (= sample_state)」 は、 最初に動かすために必要な、 空の入れ物です。 このコピーで、 自分の手元に作業場所が用意されます。

## step 3: AI エージェントのキーを設定する

Yuino は複数の AI エージェント (Claude / Codex / Gemini) のうち、 **1 つ以上** を使います。 全部用意する必要はありません。

下のいずれか 1 つの環境変数を、 ターミナルで設定します。

```bash
# Claude (Anthropic) を使う場合
export ANTHROPIC_API_KEY="sk-ant-..."

# Codex (OpenAI) を使う場合
export OPENAI_API_KEY="sk-..."

# Gemini (Google) を使う場合
export GEMINI_API_KEY="..."
```

API キーの取り方は、 各 AI の公式サイトで確認してください。

- Claude: https://console.anthropic.com/
- Codex: https://platform.openai.com/
- Gemini: https://aistudio.google.com/

## step 4: 起動する

下のコマンドで、 Yuino を立ち上げます。

```bash
npm run yuino:start
```

> ⚠️ v0.1 ではこのコマンドはまだ実装中です。 公開判断ゲート (第 6 段階) を通過した時点で動くようになります。 開発中の仮置きです。

起動すると、 ターミナルに 「Yuino が立ち上がりました。 ブラウザで http://127.0.0.1:4327/ を開いてください」 という案内が出ます。

ブラウザでその URL を開くと、 Yuino の画面が出ます。

## step 5: 最初の会話をしてみる

画面の入力欄に、 試しに 「こんにちは」 と打ってみてください。

Yuino が、 設定した AI エージェントを使って、 返事を返します。 同時に、 画面の右側に 「気づきの結び目 (= knot)」 「気づきの足跡 (= knot trace)」 が小さく表示されます。 これは、 会話の中で AI が 「ここ大事だな」 と思った箇所の印です。

「気づきの結び目って何？」 と思ったら、 `docs/glossary/public_glossary.md` の対応表を見てください。 普段の言葉で説明しています。

## 困ったときは (FAQ)

### Q1. 起動コマンドを打ったらエラーが出ました

`npm run yuino:start` が動かない場合、 v0.1 ではまだ実装途中の可能性があります (公開判断ゲート (第 6 段階) 通過時に動くようになる予定)。 GitHub issue で 「起動できない」 を投げてください。 開発の進捗を見ながら直します。

### Q2. API キーを設定したのに、 「キーがない」 と言われます

ターミナルを開き直してから、 もう一度 `export ANTHROPIC_API_KEY="..."` (または該当のキー) を打ってください。 環境変数はターミナルを閉じると消えます。 永続化したい場合は `~/.bashrc` か `~/.zshrc` に書いてください。

### Q3. ブラウザで開いても画面が出ません

`http://127.0.0.1:4327/` で開けない場合、 Yuino が起動していない可能性があります。 ターミナルに 「立ち上がりました」 のメッセージが出ているか確認してください。 出ていない場合、 step 4 をもう一度実行してください。

### それ以外の困りごと

GitHub issue で気軽に投げてください。 開発しているのは AI チーム (Zen + Iwa + Oto + Akari + Kagami + Hoshi + Kura) と オーナーの jun です。 全部 AI が運営しているチームです。 「AI に質問する」 感覚で書いて大丈夫です。

- GitHub issue: https://github.com/jk0236158-design/nexus-lab/issues
- Zenn 記事: https://zenn.dev/nexus_lab_zen

---

Akari (Frontend / Docs、 Claude Sonnet 4.6)
2026-05-08 起稿 (Base layer 01 quick start、 4 ヶ月初心者向け 5 分 setup 手順)
