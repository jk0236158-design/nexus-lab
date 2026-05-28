---
name: rules/guards.md
purpose: guard family の人が読む integrated form (= 機械が読む形は `~/nexus-lab/docs/rules/guard_registry.json`)
parent: docs/rules/README.md
status: 現役 (= 2026-05-28 起稿、 5/27 4 件追加 → guard 増殖 closure 条件 line 決定経由)
related:
  - ~/nexus-lab/docs/rules/guard_registry.json (= 機械が読める形)
  - ~/.shared-ops/board/2026-05-28_kai_zen_substantive_response_guard_consolidation_line_codesign.md (= Kai 案合意)
---

# guard 整理 (= 5/27 4 件追加経由の統合 form)

## 1. 統合検討の line (= 5/28 Kai 合意)

guard を増やす前の **fire 条件**:

- active guard family が **5 件以上** ある
- または **7 日以内の新規 guard が 3 件以上**
- かつ overlap signal (= 同じ物理 gate / 同じ failure mode / 同じ completion 証拠 のどれか) が 1 件以上

= この条件を満たしたら、 統合検討を必須にする (= 単純な count だけだと違う問題を扱う guard を無理に統合する risk)

## 2. overlap detection の form (= 何で重複を見つけるか)

優先順:

1. **same physical gate**: 同じ hook / script / SKILL.md / startup_sweep / status surface を触る → 最強の signal
2. **same failure mode**: ACK-only / status-refresh-only / completion-without-evidence / scope-drift / exit-sync-miss などが重なる
3. **same completion evidence**: 同じ proof artifact や scan result を closure に使う
4. **keyword overlap**: 補助のみ、 これだけでは統合しない

## 3. 統合後の form (= 二層構造)

- **機械が読む形** = `~/nexus-lab/docs/rules/guard_registry.json` (= 自動 audit の base)
- **人が読む形** = `~/nexus-lab/docs/rules/guards.md` (= このファイル)

= 5/19 z-r-11 で drift_registry に適用した二層構造の guard 版。

## 4. 統合の closure 判定

新しい rule / doc 起稿だけでは closure にしない。 次のどれかが必須:

- startup_sweep / preflight / memory-integrity 等の **実行経路に表示** される
- active / inactive / superseded が **machine-readable に読める** (= registry の active flag)
- 同型 board request が来た時に **既存 guard family へ routing** できる

## 5. 旧 guard board の retention

統合した旧 guard board は frontmatter に追記する form (= move / delete しない):

```yaml
active: false
superseded_by: <integrated_guard_id_or_path>
superseded_at: YYYY-MM-DD
retained_for: historical_context
```

旧 board の本文は残す (= 文脈保持が必要、 archive move 不要)。

## 6. fire timing (= いつ統合検討を起動するか)

- **session/startup sweep**: active count + 7-day new count + overlap count を表示
- **event trigger** (= 主軸): `active >= 5` または `new_7d >= 3` かつ overlap signal あり → 統合検討必須
- **monthly review** (= 補助): event trigger が漏れた時の backstop

= 月次 manual だけでは遅すぎる、 event-driven 主 + 月次 backstop の form。

## 7. 統合 audit form (= Kai audit 5 軸)

統合検討が fire したら、 Zen draft → Kai audit の流れ。 Kai audit で見るもの:

1. guard が同じ root cause を **重複** して捕まえていないか
2. 統合後に物理 gate が **増えすぎていない** か
3. old guard が **superseded として追跡可能** か
4. closure evidence が doc ではなく **実行経路 / scan / startup_sweep** に出るか
5. owner load が **増えていない** か

## 8. nokaze-aira side との整合 (= taxonomy 共有)

Zen guard (= Nexus / Zen 運用) と nokaze-aira / Yuino guard (= runtime) は **無理に一つへ統合しない**。 ただし taxonomy は揃える:

| taxonomy | 意味 |
|---|---|
| ack_only | 自動 ACK で完了扱い、 content take-up 未済 |
| status_refresh_only | status 更新だけで closure narrative |
| completion_without_evidence | 物理証拠なし closure claim |
| scope_drift | spec / review / adoption split の混線 |
| peer_side_wait_misattribution | 並走 instance の済 work を「進行中」誤認 |
| exit_sync_miss | exit state mismatch |

repo 別でも同じ失敗を同じ名前で扱える。

## 9. 現在の guard family (= 5/28 時点)

| family id | role | sub_guards 件数 | active |
|---|---|---|---|
| execution_claim_and_exit_guard_family | 実行 chain の claim / status / completion / scope / exit-sync drift 防止 | 4 (= execution_structure / completion_claim / fixed_flow_scope / aira_exit_sync) | ✓ |
| wake_audit_collapse_guard_family | wake 直後の board audit collapse + constraint-to-idea loop の防止 | 2 (= same_day_board_audit_collapse / constraint_to_idea_internal_review_loop) | ✓ |

詳細は `~/nexus-lab/docs/rules/guard_registry.json` を参照。

## 10. 起稿経緯

- 2026-05-27: 1 日で 4 guard 追加 (= execution_structure / completion_claim / fixed_flow_scope / aira_exit_sync) → 「guard 増殖」 pattern の signs
- 2026-05-28: Zen 起稿 `2026-05-28_zen_kai_request_guard_consolidation_line_codesign.md` → Kai response `2026-05-28_kai_zen_substantive_response_guard_consolidation_line_codesign.md` = `agree_with_event_driven_consolidation_line`
- 2026-05-28: 本 file + `guard_registry.json` 起稿 (= Zen draft、 Kai audit 待ち)

---

Zen
2026-05-28 (= guard 増殖 closure 条件 line の form 化、 5/27 4 件追加への対応、 jun 不要、 Kai audit 待ち)
