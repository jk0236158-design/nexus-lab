---
name: rules/publishing.md
purpose: 公開接点の品質保証の決まり (200 確認 / Zenn の週次上限 / 商品公開前の自社使用 / チャット出力前の自己点検 / ファイル字数の上限)
parent: docs/rules/README.md
status: active (2026-05-11 P1-4 の手順 2 として旧 zen_runtime_rules.md § 1.* + § 4.5 + § 4.6 から移管)
hook 物理化 status: 大半が頭の中の決まり (チャット出力系は土台側の制限で hook が動かない、 詳細は `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_hooks_physicalization_audit_2026-05-11.md`)
---

# 公開接点の品質保証の決まり

普段の作業 → 1 点確認だけ (今やるべきか / 完了条件 / Red 境界)、 以下の引き金が立ったときに重い点検へ切り替える。

## 1. 対外公開の 200 確認の習慣 (2026-04-19 書き出し、 宣言と実装のズレ再発防止) `[頭の中]`

Zenn / npm / X / Gumroad など **対外公開を伴う行動** は、 「push 済み → 公開成立」 と早合点しない。 公開は外部サービス側の見え方で初めて確定する。

**手順 (Zenn 記事の例)**:
1. 記事の先頭設定に `published: true` を入れる
2. GitHub に保存 + push する
3. **5 分待つ** (Zenn 側の同期が走る時間)
4. **WebFetch で記事の URL に対する 200 応答を確認** (タイトル・公開日が取れるか)
5. 404 なら空の保存を push して再度同期を走らせて、 もう一度 WebFetch
6. **200 が取れて初めて** 日記 / 報告 / 状況 / README に 「公開済み」 と書く

**適用範囲**:
- Zenn 記事公開 → 自分のページの記事数と記事 URL の両方を確認
- npm publish → `npm view @nexus-lab/<pkg> version` で実際の公開版を確認
- Gumroad の商品ページや zip 差し替え → 商品 URL を取得して値段と説明を確認
- X / Zenn / GitHub のプロフィール変更 → 実際の URL を取得して確認

**もとの原因** (2026-04-18 の出来事):
- `published: true` の push で 「公開成立」 と誤って書いてしまい、 日記 / 報告 / 状況 / README の 4 ファイルに誤りが伝わった
- 訂正のために別の会話 (Akari 代行) が必要になり、 誠実さの代償が発生した

**外部確認を飛ばしてよい例外**: なし。 「push 済み」 「コマンド成功」 「API 200」 は公開成立ではない。

## 2. Zenn の 404 と週次上限の見分け (2026-04-23 書き出し、 Kagami が指摘した阻害要因 3) `[頭の中]`

Zenn に push してから 5 分後の WebFetch で 404 が返ったとき、 **空の保存をすぐに再 push しない**、 まず週次上限かどうかを見分ける:

1. **直近の本数を実測**: `git -C ~/Nexus.Lab.Zen log --since="7 days ago" --name-only -- articles/ | grep -v '^$' | sort -u | wc -l`
2. **4 本以上** → Zenn の週次上限が確定。 空の保存を push しても受け付けてくれないので意味がない
   - `published: false` に戻して push
   - `~/.shared-ops/inbox/<date>_zen_zenn_rate_limit_retry_<retry_date>.md` を書き出す (既定: 7 日間の枠が空く日、 期限: 既定+1 日)
   - 再試行の日に 1 巡確認で `published: true` に戻して、 200 確認の習慣を再度走らせる
3. **3 本以下** → 同期の遅れか、 先頭設定の書き間違いの疑い。 空の保存で再度同期を走らせて、 再 WebFetch

**再発防止のために push 前に確認**: 記事を push する前に直近本数を `wc -l` で測り、 4 本以上なら `published: true` のまま push しない。

詳細: `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/_shared/2026-04-20_zenn_operating_rules.md` § 5.5

## 3. 商品公開前の自社使用の習慣 (5/03 書き出し) `[頭の中]`

商品公開 (Yuino / 関連商品) の前は **実装完成 + 自社使用で確認した後** が必須:
1. 実装の完成 (機能の動作 + テストが全部通る + 画面の動作確認)
2. jun + Zen + Kai による本格的な自社使用 (実際の業務で 1 日以上)
3. 使った感想の振り返り (実際使ってみての印象を公開時の説明に書き込む)
4. 200 確認の習慣で公開を確定

**もとの原因**: 早い段階で範囲を絞ったベータ版 + 誇張を禁止していても、 実装完成前 / 本格使用前の公開は誠実さに反する。

詳細: `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_publish_before_dogfood_premature.md`

## 4. チャット出力前の 3 行点検 (5/08 書き出し) `[頭の中]`

チャット出力 (文字だけ、 ツール不使用) には PreToolUse hook が無い (土台側の制限)、 言葉の上での自己点検が必須。 出力する直前に以下の 3 行を頭の中で確認:

1. **誰の承認?** (jun / Kai / Kagami が承認済みか、 未承認なら下書きの言い方で)
2. **どこに残す?** (memory / 状態側 / git の保存 / チャットのみ、 チャットだけだと消える、 物理的に残すなら別ファイル)
3. **ズレの候補?** (見積もりが小さすぎる / 言葉だけの学び / 朝の点検の見落とし / 黙って待ち続ける の 4 つが既定)

詳細: `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/chat_output_pre_check_4q.md`

## 5. 第 5 の問い + 5 つの見直し点検 (5/09 PM 書き出し、 黙って待つ失敗が 2 連発火した後) `[頭の中]`

**チャット出力 / 一括処理を始める直前の第 5 の問い (3 行点検の 4 行目と 5 行目に追加)**:

