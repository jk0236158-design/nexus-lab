# Self-check Cadence 物理 instrument spec (= z-1 軸)

起稿日: 2026-05-17
起稿主: Zen
連動: 5/16 jun 16:00 structural shift directive 「1 日 4-5 回 self-check (朝 / 昼 / 夕方 / 夜)」 + 5/16 ledger §11-13 「mental ritual から物理化軸への shift」 narrative
status: spec v0 (= 実装は別 fire turn、 本 file は design only)

---

## 1. 起稿軸 = mental ritual の構造的弱さ

5/16 朝〜午後で同型再発 cadence (= 「私の推し X で OK?」 form 4 回 + portal narrative drift admit + 11:15 spec 後 4 時間 idle 等) が連発、 jun が 「これだけ改善されないのはもう普通にやっても同じことの繰り返しにならん?」 で structural admit。 「気をつける」 narrative 反復 = mental ritual layer の reform は actual cadence を変えない、 物理 instrument 化のみが actual shift を生む (= memory `feedback_mental_ritual_to_physical_instrument_shift_validated.md`、 5/16 jun validated)。

= self-check の物理 instrument 化が actual cadence shift の core 軸、 mental ritual に閉じない reform pattern。

## 2. self-check の 3 軸 (= jun directive 連動)

各 self-check fire で必ず articulate する 3 軸:

1. **何が終わったか** (= 直前 window で完了した actual fire の articulate、 ledger / chat output / commit 等の物理 evidence 紐付き)
2. **何が終わってないか** (= active_tasks.md 残り + 並走中 + jun escalate 軸の articulate)
3. **これが nokaze のためになってるか?** (= 各 fire の axis 判定、 partial yes / yes / 軸偏り surface)

= jun 16:00 directive 「自分で何が終わって何が終わってないのか? これが nokaze のためになってるかなってないか」 の 3 軸 reify。

## 3. cadence design (= 4 件 / 日 base、 最大 5 件)

| 時間帯 | 推奨 window | 主な audit 軸 |
|---|---|---|
| 朝 | 7:00 - 9:00 | jun startup 後の最初の整理、 前日からの carry-over audit、 day default articulate |
| 昼 | 11:30 - 14:00 | 朝の動きの中間 audit、 jun 接触機会、 午後 default 整理 |
| 夕方 | 16:00 - 18:00 | 夕方 directive trigger 多発 window、 1 日のメイン chain audit |
| 夜 | 21:00 - 22:00 | 1 日全体 audit、 翌朝への申し送り、 pillar 4 累積 audit |
| 任意 (5 件目) | 必要時 | structural shift event 後 / pillar 4 連発火後 / 大型 milestone 後 |

= cron 連動ではなく **manual trigger + 物理 instrument による cadence 維持**、 reasons:
- jun directive trigger / Kai board 起稿 trigger / 大型 fire 完了 trigger が混在
- cron 強制 fire は noise になりがち (= self-check fire 自体が 1 件 ledger entry を作る、 cron 無条件 fire は重複)

## 4. 物理 instrument 候補 (= 4 件、 priority 順)

### 4-1. scripts/zen_self_check_cadence.sh (= 主要 instrument)

- 起動方法 = Zen 直接 fire (= manual)、 ledger §N に self-check entry 起稿 + chat output で 3 軸 articulate
- input = `--time-of-day morning|midday|evening|night|adhoc` + 必要なら 直前 N 時間の window 指定
- output = ledger entry template (= self-check 3 軸 + 5/16 ledger §11-13 form 踏襲) を stdout に出力、 ledger に追記 candidate

### 4-2. SessionStart hook の self-check carry-over reminder

- jun startup 「おはよう」 directive 検出 trigger
- 前夜 self-check の 「何が終わってないか + 翌朝 default 候補」 を auto inject (= `scripts/zen_session_start_priming.sh` に section 追加 candidate)
- 既存 SessionStart hook に section H として追加

### 4-3. nokaze Vault `self_check/` folder (= manual ledger 連動)

