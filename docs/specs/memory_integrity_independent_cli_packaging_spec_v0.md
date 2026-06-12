# Memory Integrity 独立 CLI packaging spec v0 (= k-2 補助軸、 Zen-side)

> Status: design draft — not current runtime rules (= 2026-06-12 注記。 5/17 当時の設計記録。 実装状況: Memory Integrity 本体は nokaze-aira 側で実装が進行 = yuino-memory-integrity.ts、 独立 CLI packaging 軸は未着手)

起稿日: 2026-05-17
起稿主: Zen (= Kai-led k-2 軸の補助 spec、 nokaze-aira 側 file 抽出 + packaging axis articulate)
連動: 5/16 17:46 委任権限 v1 採用後の自走範囲 (= free CLI publish 範囲) + 5/16 ledger §13 「外向き axis priority reframe」 narrative
status: spec v0 (= Kai k-2 spec 起稿の補助 reference、 actual implementation は Kai 主導)

---

## 1. 起稿軸 = effects テコ #2 の物理化準備

5/16 朝 jun 診断レポート 「効くテコ 4 件」 中:
- 効くテコ #1 = Yuino β 販売開始 (= Red boundary、 paid sales launch 軸)
- **効くテコ #2 = Memory Integrity 独立 CLI 化** (= 委任権限 v1 free CLI publish 範囲、 Kai-led)
- 効くテコ #3 = 北極星 5 step 連動
- 効くテコ #4 = audience reach channel 開拓

= 効くテコ #2 は私 + Kai 自走範囲、 Red boundary なし、 5/17 朝 「全部進めていいよ」 directive 連動の即時 fire 候補軸。 Kai k-2 spec 起稿の補助として、 Zen 側で nokaze-aira 現状 audit + packaging axis articulate を本 spec で reify。

## 2. nokaze-aira 側 Memory Integrity actual file map (= 5/17 07:40 audit)

### 2-1. core src file

- `~/Desktop/nokaze-aira/src/yuino-memory-integrity.ts` (= **970 行**、 provider-neutral memory map diagnostics)
  - export type: `YuinoMemoryIntegritySeverity` (P0/P1/P2) / `YuinoMemoryIntegrityKind` (8 種: target_root_unreadable / broken_reference / double_source_of_truth / agent_definition_mismatch / generic_agent_definition / rule_self_contradiction / stale_context / duplicate_worktree_context)
  - schema: `YuinoMemoryIntegrityFindingV1` / `YuinoMemoryIntegrityRepairGroupV1`
  - 依存: nokaze-aira 内の `src/yuino-source-of-truth.ts` (= `YuinoParticipantId` / `YuinoPermissionLevel`) + `src/yuino-state-audit.ts` (= `writeYuinoAuditedFile`)

### 2-2. test file

- `~/Desktop/nokaze-aira/tests/yuino-memory-integrity.test.ts` (= **207 行**、 unit tests)

### 2-3. integration touch points (= grep 経由 5 件)

- nokaze-aira `src/yuino-audit-replay.ts` (= audit replay 経由の連動)
- nokaze-aira `src/yuino-dashboard-renderer.ts` (= dashboard 表示)
- nokaze-aira `src/yuino-dashboard-server.ts` (= dashboard API)
- nokaze-aira `src/yuino-idle-work-loop.ts` (= idle work で memory integrity scan auto fire)
- nokaze-aira `src/yuino-module-boundary.ts` (= module 境界 audit)

= core src 1 file + test 1 file + integration touch 5 file = **計 7 file** が Memory Integrity 関連の actual nokaze-aira 側 file。

## 3. 独立 CLI 化の packaging axis articulate (= 5 step working sequence base)

### Step 1. core extraction = `@nokaze/memory-integrity` package design

- 上記 core 1 file (= 970 行) + 依存 (= `YuinoParticipantId` / `YuinoPermissionLevel` / `writeYuinoAuditedFile`) を新 package に extract
- 依存先 (= source-of-truth / state-audit) は **interface だけ extract** + dependency injection form、 actual yuino runtime に依存しない provider-neutral design 維持

### Step 2. CLI surface design

- `@nokaze/memory-integrity scan <target-root>` = 既存 scan logic を CLI invoke 化
- `@nokaze/memory-integrity scan --json` = machine-readable output (= AI agent setup ritual で AI が consume 可)
- `@nokaze/memory-integrity scan --severity P0` = severity filter
- `@nokaze/memory-integrity scan --kind broken_reference` = kind filter
- exit code = P0 finding あれば exit 1、 P1/P2 のみは exit 0 (= CI 連動可)

### Step 3. provider-neutral test extraction

