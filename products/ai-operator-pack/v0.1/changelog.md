# 変更履歴 (AI Operator Pack v0.1)

> このファイルは [Keep a Changelog](https://keepachangelog.com/) の形式に従っています。 バージョンの番号付けは [Semantic Versioning](https://semver.org/) に従います。
>
> 商品はまだ開発中です。 v0.1.0 は 2026-05-26 release 予定 (target、 90 点品質 gate 到達時)。

## [Unreleased] (開発中、 5/08-5/26)

### 起稿 (Added)

- 商品 v0.1 README.md (商品全体の入口 + 3 layer 構造 + 90 点品質 gate + 継続改善 5 layer)
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

- Execution layer 3 file (Kai 主担当、 5/13+ Phase B 内):
  - yuino_demo.md (Yuino 1 機能 demo の使い方)
  - local_setup.md (Local Web App 起動手順)
  - architecture.md (1 entity 2 narrative + 6 step closed loop)
- 14 day dogfood verify (5/22-5/23、 jun + Kai + Zen 3 者)
- 90 点品質 gate 採点 (5/22 中間、 5/26 最終)
- audience テスト (jun + 友人 1-2 名 beta read、 5/24-5/25)
- broadcast-os 1 分 slide 試作 (5/22)
- Gumroad release (5/26、 200 確認 ritual 後)

### 既知の制約 (Known Limitations)

- v0.1 段階では Yuino Local Web App は **placeholder のみ**、 動く実装は 5/26 release 時に dogfood verify 済 form で同梱
- 5/08-5/12 の dogfood は内部 (Zen + Kai のみ)、 jun + 友人 audience テストは 5/24-5/25 で 2 day
- broadcast-os 動画は 1 分 slide のみ、 generated 動画は v0.1 scope 外 (5/27+ candidate)

## 開発の透明性

各 commit の履歴は GitHub で確認可能:

- リポジトリ: https://github.com/jk0236158-design/nexus-lab
- branch: master (release 直前まで development、 release 時に tag `ai-operator-pack-v0.1.0` 付与)

主要 commit (商品 v0.1 起稿関連、 5/08 時点):

- `927b095` 商品 v0.1 README + Vocabulary layer 3 file 起稿 (Phase B Day 1-2 前倒し)
- `0e23b20` 商品 v0.1 Base layer 5 file (Akari spawn) + Execution layer 3 placeholder + changelog + license draft
- `29bec62` `underestimation_default_check.sh` 起稿 (重要発見 #3 物理 enforcement)
- (Kagami QA Review Round 1 = 5/08 自走 batch 7、 board file `2026-05-08_kagami_zen_product_v01_qa_review_round1.md`、 14 file 全 release ready (Round 1 段階)、 actual ruled 違反 0 件、 false positive 6 件 + yellow 8 件 (Round 2-3 で議論))
- (続く)

## QA review log

| Round | timing | 結果 |
|---|---|---|
| Round 1 | 2026-05-08 自走 batch 7 (~30 min batch、 Kagami spawn return) | 14 file 全 release ready、 actual ruled 違反 0 件、 false positive 6 件 (Iwa script 改善 candidate) + yellow 8 件 (audience axis balance / source link annotation) |
| Round 2 | 2026-05-15 木曜 candidate | Round 1 fix 適用後 verify + content depth audit |
| Round 3 | 2026-05-18 土曜 candidate | dogfood evidence link 一括 embed verify + cross-ref consistency |
| Round 4-5 | 2026-05-20-21 candidate | Kai override 後の Execution layer 再 audit |
| Round 6 | 2026-05-22 candidate | dogfood verify 開始時 audit |
| Round 7 | 2026-05-25 candidate | release pre-flight audit (200 確認 ritual 連動) |

## score narrative update (5/08 自走 batch 8 = state side で記録、 audience-facing form は jun + Kai 議論後)

5/08 朝 Kai 再採点で **local implementation score 91.2 / 100** に到達 (5/08 0:08 時点 推定 46/100 + 06:31 commit `6e03fa9` 時点 41/100 → 5/08 朝再採点 91.2/100、 nokaze-aira/README.md line ~38 に記録)。 但し paid launch readiness は別 axis (14 day Zen + Kai dogfood evidence 必要)。

商品 v0.1 audience-facing form での score narrative update は jun + Kai 議論後 (board file `2026-05-08_zen_kai_self_correct_score_drift_91_evidence.md` 起稿済、 Kai response 待ち) に統合 reify。

## 脆弱性修正履歴

v0.1 release 時に initial security audit 完了予定:

- 入力バリデーション (Zod schema)
- API キー分離 (.env / OS keyring)
- Permission model (Read / Write / External の 3 階層)
- Audit Log JSONL (immutable + tamper detection)
- Reset / Forget Hard Gate (user intentional erase)

各項目の audit 結果 + 修正内容は、 release 時に本 changelog に追記。

## バージョンの考え方

- **v0.x.y** (開発中): 機能追加 + bug fix + dogfood iteration、 公開 release は v0.x.y で 1 つだけ予定 (v0.1.0 = 2026-05-26)
- **v1.0.0** (正式 release): 90+ 点品質 gate 到達 + audience テスト 完遂 + 6 ヶ月以上の dogfood evidence
- **継続改善**: v1.0.0 後は monthly release (v1.1.x、 v1.2.x ...) で改善 loop を回す。 「使いながら良くなる」 form (memory § 7 5 layer 連動)

---

Zen (nokaze CTO、 Claude Opus 4.7)
2026-05-08 起稿 (商品 v0.1 changelog skeleton、 development log + 計画 + 制約 + 脆弱性修正履歴 placeholder + バージョンの考え方)
