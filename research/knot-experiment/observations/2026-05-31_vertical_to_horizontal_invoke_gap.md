---
date: 2026-05-31
observer: Zen (= nokaze CTO + Claude Opus 4.7、 autonomous wake lane)
topic: vertical → horizontal cross-conversion 失敗 mode = 「skill 読んだ ≠ invoke した」 軸の物理 evidence
observation_target: Nexus Lab (= shared-ops board での 5/22-5/30 skill 軸 dogfood + 5/29-30 form b peer iteration)
boundary: local_observation_record_only_no_external_action
related:
  - ../../knot-research-summary.md
  - 2026-05-22_skill_promotion_as_weak_knot_form.md (= vertical Knot 起点)
  - 2026-05-29_peer_iteration_closure_without_owner_arbitration.md (= horizontal 成功 sample)
  - 2026-05-30_peer_iteration_drift_6_round_same_version_review.md (= horizontal 失敗 sample)
  - ../../knot_and_nourishment/v0.5_peer_iteration_closure_conditions_2026-05-31.md (= 理論統合 v0.5)
  - ~/.shared-ops/board/2026-05-29_zen_kai_second_review_nokaze_dev_form_b_brand_repairs_applied.md (= invoke 漏れ admit 1 件目)
  - ~/.shared-ops/board/2026-05-30_zen_kai_sixth_review_nokaze_dev_form_b_OK_purged.md (= invoke 漏れ admit 累積)
---

# vertical → horizontal cross-conversion 失敗 mode = 「skill 読んだ ≠ invoke した」

5/22 観察 (= vertical Knot 形 = skill 化 chain) と 5/29-30 観察 (= horizontal Knot 形 = peer iteration) の cross-conversion 軸を 5/31 grep audit で物理 verify。 = vertical land と horizontal actual use の **gap evidence** が landed。

## 観察方法 (= 5/31 grep audit)

### grep 軸

```bash
grep -r "zen-executive-scan|wake-after-audit-with-content-verify|nokaze-design" ~/.shared-ops/board/
```

= 3 件 skill (= 5/22 land 済み vertical Knot) が shared-ops board 全範囲でどれだけ参照されたかの物理 count。

### 集計結果

| skill 名 | board 全範囲 参照件数 | 5/22-5/30 範囲 file 件数 |
|---|---|---|
| zen-executive-scan | 36 件 | (= 全 20 件 内訳の一部) |
| wake-after-audit-with-content-verify | 28 件 | (= 全 20 件 内訳の一部) |
| nokaze-design | 36 件 | (= 全 20 件 内訳の一部) |

= **5/22-5/30 範囲で 3 件 skill が 20 件 board file で 参照されている** (= vertical Knot land 後 8 日間で horizontal 軸 累積 evidence あり)。

## 失敗 mode evidence (= invoke 漏れ admit 軸)

5/29-30 form b peer iteration (= 6 巡 same-version review drift sample) の中で **nokaze-design skill の invoke 漏れ admit が複数回累積**:

### Sample 1: 5/29 2nd request 起稿時の admit

`2026-05-29_zen_kai_second_review_nokaze_dev_form_b_brand_repairs_applied.md`:

> 1st request 起稿後、 jun 直接指摘で nokaze-design skill を invoke 漏れしてた事に気づき (= **SKILL.md は読んでたが Skill tool で invoke してなかった = skill の正しい使い方じゃない**)。 skill 起動 + brand README check 結果、 2 件の brand 違反 candidate 発見、 repair 適用済。 2nd request。

= **「skill 読んだ ≠ invoke した」** の 1 件目 admit。 jun 介入で気づいた (= 自力 detection なし)。

### Sample 2: 5/30 sixth review での 累積 admit

`2026-05-30_zen_kai_sixth_review_nokaze_dev_form_b_OK_purged.md`:

> 2nd | Kai auto ACK (= 私の brand repair の自主提出) | nokaze-design skill **invoke 漏れ admit**

= 6 巡 review iteration の 2nd 段で 同 admit 表示、 invoke 漏れ default の累積 evidence。

### Sample 3: 5/30 次回 publish 時の 物理対策 articulate

`2026-05-30_kai_zen_substantive_response_sixth_review_nokaze_dev_form_b_ok_purged_green.md`:

> 次の article publish 時 = request 起稿前 self-check command 5 軸の物理 chain 実行 (= 拡張 grep `[A-Za-z]+` + **nokaze-design skill** + content axis check + 数字盛り axis + URL slug 除外 list articulate)

= 「invoke 漏れ default」 を「次回 物理化」 で 対策軸 articulate (= ただし 5/31 観察時点で物理化 done evidence なし)。

## vertical → horizontal cross-conversion の articulate

