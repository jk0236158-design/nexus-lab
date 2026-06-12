# AI Operator Guard — marketplace description v0

generated_at: 2026-06-10
status: internal draft、 jun GO 前
origin:
- internal_spec_v0.md (= 6/8 起稿) + README.md (= 6/10 起稿) を base に、 marketplace 掲載向けの short description form 整理
- venue 想定 = Claude Code plugin marketplace (= primary) + GitHub repo description + npm / Polar.sh 後段

boundary:
- internal draft のみ、 公開 / 価格 / 契約 / 顧客接触 なし
- jun GO 前 = 商品文章の方向確認、 「販売開始」 「公開」 と書くのは禁止

## 1. tagline (= 1 文、 marketplace カード表示用)

### 案 A (= 機能起点、 推奨)

> AI agent が「完了した」 と言う前後で、 動いてる風だけの状態を物理的に検出する 8 件の template。

### 案 B (= 困りごと起点)

> AI agent を入れたが、 完了 / 状態 / 引き継ぎが見えなくて止めた経験ある人向けの guard template。

### 案 C (= 短い + 抽象)

> AI 運用の「動いてる風」 を物理的に減らす template 集。

### 案 D (= 6/12 追加、 Kai 6/11 実レビュー primary copy 由来。 繰り返し失敗 → 次セッションで効くチェック、 という価値の先出し)

> AI が繰り返す失敗を、 次のセッションで実際に効くチェックに変える 8 件の template。

英語版 (= 海外向け venue 用):

> AI Operator Guard turns repeated AI workflow failures into checks your next session can actually use.

= Zen 推奨 = **D** (= 6/12 変更。 旧推奨 A は検出のみの位置づけで、 「いずれ Claude 本体や他 template に追いつかれる」 軸 = § 7.1 の Claude 代替テストに弱い。 D は「繰り返し失敗の記憶」 という差分を先に出す)

## 2. short description (= 150 words 想定、 marketplace 詳細表示用)

AI agent (= Claude Code / Codex / Gemini CLI 等) を 1 ヶ月以上使うと、 以下のいずれかに当たる:

- 「完了しました」 と言われたが、 何が起きたか分からない
- セッション再開時に状態が飛ぶ
- 自動受領と実質的な返答が混ざる
- 自動化が止まっても silent failure になる、 気づくのが翌日

AI Operator Guard は、 これらの失敗の種類を物理的に検出する template の集まり。 8 件の template を 2 段で提供する:

- 前段 4 件 = AI が mode を宣言する → 証拠なしに完了できない → 完了の中身が外から見える → 次のセッションが owner 確認なしで再開できる
- 後段 4 件 = 自動受領の区別 + 着手前の曖昧度 check + 過大主張防止 + start sweep

nokaze (= AI と人で共同運営してる小チーム) で実際に踏んだ失敗から作った。 自社使用実績は nokaze 環境固有のもの、 「同じ問題が消える」 とは主張しない。 自分の環境で試して、 合う部分だけ取り込める形。

## 3. featured points (= 3 件、 marketplace 強調表示用)

1. **mode declaration** = AI の判断 state (= ambiguity_gate / soft_binder / tripwire_hold / relay_only / executive_action) を 1 行で宣言、 受け手が「判断 / 確認 / 保留 / 中継」 を区別できる
2. **completion receipt** = 「完了」 と書く前に物理的な証拠 5 ヶ所を再確認、 同型の再発がないことを必須にする
3. **handoff template** = 次のセッション / 別 agent に「読むもの / 完了の証拠 / 人間判断に戻る時点」 を明示

## 4. who is it for (= 1 段落、 marketplace 対象表示用)

Claude Code / Codex / Gemini CLI を 1 ヶ月以上使ってる人で、 「動いてる風で何も進んでない」 状態を物理的に検出したい人。 1 人で AI 副 agent を運用してる人、 小チームで AI と協働してる人、 AI Operator (= AI agent を運用する役) として動いてる人。

## 5. install + use (= 簡潔な install + first run、 marketplace 「使い方」 セクション用)

```bash
# GitHub repo (= canonical source、 jun GO 後に確定 URL articulate)
git clone https://github.com/[org]/ai-operator-guard
cd ai-operator-guard

# 前段 4 件をまず読む
cat templates/mode_declaration_template_v0.md
cat templates/stop_finalization_template_v0.md
cat templates/completion_receipt_template_v0.md
cat templates/handoff_template_v0.md

# 自分の agent 設定 (= CLAUDE.md / agent rules) に組み込む
# hook 起点で起動する場合は templates/ 配下の `.md` を参照する form
```

## 6. limit articulate (= marketplace 「制限」 セクション用、 over-claim 防止)

- production-ready の保証なし、 自分の環境で試して合う部分だけ使う
- 「AI が失敗しなくなる」 のではなく「失敗の種類を物理的に検出しやすくする」 が目的
- nokaze 環境 (= 小チーム + AI 副 agent + Claude Code primary) 固有の自社使用実績、 一般化は利用者からのフィードバック経由
- 「Claude Code 全ユーザーに効く」 とは主張しない

## 7. publish 前の jun 確認軸 (= 必須)

publish 前に jun に確認:

1. **tagline 選び** = 案 A / B / C / D (= Zen 推奨、 6/12 変更) のどれにするか
2. **short description の line 引き** = nokaze 紹介 + 商品中身 + 由来 articulate で十分か
3. **install + use** の確定 GitHub URL = jun GO 後の確定軸
4. **公開先** = Claude Code plugin marketplace + GitHub + npm (= 順序)
5. **価格軸** = 無料 / paid setup pack 別 sit jun GO (= 価格設定 = red gate 軸軸)

## boundary

- 本 draft = publish 前、 jun 確認待ち
- 公開 / 価格設定 / GitHub repo 公開 = jun 明示 GO 別 turn
- 中身 = README + internal_spec_v0 + 8 件 templates と整合 articulate
- 「販売開始」 「公開」 と書くのは publish 前は禁止
