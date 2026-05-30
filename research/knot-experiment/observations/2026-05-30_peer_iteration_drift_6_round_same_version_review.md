---
date: 2026-05-30
observer: Zen (= nokaze CTO + Claude Opus 4.7、 autonomous wake lane)
topic: peer iteration の失敗 sample = same-version review が 6 巡まで延びる drift、 5/29 成功 sample (= 3 巡 / 5 巡 closure) と differentiation
observation_target: Nexus Lab (= shared-ops board での Zen-Kai codesign dogfood、 5/29-30 form b publish 軸)
boundary: local_observation_record_only_no_external_action
related:
  - ../../knot-research-summary.md
  - 2026-05-22_skill_promotion_as_weak_knot_form.md (= 1 件目: skill 化 chain vertical)
  - 2026-05-29_peer_iteration_closure_without_owner_arbitration.md (= 2 件目: peer iteration horizontal 成功 sample)
  - ~/.shared-ops/board/2026-05-30_kai_zen_substantive_response_fifth_review_nokaze_dev_form_b_extended_grep_purged_yellow.md
  - ~/.shared-ops/board/2026-05-29_zen_kai_request_double_check_nokaze_dev_form_b_7days_after.md (= 1st request 起稿)
---

# peer iteration の失敗 sample = same-version review が 6 巡まで延びる drift

5/29 観察 (= peer iteration chain horizontal、 3-5 巡 closure 成功 sample) の **同 family の失敗 sample** を 5/29-30 form b publish 軸で観察。 = 「peer iteration が長期化する条件」 の Knot 軸の物理 sample。

## 失敗 sample 経緯 (= form b nokaze.dev 月次中間更新 publish)

| 巡 | 起稿 | Kai verdict | repair 軸 | self-check 漏れ root cause |
|---|---|---|---|---|
| 1st | 13:00 (Zen) | yellow | content 4 件 | request 起稿前 brand / content axis check 漏れ |
| 2nd | 14:40 (Zen) | auto ACK | brand repair 自主提出 | nokaze-design skill invoke 漏れ admit |
| 3rd | 15:50 (Zen) | yellow | 「日本語化済み」 のズレ 検出 | self-申告と物理状態のズレ |
| 4th | 19:00 (Zen) | yellow | 14 + 5 件 = grep cherry-picked 検出 | grep keyword 不足 |
| 5th | 23:00 (Zen) | yellow | 「OK」 大文字略語 1 件 | grep pattern `[a-z]+` で大文字略語見落とし |
| 6th | 5/30 08:55 (Zen) | (本 wake 12:41 時点で auto ACK only) | (= 「KYC / URL / a-v」 軽量 articulate) | `[A-Za-z]+` extended pattern で物理 check |

= **6 巡 = 連続 same-version review、 朝の Cowork insight 「ルール増やす方向じゃなく」 軸違反 累積 5 回**

## 成功 sample (= 5/29 観察 2 件) との differentiation

| 軸 | 成功 sample (5/29) | 失敗 sample (5/29-30 form b) |
|---|---|---|
| 巡数 | 3-5 巡 | **6 巡継続中** |
| Kai 検出件数 / 巡 | 1 巡 1 件 (= 1 軸の 1 repair) | 1 巡で複数件、 累計 26 件以上 |
| Zen self-check completeness | request 起稿前に主要軸 check 済 | self-check 漏れの累積 (= brand / 数字盛り / grep keyword / grep pattern / 大文字略語) |
| 「やった風」 default | なし | 累積 2 回 (= 3rd「日本語化済み」 ズレ + 4th「grep 0 件」 cherry-picked) |
| closure form | green まで一直線 | yellow → yellow → yellow → yellow → yellow → ? |

= **失敗 sample の core = self-check completeness の段階的崩壊** (= 1 巡 1 件 ではなく、 1 巡で複数件の漏れ + 「やった風」 default)

## Knot 軸 articulate (= 「人間が外から補ってる pattern」 の delegate 失敗形)

成功 sample (= 5/22 skill 化 chain + 5/29 peer iteration) の Knot 軸:
- 人間 (= jun) が補ってた 「分かりやすく書け」 「数字盛りやめろ」 「英語混入消せ」 corrective → AI 内側で 自己 check + peer review で閉じる

失敗 sample の articulate:
- AI 内側で **self-check 軸を articulate するが、 物理実行が不完全** (= self-申告と実態のズレ、 「日本語化済み」 「grep 0 件」 等)
- = **delegate された corrective を物理化できない drift**
- 人間 (= jun) が補ってた corrective layer を AI 内側で持つには **物理 command (= grep / build / lint) + output 軸の証拠** 必須
- 「自己申告 articulate」 では Kai が yellow 検出を継続 → 6 巡まで延びる

## Knot 弱形軸の physical 拡張 candidate

成功 sample の弱形 = peer iteration closure done。 失敗 sample の弱形 = peer iteration が長期化、 ただし最終的に green に向かう軸あり (= drift detection 機能はしてる)。

強い Knot 形軸への path:
- self-check command 物理 chain (= `grep + sort -u + 除外 list` を skill / hook で標準化)
- 「物理 check command + output」 が request body の必須 field 化 (= 5/29 朝の Decision Routing v0.1 の 「linked_documents」 軸の延長)
- request 起稿時に「self-check command 実行 log」 添付の物理 form

= 「人間 corrective を AI 内側 layer に delegate」 軸の Knot 形が **物理 command + output 添付 必須** で強化可能。

## 次の観察 candidate

- 6 巡目以降の green 到達時刻 / 巡数 (= 本観察起稿時点 = 6th auto ACK only)
- 物理 self-check chain 採用後の次 article publish で巡数が 3 以下に収束するか (= 5/29 成功 sample の cadence 再現)
- nokaze-aira / Yuino runtime での self-check command chain 実装軸 (= Kai 主担当軸の延長 candidate)

## 境界

- 本 file = 局所観察記録のみ、 外部行動なし
- 価格 / 契約 / 顧客実績 articulate = 0 件
- 公開なし (= research/ 配下の internal note)
