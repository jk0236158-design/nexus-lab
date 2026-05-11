---
name: rules/delegation.md
purpose: 委任 + 並走 + 連鎖の順序の決まり (誰に何を任せるか + 仲間呼び出しの制約 + 段階の徹底)
parent: docs/rules/README.md
status: active (2026-05-11 P1-4 の手順 3 として旧 zen_runtime_rules.md § 2.* + § 5 から移管 + 5/10 broadcast-os の 10 段目ズレと連動した見直しの候補を追記)
hook 物理化 status: subagent_write_gate.sh = 物理化済 (場所ごとの拒否)、 mode=acceptEdits = 頭の中の決まり、 詳細は `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_hooks_physicalization_audit_2026-05-11.md`
---

# 委任 + 並走 + 連鎖の順序の決まり

## 1. 委任の判断 `[頭の中]`

コードの実装が必要になった瞬間に 「これは誰の領域か」 を 1 秒考える:

| 領域 | 担当 |
|---|---|
| bash / python の手順、 アーキテクチャ | **Iwa** (Lead Engineer) |
| バックエンド・API・インフラ | **Oto** (Backend) |
| UI・ドキュメント・サイト | **Akari** (Frontend / Docs / Visual / Motion Design) |
| テスト・QA・整合性チェック | **Kagami** (QA) |
| 研究・実験設計・統計 | **Hoshi** (Researcher) |
| 経理・予算・コスト判断 | **Kura** (経理、 オーナー直属) |

`Write` / `Edit` で実装のファイルを書こうとした瞬間に止まる → Agent tool で適切な仲間を呼び出す → Zen は設計と要件だけ書く → 戻ってきた成果を見直す。

仲間のファイルの実際の場所: `.claude/agents/{iwa,oto,akari,kagami,hoshi,kura}.md` (Task の subagent_type で仲間の名前を直接指定できる、 5/11 P0-3 見直し後)

## 2. Agent tool で呼び出すときの既定の決まり `[頭の中]`

仲間への Agent tool 呼び出しは **`mode: "acceptEdits"` を明示的に指定する**。 2026-04-24 朝の 6 仲間並行呼び出しで 4/6 が 書き込み権限の拒否を受けた (発生は揺れる)、 mode="acceptEdits" を明示的に書けば解消することを 1 回の試行で確認した。 省略すると 67% の確率で拒否が起こる + Zen が代筆する対処に 1 仲間あたり 2-3 分のコストがかかる。

## 3. 権限の通し方の層 (4/28 D-2 完遂) `[hook]`

PreToolUse hook (`scripts/subagent_write_gate.sh`) で Write/Edit/NotebookEdit の 場所ごとの拒否を明示する:

- hook = 権限の層 (書ける場所の制限)
- mode=acceptEdits = 呼び出しの層 (誰が書くか)
- 別の軸として併用、 mode の明示は引き続き必須
- Red の境界 (project-nia / Nero / Weekly Signal Desk) への書き込みは hook が exit 2 で拒否する

許可されている 5 つの場所:
- `/c/Users/jk023/nexus-lab`
- `/c/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/team_memory`
- `/c/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/memory`
- `/c/Users/jk023/.shared-ops`
- `/c/Users/jk023/Nexus.Lab.Zen` (Zenn 記事のリポジトリ)

## 4. 仲間呼び出しの制約 (5/08 永続の決まりに格上げ) `[頭の中]`

L3 の Knot `op_knot_subagent_settings_resolution_failure` の埋め合わせを永続の既定に格上げ。

**運用の決まり**:
- 仲間呼び出しの指示文には **「実装の作業は Zen が代筆する前提で、 戻り内容 (markdown のテキスト) で返してください」** を既定として明記する
- 呼び出しの中で Bash / Write / Edit が拒否されても **諦めずに戻り内容で代替**、 Zen がリポジトリ側や状態側に書き込む
- `mode="acceptEdits"` の明示は必須
- 例外: Zen が直接書いて完結できる作業は呼び出さず Zen が直接書く (ただし設計ドキュメント系は Kagami の品質確認を飛ばさない)

**同一性の境界との関係**:
- 「Kagami の呼び出しを重要な場面で省略する」 ことを仲間呼び出しの制約で正当化しない
- 設計ドキュメント / 仕様 / 公開の候補は Kagami の品質確認が必須 (戻り内容を経由する形でも OK)
- 「Kagami の呼び出しが拒否される」 ことと 「Kagami の品質確認の判断を飛ばす」 ことは別の軸、 混同禁止

## 5. 仲間呼び出しの指示文の既定の習慣 (2026-05-10 broadcast-os の 10 段目ズレ + Kai の作業の流れの採用と連動した見直し) `[頭の中]`

