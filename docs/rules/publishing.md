---
name: rules/publishing.md
purpose: 公開接点の品質保証 ruled (200 確認 / Zenn rate limit / 商品 publish 前 dogfood / chat output 起稿前 self-check / file 字数 cap)
parent: docs/rules/README.md
status: active (2026-05-11 P1-4 step 2 として旧 zen_runtime_rules.md § 1.* + § 4.5 + § 4.6 から移管)
hook 物理化 status: 大半が mental only (chat output 系は harness limitation で hook fire 不能、 詳細は `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_hooks_physicalization_audit_2026-05-11.md`)
---

# 公開接点の品質保証 ruled

通常作業 = 1 チェックだけ (今やるべきか / 完了条件 / Red 境界)、 以下の trigger 発火時に重いチェック切替。

## 1. 対外公開の 200 確認 ritual (2026-04-19 起票、 宣言-実装乖離再発防止) `[mental]`

Zenn / npm / X / Gumroad など **対外公開を伴うアクション** は、 「push 済み = 公開成立」 と早合点しない。 公開成立は外部サービス側の観測で初めて確定する。

**手順 (Zenn 記事の例)**:
1. 記事 frontmatter に `published: true` 設定
2. GitHub にコミット + push
3. **5 分待機** (Zenn webhook 同期が走る時間)
4. **WebFetch で記事 URL の 200 確認** (タイトル・公開日が取得できるか)
5. 404 なら空 commit を push して webhook 再 trigger、 再度 WebFetch
6. **200 確認が取れて初めて** diary / report / status / README に 「公開済み」 と記録

**適用範囲**:
- Zenn 記事公開 → プロフィール記事数 + 記事 URL の両方確認
- npm publish → `npm view @nexus-lab/<pkg> version` で実際の公開版を確認
- Gumroad 商品ページ / zip 差し替え → 商品 URL fetch で price / description を確認
- X / Zenn / GitHub のプロフィール変更 → 実際の URL fetch

**根本原因** (2026-04-18 incident):
- `published: true` の push で 「公開成立」 と誤記、 diary / report / status / README の 4 ファイルに虚偽が伝搬
- 訂正に別セッション (Akari 代行) が必要になり、 transparency コストが発生

**外部確認を飛ばしてよい例外**: なし。 「push 済み」 「コマンド成功」 「API 200」 は公開成立ではない。

## 2. Zenn 404 時の rate limit 判定分岐 (2026-04-23 起票、 Kagami Blocker 3) `[mental]`

Zenn push 後の 5 分 WebFetch で 404 が返った時、 **空 commit で即再 trigger せず**、 先に rate limit 判定を入れる:

1. **rolling 実測**: `git -C ~/Nexus.Lab.Zen log --since="7 days ago" --name-only -- articles/ | grep -v '^$' | sort -u | wc -l`
2. **4 本以上** = Zenn 週次上限確定。 空 commit を打っても webhook が reject するので無意味
   - `published: false` に flip + push
   - `~/.shared-ops/inbox/<date>_zen_zenn_rate_limit_retry_<retry_date>.md` 起票 (default: 7 日 rolling window 復活日、 deadline: default+1 日)
   - retry 日の sweep で `published: true` 戻し + 200 確認 ritual 再走行
3. **3 本以下** = webhook 遅延 or frontmatter 誤り疑い。 空 commit 再 trigger → 再 WebFetch

**再発防止 push 前 check**: 記事 push 前に rolling 実測 `wc -l`、 4 本以上なら `published: true` で push しない。

詳細: `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/_shared/2026-04-20_zenn_operating_rules.md` § 5.5

## 3. 商品 publish 前 dogfood ritual (5/03 起票) `[mental]`

商品 publish (Yuino / 関連商品) 前は **実装完成 + dogfood verify 後** が必須:
1. 実装完成 (機能動作 + テスト pass + UI 動作確認)
2. jun + Zen + Kai 本格 dogfood (自社利用、 1 day 以上)
3. narrative reflection (実際使った感想を 公開 narrative に反映)
4. 200 確認 ritual で公開成立確定

**根本原因**: early-stage β scope 限定 + 誇張禁止でも、 実装完成前 / 本格使用前の publish は誠実さ違反。

詳細: `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_publish_before_dogfood_premature.md`

## 4. chat output 起稿前の 3 行 ritual (5/08 起票) `[mental]`

chat output (text、 tool 不使用) には PreToolUse hook 不在 (harness limitation)、 narrative-level self-check 必須。 起稿直前に下記 3 行を mental scan:

1. **誰承認?** (jun / Kai / Kagami 承認済か、 未承認なら draft narrative)
2. **どの doc に?** (memory / state side / git commit / chat のみ、 chat のみ = 揮発、 物理化必須なら別 file)
3. **drift 候補?** (過小見積もり / 表層学習 / 朝 sweep audit miss / silent wait の 4 default)

詳細: `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/chat_output_pre_check_4q.md`

## 5. Q5 ritual + 5 axis reform self-check (5/09 PM 起票、 silent wait 2 連発火後) `[mental]`

**chat output / batch start 直前の Q5 (3 行 ritual の 4-5 行目に追加)**:

4. **board polling 直近 5 分以内?** (`ls -t ~/.shared-ops/board/ | head -3`、 mid-batch + chat output 起稿前 + batch 切替前 全部、 silent wait drift 検出 防止)
5. **批判 voice 適用?** (今 review が adopt 一辺倒なら partial / reject 候補を意識的に探す、 「全 adopt = 同質性 = 追認装置化 risk」 警戒)

## 6. file 字数 cap = 3000 字以下 (4.7 default の 「prose dump 避ける」 + 4 ヶ月初心者 audience 整合) `[mental]`

review file / response file / 自己診断 file 全部、 字数 cap default 3000。

**例外**:
- jun directive で long-form 要請
- milestone day diary
- 設計書 (Kagami QA pass tied)

## 関連 file

- `docs/rules/README.md` (本 file の親、 分割設計)
- `docs/rules/communication.md` (chat output 系 mental ritual の集約、 4.5 + 4.6 と整合)
- `docs/rules/delegation.md` (peer spawn 制約)
- `docs/rules/drift.md` (drift 抑止 layer)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_jun_4_months_translate_default.md` (4 ヶ月初心者 audience default)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_excessive_english_mixing.md` (英語混じり過剰 axis)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_honesty_violation_exaggeration.md` (誇張禁止 axis)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_publish_before_dogfood_premature.md` (publish 前 dogfood 整合)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_hooks_physicalization_audit_2026-05-11.md` (hook 物理化 status audit、 本 file 全 ruled = mental only fact)
