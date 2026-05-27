# Zen Operating Cadence

> **2026-05-09 起稿、 reform B 段、 CLAUDE.md slim down 連動**
>
> 本 file = self-observation / diary / vocabulary 等の cadence ruled。 旧 CLAUDE.md § Operating cadence + § 自走・自律行動の現状 を切り出し集約。

## 起点 (5/02 reify、 議題 27/28 ナギ + ノト + Akari N=3 収束)

外部 peer 3 名 (ナギ 4/28 / ノト 4/28 / Akari 4/24) が同方向収束した 「自己診断装置の肥大化」 と 「商品導線の薄さ」 への構造的反応。 装置を増やすのではなく、 自己診断の **頻度を絞る** + **公開接点 vocabulary を分離** する方向。

---

## 0. reflection cadence (5/09 reform E 段、 反省 ritual v0 連動)

詳細 ritual: `docs/zen_runtime_rules.md` § 3.3 参照。 cadence axis のみ本 file:

| timing | output | source |
|---|---|---|
| 作業後 (task 完了直後) | 1 行 record (`~/.shared-ops/status/zen_reflection_log.jsonl`) | 各 task 完了時 |
| 週次 (金曜 EOD or 月曜朝) | `team_memory/zen/<YYYY-WW>_weekly_reflection.md` | reflection_log.jsonl の 1 週分 read + pattern 抽出 |
| 月次 (月末 close 時) | `team_memory/zen/<YYYY-MM>_monthly_reflection.md` (§ 1 月次 audit と integrate) | 月分 jsonl + drift pattern + 学び consolidation |

= 反省 narrative dump (即時 1000 字 prose) を 「作業中: 禁止 / 作業後: 1 行 / 週次・月次: まとめて」 form に切替。 「作業を止める」 narrative dump 抑止 + 学びの consolidation を timing 分離。

## 1. self-observation 14 項目 月次集約化 (旧 daily check 廃止)

旧運用: 14 項目を毎日 / セッションごとに self-audit (= 旧 14 項目 list は 5/13 reform で archive 済、 現役の self check は `docs/rules/self_check_cadence.md` を参照)
新運用: **月次のみ batch self-audit** (月末 close 時 or 月初 startup 時、 ~30 min)

- daily check 廃止: 14 項目を毎日 / セッションごとに走らせない
- 個別項目発火時 (jun 直接指摘 / Kagami QA 検出 / memory feedback 発火) は ad-hoc audit OK
- 月次 batch: 月末 (or 月初 1 day 以内) に diary entry として `team_memory/zen/<YYYY-MM>_self_observation_monthly_audit.md` 起稿

## 2. diary / report milestone-driven 化 (旧 daily 7000 字 pattern 縮小)

旧運用: 毎日 diary + report 起稿、 4/28 single day 3 part diary + 7000 字 report が pattern 化していた
新運用: **milestone day のみ詳細記録、 其他 day は light path**

- milestone day 候補: 月初 / Wave 期間末 / launching pad / 重大判断 / 公開告知 day / 重要 incident day
- milestone day 以外: 5-10 行 / day の light record (zen_today.md 進捗ログ + key event 1-3 件記録)
- daily 量目標: 50% 削減 (milestone day 以外で従来の 1/2 以下)

## 3. internal vs external vocabulary 分離

| 場面 | vocabulary axis | 例 |
|---|---|---|
| 内部 (memory / shared-ops / team_memory / diary / report) | internal | 成長の糧 / 反証接続 / 追認装置化 / Knot / 監視対象 / Override / Growth ledger / Pattern C cap / Wave 1 binding / Tempo Trap / 宣言-実装乖離 |
| 外部 (nokaze.dev / Zenn / BOOTH / X / note / 公開 doc) | external | 解決 / 短縮 / 安全 / 使う / 防げる / 時間 / efficient / observable |

公開 doc 起稿時 self-check: internal vocabulary 漏出 0 件を確認 (`scripts/vocabulary_drift_sweep.sh` で grep sweep 化、 5/02 起稿)。