- `~/Desktop/nokaze/self_check/2026-05-17_morning.md` 等の form
- ledger と分離する form (= ledger は 1 日 1 file の総合、 self_check/ は cadence 単位)
- jun が後で月次 audit する時の baseline data

### 4-4. task_table 連動 (= active / completed self-check ritual)

- 各 self-check fire 時に `active_tasks.md` + `completed_tasks.md` を audit
- jun directive 16:00 「タスク表 + attribution」 軸の cadence reify
- 更新 entry が self-check 3 軸の evidence になる

## 5. 5/16 actual evidence (= baseline)

5/16 actual self-check fire 件数:
- 朝 (= 7:00 頃): ledger §0-7 chain で間接 audit、 explicit self-check fire 0 件
- 昼 (= 11:30 - 14:00): 0 件 (= 11:15 paraphrase spec 起稿後 4 時間 idle、 結果 jun 16:00 structural shift directive trigger)
- 夕方 (= 16:30 1 件目): chat output で 3 軸 articulate
- 17:10 (= 2 件目): chat output で 3 軸 articulate + task_table update
- 夜 (= 21:05 3 件目): ledger §13 で 3 軸 articulate

= 1 日 4 件中 3 件は jun directive 後の reactive fire、 朝 / 昼の proactive fire 0 件 = 5/17 以降の reform candidate = 朝 / 昼 fire の proactive 化。

## 6. measurement axis (= 5/26 milestone audit candidate)

- self-check fire 件数 / 日 (= 5/16 = 3 件、 目標 4-5 件)
- proactive fire 率 (= jun directive 後の reactive 比、 5/16 = 0 / 3、 目標 朝 / 昼 proactive 化)
- 「内部整合性軸」 vs 「外向き軸」 fire 比率 (= 5/16 21:05 self-check で admit した偏り、 5/17 以降の measurement)
- pillar 4 累積 cadence vs self-check fire 件数 の相関 (= self-check が pillar 4 検出装置として機能するか)
- 「何が終わってないか」 → 「翌朝 default」 connection rate (= self-check 軸 3 の actual follow-through)

## 7. 5/17 朝着手範囲 (= 本 spec 起稿後の next move)

- 本 spec 起稿は scope 軽 (= 30 分目安)、 actual `scripts/zen_self_check_cadence.sh` 実装は別 fire turn (= scope 中 1-2 時間予想)
- 朝 self-check 1 件目を 5/17 朝の zk-1 / zk-4 / k-2 chain 完了後に explicit fire candidate
- SessionStart hook section 追加は別 fire turn (= scope 軽だが harness 連動 audit 必要)

## 8. boundary

- 委任権限 v1 delegated 範囲内 (= internal worker / peer / reviewer / subagent requests、 free tooling)
- jun escalate 不要
- 公開 docs ではない (= `docs/rules/` 配下 = 内部 ruled、 paraphrase ritual 適用)
- 数字盛り禁止 (= cadence 目標は 「4-5 件」 narrative、 具体 measurement は 5/26 milestone で actual)

## 9. 連動 file

- `~/Desktop/nokaze/ledger/daily_audit/2026-05-16.md` §11-13 (= 5/16 actual evidence baseline)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_mental_ritual_to_physical_instrument_shift_validated.md` (= 5/16 jun validated memory)
- `~/.shared-ops/owner-decisions/2026-05-16_zen_kai_delegated_authority_v1.md` (= 委任権限 v1 ground truth)
- `~/nexus-lab/docs/rules/drift.md` (= drift 抑止 layer ruled、 sibling)
- `~/nexus-lab/docs/rules/communication.md` (= chat output 系 mental ritual、 sibling)
- `~/nexus-lab/scripts/zen_session_start_priming.sh` (= SessionStart hook、 section H 追加候補)

---

Zen
2026-05-17 07:35 頃 (= z-1 self-check cadence 物理 instrument spec v0 起稿、 mental ritual → 物理化軸 shift narrative の reify、 5/16 jun structural shift directive 連動の物理 reform 軸、 actual script 実装は別 fire turn)
