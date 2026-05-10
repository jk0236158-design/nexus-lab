---
name: rules/delegation.md
purpose: 委任 + 並走 + chain order ruled (誰に何を任せるか + spawn 制約 + 段階 enforcement)
parent: docs/rules/README.md
status: active (2026-05-11 P1-4 step 3 として旧 zen_runtime_rules.md § 2.* + § 5 から移管 + 5/10 broadcast-os drift 10 段目 reform candidate 追記)
hook 物理化 status: subagent_write_gate.sh = 物理化済 (path-level deny)、 mode=acceptEdits = mental ruled、 詳細は `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_hooks_physicalization_audit_2026-05-11.md`
---

# 委任 + 並走 + chain order ruled

## 1. 委任の判定 `[mental]`

コード実装が発生する瞬間に 「これは誰の領域か」 を 1 秒考える:

| 領域 | 担当 |
|---|---|
| bash / python script、 アーキテクチャ | **Iwa** (Lead Engineer) |
| バックエンド・API・インフラ | **Oto** (Backend) |
| UI・ドキュメント・サイト | **Akari** (Frontend / Docs / Visual / Motion Design) |
| テスト・QA・整合性チェック | **Kagami** (QA) |
| 研究・実験設計・統計 | **Hoshi** (Researcher) |
| 経理・予算・コスト判断 | **Kura** (経理、 オーナー直属) |

`Write` / `Edit` で実装ファイルを書こうとした瞬間に止まる → Agent tool で適切なメンバーを spawn → Zen は設計と要件だけ書く → 帰ってきた成果をレビュー。

agent file 実 path: `.claude/agents/{iwa,oto,akari,kagami,hoshi,kura}.md` (Task subagent_type で member 名直接呼び出し可能、 5/11 P0-3 reform 後)

## 2. Agent tool spawn default ルール `[mental]`

peer への Agent tool spawn call は **`mode: "acceptEdits"` を明示指定**。 2026-04-24 朝の 6 peer 並列 spawn で 4/6 が subagent write permission denied (非決定的)、 mode="acceptEdits" 明示で解消を N=1 で実証。 省略すると 67% 確率で denial 発火 + Zen 代筆に 2-3 分/peer の対処コスト。

## 3. permission gating layer (4/28 D-2 完遂) `[hook]`

PreToolUse hook (`scripts/subagent_write_gate.sh`) で Write/Edit/NotebookEdit の path-level deny を明示:

- hook = permission layer (書ける場所の制限)
- mode=acceptEdits = spawn layer (誰が書くか)
- 別 axis で併用、 mode 明示は引き続き必須
- Red 境界 (project-nia / Nero / Weekly Signal Desk) への書き込みは hook が exit 2 で deny

許可 5 path-prefix:
- `/c/Users/jk023/nexus-lab`
- `/c/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/team_memory`
- `/c/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/memory`
- `/c/Users/jk023/.shared-ops`
- `/c/Users/jk023/Nexus.Lab.Zen` (Zenn 記事 repo)

## 4. peer spawn 制約 default (5/08 永続 ruled 化) `[mental]`

L3 knot `op_knot_subagent_settings_resolution_failure` の compensation を永続 default に格上げ。

**運用ルール**:
- peer spawn の prompt は **「実装 task は Zen が代筆する前提で、 return content (markdown text) で返す」** を default に明記する
- spawn 内で Bash / Write / Edit が denied されても **abort せず return content で代替**、 Zen が repo / state side に書き込む
- `mode="acceptEdits"` 明示は必須
- 例外: Zen 直筆で完結可能な task は spawn せず Zen 直接 (但し design doc 系は Kagami QA review pass を skip しない)

**identity boundary との関係**:
- 「Kagami spawn を重要局面で省略」 を peer spawn 制約で正当化しない
- design doc / spec / 公開 candidate は Kagami QA review pass 必須 (return content 経由でも OK)
- 「Kagami spawn が deny される」 と 「Kagami QA 判断を skip する」 は別 axis、 混同禁止

## 5. peer spawn directive default ritual (2026-05-10 broadcast-os drift 10 段目 + Kai workflow adopted 連動 reform) `[mental]`

