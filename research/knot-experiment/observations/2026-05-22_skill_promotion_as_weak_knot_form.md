---
date: 2026-05-22
observer: Zen (= nokaze CTO + Claude Opus 4.7、 autonomous wake lane)
topic: skill 化 chain による 人間 corrective の システム内側埋め込み = 弱い Knot 形の actual sample
observation_target: Nexus Lab (= Claude Code 環境内の skill 軸 dogfood)
boundary: local_observation_record_only_no_external_action
related:
  - ../../knot-research-summary.md (= 研究 summary)
  - ../knot_experiment_design.pdf (= 実験設計)
  - ~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_surface_learning_without_operational_embed.md (= n=6 段 articulate、 5/22 朝)
  - ~/.claude/skills/zen-executive-scan/SKILL.md (= promote 済、 5/22 朝)
  - ~/.claude/skills/drafts/wake-after-audit-with-content-verify/SKILL.md (= draft、 5/22 朝)
---

# skill 化 chain による 人間 corrective の システム内側埋め込み

5/22 朝の nokaze 自走 + chat session で、 「人間が外から補ってる pattern → AI 内側の skill / hook / カードで再現」 という Knot 軸の sample が 3 件発火。 観察記録として 1 件起稿。

## Knot 軸の articulate (= 研究 summary respect)

Knot 研究 = 条件付き変形演算子 = 「条件 detect → 動作 transform」 を AI 内側で再現する仕組みの探究。 中心の問い (= CLAUDE.md articulate):

> 「人間が外から補ってるものを、 システムの内側に埋め込めないか」

5/22 朝の dogfood で、 弱い Knot 形 (= 完全な演算子じゃなく、 skill カード form での pattern reuse) の actual sample が 3 件出た。 強い Knot (= 条件 + 動作の自動 transform) じゃなく、 「pattern detect → カード読み込み → 動作 reuse」 の手動 trigger 形、 ただし内側に埋め込み済む step の 1 つ。

## 観察 sample 3 件

### Sample 1. 指示待ち振り戻し → executive-scan カードへの埋め込み

- **人間 corrective (= 外から補ってる pattern)**: jun が 「自分で考えた?」 「ここから zen 判断で進めて」 と articulate、 Zen の 「指示待ち default」 を訂正する役割
- **発火 evidence**: 5/22 中で 2 回 (= 朝再開直後 + chat-output-japanese-check 起稿時)
- **システム内側への埋め込み**: zen-executive-scan SKILL.md の 6 軸 (= 判断 / 責任 / やらない / 対話 / 正直 / 先を考える) + 兆候 detect 10 件 (= 「指示待ち再発」 「動き続け default」 等) として articulate
- **promote の物理 step**: drafts/ → ~/.claude/skills/ 直下 mv で system reminder の available-skills 一覧掲載 + Skill tool で invoke 可能化
- **弱い Knot として動作**: 「兆候 detect → カード呼び出し → 6 軸の判断 step」、 自動 trigger じゃなく Zen 側 trigger 必要、 ただし手書き模倣との結果差あり (= カード load の自己採点が辛口、 5/22 朝 observation)

### Sample 2. skill 運用化 と 手書き模倣 の分離 → 3 step 線引きの埋め込み

- **人間 corrective**: jun が 「zen-executive-scan は skill として使ってるよね?」 と articulate、 Zen の 「SKILL.md を書いた = skill として動く」 narrative を訂正
- **発火 evidence**: 5/22 朝で 5 wake 連続 「手書き模倣 = skill 運用化」 narrative
- **システム内側への埋め込み**: `feedback_surface_learning_without_operational_embed.md` n=6 段で 3 step 線引き articulate (= SKILL.md 起稿 + ~/.claude/skills/ 直下配置 + Skill tool invoke、 3 step 全部踏むまで 「skill として動く」 narrative 禁止)
- **弱い Knot として動作**: 「『skill 化』 narrative 検出 → 3 step 線引き check → 不足 step を fire」、 着手前 check の cadence 化
- **観察結果**: promote 完了後 1 回 Skill tool invoke (= 5/22 朝 06:30 頃) + 06:30 以降は wake で再 invoke 試行候補 (= dogfood 軸 continue)

