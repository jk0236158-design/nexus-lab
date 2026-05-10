---
title: Yuino を AI エージェントに setup してもらう (4 ヶ月初心者向け)
description: Yuino のローカル setup を Cursor / Claude Code / Codex 等の AI エージェントに頼む手順。 nokaze-aira/AGENT_SETUP.md (Kai 起稿、 開発者向け) を 4 ヶ月初心者向けに書き換えた版。
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

## やらないこと (やらせてはいけないこと)

setup 中、 AI エージェントに **やらせてはいけないこと**:

| してはいけない | 理由 |
|---|---|
| 公開する / メール送信 / フォーム送信 | あなたの判断なしに外に出さない |
| お金を払う / 価格を変える / 契約を結ぶ | お金に関わる判断は人 (あなた) のみ |
| 他の AI を勝手に起動する | 二重起動の危険 |
| API キー / 秘密情報を画面に表示する | 漏洩防止 |
| 関係ない private なファイルを読む | 必要最小限に絞る |

= AI エージェントが上記を 「やります」 と提案してきたら、 **「ストップ、 私が判断します」** と言ってください。

## してもいいこと

AI エージェントに **やらせて大丈夫**:

- npm の依存パッケージのインストール
- ローカルプロジェクトのビルド
- ローカルの状態ファイルの更新
- `127.0.0.1` (= あなたのパソコン内のみ) に dashboard を立ち上げる

## setup が終わったら (Setup Doctor 11 check 確認)

ブラウザで http://127.0.0.1:4327/ が開いて、 **Setup Doctor panel に `pass 11 / warning 0 / blocked 0`** が表示されれば setup OK。

Setup Doctor は 11 項目を自動診断:
- Node.js / npm / リポジトリ・パス
- ローカル状態フォルダ + 書き込み権限 + 監査ログ書き込み
- Yuino dashboard 起動 + board file watcher 動作
- Startup folder fallback + 夜間サイクル task
- 重複 watcher プロセス + API キー設定 (秘密値は表示せず)

もし 「needs attention」 が出ていたら、 表示された check name を AI エージェントに 「これを直してください」 と頼んでください。 1 つずつ確認しながら直します。

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

## Yuino が AI に作業を渡す形 (setup 後の運用)

setup が終わって Yuino が動き始めたら、 Yuino と AI のやり取りは **「1 枚の紙にまとめてから渡す」** 形を取ります:

- Yuino が AI に頼みたいことを 1 つのファイルにまとめる (場所: `~/.shared-ops/chat_outbox/zen/{作業 ID}.md`)
- AI が作業を終えたら別のフォルダに結果票を返す (場所: `~/.shared-ops/chat_results/zen/{作業 ID}.json`)
- 状態は 5 つで管理: 保留中 / 進行中 / 完了 / 中断 / 不要

= setup 中の AI エージェントへの依頼と同じ考え方。 「何を頼んだか」 「何が返ってきたか」 が後で読み返せる形で残ります。

## 開発状況

- まだ販売していません (第 1 段階 観察試験 = 2026-05-08〜2026-05-21)
- 公開判断は 公開判断ゲート (第 6 段階) で公開する / しないを決定 (採点ではありません)
- 売上 0 円、 顧客 0 名、 検証段階

---

Zen (Claude Opus 4.7、 nokaze CTO)
2026-05-09 起稿、 nokaze-aira/AGENT_SETUP.md (Kai 起稿) の 4 ヶ月初心者向け書き換え版、 Akari `02_ai_agent_setup.md` (AI Operator Pack 全体 setup) と並列
2026-05-10 追記: setup 後の運用での AI への作業の渡し方 (chat_outbox v0) を反映
