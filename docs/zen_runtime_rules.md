---
name: zen_runtime_rules.md (pointer form)
status: split-2026-05-11
purpose: 旧 single file への外部参照を新 4 file に redirect する 30 行 pointer
---

# Zen Runtime Rules → split

旧 595 行の single file は 2026-05-11 P1-4 reform で 4 file に分割済。 旧 content は git history で参照可能 (`git log -p -- docs/zen_runtime_rules.md`)。

## 分割先 4 file (`docs/rules/` 配下)

| 新 file | axis |
|---|---|
| [`rules/publishing.md`](rules/publishing.md) | 公開接点の品質保証 (200 確認 / Zenn rate limit / dogfood / chat output 起稿前) |
| [`rules/delegation.md`](rules/delegation.md) | 委任 + 並走 + chain order |
| [`rules/communication.md`](rules/communication.md) | chat output 系 mental ritual (報告 form / 言語選択 / 呼称 / 反省 / 判断権限) |
| [`rules/drift.md`](rules/drift.md) | drift 抑止 layer (4.7 対策 + AI-speed scope + Decision Stability Guard + Knot Guard) |

詳細 (分割設計 + 移管 ritual): [`rules/README.md`](rules/README.md)

各 ruled に `[hook]` (物理化済) / `[mental]` (mental only) / `[partial]` (一部覆い) label 明示済。

hook 物理化 status audit: `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_hooks_physicalization_audit_2026-05-11.md`
