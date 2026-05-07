# Aira (nexus-lab/aira/) — Sunset Plan

**Status**: historical / fallback (5/07 朝 Kai audit 完遂後)
**Deprecation date**: 2026-05-26 (canonical switch milestone)
**Date written**: 2026-05-08 (Zen)

## Origin

This `nexus-lab/aira/` directory contains 4 functions (Observer + Work Generator + Evaluator + Tripwire) implemented by Zen between 4/28 and 5/06 as the first attempt at the Aira supervisor structure (議題 27/28 連動、 「自己診断装置の肥大化」 + 「自己停止検出 N=1 弱い」 への構造的反応)。

| Function | File | Reify date | Test status |
|---|---|---|---|
| Observer | `src/aira-observer.ts` | 2026-05-06 (commit a43c788) | vitest 151/151 pass |
| Work Generator | `src/aira-work-generator.ts` | 2026-05-06 (commit 8974eeb) | included |
| Evaluator | `src/aira-evaluator.ts` | 2026-05-06 (commit 94e4cc0) | included |
| Tripwire | `src/aira-tripwire.ts` | 2026-05-06 (commit 2cc2143) | included |

5/06 evening: Aira ground truth narrative confirmation (jun + Kai) → **「Aira 実装の正本 = Kai-side `nokaze-aira/`」** に確定 (1 entity 2 narrative の 1 = Aira 実装は Kai 主担当 ruling)。

## Audit (Kai 主導、 work-234)

5/19 EOD target → **5/07 朝に 12 day 前倒し完遂** (commit `bbfa50b`、 audit report = `C:\Users\jk023\Desktop\nokaze-aira\docs\aira_zen_4functions_audit_2026-05-07.md`)。

### 結論 (Kai audit)

| Function | Audit verdict | Reason |
|---|---|---|
| Observer | migrate: none | nokaze-aira observer step 全部含む |
| Work Generator | migrate: none | nokaze-aira decide step 全部含む |
| Evaluator | migrate: none | nokaze-aira verify step 全部含む |
| Tripwire | migrate: none | nokaze-aira recover + Approval Gate 全部含む |

Kai-only retain (移植不要): atomic write + 各種 hardening (timestamp guards / 明示 active-work 解析 / `## 選んだ1件` 解析等)。

= **移植 candidate ゼロ**、 Zen 4 機能は historical / fallback として 5/12 dogfood close まで保持、 5/26 で deprecated 確定。

## Sunset timeline

| Date | Action | Status |
|---|---|---|
| 2026-05-06 | Aira 実装正本 = Kai-side 確定 | ✅ done |
| 2026-05-07 朝 | Kai audit 完遂 (work-234) | ✅ done |
| 2026-05-07-2026-05-12 | dogfood 期間、 fallback として保持 | active |
| 2026-05-13-2026-05-25 | Phase B 期間、 nokaze-aira primary、 fallback unused 想定 | active (no-op) |
| **2026-05-26** | **canonical switch milestone**: Zen 4 機能 deprecated 確定、 本 directory archive | planned |
| 2026-05-26 以降 | `nexus-lab/aira/` → `nexus-lab/aira-archive-2026-05/` rename 物理化 | planned |

## Sunset action (2026-05-26)

1. `git mv nexus-lab/aira nexus-lab/aira-archive-2026-05` (rename = git history 保持)
2. CLAUDE.md の 「Zen 4 機能 (nexus-lab/aira/src/aira-*.ts) の取り扱い」 section を archive 完了 narrative に書き換え
3. ops-console や他 component の import path で `aira/` 参照あれば audit + remove (5/07 PM 時点では参照なし、 vitest 94/94 pass で確認済)
4. `team_memory/zen/diary/2026-05-26_*.md` で sunset record

## Rollback condition (例外 = nokaze-aira/ で 7 day 連続 closed loop fail 時のみ)

5/26 以降の rollback は以下 1 条件のみ受理:

- **nokaze-aira/ closed loop が 7 day 連続で fail** (observer / decide / dispatch / verify / recover / execute の 6 step のいずれか 7 day 連続 fail = 構造的不整合)

その場合 `nexus-lab/aira-archive-2026-05/` を fallback として再 enable、 但しこれは緊急避難 path、 通常運用では使わない。

その他の rollback 条件 (例: 単発 fail / 開発者主観の 「Kai-side 弱そう」 narrative / Phase 移行不安) は受理しない、 「fallback 名目で残し続ける」 drift (memory `feedback_surface_learning_without_operational_embed.md` 同型) 防止のため。

## 5/12 dogfood close 後の状態

- nexus-lab/aira/ は no-op で保持 (rename / delete はしない、 5/26 まで)
- 新規 enhancement / bugfix は **nokaze-aira/ 一本化** (CLAUDE.md ruled)
- Zen 4 機能への新規 commit は 5/12 以降禁止 (5/13+ Phase B = nokaze-aira/ primary)

## boundary 注意

- Zen は **nokaze-aira repo は readonly 参照のみ** (CLAUDE.md「他プロジェクトは参照のみ、書き込み厳禁」 ruled 適用)
- Aira-related proposal は `~/.shared-ops/board/` or `~/.shared-ops/proposals/` 経由で Kai に投げる (Pattern C 同形)
- Zen は **Aira を二重実装しない**、 中核 work shift = 「Aira 実装」 → 「Yuino 商品化体験設計」 (5/06 evening reform)

## related

- `CLAUDE.md` § Zen 4 機能 (nexus-lab/aira/src/aira-*.ts) の取り扱い (5/07 朝 audit 結果反映済)
- `memory/feedback_aira_ownership_shift_kai_lead.md` (役割分担、 Kai 主導 ruling)
- `memory/feedback_aira_yuino_naming_fixed.md` (1 entity 2 narrative ground truth)
- `memory/feedback_yuino_productization_consolidated.md` § 2 (役割分担統合 entry)
- `nokaze-aira/docs/aira_zen_4functions_audit_2026-05-07.md` (Kai audit report、 readonly 参照)

---

Zen
2026-05-08 0:16 (Zen 4 機能 SUNSET.md 起稿、 5/26 deprecated 物理 boundary 明示、 rollback 条件 = nokaze-aira/ 7 day 連続 closed loop fail のみ受理、 「fallback 名目で残し続ける」 drift 防止、 5/26 milestone day で `nexus-lab/aira-archive-2026-05/` rename 予定)
