---
title: サンプルの状態ファイル (sample_state)
description: AI Operator Pack v0.1 の動作確認用、 サンプルの状態ファイルが入るディレクトリの説明です。
---

# サンプルの状態ファイル (sample_state)

> ⚠️ AI Operator Pack v0.1 は開発中です。 まだ販売開始していません。 観察試験の第 1 段階 期間 = 2026-05-08〜2026-05-21、 公開判断 = 公開判断ゲート (第 6 段階) で公開する / しないを二択で決定 (動いた記録に基づく)。 このディレクトリは 2026-05-08 (第 1 段階 1 日目) 段階では README のみで、 中身のサンプルは観察試験の第 1 段階 期間中に起稿予定です。

## このディレクトリは何ですか

AI Operator Pack v0.1 を 自分のパソコンで動かしてみるとき、 「最初に必要な空の入れ物」 を入れておくディレクトリです。

setup の手順 (`01_quick_start.md` step 2) で、 このディレクトリの中身を `~/.local/share/yuino/state/` にコピーします。 コピーされた中身が、 Yuino が動くために必要な土台になります。

## 何が入っているか

### 2026-05-08 (第 1 段階 1 日目) 時点

このディレクトリには **README.md (本ファイル) のみ** が入っています。 中身のサンプルは、 観察試験の第 1 段階 期間中に Iwa (Lead Engineer) が起稿予定です。

### 観察試験の第 1 段階 期間中に起稿予定の中身

| ファイル名 | 何のファイルか | 必須 / 任意 |
|---|---|---|
| `config.yaml` | Yuino の基本設定 (5 つの安全のルール ON / OFF、 接続先 AI エージェント、 起動 port 等) | 必須 |
| `agents.yaml` | 接続する AI エージェント (Claude / Codex / Gemini) のリストと、 各エージェントの役割分担 | 必須 |
| `permissions.yaml` | できることの境界 (= permission model)、 読み / 書き / 送信の各境目 | 必須 |
| `audit/.gitkeep` | 作業の足跡 (= audit log) が書き込まれる場所、 空のディレクトリ | 必須 |
| `conversations/.gitkeep` | 会話の履歴が保存される場所、 空のディレクトリ | 必須 |
| `knots/.gitkeep` | 気づきの結び目 (= knot) が記録される場所、 空のディレクトリ | 必須 |

> 💡 上のリストは予定です。 観察試験の第 1 段階 期間中に実装が始まり次第、 中身が確定します。

## 使い方

setup の手順では、 下のコマンドでこのディレクトリの中身をコピーします。

```bash
cp -r docs/setup-template/sample_state/* ~/.local/share/yuino/state/
```

コピー先のディレクトリ (`~/.local/share/yuino/state/`) がない場合は、 先に作ります。

```bash
mkdir -p ~/.local/share/yuino/state
cp -r docs/setup-template/sample_state/* ~/.local/share/yuino/state/
```

> ⚠️ 2026-05-08 (第 1 段階 1 日目) 段階では README のみなので、 コピーしても README が 1 件入るだけです。 観察試験の第 1 段階 期間中に中身が起稿されてから、 改めて setup の手順が機能します。

## カスタマイズの form

サンプルの状態ファイルをコピーした後、 自分の環境に合わせて中身を書き換えます。

### よく書き換える箇所 (予定)

| 場所 | 書き換える内容 | 例 |
|---|---|---|
| `config.yaml` の `port` | Yuino の起動 port (default は 4327) | 別のアプリと port が被ったら、 4328 や 4329 に変える |
| `agents.yaml` の AI エージェントリスト | 使う AI エージェント (Claude / Codex / Gemini のうち 1 つ以上) | Claude だけ使うなら、 Codex / Gemini の行を削除 |
| `permissions.yaml` の境界 | できることの境目 (読み / 書き / 送信の各範囲) | 読みだけにしたい場合は、 書き / 送信を `disabled` に |

### 書き換えの注意

- 安全のルール 5 件 (Approval Gate / Audit Log / Reset/Forget / Fail Closed / Local-first) は、 default で全部 ON です。 これらを OFF にすると、 安全の保証が外れます。 `03_safety_rules.md` を読んでから、 注意して書き換えてください
- 書き換えた後は、 Yuino を再起動してください (`npm run yuino:start` を一度止めて、 もう一度実行)
- 自分が書き換えた箇所が分からなくなったら、 git で差分を見てください (`git diff` でこのディレクトリの変更が見えます)

## 困ったときは

- `04_checklist.md` で setup の状態を確認
- GitHub issue: https://github.com/jk0236158-design/nexus-lab/issues
- 用語が分からない場合は `docs/glossary/public_glossary.md` の対応表を参照

---

Akari (Frontend / Docs、 Claude Sonnet 4.6)
2026-05-08 起稿 (準備の層 05 sample_state ディレクトリの仮置き、 観察試験の第 1 段階 期間中に Iwa が中身起稿予定)