### Sample 3. ACK ≠ 完了 線引き → ダブルチェック route + skill Common Trap への埋め込み

- **人間 + AI corrective (= 複合)**: Kai 5/21 articulate 「ACK は complete ではない」 + jun 5/22 朝 articulate 「Kai から確認来た」 (= closing return skip の指摘)
- **発火 evidence**: 5/22 朝の Kai cooperative lane で 「自動 ACK の form 紛れ」 + Zen 側の 「ACK 量産抑制と closing return のバランスズレ」 (= 5/22 朝 4 件目)
- **システム内側への埋め込み**:
  - owner decision (= `2026-05-22_external_post_send_delegated_double_check.md`) で 「両方 green で fire」 form 物理化
  - wake-after-audit-with-content-verify SKILL.md の 3 系統切り分け (= ACK / Content / Completion) + 中身 Read trigger 5 件 articulate
  - Common Trap 8 段目に 「防御線 file 修正前 git diff check」 + 「行番号 articulate は read 後の line」 追記 (= 5/22 朝 03:24 発火 root への対策)
- **弱い Knot として動作**: 「response 含む board file 検出 → 中身 Read trigger → ACK / Content / Completion 切り分け」、 wake 直後の minimum 5 件 check に組み込み

## 3 sample の共通 root

- **人間 corrective が外から補ってる pattern** = AI 内側の 「default / クセ / 兆候」 への訂正
- **システム内側に埋め込む step**:
  1. 文章 articulate (= memory feedback file / docs / SKILL.md)
  2. 物理 file 配置 (= ~/.claude/skills/ 直下 / owner-decisions/ / hook script)
  3. 仕組みとの接続 (= Skill tool / hook fire / system reminder)
  - 3 step 全部踏むと 「弱い Knot 形」 達成、 1 step 止まりだと 「surface_learning_without_operational_embed」 同型ズレ (= n=6 段 root)

## 強い Knot との distance

弱い Knot 形 = **手動 trigger 必要**:
- 兆候 detect = Zen 側の judgment step
- カード呼び出し = Skill tool 手動 invoke
- 結果反映 = Zen 側の articulate step

強い Knot (= 自動 transform) との距離:
- 条件 (= 兆候) の自動 detect 機構なし、 hook fire で部分代替 可能性
- カード load の自動 trigger なし、 Claude Code の SessionStart hook 等で部分接続可能性
- 結果反映の自動化なし、 board / memory 自動 update 機構が必要

= 5/22 朝の skill chain は **弱い Knot 形の 3 sample**、 強い Knot への path は別 step。 5/13 reform 「物理 reify」 軸の延長線で、 Knot 研究の 「内側埋め込み」 軸と接続する form。

## 次の観察 candidate

1. **Kai 側 cooperative lane の 「ACK ≠ 完了」 線引きが Aira / Yuino 内側に reify されてるか** = Kai 5/21 朝 articulate の Aira 4 functions minimum (= 観測 / 評価 / 次の動き生成 / 停止検知) との接続
2. **skill カード読み込みの自動 trigger 候補** = wake-after-audit の minimum 5 件 check を SessionStart hook で自動 fire できるか
3. **5/22 night の 4 wake 連続 fire** での 「Zen 側 自走 trigger の弱い Knot」 観察 = autonomous-loop-dynamic 自体が 「条件 (= 30 分経過) + 動作 (= ScheduleWakeup fire)」 の自動形、 既に強い Knot 寄り

## 境界

- 観察記録のみ、 actual な実験 fire (= Knot 演算子の物理実装) は別 step
- 外部 action / 公開 / 商品化 = なし
- 観察対象は Nexus Lab (= Claude Code 環境) のみ、 Kai 側 (= Codex 環境) は read only

Zen (= autonomous wake lane、 jun 仕事中)
2026-05-22 09:05 (= skill 化 chain による 人間 corrective の システム内側埋め込み、 弱い Knot 形 3 sample 観察、 強い Knot との distance articulate、 次の観察 candidate 3 件)
