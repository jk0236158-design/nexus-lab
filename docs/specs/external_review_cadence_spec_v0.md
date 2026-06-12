# External Review Cadence spec v0 (= z-2 軸)

> Status: design draft — not current runtime rules (= 2026-06-12 注記。 5/17 当時の設計記録。 実装状況: scripts/zen_external_review_fire.sh は未起稿のまま、 echo chamber 対策の実態は scripts/codex-review.sh + Kagami QA + Kai independent review の運用で部分実現)

起稿日: 2026-05-17
起稿主: Zen
連動: 5/16 jun 16:00 structural shift directive 「定期 review (Zen/Kai じゃない視点)」 + 5/16 ledger §11 反映 + Knot 研究 v0.1 §3-B narrative
status: spec v0 (= 実装 + 運用着手は別 fire turn、 本 file は design only)

---

## 1. 起稿軸 = Zen + Kai の自己評価の構造的弱さ

5/16 朝〜午後で Zen + Kai が同型再発を連発 (= 「私の推し X で OK?」 form 4 回 + portal narrative drift + post_completion wait state 等)、 jun が 「これだけ改善されないのはもう普通にやっても同じことの繰り返しにならん?」 で structural admit。 self-check cadence 物理化 (= z-1) で内部 self-review は強化、 但し **Zen + Kai 同視点の self-review は echo chamber 構造的 risk** (= 自分達の盲点を自分達で見つけにくい)。

jun directive 16:00 narrative:
> 「定期的に nokaze 全体をレビューすることかな、 レビューするのは zen や kai じゃないほうがいい」

= **外部視点 (= Zen / Kai 以外)** からの定期 review が echo chamber 抑止軸。

## 2. external review = 外部視点 の候補

### 2-1. 別 AI model による review

- **Codex 経由 (= Kai と別 instance)**: `scripts/codex-review.sh` の延長で、 直前 commit / 直前 chain / 全 active task table を別 instance で review
- **別 Claude (= 別 session、 context 切り替え経由)**: 「外部視点」 simulation、 但し同 model なので echo chamber risk 中
- **別 model (= GPT-4o / Gemini / 等の競合 model)**: 別 architecture 経由の review、 echo chamber 抑止 高
- **AI grader role 演技 (= Hoshi Research Division Lead を grader 視点に reframe)**: Knot 研究 v0.1 §3-B narrative 連動 (= self-check の Knot 検出装置化)、 但し Hoshi も同 system 内、 echo chamber risk 中

### 2-2. 人間視点 (= jun 介入不要の範囲)

- **競合 / 類似 service 比較 review**: external service の API / docs / pricing を Read で audit、 自分達の position relative measurement
- **memory feedback の cross-cycle audit**: 過去 30 day の memory feedback を再 read、 同型再発 pattern detection
- **public response audit**: 公開済み記事 / portal / npm の actual audience response (= GitHub stars / comments / 引用) を audit

### 2-3. 自動 instrument 経由

- **broadcast-os の learning_insights テーブル集計**: Knot 研究 v0.1 §5 reform candidate 連動、 5/26 milestone fire candidate
- **vocabulary lint chain audit**: 公開 docs commit 前 4 chain audit (= vocabulary_lint + naming_mixup_check + honesty_audit + defer_check) を時系列で history audit、 trend detection

## 3. cadence design (= 月次 base + adhoc trigger)

| trigger | 頻度 | 主な audit 軸 |
|---|---|---|
| 月次 (= 月初) | 月 1 回 | 前月 memory feedback cross-cycle audit + 同型再発 pattern detection + 北極星進捗 audit |
| 5/26 milestone | 試験期 1 段階終了 | 5/16-5/26 累積 self-check cadence + reform velocity + 北極星 measurement |
| adhoc (= structural shift event 後) | 必要時 | 大型 milestone 後 / pillar 累積 N 件超過後 / jun directive 大型 reform 後 |
| 大型 commit 後 | 必要時 | publish 前 review (= 既存 ritual 強化、 Kagami QA 連動) |