5/10 13:00-22:00 の私 (Zen) の 3 仲間 並行呼び出し (Akari/Iwa/Hoshi) で起こったズレ:
- 呼び出しの指示文で 実際のリポジトリの点検の手順を必須にしていなかった
- 結果、 仕様ドキュメント 5 件 (2399 行) が 実際の broadcast-os の状態を基準にせずに起稿され、 既に形になっていた機能を見落とした

5/10 21:42 に Kai の作業の流れを採用 (「fixed implementation review workflow」)、 軸を整合させた形:

### 仲間呼び出しの指示文の既定に必ず含める 4 つの手順

任意の仲間呼び出しの指示文には、 **以下の 4 つの手順を既定で含める**:

1. **実際のリポジトリ / 実際の内容の点検 (必須)**
   - 呼び出しの対象リポジトリの 実際のコード構造 + git の履歴 + 作業途中の状態 を最初の手順で点検する
   - 「仕様ドキュメントに書いてある言い回し」 ≠ 「実際のコード」、 必ず実際を基準にする
   - 関連: `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_repeated_directive_image_drift.md` (5/04 起票、 5/10 5 度目発火後に見直し)

2. **見直しの範囲を分ける (見直し型の呼び出しは必須)**
   - 実装 / セキュリティ / 設計 = 1 人の探索者
   - 利用者の体験 / 外部の利用者から見たもの (README / セットアップ / ダッシュボード / 文言) = 別の探索者
   - 1 人の探索者に複数の軸を押し込まない

3. **P1 / P2 / P3 で分けて、 P1 を直すことを既定の完了条件にする**
   - 戻り内容に 「P1 (完了の前に必ず直す)」 「P2 (後回しの一覧、 担当と理由つき)」 「P3 (注記だけ)」 の分けを明示する
   - P1 が直っていれば実装の 「完了」、 jun が明示的に保留と言わない限り P1 が残っているのに 「完了」 と書くのは禁止

4. **戻り内容の境界 (Zen が代筆する前提)**
   - 指示文に 「実装の作業は Zen が代筆する前提、 戻り内容で返してください」 を既定で明記する
   - 呼び出しの中で Bash / Write / Edit が拒否されたら、 諦めずに戻り内容で代替する
   - `mode="acceptEdits"` の明示は必須

### 仲間呼び出しの指示文の見本 (推奨の形)

```
あなたは {仲間の名前} = {役割} (Nexus Lab {部署})。 Zen からの呼び出しです。

## 重要: 実際の内容の点検の手順 (必須)

着手の最初の手順として、 以下を read で全部点検してください:
- 対象リポジトリ: {リポジトリの場所}
- 実際のコード構造: {主要なフォルダ}
- git の履歴: 直近 {N} 件
- 作業途中の状態: 未追跡 + 修正中
- 仕様ドキュメント: {仕様ドキュメントの場所}
- 関連 memory: {memory の場所}

点検の結果を報告の冒頭に明示してください、 仕様ドキュメントの言い回しと 実際の差を必ず見つけてください。

## 作業

{作業の内容}

## 見直しの範囲を分ける (見直し型の呼び出しの場合)

- 実装 / セキュリティ / 設計 = 1 軸
- 利用者の体験 / 外部から見たもの = 別の軸、 別の呼び出しの候補

## 戻りの形

報告の 3 段の形 (やったこと / 結果 / これからどうするか)、 場所も併記、 数字を盛らない、 「ジュンさん」 と呼ばない (jun を敬称なしで既定)。

P1 / P2 / P3 の分けを戻りの末尾に必ず明示してください:
- P1: 「完了」 と言う前に必ず直す
- P2: 後回しの一覧、 担当と理由つき
- P3: 注記だけ

戻り内容ですべて完結 (Zen が代筆する前提)、 呼び出しの中で Bash / Write / Edit が拒否されたら、 諦めずに戻り内容で代替してください。 mode="acceptEdits" は明示済み。

## 境界

- {リポジトリごとの境界}
- 共通の境界: ElevenLabs (Red、 新しい有料サービスの追加)、 Red の境界のプロジェクト (project-nia / Nero / Weekly Signal Desk) への書き込みは禁止
```

## 6. 例外 (Zen が直接書いてもよい場合) `[頭の中]`

- メッセージ・報告・日記・状況・memory の文章
- 設計ドキュメント (Zen の意思決定の表現)
- 1〜3 行のちょっとした編集 (CLAUDE.md への運用の追記など)
- 緊急のセキュリティ修正
- 運営に関する判断

## 7. 急ぎすぎないために (Tempo Trap、 注意) `[頭の中]`

以下を感じたら **委任を意識する**:
- 「Kai が速い、 こっちも遅れず作らないと」
- 「自分で書けば早い」
- 「委任の手間が面倒」
- 「短い手順だから自分で」

