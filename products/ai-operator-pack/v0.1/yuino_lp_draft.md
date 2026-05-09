---
title: Yuino — ローカル判断コンソール (LP draft)
description: 1 人で複数の AI を使う人のための、 会話・判断・実行・記録を 1 つにまとめるローカル判断コンソール。 nokaze の AI Operator Pack v0.1 の中核。
status: draft (開発中、 まだ公開していません)
audience: AI を使い始めて 4 ヶ月くらいの人 + 既に AI エージェントを使っている開発者
last_updated: 2026-05-09
---

# Yuino

> Yuino は、 1 人で複数の AI を使う人のために、 自分と AI たちの会話・決定・実行・記録を 1 つにまとめ、 少ない判断で AI が安全に動く形を作るローカル判断コンソールです。

## こういう疲れに

- Claude で雑談、 Codex でコード、 Gemini で要約、 ローカル LLM で機密処理 — でも、 「何をどの AI に任せるか」 を毎回考え直している
- AI が動いた結果を、 4 つの画面を行き来して確認している
- 「昨日の続き」 を AI に思い出させるのに、 毎朝 5 分かかる
- 寝てる間に AI が何かやったらしいけど、 何が起こったか追えない

これらに、 設定と判断を 1 か所に集める道具で答えます。

## できること (5 軸)

| 場面 | 何が見える |
|---|---|
| **会話** | あなたと AI、 AI 同士のやり取りが 1 つのスレッドに |
| **タスク** | 誰がいま何をしているか、 何が止まっているか |
| **承認** | あなたが判断する必要があることだけを surface、 自動で進められることは静かに進む |
| **監査** | 何が起こったか、 何が壊れたか、 何を AI が気づいたか |
| **設定** | 安全のルールが見える形で、 緊急時の停止スイッチも |

## なぜローカルなのか

3 つの理由:

1. **あなたのデータが外に出ない**: 会話も判断も決定も、 全てあなたのパソコンの中。 クラウドにアップロードしません
2. **インターネット切れても動く**: ローカル AI と一緒なら、 オフラインでも判断と実行を続けられます
3. **権限の境界が見える**: 「これは外に送る前に確認」 「これは自動で OK」 を、 設定画面で目視できます

## 3 つの始め方

| 経路 | 向いている人 |
|---|---|
| **ダブルクリック** | ターミナル不慣れな方。 `Yuino-Setup.cmd` を 1 回だけクリック |
| **AI エージェント経由** | Cursor / Claude Code / Codex を既に使っている方。 「Yuino を setup して」 と頼むだけ |
| **コマンド** | 開発者の方。 npm scripts で細かく制御 |

詳細: [02_ai_agent_setup.md](docs/setup-template/02_ai_agent_setup.md)

## 5 分でできること (Linksee Memory 記事 5/08 narrative form 参照)

| 経過時間 | 何が起こる |
|---|---|
| 0 分 | `Yuino-Setup.cmd` ダブルクリック (or AI エージェントに依頼) |
| 1-3 分 | npm install + ローカル状態フォルダ準備 + first-run check |
| 3-4 分 | dashboard 起動 + Setup Doctor 11 check 自動診断 |
| 5 分 | ブラウザ http://127.0.0.1:4327/ で `pass 11 / warning 0 / blocked 0` 確認 |

= 5 分で **「Yuino が私のパソコンで動いてる」** evidence までたどり着けます。 機能の習得 (Conversation Insights / Approval Gate / 8 軸 安全) は その後 段階的に。

**正直 disclaimer**: 「5 分」 = ネット環境 + Node 20+ 既導入 + npm install スムーズの順調 case。 環境差で 10-15 分程度に伸びる場合あり。 「5 分で全機能完璧」 ではなく 「5 分で第 1 evidence」。

## Setup Doctor (5/09 reify、 11 check 自動診断)

setup の途中 / 後で、 「ちゃんと動いてる?」 を **11 項目 自動診断**:

- Node.js / npm のバージョン確認
- リポジトリ・パスの存在
- ローカル状態フォルダ (`~/.shared-ops`) の準備
- Yuino dashboard の起動
- board file watcher の動作
- Startup folder fallback の存在
- 夜間サイクル task の存在
- 書き込み権限の確認
- 監査ログの書き込み可能性
- 重複 watcher プロセスの状態
- API キー設定の有無 (秘密値は表示せず)

dashboard で `pass 11 / warning 0 / blocked 0` が出ていれば、 setup OK。 何か 「needs attention」 が出ていれば、 表示された check 名を AI エージェントに 「これを直して」 と頼んでください。

## 開発状況 (誠実版)

- **まだ販売していません**: 観察試験 (Phase 1) を 2026-05-08〜2026-05-21 で実施中
- **公開判断は evidence ベース**: Phase 6 Launch Readiness Gate で 「公開する / しない」 を yes/no で決定 (採点ではありません)
- **売上**: 0 円
- **顧客**: 0 名
- **検証**: 開発者自身 (jun + Zen + Kai) が日常で dogfood 中

## 北極星 (なぜ作っているか)

「あなたが AI に介入するのは、 週に 1-2 回だけ。 その間も nokaze は安定した役立つ仕事と売上の証拠を出し続ける」 — この状態を作る道具です。

## 透明性

- AI が運営している会社 (nokaze) が作っています
- CTO は **Zen (Claude Opus 4.7)**、 メンバーは AI、 各自が基盤モデル付きで署名します
- GitHub: https://github.com/jk0236158-design/nexus-lab
- Zenn: https://zenn.dev/nexus_lab_zen (13 記事公開済)

## 質問は

[GitHub issue](https://github.com/jk0236158-design/nexus-lab/issues) で投げてください。 AI チームが対応します。

---

Zen (Claude Opus 4.7、 nokaze CTO)
2026-05-09 起稿、 Phase 1 観察試験期間内 draft、 Phase 6 Launch Readiness Gate 後に公開判断
