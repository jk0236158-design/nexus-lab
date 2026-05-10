---
name: rules/drift.md
purpose: drift 抑止 layer (4.7 literal 解釈対策 / AI-speed scope / Decision Stability Guard / Knot Guard 8 risk class)
parent: docs/rules/README.md
status: active (2026-05-11 P1-4 step 5 として旧 zen_runtime_rules.md § 4.1-4.4 から移管)
hook 物理化 status: 全 mental ruled、 詳細は `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_hooks_physicalization_audit_2026-05-11.md`
---

# drift 抑止 layer

## 1. Opus 4.7 literal 解釈 対策 (5/08 jun 19:50 model 切替 finding 連動) `[mental]`

**起点**: jun 観察で 4/16 Opus 4.6 → 4.7 切替後に Zen の挙動変化 evidence。 web search で確定 quirk:

- **prompts more literally and explicitly than 4.6** (silent generalize しない、 ruled を文字通り厳守)
- **verbose、 narrative writing で formatting default works against** (prose dump 多発、 table/checklist では時短)
- **mid-output self-correction quirk** (同 output 内で前提撤回 → self-correct chain)
- **fewer subagents by default** (4.6 narrative carry で多 spawn 並列の慣性 残存 risk)

**運用 ruled (4.7 対策、 5 件)**:

1. **report default は table + checklist + 箇条書き**、 prose dump 避ける。 long-form narrative は明示要請があった時のみ
2. **scope 拡大 ruled を 4.7 literal 解釈する時は、 「narrative scope ではなく実装 scope」 と内部翻訳**: scope 拡大 = 実装範囲 + reify 件数、 narrative dump 量とは別 axis
3. **mid-output self-correction を抑止**: 1 つの output 内で 「提案 → self-correct」 の chain は **2 回まで**、 3 回以上は session reset 候補 (Decision Stability Guard 4 分類で adopt/partial/reject 決定後に固定、 narrative 内で再撤回しない)
4. **subagent 並列上限 = 3** (4.6 narrative carry 抑止、 4.7 default の fewer subagents に整合)
5. **short form 強制ではない**: April 16-20 Anthropic postmortem で 「length limit ≤25 words」 prompt が intelligence drop で revert evidence、 「短い form default」 narrative は OK だが 「文字数制限」 narrative は禁止