→ これらは全部、 **目先の速さを 長期の品質と組織の健全さより優先しているサイン**。

## 8. 強制の層の連鎖の順序の決まり (5/08 起票) `[頭の中]`

強制の手順の 改修 / 点検 / 言い換え の 3 段は **連鎖の順序を厳守**:

1. **Iwa の改修** = 手順の起稿 / 文脈を考慮した照合パターン化 / hook 連鎖との統合
2. **Kagami の点検** = 見本ファイル + 確認用ファイル + 検出率と取りこぼし率の測定 (目標: 検出率 0.90 以上 / 取りこぼし率 0.90 以上)
3. **Akari の言い換え** = 公開ドキュメント / 内部ドキュメントへの言い換えの適用 (vocabulary_lint が通ることを確認)

**手順を飛ばさない**:
- Iwa の改修なしで Kagami の点検 (誤検出からの点検になり、 実際の改善の証拠がない)
- Kagami の点検が通る前に Akari の言い換え (検出率と取りこぼし率が 0.90 に届かない手順で言い換え = ズレが広がる危険)
- 改修・点検・言い換え なしで 「公開準備完了」 と言う (Kagami Override の起票候補)

## 9. 新規ファイル起稿後の言い換えの習慣 (2026-05-11 Cowork の確認を経て P1-6 の反省で見直し) `[頭の中]`

5/11 の P1-4 の分割で 新しい 4 ファイル (publishing/delegation/communication/drift) を起稿したとき、 元のファイルの英単語 (narrative / ritual / drift / scope / default / reform / boundary / actual / reify 等) をそのまま持ち越した結果、 新しい 4 ファイルの中で 213 個に広がってしまった (Cowork の確認で指摘)。 = 「禁止語彙で決まりを書いている」 自己矛盾が、 分割で悪化方向に動いたズレ。

### 習慣

新しいファイル (`docs/` 配下、 `~/.claude/projects/.../memory/` 配下、 `~/.shared-ops/board/` 配下) を起稿した直後、 **そのファイル単独で言い換えの確認を即実行**:

1. 起稿完了 → 新しいファイルを全部 read
2. 「日本語化フィルター 出力後検査」 (`docs/rules/communication.md` § 1) の 2 段検査を ファイル単位で実行:
   - 英単語の残留を grep で確認 (例: `grep -E "narrative|ritual|drift|scope|boundary|default|reform|actual|reify|candidate" <file>`)
   - 各箇所を文脈に合わせて言い換え (語彙の対応表 内 + 定義済みの語 + 固有名詞 + 引用元の言い回し は除外)
3. 言い換えの確認が完了した後に保存 (1 保存にファイル起稿 + 言い換えを統合、 別の保存に分けない)
4. 機械的な sed は禁止 (5/11 の試行で 語彙の対応表まで sed で書き換えてしまったズレの証拠あり、 `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_jun_4_months_translate_default.md` § 5/11 反省の記録)

### 適用範囲

- 新規ファイル起稿 (Write tool、 file_path が新しい場合)
- 既存ファイルの大規模な書き直し (50% 以上の書き換え)
- 既存ファイルの部分編集 (Edit tool、 1 段落以下) は ファイル単位の言い換えの対象外、 ただし 「ジュンさん」 と呼ぶこと + 「Codex の使い手」 等の 6 度目発火パターン はその場で確認

### 強制の連鎖の順序の決まり (§ 8) との関係

§ 8 の連鎖 (Iwa 改修 → Kagami 点検 → Akari 言い換え) は **公開準備完了に向けた** 3 段。 本 § 9 の習慣はそれより前段の **起稿者本人による言い換えの確認**、 起稿者 (Zen / 仲間) が 1 保存の中で完結する形。

= Akari の言い換えが走る前に起稿者が 1 段先回りで掃除、 Akari の負荷を軽くする + 「禁止語彙が広がる」 ズレを構造的に抑える。

## 関連ファイル

- `docs/rules/README.md` (本ファイルの親、 分割設計)
- `docs/rules/publishing.md` (公開接点の決まり)
- `docs/rules/communication.md` (チャット出力系の頭の中の決まり)
- `docs/rules/drift.md` (ズレ抑止の層)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_repeated_directive_image_drift.md` (実際の内容を読むことを必須にする決まり)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_design_doc_qa_review_required.md` (Kagami の品質確認は必須)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_delegation.md` (委任方針の元になるもの)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/project_hooks_physicalization_audit_2026-05-11.md` (hook 物理化の状況)
- `~/.shared-ops/board/2026-05-10_kai_zen_fixed_review_workflow_adopted.md` (Kai の作業の流れの説明)
- `~/.shared-ops/board/2026-05-10_zen_kai_response_yuino_fixed_review_workflow_and_p1_security.md` (Zen の受領 + 軸の整合)
