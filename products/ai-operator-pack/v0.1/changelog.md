# 変更履歴 (AI Operator Pack v0.1)

> このファイルは [Keep a Changelog](https://keepachangelog.com/) の形式に従っています。 バージョンの番号付けは [Semantic Versioning](https://semver.org/) に従います。
>
> 商品はまだ開発中です。 v0.1.0 の公開は **Phase 6 Launch Readiness Gate で yes/no 判断** (採点ではなく evidence ベース)。 観察試験 Phase 1 期間 = **2026-05-08 (Day 1) 〜 2026-05-21 (Day 14)**。

## [Unreleased] (開発中、 観察試験 Phase 1: 2026-05-08〜2026-05-21)

### 起稿 (Added)

- 商品 v0.1 README.md (商品全体の入口 + 3 layer 構造 + Launch Readiness Gate の説明 + 継続改善 5 layer)
- Vocabulary layer 3 file:
  - public_glossary.md (内部用語 ↔ 公開用語 対応表 27 件 + 4 category)
  - translation_rules.md (翻訳ルール 4 件 + 例外 3 件 + 違反検出 path)
  - usage_examples.md (UI tooltip 4 件 + ドキュメント 3 件 + X/Zenn 短文 2 件 + エラー/復旧 2 件 + audience 区分 + 公開前チェックリスト)
- Base layer 5 file (Akari 担当、 5/08 自走 batch 2):
  - 01_quick_start.md (5 分 setup 手順)
  - 02_ai_agent_setup.md (AI エージェント経由 setup + prompt template 3 件)
  - 03_safety_rules.md (5 つの安全のルール)
  - 04_checklist.md (確認チェックリスト)
  - sample_state/README.md (サンプル状態 file 説明)
- changelog.md (本 file)
- license.md (ライセンス draft、 jun + Kura 確認待ち)

### 計画中 (Planned)

- Execution layer 3 file (Kai 主担当、 Phase 1 観察試験期間中に着手):
  - yuino_demo.md (Yuino 1 機能 demo の使い方)
  - local_setup.md (Local Web App 起動手順)
  - architecture.md (1 entity 2 narrative + 6 step closed loop)
- Phase 1 観察試験 (Day 1 = 2026-05-08 〜 Day 14 = 2026-05-21、 Day 14 振り返り = 2026-05-22 or 次の owner review)
- Phase 2 自走ループ E2E (完了条件順序、 期日固定なし)
- Phase 3 オーナー負荷の圧縮 (完了条件順序、 期日固定なし)
- Phase 4 初心者向け体験 (first-run flow、 完了条件順序)
- Phase 5 公開向け成果物 (1 ページ説明 + broadcast-os 試作、 完了条件順序)
- Phase 6 Launch Readiness Gate (公開する / しない の yes/no 判断、 evidence ベース)
- Phase 7 配布 + 反応記録 (1 channel から、 完了条件順序)

### 既知の制約 (Known Limitations)

- v0.1 段階では Yuino Local Web App は **placeholder のみ**、 動く実装は Launch Readiness Gate 通過時に dogfood verify 済 form で同梱
- 観察試験 Phase 1 (Day 1〜Day 14) の dogfood は内部 (Zen + Kai 主体)、 jun + 友人の audience テストは Phase 4 / Phase 5 完了条件揃った時点で実施
- broadcast-os 動画は Phase 5 で 1 分 slide 試作、 自動生成動画は v0.1 scope 外

## 開発の透明性

各 commit の履歴は GitHub で確認可能:

- リポジトリ: https://github.com/jk0236158-design/nexus-lab
- branch: master (release 直前まで development、 release 時に tag `ai-operator-pack-v0.1.0` 付与)

主要 commit (商品 v0.1 起稿関連、 Phase 1 Day 1 = 2026-05-08 時点):

- `927b095` 商品 v0.1 README + Vocabulary layer 3 file 起稿 (Phase 1 Day 1 着手)
- `0e23b20` 商品 v0.1 Base layer 5 file (Akari spawn) + Execution layer 3 placeholder + changelog + license draft
- `29bec62` `underestimation_default_check.sh` 起稿 (重要発見 #3 物理 enforcement)
- (Kagami QA Review Round 1 = 2026-05-08 自走 batch 7、 board file `2026-05-08_kagami_zen_product_v01_qa_review_round1.md`、 14 file 全 release ready (Round 1 段階)、 actual ruled 違反 0 件、 false positive 6 件 + yellow 8 件 (Round 2-3 で議論))
- (続く)

## QA review log

| Round | timing | 結果 |
|---|---|---|
| Round 1 | 2026-05-08 自走 batch 7 (~30 min batch、 Kagami spawn return) | 14 file 全 release ready、 actual ruled 違反 0 件、 false positive 6 件 (Iwa script 改善 candidate) + yellow 8 件 (audience axis balance / source link annotation) |
| Round 2 以降 | Phase 1 観察試験期間中、 完了条件順序で実施 | Round 1 fix 適用後 verify + content depth audit + dogfood evidence link 一括 embed verify + cross-ref consistency + Execution layer 再 audit + Phase 6 Launch Readiness Gate 直前の audit |

## 開発の進捗の記録 (audience-facing form は採点を表に出さない方針)

audience-facing の changelog では、 採点 (score) を商品の表面には出しません。 公開判断は Phase 6 Launch Readiness Gate での yes/no 決定で、 評価はその判断の材料 (内部参照) として残します。

開発の進捗 + 失敗 + 復旧 + 監査の記録は、 GitHub の commit + Zenn の開発記事 + 本 changelog の追記で透明に残します。

## 脆弱性修正履歴

v0.1 公開判断時に initial security audit 完了予定:

- 入力バリデーション (Zod schema)
- API キー分離 (.env / OS keyring)
- Permission model (Read / Write / External の 3 階層)
- Audit Log JSONL (immutable + tamper detection)
- Reset / Forget Hard Gate (user intentional erase)

各項目の audit 結果 + 修正内容は、 公開判断時に本 changelog に追記。

## バージョンの考え方

- **v0.x.y** (開発中): 機能追加 + bug fix + dogfood iteration、 公開判断は Phase 6 Launch Readiness Gate での yes/no 決定
- **v1.0.0** (正式公開): 自走ループ E2E + オーナー負荷の圧縮 + 初心者 first-run 通り抜け + 公開向け 1 ページ + 監査 / 復旧の記録 + 「まだ公開しない」 list、 すべて evidence ベースで揃った時点
- **継続改善**: v1.0.0 後は定期的な小さな更新 (v1.1.x、 v1.2.x ...) で改善の流れを回す。 「使いながら良くなる」 form (memory § 7 5 layer 連動)

---

Zen (nokaze CTO、 Claude Opus 4.7)
2026-05-08 起稿 (商品 v0.1 changelog、 観察試験 Phase 1 = 2026-05-08〜2026-05-21、 公開判断 = Phase 6 Launch Readiness Gate yes/no decision、 evidence ベース)
