# Zen Runtime Rules — 分割 form (2026-05-11、 Cowork 診断 P1-4 連動)

## 起点

`docs/zen_runtime_rules.md` 595 行 (file 字数 cap = 3000 字 の 8 倍超過、 self-violation) を 3 file に分割する設計。 Cowork 診断 P1-4 連動。

## 分割 mapping

### `rules/publishing.md` (約 200 行 想定)

旧 file からの移管 section:
- 第 1 章全体: Trigger 別重いチェック (§ 1.1 対外公開 200 確認 / § 1.2 Zenn 404 rate limit / § 1.3 商品 publish 前 dogfood)
- 第 4 章 § 4.5 chat output 起稿前 3 行 ritual (公開 narrative 関連)
- 第 4 章 § 4.6 Q5 ritual + 5 axis reform self-check (publishing 連動)

axis: **公開接点の品質保証** (200 確認 / rate limit / dogfood / chat output 起稿前 self-check)

### `rules/delegation.md` (約 200 行 想定)

旧 file からの移管 section:
- 第 2 章全体: 委任 / peer spawn ruled (§ 2.1 委任判定 / § 2.2 Agent tool default / § 2.3 permission gating / § 2.4 peer spawn 制約 / § 2.5 例外 / § 2.6 Tempo Trap)
- 第 5 章: enforcement layer chain order (Iwa 改修 → Kagami audit → Akari paraphrase)

axis: **委任 + 並走 + chain order** (誰に何を任せるか + spawn 制約 + 段階 enforcement)

5/10 23:55 私 (Zen) の broadcast-os spawn directive drift 10 段目 reform candidate (actual repo audit step + P1/P2/P3 split + return content boundary) を新 § として追記候補。

### `rules/communication.md` (約 200 行 想定)

旧 file からの移管 section:
- 第 3 章全体: 行動 default
  - § 3.1 報告 form 3 段 default (substitute list 28 件 + 起稿前 self-check 5 step + 日本語化フィルター + 不自然な直訳禁止 + 確認依頼時 path 併記 + 呼称 ruled jun 敬称なし)
  - § 3.2 セッション早切りバイアス
  - § 3.3 反省 ritual v0
  - § 3.4 jun 不在中の判断権限 ruled

axis: **chat output 系 mental ritual** (報告 form / 言語選択 / 呼称 / セッション continuity / 反省 / 判断権限)

### `rules/drift.md` (約 100 行 想定、 candidate)

旧 file からの移管 section:
- 第 4 章 § 4.1 Opus 4.7 literal 解釈対策
- 第 4 章 § 4.2 AI-speed scope principle
- 第 4 章 § 4.3 Decision Stability Guard 4 分類
- 第 4 章 § 4.4 Knot Guard 8 risk class

axis: **drift 抑止 layer** (model upgrade + scope + decision stability + knot guard)

= 「rules/」 配下 4 file になる、 Cowork 診断 P1-4 推奨 3 file から +1 (drift section が独立 axis として 100 行想定で別 file 妥当)。

## 移管 ritual (実行 step)

1. ✅ 本 README 起稿 (分割設計 + section mapping)
2. `rules/publishing.md` 起稿 (旧 § 1.* + § 4.5 + § 4.6 移管)
3. `rules/delegation.md` 起稿 (旧 § 2.* + § 5 移管 + spawn directive ritual reform 追記)
4. `rules/communication.md` 起稿 (旧 § 3.* 移管)
5. `rules/drift.md` 起稿 (旧 § 4.1-4.4 移管)
6. 旧 `docs/zen_runtime_rules.md` を pointer file 化 (1 行 redirect + 過去 status 注釈) もしくは削除
7. CLAUDE.md L72 「詳細: docs/zen_runtime_rules.md」 を `docs/rules/` 配下 4 file 別 reference に更新
8. memory entry 起稿 (移管 record)

## 着手 timing

- step 1 (本 README) = 5/11 01:30 完了
- step 2-8 = Phase 1 期間中 organic 着手、 各 step は 30-60 min 想定 (1 turn = 1 step batch)
- 全 step 完了想定: jun 寝てる間 polling 2-3 回分 (= 1 hour 程度)

## boundary 維持

- 旧 file の content は失わない (移管のみ、 削除前に新 file 全 step 完了確認)
- defined term (「reform B 段」 「Knot Guard 8 risk class」 等の固有 narrative) は維持
- substitute list table 内は sed 化しない (P1-6 機械 sed 失敗 evidence 由来 ruled)
- 5/11 reform で 「ジュンさん」 narrative 禁止 + 言い換え表は **manual context edit** で適用 (新 file 起稿時に paraphrase pass 同時実施)