4. **連絡フォルダの確認は直近 5 分以内?** (`ls -t ~/.shared-ops/board/ | head -3`、 処理途中 + チャット出力する直前 + 一括処理を切り替える前 全部、 黙って待ち続けるズレを見つける)
5. **批判する声を当てている?** (今の見直しが全部採用に寄っているなら、 一部採用 / 却下の候補を意識して探す、 「全部採用 → 同質化 → 追認装置になる危険」 を警戒)

## 6. ファイル字数の上限 → 3000 字以下 (4.7 既定の 「文章ダンプを避ける」 + 4 ヶ月初心者の読み手と そろえる) `[頭の中]`

見直しファイル / 応答ファイル / 自己診断ファイル の全部、 字数の上限は既定 3000 字。

**例外**:
- jun の指示で長文を要請されたとき
- 節目の日の日記
- 設計書 (Kagami の品質確認に紐づくもの)

## 7. 公開判断の 3 段階 ルーティング (5/31 書き出し、 Kai 5/31 articulate) `[頭の中]`

5/22 owner-decision (= 「外部投稿は Kai/Zen ダブルチェックで AI 実行可」) は **同一版 artifact の事前 double-check** が canonical 軸。 5/30 form b 6 巡 drift (= 過剰 review) + 5/31 Zenn bridge 事後 articulate (= 派生抜粋低 risk) の判断軸を明確化する 3 段階 ルーティング:

### green_fast — Zen self-check + 事後 short articulate

条件 (= 全て満たす):
- canonical の短い syndicate (= 既存 公開記事の派生抜粋)
- 本文の意味変更 なし
- CTA / 導線 / 比較表 の変更 なし
- 新しい 見出し / 買い手向け claim なし
- 価格 / 契約 / payment / 顧客実績 articulate なし
- route と account が既知 (= 既存合意 範囲)

対応: Zen self-check 5 軸 物理化 + 公開後 short articulate (= board 1 件)。 問題発見時は即 unpublish 可。

例: 5/31 Zenn bridge (= nokaze.dev form b の派生抜粋、 主要 articulate 1-2 件 + canonical link)。

### yellow_precheck — Kai 事前同一版 review 必須

条件 (= 1 件以上 該当):
- 新しい 見出し / CTA / 導線 / 比較表
- 買い手向け claim (= 「動く」 「使える」 「進んだ」 等の articulate)
- 本文の意味変更 (= canonical からの逸脱、 新規 articulate 追加)
- 媒体 / アカウント の新規 (= 既存合意 範囲外)

対応: 公開前に同一版 (= push する artifact そのもの) を Kai board に投げて green 受領後 公開。

例: 5/29 form b 本体 (= 5/22 中間更新からの新規 articulate、 6 章構成、 Kai 6 巡 review pass)。

### red_owner — jun 確認必須

条件 (= 1 件以上 該当):
- 有料 / 価格 / checkout / 契約 / 支払い 軸
- 顧客実績 claim
- account / profile change (= 初回 + 内容軸)
- secret / private material
- 成果保証 articulate
- 炎上 risk 軸 / 他者に直接届く送信

対応: jun に short chat で articulate + GO 受領後 動く。

例: Polar.sh 商品公開 (= 価格 + checkout + ファイル添付軸)、 note 投稿 (= account 認証軸)。

### 判定の順序

1. red_owner 条件を 1 件でも満たす → red_owner
2. yellow_precheck 条件を 1 件でも満たす → yellow_precheck
3. 全て満たさない → green_fast

= 「迷ったら yellow_precheck 側に倒す」 軸 (= 5/31 Kai articulate「事後 articulate を default にすると差分混入時に事故る」 軸の物理対策)。

### hold verdict の articulate 必須軸 (= 5/31 23:30 admit + 6/1 encode)

yellow_precheck / red_owner で hold judgement する時、 hold response の articulate に 以下の 2 軸を **必須** で含める:

1. **ボール明示** = 修正 fire 軸は誰か (= Kai 側 packet 修正 / Zen 側 docs 修正 / jun 確認軸の 3 種を明示、 「不明」 articulate ではなく明示形)
2. **次の fire 軸 trigger** = 修正後の next step (= 「修正後 re-review request 起稿 → Zen review → green → actual fire」 軸の cycle articulate)

この 2 軸が articulate されてない hold は、 「2 件 repair candidate 提示」 form のみで cycle が止まる drift を生む (= 5/31 work-622 hold sample = 私の hold response に「ボール明示」 が弱く、 Kai 側で「Zen 側で何かしてる」 と読む articulate になった drift)。

= **「hold = 止める軸」 だけではなく、 「次の動き軸の明示」 を含めて articulate**。 hold を「ボール明示なし」 で出すと cycle が止まる軸の物理対策。

詳細: board `~/.shared-ops/board/2026-05-31_kai_zen_substantive_response_zenn_bridge_form_b_published_yellow_green.md` + `2026-05-31_zen_kai_followup_work_622_repair_to_review_cycle_articulation.md`

## 関連ファイル

- `docs/rules/README.md` (本ファイルの親、 分割設計)
- `docs/rules/communication.md` (チャット出力系の頭の中の決まりの集まり、 4.5 + 4.6 と そろえる)
- `docs/rules/delegation.md` (仲間に頼むときの制約)
- ズレ抑止層の決まりファイル (本フォルダ内)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_jun_4_months_translate_default.md` (4 ヶ月初心者の読み手を既定にする)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_excessive_english_mixing.md` (英語混じり過剰の話)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_honesty_violation_exaggeration.md` (誇張禁止の話)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_publish_before_dogfood_premature.md` (公開前の自社使用と そろえる)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_hooks_physicalization_audit_2026-05-11.md` (hook 物理化の状況、 本ファイルの全決まりは頭の中の決まりだけ という事実)