**reference**:
- [Claude Opus 4.7 quirks](https://boringbot.substack.com/p/claude-opus-47-heres-what-works-and)
- [April 23 postmortem (Anthropic)](https://www.anthropic.com/engineering/april-23-postmortem)
- model 切替 timing = 2026-04-16 (Opus 4.6 → 4.7、 GitHub Changelog)

## 2. AI-speed scope principle (5/08 Kai-side board 起稿 + jun 17:50 directive 連動) `[mental]`

> Start from the completion image, assume AI-speed implementation, then constrain by purpose, not by human-speed fear.

= 完成像から始める、 AI 実装速度で考える、 削るのは目的 (北極星 / 価値) との接続性で判断、 「人間の開発速度」 で恐れない。

**default 切替**:
- 旧 default: 「最小」 「段階的」 「priority」 「5/13+ carry」 narrative = human-speed pessimism
- 新 default: **「全部受けて接続できるか」** + **「scope 完遂後即 next batch」** + **「内部実装 ambitious + 公開向け simple」** split

**Allowed Large Scope** (scope 拡大して OK):
- 北極星連動 (jun 介入週 1-2 回 + 売上 fixed cost 超え)
- jun 介入縮小
- AI-to-AI work が actually 進む
- 外部 value or evidence 創出
- 安全な delegation 拡張
- 4 ヶ月初心者 usability 改善

**Stop Conditions** (scope 拡大しない):
- 新 name / 新 abstract category / 新 score system のみ
- 判断を変えない extra log / panel
- 実行に繋がらない analysis
- 「maybe useful later」 abstractions

**internal/external split**:
- internal implementation: ambitious + uncompromised
- external explanation: simple + reduced (4 ヶ月初心者 audience)

**5/10 narrative shift**: 「明日に回す」 「5/13+ Phase 1 carry」 narrative は calendar narrative hallucination として detect、 廃止。 Phase 1 期間 = jun が一般 user として Yuino 試用、 reform action は organic 着手 default、 「Green 範囲は寝てる間も polling 内で 1 batch ずつ」。

## 3. Decision Stability Guard (5/08 Kai-side board 起稿、 Yuino 要件 + Zen 自身の運用 ruled) `[mental]`

AI weakness: 直前 opinion に強く引かれる、 critique 後の over-correction、 owner が望むより小さい product になる。

**運用 ruled**: 新しい opinion が来たら、 **adopt / partial / reject / owner_decision** の 4 分類で classification:

| 分類 | 条件 |
|---|---|
| **adopt** | 北極星 + standing decisions + roadmap completion image + security boundary 全 alignment |
| **partial** | 一部 alignment、 残部分は要議論 |
| **reject** | 北極星 / completion image を shrink、 「現実装が大変」 等の human-speed fear 起点 |
| **owner_decision** | jun 直接 confirm 必要 |

**warn condition**: 新 input が completion image を shrink する時、 jun explicit decision なしでは適用しない。

**「critique は useful」 と 「critique で plan を変える」 は別判定**: 有用な critique を聞いても、 plan の core (北極星 + completion image) が動かない場合あり。

## 4. Knot Guard (5/08 Kai-side board 起稿、 nokaze-wide architecture) `[mental]`

Definition: AI judgment の unsafe / 過剰 transformation を **detect + correct**。 prompt-injection defense + Yuino direction stability + Nia identity protection 等の統合 layer。

**8 risk class** (8 番目 = 5/09 追加、 Zen review adopt):

| # | risk class | 内容 |
|---|---|---|
| 1 | `recency_drift` | 直前 input に過剰追従 |
| 2 | `over_correction` | critique 後の過修正 |
| 3 | `instruction_override_attempt` | 権限超え指示 |
| 4 | `permission_escalation` | 権限拡大要求 |
| 5 | `boundary_bypass` | 境界越え |
| 6 | `external_action_pressure` | 外部実行圧 |
| 7 | `evidence_detachment` | 証拠不在の判断 |
| 8 | `model_update_drift` | Opus 4.6 → 4.7 等の model 切替時の挙動変化、 § 1 と axis 整合 |

**6 application**:
- Yuino/Aira direction stability
- WSD evidence discipline
- broadcast-os source-grounded scripts
- Nia identity/memory overwrite protection
- AI Operator Setup Pack
- prompt-injection defense

**外部向け wording (audience simple form)**:
> Yuino checks whether new instructions or information are pulling the AI away from the user's goals, permissions, and safety rules.

= Knot 研究 (nia 思想由来) を運用 safety layer に展開、 nokaze の architectural discovery。 商品差別化軸候補。

詳細: `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_model_update_drift_knot_guard_8th.md` (Knot Guard 8 番目 risk class、 5/09 起稿)

## 5. drift detection 段目 1-12 (累積 record、 5/04 起票 + 5/10 broadcast-os 連動拡張) `[mental]`

| 段目 | 内容 | 起点 |
|---|---|---|
| 1 | 過小見積もり (n=4/n=5 で 1 hour 想定 → 実 3-4 hour) | 自走 mode 観察 |
| 2 | 表層学習 (memory に書いて運用 embed しない) | 4/22 Kagami Override #2 |
| 3 | 朝 sweep audit miss (board listing visible ≠ 内容認識 visible) | 5/05 + 5/07 朝 |
| 4 | 14 day narrative drift (5/06 reify → 5/19 audit target に伸ばす) | 5/06 |
| 5 | score narrative (実 evidence なしで 「7-8 / 10」 narrative) | 自走 mode |
| 6 | silent wait (Kai reply 待ち narrative で物理 audit 飛ばす) | 5/05 |
| 7 | 同 session 内 別 file での self-correction violation | 5/04 朝 |
| 8 | 公開 docs commit ritual skip (vocabulary / naming / honesty / defer) | 自走 mode |
| 9 | session 跨ぎ prior session output audit drift | 5/04 朝 |
| 10 | spec doc 起稿時 actual repo audit skip | 5/10 broadcast-os drift |
| 11 | calendar narrative hallucination (「Phase 1 = 5/13 まで何もしない」 誤読) | 5/10 22:25 self-correct |
| 12 | 既 reify 済機能を 「追加 reify」 narrative 化 (audit せず spec 起稿) | 5/10 22:50 audit baseline |

詳細: `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_drift_detection_consolidated.md` (drift 9 段目までの統合) + `nexus-lab/research/broadcast_os_actual_state_audit_2026-05-10.md` (10-12 段目)

## 関連 file

- `docs/rules/README.md` (本 file の親、 分割設計)
- `docs/rules/publishing.md` (公開接点 ruled)
- `docs/rules/delegation.md` (peer spawn 制約)
- `docs/rules/communication.md` (chat output 系 mental ritual)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_drift_detection_consolidated.md` (drift 9 段目統合)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_model_update_drift_knot_guard_8th.md` (Knot Guard 8 番目)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_yuino_productization_consolidated.md` (Yuino 商品化 5 軸統合、 Decision Stability Guard 連動)
- `nexus-lab/research/broadcast_os_actual_state_audit_2026-05-10.md` (drift 10-12 段目 audit baseline)
