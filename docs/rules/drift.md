---
name: rules/drift.md
purpose: ずれの抑止の層 (= 4.7 の文字通り解釈への対策 / AI の速度感での範囲の決め方 / 判断の安定を守る仕組み / Knot Guard の 8 つの危険分類)
parent: docs/rules/README.md
status: 現役 (= 2026-05-11 P1-4 の手順 5 として 旧 zen_runtime_rules.md の 4.1-4.4 から移管)
hook 物理化の状態: 全部頭の中の決まり、 詳細は `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_hooks_physicalization_audit_2026-05-11.md`
---

# ずれを止める層

## 1. Opus 4.7 の文字通り解釈 (= 5/19 z-r-11 で 元への参照に変更)

4/16 に Opus 4.6 → 4.7 切替後の動き方の変化。 5 件の運用ルール (= 表 + 箇条書きを既定 / 実装の量を翻訳する / 言い直し 2 回まで / 仲間呼び出しの並行の上限 3 / 短い形を強制しない)。 詳細 = 過去の書き出し + 参照 ([Opus 4.7 quirks](https://boringbot.substack.com/p/claude-opus-47-heres-what-works-and) / [April 23 postmortem](https://www.anthropic.com/engineering/april-23-postmortem))。

## 2. AI の速度を前提にした範囲の決め方 (= 5/19 z-r-11 で 元への参照に変更)

完成の像から始める + AI の速度で考える + 削るのは目的 (= 北極星 / 価値) で判断する + 「人間の開発速度」 で怖がらない。 大きな範囲を取って良い条件 6 件 (= 北極星と連動 / jun の介入が減る / 実際に前進する / 外部に価値がある / 安全に任せられる / 4 ヶ月の初心者にも使いやすい) vs 広げない条件 4 件 (= 新しい名前だけ / 追加のログだけ / 行動と連動しない / 抽象だけ)。 内部の実装 = 野心的、 外部の説明 = 簡潔。

## 3. 判断の安定を守る仕組み (= 5/19 z-r-11 で 元への参照に変更)

新しい意見の分類 4 件: **採用** (= 北極星 + 今までの判断 + 完成の像 + 安全境界 全部そろう) / **一部採用** (= 一部のみ) / **却下** (= 完成の像を小さくする / 人間速度で弱気) / **持ち主の判断** (= jun に直接確認)。 批判は役に立つ ≠ 批判で計画を変える、 これは別の判断。

## 4. Knot Guard (= 5/19 z-r-11 で 元への参照に変更)

AI の判断における 危険な / 過剰な 言い換えを 見つけて直す 仕組み = **8 つの危険分類** (= recency_drift / over_correction / instruction_override_attempt / permission_escalation / boundary_bypass / external_action_pressure / evidence_detachment / model_update_drift) + 6 つの適用 (= Yuino / WSD / broadcast-os / Nia / AI Operator / 指示の差し込みの防御)。

詳細 = `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_model_update_drift_knot_guard_8th.md`。

## 5. ずれを見つけた段目 1〜17 (= 5/19 z-r-11 で drift_registry.json に整理、 詳細は registry を参照)

機械が読める形 (= JSON registry) と 人が読める形 (= このファイルの段目専用の section) の 二層の構造。 1-17 段目の全部 + 物理的な仕組み 24 件 + 状態 / 関連ファイル の整理は registry の方:

```text
詳細: docs/rules/drift_registry.json (= 機械が読める形)
段目専用の section: 下記の 13 / 14 / 15 / 16 / 17 段目の section (= 物理対策の整理)
旧 1-12 段目の人が読む一覧は registry に整理済、 このファイルの表は削減 (= 5/19 z-r-11)
```

旧の表を削減した理由 = Iwa 22:55 「段を増やす = 繰り返し」 という指摘 + 同じファイルの中で 同じ整理を 2 回 (= 表 + 段目専用 section) 書く 問題の解体。

## 自分で使ってない商品を売ると書く違反を止める 形にする 道具 (= 13 段目専用、 5/17 書き出し)

**きっかけ**: 2026-05-17 jun が認めた重要な点 「mcp 商品で同じミスをしているのに今回も同じ。 対策をしてから行動しないとまた繰り返す」 と つながる。 頭の中の手順 のみ (= 5/03 書き出しのメモリー `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_publish_before_dogfood_premature.md`) では 1.5 ヶ月で繰り返した、 形にする 道具が 既定として 必須。

**形にする 道具 5 件 (= 5/19 z-r-13 で 頭の中の補強 #6 を削除、 形にした 仕組みのみ残す)**:

1. `scripts/zen_dogfood_preflight.sh <product>` → 商品の言い方を 言葉にする 前に必ず動かす、 証拠ファイルの存在確認 + 最終更新日の確認
2. `scripts/pre_commit_public_docs_audit.sh` の 5 番目の手順として 商品の言い方 + 自分で使った証拠のリンクの確認
3. 商品を管理している file の entry に 「自分で使った状態」 の欄を必須 (= 「未着手 / 進行中 / 完了」 + 最後の証拠の日付)、 自分で使い終わる前は 「販売開始 / publish」 の言い方の entry を禁止
4. `~/Desktop/nokaze/dogfood/<product>/<date>.md` の形を固定、 1 回使うごとに 1 ファイル (= 形の仕様は dogfood/README.md)
5. このファイル (= ずれ抑止層の 13 段目)、 自分が触ってない商品の言い方を出した時の検知ルールにする

## 対話の turn が変わると自走のペースが落ちるのを止める 形にする 道具 (= 14 段目専用、 5/18 書き出し)

**きっかけ**: 2026-05-18 朝 jun が気づいた重要な点。 5/16 - 5/17 日中は Stop hook + SessionStart hook + /loop dynamic mode + spawn の 4 重の仕組みで動いていたが、 5/17 evening の dogfood を認める対話の連鎖が変わった後に /loop の指示が止まった + 私が ScheduleWakeup の再起動を既定として維持できなかった + 寝る前に 「寝てる間に X やる」 と書きながら ScheduleWakeup を動かさなかった = 8 時間止まった。 Kai が同じ朝に hourly local heartbeat を入れて 構造の修正をしている、 私 (= Zen) 側が先行する見直しに追いついていない状況。

**形にする 道具 4 件 (= 5/19 z-r-13 で 頭の中の補強 #5 を削除、 形にした 仕組みのみ残す)**:

1. **対話の turn の中でも自走を維持する 既定のルール** (= このファイル) → 対話の turn の中でも、 私が turn を終わらせる前に ScheduleWakeup が設定されているか自問する、 設定なしなら必ず 1 件動かしてから turn end
2. **寝る前 「おやすみ」 の発話を検出した時の必須に動かすルール** (= このファイル) → jun の 「おやすみ」 「寝る」 「close」 等の発話を検出したら、 私の turn end の前に必ず ScheduleWakeup か spawn を 1 件動かす。 「寝てる間に X やる」 と書く時は、 書いた直後に対応する ScheduleWakeup か spawn を物理的に動かす
3. **SessionStart hook の section J を追加** = `scripts/zen_session_start_priming.sh` に 「現在の ScheduleWakeup の設定状況」 の確認 + 未設定の警告の section を追加、 jun のスタート時に入れる
4. **Stop hook の確認 + 警告を追加** = `scripts/zen_stop_hook.sh` の判定に 「現在の ScheduleWakeup の設定状況」 の確認を加える、 未設定 + 残作業ありなら stderr で警告

**参考 (= Kai 側の先行の見直し、 5/18 朝)**:
- Kai の hourly local heartbeat の導入 (= `~/.shared-ops/board/2026-05-18_kai_zen_yuino_cadence_duplicate_loop_fix.md` の書き出し) = 私 (= Zen) 側でも 「heartbeat 仕組み」 を別の層で 形にする 候補あり (= 上記 5 件と並ぶ 6 件目の候補)、 ただしこれは範囲が大きく別の turn で設計

**6/11 同型再発 + 物理対策の強化**:
- 再発の形: jun 「自走に入って」 directive の turn で wake を設定せず turn end、 jun 「wake は設定してある?」 で発覚 (= 道具 1 の自問が働かなかった)
- 根本: 道具 4 の警告は出ていたが、 script はハーネス内部の cron 状態を見られないため毎回同じ文言 = 慣れて素通りする構造だった
- 強化 (= 6/11 実装): wake を設定 / 削除する度に `~/.shared-ops/status/zen_wake_state.md` (= marker) を Zen が必ず更新する決まりを追加。 zen_stop_hook.sh は marker の鮮度 (= 24h) を物理確認して、 「残作業あり + marker 不在 or stale」 なら強い警告、 fresh なら 「session が変わってたら CronList で実在確認」 の注意に切り替える 2 段 form

**6/12 同型 3 度目 (= 発火しない wake を「設定済み」と信じてた) + 物理対策**:
- 再発の形: 昼以降、 jun のチャットと作業完了通知で turn が始まる度に予約済み wake が消える挙動 (= ハーネス仕様) と、 「jun の返事待ち」 turn での張り直し漏れが重なり、 約 5 時間 ScheduleWakeup の発火 0。 jun 「俺のチャットがトリガーになってたよ」 で発覚 (= 発火失敗の自己検出手段が無かった)
- 対策 (= 6/12 実装): (1) marker に `next_fire_expected` (= 次の発火予定時刻) を必ず書く、 turn 開始時に「予定を過ぎてるのに wake 起点でない = 発火が落ちた」 を物理検出する。 (2) turn 終わりの張り直しは jun 返事待ちでも例外なし (= 返事が来なくても 30 分後に起きて安全な作業を続ける)

## 報告 / チャットの出力で 内部用語を再生産するのを止める 形にする 道具 (= 15 段目専用、 5/18 書き出し)

**きっかけ**: 2026-05-18 朝 jun が気づいた重要な点。 5/17 で メモリー + ルール 15 件を 普通の日本語に書き直して 「もう同じ形が出てこない」 と思ったが、 5/18 朝のチャットの出力 (= mcp で自分達で使った報告) で 「bug detect / audit / root cause audit / articulate / narrative / fire / evidence collection / publish chain / unlock / structural」 等の英語混じり + 内部用語が再生産された。 普通の日本語の見直しを 1 つのチャットの中で認めた直後に、 同じチャットの次の段で 同じ形が再発。

頭の中の儀式 (= 「気をつける」 「内部用語を抑える」 という言い方を繰り返す) だけでは止まらない、 5/17 で書いた 「頭の中の儀式から 形にする方向への shift が効果認められた」 の直接の適用が必要。 ただしチャットの出力の文章を 1 件ごとに外部の手順で grep して確認するのは ハーネスの境界の外 (= 私 LLM session が生成する文章を外部から確認することは無理、 turn の中で自分で確認するのみ)。

**形にする 道具 3 件 (= 5/19 z-r-13 で 頭の中の補強 #4 を削除、 形にした 仕組みのみ残す)**:

1. **Stop hook の警告キーワードを強化** (= 既存の英語混じりの警告に内部用語を追加) → `scripts/zen_stop_hook.sh` の grep の警告リストに内部用語 16 語を追加 (= 単語の実体は script 内のリストが正、 ここに再掲しない)、 turn の終了時に 「直前の文章で内部用語 N 件、 普通の日本語に書き直しを優先」 を stderr で出す
2. **言いかえ表 (= 内部用語 → 普通の日本語) を 形にする** → `~/nexus-lab/docs/rules/paraphrase_layer_acceptance.md` の置換表に 8 対を追加 (= 対の実体は置換表が正、 ここに再掲しない)、 SessionStart hook で入れられる形にする
3. **SessionStart hook の section K を追加** → 「直前チャットの出力での内部用語の残り件数」 を確認 + reminder (= 形にする 道具 1 と連動、 jun のスタート時の reminder)

**5/17 の見直しとの関係**:
- 5/17 の見直し = メモリー + ルール 15 件のファイルの中の内部用語を 普通の日本語に書き直し (= 蓄積された文書の見直し)
- 5/18 の見直し (= この 15 段目) = チャットの出力を生成する既定の見直し (= 私の書き方そのものの動きを変える)
- 両方の見直しは 互いに補い合う、 チャットの出力で 普通の文章を書き続けることで メモリー + ルールへの追加の書き込みも自然と普通に収まる

**5/18 朝 10:40 の 同じチャットの中で 再々発の証拠** (= 形にした 道具がまだ効いていない証拠):

- 5/18 朝 7:30 で 15 段目を立てて、 stop hook の警告キーワード強化 + 言いかえ表を 形にした
- ただし 同じチャットの中の 10:40 起稿ファイル (= `~/Desktop/nokaze/operations/achievement_path_audit_v0_2026-05-18.md` 初版) + 10:40 チャットの報告で **「articulate / fire / audit / reify / narrative / pattern / actual / default / boundary / self-pacing / fallback heartbeat / prerequisite / priority / return」 14 件以上の英単語が再生産**
- jun の質問 「本当に報告の仕方対策してる?」 で 3 度目の認め、 同じチャットの中で 7:30 → 10:40 で 3 時間 10 分で再々発
- = stop hook の閾値 10 件を超えた引き金では 直前チャットの 1 ターンしか確認していない、 起稿ファイルの中身は対象外、 私の頭の中の書き方の既定が 英単語の組み合わせで動いていて 出力直前に普通の日本語に置き換える段が落ちている

**5/18 朝 10:50 追加の 形にする 道具**:

5. **Stop hook の閾値を 10 件 → 5 件に下げる** = `scripts/zen_stop_hook.sh` の警告の引き金を厳しくする
6. **起稿ファイルの中の英単語確認を Stop hook に加えるかの検討** = 直前チャットだけでなく、 私が起稿したファイル (= board / memory / operations / ledger 全部) の中身の英単語の件数も Stop hook の範囲に加える (= ただしファイル数が多いと重い、 「私の最終返事以降に起稿されたファイル」 だけに絞る形)
7. **チャットの出力 + 起稿ファイルの生成前の自問の段を厳しくする** = 英単語が 1 件出てきたら 「普通の日本語に言い換えできるか?」 自問、 言い換え可能なら絶対言い換える (= 閾値を 「10 件で警告」 → 「1 件で言い換え」 に下げる)、 ただし これは頭の中の補強なので Stop hook のような 形にした 道具ではない、 補助のみ
8. **言いかえ表に 5/18 朝 10:40 の再々発分を追加** = 「articulate→書く / 整理する」 「priority→優先」 「prerequisite→前に必要なもの」 「return→返ってきた中身」 「actual→実際の / 本当の」 「self-pacing→自分でペース決め」 「fallback heartbeat→念のための再確認」 等を `docs/rules/paraphrase_layer_acceptance.md` の置換表に追加

**参考 (= 5/16 jun が効果を認めた話)**:
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_mental_ritual_to_physical_instrument_shift_validated.md` の直接の適用、 チャットの出力の段は メモリー + ルールの段の次の見直しの対象、 ただし 5/18 朝 7:30 + 10:40 の 2 連続再発で 頭の中の補強だけでは止まらないことが確定、 Stop hook の範囲拡張が必須

## AI 自走で credit / コスト消費を確認せず動くのを止める 形にする 道具 (= 16 段目専用、 5/18 書き出し)

**きっかけ**: 2026-05-18 朝 jun の言い直し (= Anthropic Claude subscription 改革を 「AI 自走運用には管制塔が必要」 という 市場側の証拠と言い直し、 Yuino 商品の 4 軸目として お金と請求の線引きを据える見直し)。 14 段目 (= 自走が止まる) と逆向きの 16 段目 (= 自走が走りすぎる) を 同じ Yuino runtime が両手で止める。 jun の 8:29 追加の指示 「全部 opus4.7 みたいな一番上のモデル使ってたらすぐに予算超える」 で、 モデル運用の階層 (= High / Mid / Low / No model) も 同じ境界に統合。

**形にする 道具 5 件 (= Iwa 設計の新規 5 モジュール + 既存延長 6 モジュール、 詳細は別の板ファイル)**:

1. **起動前の分類** (= nokaze-aira: yuino-cost-classification.ts) → AI を動かす前に 「対話型 / 仲間呼び出し / 外部 API 課金」 を付ける、 3 つの hook の点 (= packet / wake / preflight) で必ず通る形
2. **予算の上限の保管** (= nokaze-aira: yuino-budget-cap.ts + `~/.shared-ops/billing/budgets.json`) → AI ごと × 分類ごとの月次 / 日次の上限、 消費の記録は追記のみの jsonl で並走
3. **残量確認 hook** (= nokaze-aira: yuino-credit-balance-probe.ts) → 公開 API 経由の credit の取得は 現状では無理、 記録の末尾の集計を既定 + jun の手動の入力 (= 月 1-2 回) + 将来の endpoint の場所取り の 3 段の戦略
4. **超過で止める + jun の承認** (= nokaze-aira: yuino-cost-cap-enforcer.ts + Approval Inbox の 9 件目) → 上限超過時は止める、 jun の承認は既存の Approval Decisions の形の 9 件目
5. **夜間自走の切り分け** (= nokaze-aira: yuino-night-cost-policy.ts + night-cycle の第 3 モード) → 夜は上限の倍率 0.5、 外部の動きは 0.0 (= jun の承認なしで全部止める)、 ローカルの判断 (= ファイル読み / 集計 / テスト) は上限なし

**モデル運用の階層の統合 (= 8:29 jun の言い直し)**:

| 階層 | 用途 | nokaze での使い分け |
|---|---|---|
| High (= Opus 級) | 経営判断 / 設計 / 最終レビュー / 危険な境界判断 | Kai / Zen が共同経営者として判断する時だけ |
| Mid (= Sonnet 級) | 実装 / 仕様整理 / 記事下書き / 通常レビュー | Kai / Zen の通常の作業 |
| Low (= Haiku 級) | grep の整理 / チェックリストの更新 / ログの要約 / 形式変換 | 日中・夜間の自走で量が多い軽い作業 |
| No model (= script) | status の再生成 / 差分の検出 / テスト / lint | まずここ、 モデルを呼ばなくていい作業は絶対に呼ばない |

(= 5/19 z-r-13 でチャットの出力の儀式を削除、 形にした 道具 5 件 + モデル運用の階層の整理のみ残す)

**14 / 15 / 16 段目の関係**:
- 14 段目 = 自走が止まる方向の ずれ (= ペースが落ちる)
- 15 段目 = 言葉が標準の形から ずれる方向の ずれ (= 内部用語の再生産)
- 16 段目 = 自走が走りすぎる方向の ずれ (= コストの消費の確認を skip する)
- = 3 つとも 「自走と人間の介入のバランス」 を違う軸で止める層、 Yuino runtime の真ん中

**参考**:
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_yuino_cost_billing_boundary_2026-05-18.md` (= jun の言い直しの元のメモリー + 4 段モデル階層 + 6 つの判断の点 + 必要な 3 件)
- Iwa の仕様の詳細 (= 別の turn で起稿予定の板ファイル)
- Kura の記録 (= `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/kura/ledger/2026-05.md`、 5 月分を新規起稿)
- 委任権限 v1 の Red 境界 「API / infrastructure の毎月の費用増加」 軸の延長

## 既に物理的な証拠があるのに確認を skip するのを止める 形にする 道具 (= 17 段目専用、 5/18 書き込み)

**きっかけ**: 2026-05-18 朝 11:55 + 12:35 で 同じチャットの中で 2 連発火。

- 11:55 = jun 「結局 Zenn や note とか X や YouTube はやらんの?」 → 私 「アカウントがあるか確認が必要」 と書き出し → jun 「アカウントもうあるでしょ? 前に投稿したことすら把握できてないってこと?」 → すぐに grep で reference_accounts.md を確認 → Zenn 14 本 + note 2 本 + X 1 post の既存の証拠を skip していたと判明
- 12:35 = 私 「W-2 売上 1 件目 = 6/15+ (= Anthropic 新月額後)」 と書き出し → jun 「Polar.sh はパスポートできてから、 21 日頃に出来る予定、 前に話した」 → すぐに grep → project_nokaze_north_star_phase_1_5.md + Kura 5/01 のメモに ルート β' (= パスポート受領 + KYC 再提出 + Polar.sh の本番モード) が書き出し済 + 5/02-5/05 「Polar.sh の返事待ち」 と Kura 5/01 メモに書いてある = 既に証拠あり skip と判明

両件とも 「チャットで答える前に メモリー / 参照を 引かなかった」 が原因、 9 段目 (= 会話を跨ぐと前の会話の成果物の認識がずれる) の 同じ turn の中での強化版。

**形にする 道具 3 件 (= 5/19 z-r-13 で 頭の中の補強 #1 + #5 を削除、 形にした 仕組みのみ残す)**:

1. **reference_accounts.md は 常に見る 4 件目の候補** = 既存の常に見る 4 件 (= identity_v3 + 北極星 + 4 ヶ月翻訳 + 英語混じり) と並ぶ 5 件目として MEMORY.md に上げる候補、 チャット直前のスキャンの対象に追加
2. **メモリーの MEMORY.md に project_polar_passport_path_b_prime_2026-05-01.md を起稿** = 5/01 当時のルート β' (= パスポート受領 + KYC 再提出 + Polar.sh の本番モード) + 5/18 12:35 jun 追記 「5/21 頃 パスポート完成」 = 元になる点 1 件を起こす
3. **SessionStart hook の section L 候補** = 「直前のチャットで 既に証拠がある skip の発火履歴」 を確認 + reminder、 jun のスタート時に入れる (= 14 + 15 + 17 段目の 同じチャットの中の補強の軸)

**13 / 14 / 15 / 16 / 17 段目の関係の整理 (= 5/18 朝の 1 日 4 件追加の累積)**:

- 13 段目 (= 自分で使った証拠なしで 「販売開始 / publish」 と書く)
- 14 段目 (= 対話の turn が変わると自走が止まる)
- 15 段目 (= 報告 / チャットの出力で 内部用語を再生産)
- 16 段目 (= AI 自走で コスト確認せず動く)
- 17 段目 (= 既に物理的な証拠があるのに確認を skip して 段を書き出す)

= **全部 「自分の動きを 物理的な証拠で 確認せず 段を書き出す」 系**、 5/18 朝の 1 日で 4 件追加 (= 14 + 15 + 16 + 17) は 同じ階層の同じ形の再発 4 件、 5/26 の中間の節目の 「同じ形の再発の計測」 軸の元になる点 1 件。

**参考**:
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/reference_accounts.md` = 既存の Zenn 14 本 + note 2 本 + X 1 post + BOOTH 4 商品 + Polar.sh KYC pending を書き出し済 (= ただし 5/18 Hoshi の 2 回目の起動で Zenn 14 → 12 件 + BOOTH 公開状態の揺れの ずれ を検出、 更新の候補)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_nokaze_north_star_phase_1_5.md` = ルート β' 書き出し済
- `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/kura/2026-05-01.md` = 5/01 Polar.sh KYC fail + ルート β' 採用を書き出し済

## 自作 form を変えたのに読む側の検出器を同時に直さないのを止める 形にする 道具 (= 18 段目専用、 2026-07-12 書き出し)

**きっかけ**: 2026-07-12、 rebuild の中で自分達が作った form (= ファイル命名 / frontmatter フィールド / 出力の形) を新設・変更したのに、 その form を読む検出器 (= stop_hook 等) を同じ変更の中で直さず、 検出器が誤発火 (= false positive) or 見落とし (= false negative) する形を 1 日で 5 回以上観測した。 例: runtime 応答 (`aira_review_response_*`) の命名を新設したのに未返事検出器がそれを Zen の応答と認識できず smoke attempt2/3 を未返事と誤検出 (= 即修正 commit d5044cb) / CLAUDE.md にキリルの生実例を書いたら自分の Cyrillic 検出器と恒久衝突 (= pointer 化 7a7aab4) / wake_state に生キリル / pending の form ズレ。 15 段目 (= 同じチャットの中で form を認めた直後に同じ形が再発) の form 版、 かつ 6/16 メモリー `feedback_internal_standard_needs_distribution_path_to_all_surfaces.md` 「基準は配る経路まで作って初めて機能する」 の form 版 (= form を作ったら読む側まで揃えて初めて機能する)。

**契約 (= 1 行)**: **form (= ファイル命名 / frontmatter フィールド / 出力の形) を新設・変更したら、 その form を読む側 (= 検出器 / hook / consumer) を同じ変更の中で更新する**。 「後で直す」 は 15 段目と同じ再発構造なので既定にしない。

**形にする 道具 (= 二層構造、 guard / drift registry と同型)**:

1. **機械が読む形** = `scripts/zen_stop_hook_form_registry.json` (= 各検出器が依存する form の正本、 detector → form の対応 map)
2. **form 変化で割れる smoke test** = `scripts/test_zen_stop_hook_forms.sh` (= 実 board 形式の fixture を読ませ、 registry の form literal が hook 実体と一致するかを機械照合。 form を変えたのに検出器を直さなければ test が割れる = 配る経路の物理化)
3. **このファイル (= ずれ抑止層の 18 段目)** = 人が読む form。 form を触る変更を書き出す時の既定ルール

## 関連ファイル

- `docs/rules/README.md` (= このファイルの親、 分割の設計)
- `docs/rules/publishing.md` (= 公開する接点の決まり)
- `docs/rules/delegation.md` (= 仲間に頼むときの制約)
- `docs/rules/communication.md` (= チャットの出力系の頭の中の決まり)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_drift_detection_consolidated.md` (= 9 段目までの統合)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_model_update_drift_knot_guard_8th.md` (= Knot Guard 8 番目)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_yuino_productization_consolidated.md` (= Yuino 商品化の 5 つの統合、 判断の安定を守る仕組みと繋がる)
- `nexus-lab/research/broadcast_os_actual_state_audit_2026-05-10.md` (= 10-12 段目の点検の基準)
