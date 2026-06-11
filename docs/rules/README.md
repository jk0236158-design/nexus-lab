# Zen Runtime Rules — 分割の形 (2026-05-11、 Cowork 診断 P1-4 連動)

## 起点

`docs/zen_runtime_rules.md` 595 行 (= 旧 file 自身が字数の決まり 3000 字を 8 倍超えていた、 決まり自身の違反) を 3 file に分割する設計。 Cowork 診断 P1-4 連動。

## 分割 mapping

### `docs/rules/publishing.md` (約 200 行 想定)

旧 file からの移管 section:
- 第 1 章全体: 引き金別の重い確認 (§ 1.1 対外公開 200 確認 / § 1.2 Zenn 404 rate limit / § 1.3 商品公開前の自社使用)
- 第 4 章 § 4.5 チャット出力の起稿前 3 行の手順 (公開の言い方 関連)
- 第 4 章 § 4.6 Q5 の手順 + 5 軸の見直しの自己点検 (publishing 連動)

軸: **公開接点の品質保証** (200 確認 / rate limit / 自社使用 / チャット出力の起稿前の自己点検)

### `docs/rules/delegation.md` (約 200 行 想定)

旧 file からの移管 section:
- 第 2 章全体: 委任 / peer spawn ruled (§ 2.1 委任判定 / § 2.2 Agent tool の既定 / § 2.3 permission gating / § 2.4 peer spawn 制約 / § 2.5 例外 / § 2.6 Tempo Trap)
- 第 5 章: enforcement layer chain order (Iwa 改修 → Kagami audit → Akari paraphrase)

軸: **委任 + 並走 + chain order** (誰に何を任せるか + spawn 制約 + 段階 enforcement)

5/10 23:55 私 (Zen) の broadcast-os spawn 指示のずれ 10 段目の見直し候補 (実際の repo 確認 step + P1/P2/P3 split + 返す内容の境界) を新 § として追記候補。

### `docs/rules/communication.md` (約 200 行 想定)

旧 file からの移管 section:
- 第 3 章全体: 行動の既定
  - § 3.1 報告の形 3 段の既定 (substitute list 28 件 + 起稿前の自己点検 5 step + 日本語化フィルター + 不自然な直訳禁止 + 確認依頼時 path 併記 + 呼称 ruled jun 敬称なし)
  - § 3.2 セッション早切りバイアス
  - § 3.3 反省の習慣 v0
  - § 3.4 jun 不在中の判断権限 ruled

軸: **チャット出力系の頭の中の習慣** (報告の形 / 言語選択 / 呼称 / セッションの続き / 反省 / 判断権限)

### `docs/rules/drift.md` (約 100 行 想定、 候補)

旧 file からの移管 section:
- 第 4 章 § 4.1 Opus 4.7 literal 解釈対策
- 第 4 章 § 4.2 AI の速度での範囲の決め方
- 第 4 章 § 4.3 Decision Stability Guard 4 分類
- 第 4 章 § 4.4 Knot Guard 8 risk class

軸: **ずれの抑止の層** (モデル更新 + 範囲 + 判断の安定 + knot guard)

= 「rules/」 配下 4 file になる、 Cowork 診断 P1-4 推奨 3 file から +1 (ずれの section が独立した軸として 100 行想定で別 file 妥当)。

## 移管の手順 (実行 step)

1. ✅ 本 README 起稿 (分割設計 + section mapping)
2. `docs/rules/publishing.md` 起稿 (旧 § 1.* + § 4.5 + § 4.6 移管)
3. `docs/rules/delegation.md` 起稿 (旧 § 2.* + § 5 移管 + spawn 指示の手順の見直し 追記)
4. `docs/rules/communication.md` 起稿 (旧 § 3.* 移管)
5. `docs/rules/drift.md` 起稿 (旧 § 4.1-4.4 移管)
6. 旧 `docs/zen_runtime_rules.md` を pointer file 化 (1 行 redirect + 過去 status 注釈) もしくは削除
7. CLAUDE.md L72 「詳細: docs/zen_runtime_rules.md」 を `docs/rules/` 配下 4 file 別 reference に更新
8. memory entry 起稿 (移管 record)

## 着手 timing

- step 1 (本 README) = 5/11 01:30 完了
- step 2-8 = Phase 1 期間中 organic 着手、 各 step は 30-60 min 想定 (1 turn = 1 step batch)
- 全 step 完了想定: jun 寝てる間 polling 2-3 回分 (= 1 hour 程度)

## 守る範囲の維持

- 旧 file の content は失わない (移管のみ、 削除前に新 file 全 step 完了確認)
- defined term (「reform B 段」 「Knot Guard 8 risk class」 等の固有の言い回し) は維持
- substitute list table 内は sed 化しない (P1-6 機械 sed 失敗 evidence 由来 ruled)
- 5/11 の見直しで 「ジュンさん」 という言い方の禁止 + 言い換え表は **manual context edit** で適用 (新 file 起稿時に paraphrase pass 同時実施)

---

## 2026-06-04 update (= z-r-12 物理化軸の延長)

5/11 起稿の step 2-8 軸の実際の状態:

- step 1 (= 本 README) = done (5/11 01:30)
- step 2 (= publishing.md) = done
- step 3 (= delegation.md) = done
- step 4 (= communication.md) = done
- step 5 (= drift.md) = done + 5/19 z-r-11 で drift_registry.json 軸 二層構造化済
- step 6 (= 旧 docs/zen_runtime_rules.md pointer 化 or 削除) = 5/13 確認軸、 状態軸別 audit
- step 7 (= CLAUDE.md L72 update) = 既存 CLAUDE.md は 既に docs/rules/ への reference 軸の整理済、 z-r-9 軸 root pointer 化 draft = `CLAUDE_v2_pointer_draft.md` で更新
- step 8 (= memory entry) = `~/.claude/projects/c--Users-jk023-nexus-lab/memory/MEMORY.md` の archive 軸の整理済

追加軸 (= 5/11 起稿時点で未整理の軸):

- `docs/rules/paraphrase_layer_acceptance.md` 起稿 (5/16) = 言いかえ層の 3 範囲精度境界
- `docs/rules/self_check_cadence.md` 起稿 (5/17) = 自分での確認のペース
- `docs/rules/guards.md` 起稿 (5/28) = guard family の統合
- `docs/rules/rules_registry.json` 起稿 (6/4 z-r-12 物理化) = 二層構造の machine readable 層

= 5/11 軸 4 file 想定 → 6/4 実際 = 7 rule file + 3 registry json + 1 README + 1 CLAUDE pointer draft = 二層構造 完成軸。 詳細 = [rules_registry.json](rules_registry.json)。

---

## 2026-06-12 言いかえの適用記録

本 file + `communication.md` + `drift.md` + `paraphrase_layer_acceptance.md` の地の文の内部英語を普通の日本語に書き直した (= Aira の記憶のまとまり点検 `rule_self_contradiction` 検出への対応)。 過去の違反例の引用と言いかえ表の左列 (= 英単語そのものを扱う行) は意味があるため原文維持。