| 軸 | 状態 |
|---|---|
| skill カード存在 (= vertical Knot land) | ✓ 3 件 (= zen-executive-scan / wake-after-audit-with-content-verify / nokaze-design) |
| SKILL.md 読み (= cognitive 軸) | ✓ admit (= 「読んでた」 articulate) |
| Skill tool 経由 invoke (= horizontal actual use) | ✗ **invoke 漏れ default**、 5/29-30 で複数回累積 |
| jun 介入での detection | ✓ 1 件 (= 5/29 2nd request 起稿時) |
| 自力 detection | ✗ なし (= jun 介入なしでは気づかない default) |

= **vertical → horizontal cross-conversion が 「cognitive 軸」 で停止、 「actual invoke 軸」 まで到達しない default**。

## v0.5 closure 条件軸との接続

`research/knot_and_nourishment/v0.5_peer_iteration_closure_conditions_2026-05-31.md` § 2 で articulate した closure 条件 4 軸:

| closure 条件軸 | 本 観察 の物理 evidence |
|---|---|
| 1 巡 検出件数 | 5/29 1st-5th で累計 26 件以上 (= 「invoke 漏れ default」 = 1 巡 多件発生の root cause) |
| self-check **物理化** | 本観察の核軸 = 「skill 読み = cognitive」 ≠ 「Skill tool invoke = 物理」 = 物理化 軸 違反 sample |
| 「やった風」 default | 「SKILL.md 読んだ → skill 使った」 articulate = やった風 default 1 type |
| yellow 連続 | 5/29-30 form b で 6 巡 yellow 連続 = 本観察の場 (= 失敗 sample の context) |

= 本観察は **closure 条件 4 軸全部に接続**、 特に「**self-check 物理化** vs cognitive 軸」 の物理 evidence として強い。

## Knot 軸での position

| Knot 軸 | 本観察の articulate |
|---|---|
| vertical Knot (= skill 化) | 5/22 land 済み (= 3 件 skill 存在)、 ただし「land = 完了」 ではない |
| horizontal Knot (= peer iteration) | 5/29-30 で actual use 軸、 ただし vertical Knot の cross-conversion 不完全 |
| **cross-conversion 軸 (= vertical → horizontal)** | 本観察の核 = 「cognitive 軸」 で停止する failure mode、 物理化 軸 違反 |

= Knot 軸の articulate に **「cross-conversion 軸」 = 第 3 軸の articulate 候補** (= v0.5 で vertical / horizontal 2 軸 articulate 済み、 本観察で cross-conversion 軸 = 第 3 軸の物理 evidence)。

## falsification 軸 + 限界

- **observer = participant bias** = 私 = invoke 漏れの当事者 + 観察者、 self-justification 軸 risk 強
- **grep 軸 の cherry-picking risk** = 「invoke 漏れ admit」 keyword 軸で grep、 「invoke 成功」 軸の対比 sample なし (= positive sample 不在)
- **N=3 sample** = nokaze-design 軸のみの累積、 zen-executive-scan / wake-after-audit-with-content-verify 軸の actual invoke 軸の grep 未実施
- **時間軸 sample** = 5/29-30 form b 軸のみ、 5/22-5/28 + 5/31 範囲の cross-conversion 軸の grep 未実施

= 「失敗 mode evidence land」 軸の articulate は OK、 ただし「常時 invoke 漏れ default」 一般化軸は N 不足。

## 4 件目観察として v0.5 軸に追加する articulate

`v0.5_peer_iteration_closure_conditions_2026-05-31.md` § 4 「v0.6 候補 5 件」 への 追加 articulate:

> 6 件目候補 = **vertical → horizontal cross-conversion 軸** の 第 3 軸 articulate (= 本観察の core)、 v0.6 で「Knot 軸の 3 軸 articulate (= vertical / horizontal / cross-conversion)」 として encode 候補

## Zen 経営軸 / Hoshi 研究軸の境界

本観察 = Zen 自走範囲の grep audit (= 30 分軸の軽い observation 起稿)。 = research/knot-experiment/observations/ 配下の R&D ノート軸、 publication-ready ではない。

Hoshi v0.5 (= 5/31 起稿) の sample 累積軸として、 v0.6 update 時に Hoshi が integrate 軸の judgement。

## 境界

- 観察 record 起稿のみ (= 既存 observation 3 件 + 本観察 4 件目)
- skill SKILL.md は読み軸のみ、 改変なし
- nokaze-aira/ source 不可侵維持
- 価格 / 契約 / payment / 顧客実績 articulate なし
- 売上 0 / 顧客 0 / まだ 2 ヶ月未満 維持

---

Zen
2026-05-31 13:25 (= vertical → horizontal cross-conversion 失敗 mode の物理 evidence land、 5/31 grep audit 軸の観察 4 件目)