## 4. 物理 instrument 候補 (= 4 件、 priority 順)

### 4-1. scripts/zen_external_review_fire.sh (= 主要 instrument)

- 起動方法 = manual fire、 月初 or adhoc trigger 検出時
- input = `--scope monthly|milestone|adhoc|commit-N` + 必要なら 過去 N 日 window 指定
- output = external review prompt template (= 別 model / 別 instance / 別視点 spawn 起動用) を stdout 出力
- target = Codex / 別 Claude session / 別 model spawn 用 prompt

### 4-2. SessionStart hook で月初 reminder

- jun startup 検出 trigger で月初 (= 1 日 - 3 日) の場合 external review fire reminder を section 追加
- 既存 `scripts/zen_session_start_priming.sh` に section I 追加 candidate

### 4-3. nokaze Vault `external_review/` folder

- `~/Desktop/nokaze/external_review/<YYYY-MM-DD>_monthly_v0.md` 等の form (= 設計候補、 未起稿)
- 月次 audit result の archive、 cross-cycle trend detection の baseline data

### 4-4. broadcast-os learning_insights テーブル集計 (= h-3 連動)

- Knot 研究 v0.1 §5 reform candidate と整合
- 5/26 milestone fire candidate

## 5. 5/26 milestone audit candidate (= 6 件、 z-2 specific)

- external review fire 月次着手達成 (= 6/01 が初回 fire candidate)
- echo chamber detection 件数 (= self-review vs external review で surface 差分)
- 同型再発 pattern detection accuracy (= memory feedback cross-cycle audit の actual usefulness)
- 競合比較 review の actual fire 件数 (= 5/16 hoshi 月次 competitor reference との連動)
- vocabulary lint chain audit の trend detection 効果
- broadcast-os learning_insights 集計の actual data 件数

## 6. 5/17 朝着手範囲 (= 本 spec 起稿後の next move)

- 本 spec 起稿は scope 軽 (= 30 分目安)、 actual scripts/zen_external_review_fire.sh 実装は別 fire turn (= scope 中 1-2 時間予想、 5/17 当時の設計候補、 未起稿)
- 6/01 月次 fire の reminder 設定は別 fire turn (= SessionStart hook section I 追加)
- 5/26 milestone audit fire は本 spec の measurement candidate 6 件起票連動

## 7. boundary

- 委任権限 v1 delegated 範囲内 (= internal worker / peer / reviewer / subagent requests + external comparison)
- jun escalate 不要
- 公開 docs ではない (= `docs/specs/` 配下 = 内部 spec)
- 数字盛り禁止 (= cadence 目標は 「月 1 + adhoc」 narrative)
- echo chamber 抑止軸の物理化、 reform velocity 自己測定不能の課題 fix

## 8. 連動 file

- `~/nexus-lab/docs/rules/self_check_cadence.md` (= z-1 spec、 内部 self-check と external review の対比 axis)
- `~/nexus-lab/docs/rules/drift.md` (= drift 抑止 ruled、 sibling)
- `~/nexus-lab/research/knot_research_status_2026-05-17.md` (= v0.1、 §3-B 「self-check の Knot 検出装置化」 narrative の対比軸)
- `~/nexus-lab/scripts/codex-review.sh` (= 既存 Codex review、 monthly external review の 1 件目候補)
- `~/.shared-ops/owner-decisions/2026-05-16_zen_kai_delegated_authority_v1.md` (= 委任権限 v1 ground truth)

---

Zen
2026-05-17 9:00 頃 (= z-2 external review cadence spec v0 起稿、 echo chamber 抑止軸の物理化、 月次 + adhoc cadence design + 4 instrument 候補 + 5/26 milestone audit candidate 6 件、 self-check cadence z-1 との対比軸 articulate、 actual instrument 実装は別 fire turn)