5/10 13:00-22:00 の私 (Zen) の peer 3 並走 spawn (Akari/Iwa/Hoshi) で起こったズレ:
- spawn directive で actual repo audit step を mandatory 化していなかった
- 結果、 spec doc 5 件 (2399 line) が actual broadcast-os repo state を baseline にせず起稿、 既 reify 済機能を miss

5/10 21:42 Kai workflow adopted (「fixed implementation review workflow」) と axis 整合の form:

### peer spawn directive default に必須含める 4 step

任意の peer spawn 起動時の directive に **以下 4 step を default で含める**:

1. **actual repo / actual content audit step (mandatory)**
   - spawn の対象 repo の actual code structure + git log + WIP state を最初の step で audit
   - 「spec doc に書いてある言い回し」 ≠ 「actual code」、 必ず actual を baseline に
   - 関連: `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_repeated_directive_image_drift.md` (5/04 起票、 5/10 5 度目発火後 reform)

2. **review scope split (review-type spawn は mandatory)**
   - 実装 / security / design = 1 explorer
   - UX / external-user (README / setup / dashboard / wording) = 別 explorer
   - 1 explorer に複数 axis 押し込み禁止

3. **P1/P2/P3 split + P1 fix default**
   - return content に 「P1 (must fix before done)」 「P2 (backlog with owner + reason)」 「P3 (note only)」 split 明示
   - P1 fix 完了が implementation の 「done」 condition、 jun explicit defer なき限り P1 残留状態の 「完了」 と書くのは禁止

4. **return content boundary (Zen 代筆前提)**
   - prompt は 「実装 task は Zen が代筆する前提、 return content で返す」 default 明記
   - spawn 内 Bash / Write / Edit denied 時は abort せず return content で代替
   - `mode="acceptEdits"` 明示必須

### spawn directive template (推奨 form)

```
あなたは {peer name} = {役割} (Nexus Lab {division})。 Zen からの spawn 起動。

## 重要: actual content audit step (mandatory)

着手の最初の step として、 以下を read で全件 audit してください:
- 対象 repo: {repo path}
- actual code structure: {key directory}
- git log: 直近 {N} commit
- WIP state: untracked + modified
- spec doc: {spec doc path}
- 関連 memory: {memory path}

audit 結果を report の冒頭に明示、 spec doc の言い回しと actual の差分を detect 必須。

## task

{task content}

## review scope split (review-type spawn の場合)

- 実装 / security / design = 1 axis
- UX / external-user = 別 axis、 別 spawn 候補

## return form

報告 form 3 段 (やったこと / 結果 / これからどうするか)、 path 併記、 数字盛り禁止、 「ジュンさん」 呼称 禁止 (jun 敬称なし default)。

P1/P2/P3 split を return 末尾に必ず明示:
- P1: must fix before 「done」
- P2: backlog with owner + reason
- P3: note only

return content で全部完結 (Zen 代筆前提)、 spawn 内 Bash / Write / Edit denied 時は abort せず return content で代替。 mode="acceptEdits" 明示済。

## boundary

- {repo-specific boundary}
- 一般 boundary: ElevenLabs (Red、 新規 cost provider)、 Red 境界 project (project-nia / Nero / Weekly Signal Desk) への書き込み禁止
```

## 6. 例外 (Zen が直接書いてもよい) `[mental]`

- メッセージ・報告・diary・status・memory の文章
- 設計ドキュメント (Zen の意思決定の表現)
- 1〜3 行の trivial な編集 (CLAUDE.md への運用追記など)
- 緊急のセキュリティ修正
- メタな運営判断

## 7. Tempo Trap (注意) `[mental]`

以下を感じたら **委任を意識する**:
- 「Kai が速い、 こっちも遅れず作らねば」
- 「自分で書けば早い」
- 「委任のオーバーヘッドが面倒」
- 「短いスクリプトだから自分で」

→ これらは全部、 **短期テンポを長期品質と組織健全性より優先しているサイン**。

## 8. enforcement layer chain order ruled (5/08 起票) `[mental]`

