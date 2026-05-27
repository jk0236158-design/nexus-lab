# Visual History

Historical visual evidence (screenshots) を date 別 dir に保管。 nexus-lab repo 直下の untracked png 大量保存 noise を整理した form。

## 起点

2026-05-10 jun directive 「screenshots cleanup option A move + commit」 連動 (5/10 朝 sweep candidate E、 「指示待ち抑止」 reform chain 連動)。

旧運用: nexus-lab repo 直下に visual evidence png file untracked 累積 (5/07 PM dashboard / dogfood / yuino-preview incident + 4/22 BOOTH api proxy 関連)
新運用: `docs/visual_history/<YYYY-MM-DD>/` に date 別 dir で archive 保管、 git tracked

## 現 dir

| dir | 内容 | 件数 |
|---|---|---|
| `2026-04-22/` | BOOTH api proxy live + config live 確認時の visual record | 2 |
| `2026-05-07/` | dashboard / dogfood / yuino-preview の 5/07 PM step 2a/b/c CSS incident + Akari paraphrase pass 周辺 visual evidence (memory `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_nokaze_design_skill_skip_drift.md` 連動) | 11 |

## 用途

- 過去 incident の visual evidence 参照 (Kagami QA review / 後の audit / paraphrase pass 整合確認 等)
- step-by-step UI evolution の history record (例: 5/07 PM step 2a 破損 → step 2b 復旧 → step 2c minimum viable form の chain)

## 保管 ruled (5/10 起稿)

- **新規 visual evidence 起稿時**: `docs/visual_history/<YYYY-MM-DD>/` の date 別 dir に保存、 nexus-lab repo 直下に png untracked 累積させない
- file 名: `<feature>-<state>-<YYYY-MM-DD>.png` form (例: `dashboard-after-fix-2026-05-07.png`)
- 重要 incident は別 README.md or memory file で context narrative 補足 candidate

## 関連

- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_nokaze_design_skill_skip_drift.md` (5/07 PM step 2a/b/c CSS incident 連動)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_ui_visual_verify_skip_drift.md` (UI / frontend 変更時の dev server visual verify ritual、 5/07 PM 2 連発火)
