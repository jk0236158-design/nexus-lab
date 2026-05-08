---
title: 確認チェックリスト (setup 完了後)
description: AI Operator Pack の setup が終わった後、 ちゃんと動くかを 1 件ずつ確認するチェックリストです。
---

# 確認チェックリスト

> ⚠️ AI Operator Pack v0.1 は開発中です。 まだ販売開始していません。 観察試験 Phase 1 期間 = 2026-05-08〜2026-05-21、 公開判断 = Phase 6 Launch Readiness Gate (yes/no decision、 evidence ベース)。

## このページは何ですか

`01_quick_start.md` か `02_ai_agent_setup.md` で setup を終えた後、 「全部ちゃんと動いているか」 を 1 件ずつ確認するチェックリストです。

setup が完了したと思ったら、 このページを上から順番に確認してください。

## 環境のチェック (3 件)

| | 確認項目 | どう確認するか |
|---|---|---|
| ☐ | Node.js v20 以上が入っている | ターミナルで `node -v`、 `v20.0.0` 以上が出れば OK |
| ☐ | git が入っている | ターミナルで `git --version`、 何か出れば OK |
| ☐ | お好きなターミナルが使える | ターミナルでコマンドを打って実行できれば OK |

3 件全部 ☐ が ☑ になっていますか？ 1 件でも No なら、 `01_quick_start.md` の前提に戻ってください。

## AI エージェントのキー設定 (1 件)

| | 確認項目 | どう確認するか |
|---|---|---|
| ☐ | Claude / Codex / Gemini のうち、 **1 つ以上** のキーを設定した | ターミナルで `echo $ANTHROPIC_API_KEY` (または該当のキー) を打って、 `sk-...` のような値が表示されるか |

3 つ全部設定する必要はありません。 1 つでも OK です。

設定したキーが表示されない場合、 ターミナルを開き直して、 もう一度 `export ANTHROPIC_API_KEY="..."` を打ってください。

## 設定ファイルのコピー (1 件)

| | 確認項目 | どう確認するか |
|---|---|---|
| ☐ | sample_state がコピーされている | ターミナルで `ls ~/.local/share/yuino/state/` を打って、 ファイルがいくつか出れば OK |

何も出ない場合、 `01_quick_start.md` の step 2 をもう一度実行してください。

## 安全のルールの適用確認 (5 件)

`03_safety_rules.md` の 5 つのルールが、 全部ON になっているか確認します。

| | 安全のルール | 確認の form |
|---|---|---|
| ☐ | 承認の関所 (Approval Gate) ON | 設定ファイルに `approval_gate: enabled` が書かれているか |
| ☐ | 作業の足跡 (Audit Log) ON | 設定ファイルに `audit_log: enabled` が書かれているか |
| ☐ | 全消し (Reset/Forget) 使える | 画面に 「全消し」 ボタンが表示されているか (起動後) |
| ☐ | 怪しい時は止まる (Fail Closed) ON | 設定ファイルに `fail_closed: enabled` が書かれているか |
| ☐ | 手元で動く (Local-first) ON | 設定ファイルに `local_first: enabled` が書かれているか |

5 件のうち、 1 件でも OFF があれば、 `03_safety_rules.md` を読んでから、 sample_state の設定を確認してください。

> 💡 これらは sample_state の default 設定で全部 ON になっています。 自分でわざわざ書き換えていない限り、 全部 ON のはずです。

## 最初の会話 (動作確認、 1 件)

| | 確認項目 | どう確認するか |
|---|---|---|
| ☐ | Yuino が起動して、 最初の会話が成立した | ブラウザで `http://127.0.0.1:4327/` を開き、 「こんにちは」 と入力して返事が返ってくれば OK |

> ⚠️ v0.1 では起動コマンド (`npm run yuino:start`) はまだ実装途中です (公開判断 Phase 6 通過時に動くようになる予定)。 この項目は公開判断通過後に確認できるようになります。

## 「うまく動かない」 ときの対処 (3 件)

setup の途中で、 何かうまく動かない場合の対処です。

### 対処 1: GitHub issue を投げる

下の URL から、 issue を投げてください。 AI チームが対処します。

- GitHub issue: https://github.com/jk0236158-design/nexus-lab/issues

issue を書くときは、 下の情報を入れてください:

- どの step で止まったか (例: step 3 の API キー設定)
- 何のエラーが出たか (ターミナルのメッセージをコピペ)
- 自分の OS (macOS / Windows / Linux) と、 Node.js のバージョン

### 対処 2: FAQ を見る

`01_quick_start.md` の最後に FAQ があります。 よくある困りごと 3 件を載せています。

### 対処 3: Discord で質問する (準備中)

Discord でリアルタイムに質問できる場所を準備中です。 公開判断 (Phase 6) 通過後に開設予定です。 今は GitHub issue でお願いします。

## 全部チェックが終わったら

7 件 (環境 3 + キー 1 + コピー 1 + 安全 5 + 動作 1 = 11 件のうち、 必須 11 件) が全部 ☑ になったら、 setup 完了です。

その後の使い方は、 下の docs を見てください。

- 用語の対応表: `docs/glossary/public_glossary.md`
- Yuino の demo の使い方: `docs/execution/yuino_demo.md` (観察試験 Phase 1 期間中に Kai 起稿予定)
- 仕組みの説明: `docs/execution/architecture.md` (観察試験 Phase 1 期間中に Kai 起稿予定)

---

Akari (Frontend / Docs、 Claude Sonnet 4.6)
2026-05-08 起稿 (Base layer 04 確認チェックリスト 11 項目、 4 ヶ月初心者向け)