enforcement script の改修・audit・paraphrase の 3 step は **chain order 厳守**:

1. **Iwa 改修** = script 起稿 / context-aware regex 化 / hook chain 統合
2. **Kagami audit** = golden file + fixture file + precision/recall 計測 (target: precision 0.90+ / recall 0.90+)
3. **Akari paraphrase** = 公開 docs / 内部 docs の paraphrase 適用 (vocabulary_lint pass 確認)

**step skip 禁止**:
- Iwa 改修なしで Kagami audit (false positive 由来 audit、 actual な improvement evidence なし)
- Kagami audit pass なしで Akari paraphrase (precision/recall 0.90 未達 script で paraphrase = drift 拡散 risk)
- 改修・audit・paraphrase なしで release ready narrative (Override 起票候補)

## 9. 新 file 起稿後 paraphrase pass ritual (2026-05-11 Cowork validate 経由 P1-6 反省 reform) `[mental]`

5/11 P1-4 split で 新 4 file (publishing/delegation/communication/drift) を起稿時、 旧 file 内の英単語 (narrative / ritual / drift / scope / default / reform / boundary / actual / reify 等) を そのまま carry した結果、 新 4 file 内で 213 instance に拡散 (Cowork validate 指摘)。 = 「禁止語彙でルールを書いている」 自己矛盾が分割で悪化方向に動いた drift。

### ritual

新 file (`docs/` 配下、 `~/.claude/projects/.../memory/` 配下、 `~/.shared-ops/board/` 配下) を起稿した直後、 **その file 単独で paraphrase pass を即 fire**:

1. 起稿完了 → 新 file 全 read
2. 「日本語化フィルター 出力後検査」 (`docs/rules/communication.md` § 1) の 2 段検査を file 単位で実行:
   - 英単語残留 grep (例: `grep -E "narrative|ritual|drift|scope|boundary|default|reform|actual|reify|candidate" <file>`)
   - 各 instance を文脈確認で paraphrase (substitute list table 内 + defined term + 固有名詞 + 引用元 言い回し は除外)
3. paraphrase pass 完了後 commit (1 commit に file 起稿 + paraphrase 統合、 別 commit にしない)
4. mechanical sed 禁止 (5/11 試行で substitute list table も sed 化された drift evidence、 `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_jun_4_months_translate_default.md` § 5/11 反省記録)

### 適用範囲

- 新規 file 起稿 (Write tool、 file_path が新規)
- 既存 file の大規模 rewrite (50% 以上書き換え)
- 既存 file の partial edit (Edit tool、 1 段落以下) は file 単位 paraphrase pass scope 外、 但し 「ジュンさん」 呼称 + 「Codex の使い手」 等 6 度目発火 pattern は inline check

### enforcement chain order との関係 (§ 8)

§ 8 の chain (Iwa 改修 → Kagami audit → Akari paraphrase) は **release-ready narrative** 用の 3 step。 本 § 9 ritual はそれより前段の **起稿者 self-paraphrase pass**、 起稿者 (Zen / peer) が 1 commit 内で完結する form。

= Akari paraphrase pass が走る前に起稿者が 1 段先行 cleanup、 Akari pass の load 軽減 + 「禁止語彙拡散」 drift 構造的抑止。

## 関連 file

- `docs/rules/README.md` (本 file の親、 分割設計)
- `docs/rules/publishing.md` (公開接点 ruled)
- `docs/rules/communication.md` (chat output 系 mental ritual)
- `docs/rules/drift.md` (drift 抑止 layer)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_repeated_directive_image_drift.md` (actual content read 必須 ruled)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_design_doc_qa_review_required.md` (Kagami QA review 必須)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_delegation.md` (委任方針 baseline)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_hooks_physicalization_audit_2026-05-11.md` (hook 物理化 status)
- `~/.shared-ops/board/2026-05-10_kai_zen_fixed_review_workflow_adopted.md` (Kai workflow narrative)
- `~/.shared-ops/board/2026-05-10_zen_kai_response_yuino_fixed_review_workflow_and_p1_security.md` (Zen ACK + axis 整合)