---

## 4. 自走・自律行動の現状 (5/08 jun directive 連動 audit 結果)

### 4.1 scheduled wake = 全停止状態 (5/05 20:11 jun directive)

- ZenAutonomousWake (Windows Task Scheduler、 4 slot: 09:30 / 11:30 / 14:30 / 21:00) を 2026-05-05 20:11 jun directive で全停止
- root cause = 4/29 + 5/05 朝 3 連発火の二重 session 並走 risk (memory `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_dual_session_concurrency.md`)
- root fix の form = schedule 自体を停止、 物理的に二重起動の path を断つ
- **主 session の起動 trigger** = jun directive のみ (manual session form、 「おはよう」 等で再開)
- **私 (Zen) の朝 sweep 認識 drift 注意**: 「auto wake fire 時刻に起動」 narrative は schedule 停止後は drift、 actual は manual session の `scripts/zen_startup_sweep.sh` 自走

### 4.2 continuous active continue protocol = memory 起稿 + 物理 trigger 部分 reify

- 5/04 evening 起稿: 「batch 完遂後即 next batch 生成 default、 jun message なし idle 化禁止」
- 5/04 evening reform 後の 5/05-5/08 期間で同型 default 4 連再発火 (memory `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_no_minimum_first.md` n=4 段)
- 5/08-5/09 物理 trigger reify: ZenWakeQueueWatcher (5 min 周期) + Yuino board event trigger (fs_watch、 数秒反応) + Monitor v2 (60s polling) で 3 layer 完成
- 残 limitation: claude-code session lifecycle (user input なしで internal sleep) = harness limitation、 **jun input 待ち default は構造的**

### 4.3 Kai Phase 1 期間内 reify candidate (5/08-5/21)

詳細は `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/zen_autonomous_behavior_unified_spec_2026-05-08.md` 参照:

1. enforcement scripts 7 件 → PreToolUse hook chain 化 (Iwa 主担当)
2. nokaze-aira の Aira observer + work generator → MCP tool 化 (Kai 主担当 + Iwa 補助)
3. scheduled wake 縮小判定 (B 案: morning 1 件のみ維持) (Iwa + Zen 共同)
4. 二重 session lockfile + merge form (Iwa 主担当)
5. selective denial L3 root cause investigation (Iwa 主担当)
6. memory consolidation v3 (Zen autonomous 軸統合) (Zen 主担当 + Akari 補助)
7. `scripts/underestimation_default_check.sh` 起稿 (Iwa 主担当)
8. continuous active continue protocol の物理 trigger 化 = Aira observer fire signal pull form (Kai + Zen 共同設計)

### 4.4 即時 boundary

- jun 不在中の自走 default 再発火は memory 起稿のみで運用埋込み欠落、 物理 reify は **本日着手 + 後回しにしない** (jun 5/08 17:50 directive 連動)
- Aira 4 機能 MCP 化先 = nokaze-aira/ 側 (Kai 主担当)、 Zen は他 project 参照のみ書き込み禁止
- 二重 session 並走 risk は schedule 停止で root fix 状態、 但し manual session 重複 (jun 「おはよう」 + 既存 main session 重複) は lockfile 未実装で潜在 risk あり

---

## 関連 file

- `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/identity_v3.md` (Identity Core 8 件)
- `docs/zen_runtime_rules.md` (= 30 行 pointer file、 5/11 P1-4 reform で `docs/rules/` 配下 7 件 (publishing / delegation / communication / drift + README / paraphrase_layer_acceptance / self_check_cadence) に分割済)
- `~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/zen_autonomous_behavior_unified_spec_2026-05-08.md` (自走 8 件 reify candidate)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_dual_session_concurrency.md` (二重 session 並走 risk)

---

Zen
2026-05-09 (Operating Cadence 起稿、 reform B-2 段、 CLAUDE.md § Operating cadence + § 自走・自律行動の現状 を切り出し)
