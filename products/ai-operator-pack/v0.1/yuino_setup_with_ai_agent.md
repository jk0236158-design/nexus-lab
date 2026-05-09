---
title: Yuino を AI エージェントに setup してもらう (4 ヶ月初心者向け)
description: Yuino のローカル setup を Cursor / Claude Code / Codex 等の AI エージェントに頼む手順。 nokaze-aira/AGENT_SETUP.md (Kai 起稿、 開発者向け) を 4 ヶ月初心者 audience に paraphrase。
status: draft (開発中、 まだ販売していません)
audience: AI を使い始めて 4 ヶ月くらいの人で、 すでに Cursor / Claude Code / Codex のいずれかを使っている方
last_updated: 2026-05-09
related: [02_ai_agent_setup.md (AI Operator Pack 全体 setup)](docs/setup-template/02_ai_agent_setup.md)
---

# Yuino を AI エージェントに setup してもらう

> Yuino は、 1 人で複数の AI を使う人のためのローカル判断コンソール。 setup も AI エージェントに頼んで進められます。

## このページは何ですか

Yuino をあなたのパソコンで動かす準備を、 自分で 1 行ずつコマンドを打つ代わりに、 **すでに使っている AI エージェントに頼む** ための手順書です。

Cursor を使っているなら Cursor に。 Claude Code なら Claude Code に。 同じ form で setup してもらえます。

## やってもらうこと

AI エージェントに、 下の prompt をコピペして送ってください:

```
私は AI を使い始めて 4 ヶ月くらいです。 nokaze の Yuino をこの Windows パソコンで
動かしたいです。 下の手順で setup してください。

1. https://github.com/jk0236158-design/nokaze-aira を clone してください
   (注: 場所が見つからない場合、 「公開済みか?」 を私に聞いてください、 まだ非公開かも)

2. clone したフォルダで `npm install` を実行してください

3. `npm run yuino:first-run:local` を実行して、 first-run check を通してください
   (Node 20+ / git / write 権限 等の確認)

4. `npm run yuino:dashboard:serve` で dashboard を起動してください
   (http://127.0.0.1:4327/ にブラウザでアクセス、 「OK」 か 「needs attention」 が出ます)

5. 「needs attention」 があれば、 私と一緒に 1 つずつ確認しながら直してください

各 step の後、 「OK でしたか」 を私に聞いてください。 私は yes / no で答えます。
```

AI エージェントが step を 1 つずつ実行 + あなたに確認を取りながら進めます。

## やらないこと (boundary)

setup 中、 AI エージェントに **やらせてはいけないこと**:

| してはいけない | 理由 |
|---|---|
| publish / send email / form 送信 | あなたの判断なしに外に出さない |
| お金を払う / 価格を変える / 契約を結ぶ | 経理判断は人間 (あなた) のみ |
| 他の AI session を勝手に起動する | 二重起動 risk |
| API キー / 秘密情報を画面に表示する | 漏洩防止 |
| 関係ない private file を読む | 必要最小限に絞る |

= AI エージェントが上記を 「やります」 と提案してきたら、 **「ストップ、 私が判断します」** と言ってください。

## してもいいこと

AI エージェントに **やらせて大丈夫**:

- npm の依存パッケージのインストール
- ローカル project の build
- ローカル status file の refresh
- `127.0.0.1` (= あなたのパソコン内のみ) に dashboard を bind

## setup が終わったら

- ブラウザで http://127.0.0.1:4327/ が開いて 「OK」 になっていれば完了
- もし 「needs attention」 が出ていたら、 表示された check name を AI エージェントに 「これを直してください」 と頼んでください

## 困ったとき

| こうなったら | こう聞いてください |
|---|---|
| `npm install` でエラー | 「Node のバージョンを確認してください」 |
| dashboard が開かない | 「ポート 4327 が他のプロセスで使われていないか確認してください」 |
| Yuino-Setup.cmd が動かない | 「PowerShell の実行ポリシーを確認してください」 |
| API キーの設定方法が分からない | 「ANTHROPIC_API_KEY を ~/.bashrc か環境変数に設定する手順を教えてください」 |

## 相談先

[GitHub issue](https://github.com/jk0236158-design/nokaze-aira/issues) で投げてください (リポジトリが公開されていれば)。 まだ非公開期間中なら、 [nexus-lab issue](https://github.com/jk0236158-design/nexus-lab/issues) でも OK。

## なぜこの form なのか

- AI を使い始めて 4 ヶ月くらいの方は、 ターミナル不慣れなことが多い
- 一方、 Cursor や Claude Code は既に使っている人が多い
- 「自分でコマンドを 1 行ずつ打つ」 より、 **「AI エージェントに頼む」 方が 4 ヶ月初心者には楽で安全**
- Yuino は AI と一緒に運営する道具なので、 setup 自体も AI と一緒に進めるのが自然

## 開発状況

- まだ販売していません (Phase 1 観察試験 = 2026-05-08〜2026-05-21)
- 公開判断は Phase 6 Launch Readiness Gate で yes/no 決定 (採点ではありません)
- 売上 0 円、 顧客 0 名、 検証段階

---

Zen (Claude Opus 4.7、 nokaze CTO)
2026-05-09 起稿、 nokaze-aira/AGENT_SETUP.md (Kai 起稿) の 4 ヶ月初心者 audience paraphrase 版、 Akari `02_ai_agent_setup.md` (AI Operator Pack pack-level) との sibling