- 既存 207 行 test を新 package 配下に extract + nokaze-aira runtime 依存を mock 化
- vitest + node native test runner 両対応 candidate
- minimum viable test set = 8 kind 全件 + severity 3 件 = 計 24 case 程度

### Step 4. README + LP draft (= 委任権限 v1 delegated 範囲)

- 「AI agent 用の memory map diagnostics CLI」 narrative (= jun 4 ヶ月初心者前提 + AI agent readable form)
- audience = AI agent (= Cursor / Claude Code / Codex / Gemini CLI) を使う developer
- value proposition = 「AI が読む file の整合性を AI が起動前に診断、 broken reference / source-of-truth 重複 / agent definition mismatch 等を P0/P1/P2 で surface」
- positioning = Yuino 商品の **lead magnet / proof surface** (= jun 診断レポート narrative と整合)
- 「fixed price ¥X」 narrative 禁止 (= candidate anchor narrative 維持、 価格 final state 表記なし)

### Step 5. npm publish (= 委任権限 v1 free CLI publish 範囲、 Kai 自走 GO)

- package name candidate = `@nokaze/memory-integrity` (= scope 確保済 candidate、 audit 必要) or `@nokaze/memory-integrity-scan`
- version = 0.0.1 (= experimental tag candidate)
- license = MIT (= free CLI publish 整合)
- README に Yuino β / Aira 連動 narrative 追加 (= 「この CLI は Yuino の一部、 詳細は yuino.nokaze.dev」 narrative)
- 公開先 = npm registry + nokaze.dev/aira/ section (= Akari portal 反映 zk-4 と連動)

## 4. delegated authority v1 整合 check

### delegated 範囲内 (= 即 fire 可、 jun confirmation 不要)

- free CLI publish (= npm publish 0.0.1)
- README / docs / LP draft publication
- internal worker (= Iwa / Akari spawn で extract + test + README 起稿)
- external comparison (= 類似 CLI の competitor research 必要なら hoshi spawn)

### Red boundary (= jun escalate 必須、 該当なし default)

- paid sales launch (= 0.0.1 は free CLI publish 軸、 paid 化軸 entry なし)
- final price decision (= 該当なし、 free CLI)
- direct sales outreach (= 公開後 audience reach narrative は別 axis、 outreach は public announcement 範囲)

= 全 step が delegated 範囲、 jun escalate なしで Kai 自走 + Zen 補助で進行可。

## 5. Kai k-2 spec 起稿への補助 narrative

Kai が k-2 spec を起稿する際の補助:
- 上記 2-1〜2-3 = nokaze-aira 側 actual file map (= extraction scope 確定)
- 上記 3 = 5 step working sequence (= jun 朝 narrative 連動)
- 上記 4 = boundary check (= 全 step delegated 整合)

私側補助 candidate (= Kai 起稿後の fire):
- Iwa spawn = core extraction の implementation
- Akari spawn = README / LP draft 起稿
- Iwa spawn = test extraction + minimum viable test set 起稿

## 6. measurement axis (= 5/26 milestone audit candidate 追加)

- `@nokaze/memory-integrity` の npm publish 完了 (= actual fire)
- README + LP draft 公開 (= audience reach 入口の 1 件目)
- AI agent setup ritual から CLI invoke される actual usage 件数 (= 5/26 measurement)
- Yuino β 商品 narrative との連動度 (= lead magnet / proof surface としての effects)

## 7. boundary

- 委任権限 v1 delegated 範囲内 fire
- 価格 final state narrative 禁止 (= candidate anchor narrative 維持)
- 数字盛り禁止 (= 「N 件 finding 検出」 narrative は actual scan 結果ベース)
- Kai-led 軸の補助、 Kai k-2 spec 起稿が主、 本 file は補助 reference

## 8. 連動 file

- `~/Desktop/nokaze-aira/src/yuino-memory-integrity.ts` (= core src、 readonly)
- `~/Desktop/nokaze-aira/tests/yuino-memory-integrity.test.ts` (= test、 readonly)
- `~/.shared-ops/owner-decisions/2026-05-16_zen_kai_delegated_authority_v1.md` (= delegated authority v1 ground truth)
- `~/Desktop/nokaze/task_table/active_tasks.md` §3 k-2 (= Kai-led task entry)
- `~/Desktop/nokaze/task_table/active_tasks.md` §1B zk-5 (= Memory Integrity CLI free CLI publish、 自走範囲 entry)

---

Zen
2026-05-17 07:40 頃 (= k-2 Memory Integrity 独立 CLI packaging spec v0 起稿、 nokaze-aira 側 7 file map articulate + 5 step working sequence + delegated authority v1 整合 check + 5/26 milestone audit candidate 4 件、 効くテコ #2 物理化準備、 Kai k-2 spec 起稿の補助 reference)
