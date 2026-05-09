---
title: Yuino Security Promise — 絶対妥協なし、 8 つの約束
description: Yuino の安全設計。 ローカル優先、 秘密分離、 承認ゲート、 権限階層、 監査ログ、 文脈最小化、 緊急停止、 失敗時クローズ の 8 軸。 商品価値の中心。
status: draft
audience: AI を運営する人 + 4 ヶ月初心者で 「AI に何でも任せて大丈夫?」 と不安な方
last_updated: 2026-05-09
---

# Yuino の安全についての 8 つの約束

> AI に判断を任せるとき、 「これは外に出したくない」 「これは私が決めたい」 「壊れた時に止めたい」 は譲れない。 Yuino は安全を **おまけ機能ではなく商品の中心** に置きます。

## 1. ローカル優先 (Local-first)

- 会話 / 判断 / 決定 / 監査ログ は **全てあなたのパソコンの中**
- クラウドにアップロードしません
- インターネット切れても動く部分を default に

= データの場所が常に明確。

**5/09 wire-level reify evidence**: Setup Doctor v0 が 「local diagnostics only」 boundary で 11 check 自動診断、 全 pass で `ready_for_beginner_setup: yes` を visible に。

## 2. 秘密の分離 (Secret Isolation)

- API キー / パスワード / 個人情報 は専用 storage に分離
- AI に渡す context に **意図しない秘密が混じらない**
- 設定画面で 「どの秘密がどこにあるか」 が見える

= 秘密は AI から隔離。

## 3. 承認ゲート (Approval Gate)

- 行動を 4 段階に分ける:
  - **読む** (read): 自動で OK
  - **下書き** (draft): 自動で作成、 公開しない
  - **内部実行** (internal_execute): 限定された範囲で自動 OK (whitelist 制)
  - **外部実行** (external_execute): **必ずあなたの判断必要**
- 「メール送る」 「お金払う」 「公開する」 は **外部実行**、 自動進行禁止

= 重要なことは必ず人間 (あなた) が承認。

## 4. 権限階層 (Permission Hierarchy)

- AI 各人に明確な権限レベル
- 「Codex はコードに触れる」 「Gemini は読むだけ」 を明示
- 設定画面で **誰が何にアクセスできるか** が一覧で見える

= 「いつの間にか AI が勝手に...」 を防止。

## 5. 監査ログ (Audit Log)

- 何が起こったか、 誰がやったか、 なぜ許されたか、 全て **改ざんできない form** で記録
- AI が何を考えたか、 どの判断を下したか、 後から追える
- 設定画面で 「過去 24 時間の AI 動作」 を 1 画面で確認できる

= 「気づいたら〇〇されてた」 を防止 + 必要なら追跡可能。

## 6. 文脈最小化 (Context Minimization)

- AI に渡す情報は **必要最小限**
- 「全部のファイル読ませる」 ではなく 「関連する部分だけ」
- 大きな context = 大きな漏洩 risk = 大きな誤動作 risk

= 「AI に全部見せれば賢くなる」 narrative を否定、 **少ない情報で正確に動く** 設計。

## 7. 緊急停止 (Kill Switch)

- 「今すぐ全部止めたい」 ボタンが常に visible
- 1 クリックで全 AI session 停止 + 全 outbox 凍結
- 「あれっ、 これ進めていいんだっけ?」 と思った瞬間に押せる

= 暴走時の最後の手段が **常に手元にある**。

## 8. 失敗時クローズ (Fail Closed)

- AI が判断に失敗した時 / 確信がない時、 **default 動作 = 何もしない**
- 「迷ったら進める」 ではなく 「迷ったら止まる + あなたに聞く」
- silent error 禁止、 全 失敗は visible

= 失敗の方向に倒れる。

## 8 軸の意味

これらは **おまけではない**:

- 「あったら嬉しい」 機能ではなく、 **「これがないと商品として成立しない」** 位置
- AI を業務で使う時、 **データ漏洩 / 暴走 / 誤判断** が許される場面はない
- nokaze は 「中身がいい会社」、 安全を 「うちは妥協しません」 と最初に宣言する

## 「妥協しない」 の意味

開発でよくあること:
- 「とりあえず動かして、 後でセキュリティ」 → 後で直されない
- 「ユーザーが面倒だから、 デフォルトを緩める」 → 後で事故る

Yuino の判断:
- **8 軸全て v0 から実装、 後付けではない**
- **デフォルトは安全側**、 緩めたい時は ユーザー (あなた) が明示的に変更
- 「不便」 と感じた時、 「不便な理由」 が表示される

= 安全のための不便は **理由が見える**、 我慢じゃなく納得できる form。

## 開発状況

- v0 実装中 (Phase 1 = 2026-05-08〜2026-05-21):
  - 1 ローカル優先 = 完了
  - 3 承認ゲート = 完了 (4 段階 enum + external_execute は 自動禁止 default)
  - 4 権限階層 = 完了 (provider 別 contract)
  - 5 監査ログ = 完了 (audit log + state mutation log)
  - 8 失敗時クローズ = 完了 (boundary 6 件)
- v1 reify (Phase 2 carry):
  - 2 秘密の分離 (Secret Isolation 強化)
  - 6 文脈最小化 (Context Minimization 設計)
  - 7 緊急停止 (Kill Switch UI)

## なぜこれを最初に書くのか

「セキュリティは後で」 になりがちだから。

Yuino を試そうかどうか考えている人には、 「機能の話」 より先に 「壊れない / 漏れない / 止まる」 を 知っていてほしい。

= 安全を 商品 narrative の **3 軸目 (Conversation Insights + Local Web App と並ぶ core)** に置きます。

---

Zen (Claude Opus 4.7、 nokaze CTO)
2026-05-09 起稿、 5/07 PM jun directive 「絶対妥協なし」 + `feedback_yuino_security_axis.md` 8 軸 を audience-facing form に paraphrase、 商品 3 軸目 narrative
