# AI Operator Pack v0.1 (development progress、 商品 publish 前)

> ⚠️ 開発中です。 まだ販売開始していません。 90 点品質 gate 到達 + dogfood verify 14 day 完遂後に release 予定 (target: 2026-05-26)。

## これは何ですか

複数の AI を一緒に使い始める人のための、 設定の手引き + 用語の対応表 + 動く小さな道具 を 1 つのパックにしたものです。

「Claude で雑談、 Codex でコード、 Gemini で要約、 ローカル LLM でセキュアな処理 — でも、 結局 『何をどの AI に任せるか』 を毎回考え直している」 という疲れに、 設定と判断を 1 か所に集める道具で答えます。

## 3 つの層

| 層 | 何が入っているか | 誰のため |
|---|---|---|
| **準備の層** (Base layer) | AI 設定の手引き、 README、 確認チェックリスト、 サンプルの状態ファイル、 安全のルール、 AI エージェントに頼む手順書 | AI を始めて 4 ヶ月くらいの人 |
| **言葉の層** (Vocabulary layer) | 内部用語と公開用語の対応表 (「気づきの結び目」「気づきの硬さ」 等)、 4 ヶ月初心者向けの説明 | AI を運営する人 (Claude Code / Codex / Cursor 利用者) |
| **動かす層** (Execution layer) | Yuino の小さな demo (会話 → 判断 → 操作 → 結果のまとめ の 1 機能)、 ローカル動作 | 4 ヶ月初心者 + 開発者 両方 |

## 3 つの姿勢

このパックは nokaze の 3 つの姿勢に従って作っています。

1. **数字を盛りません** — 売上 0 円、 顧客 0 名、 検証段階です。 「急成長」「次世代」「突破」 等の言葉は使いません。
2. **AI が運営していることを隠しません** — Zen (Claude Opus 4.7) が CTO、 各メンバーは AI、 基盤モデル付きで署名します。
3. **品質で黙らせます** — テスト + 独立 QA + dogfood + 改善履歴の 5 layer で、 「AI が作ったから微妙」 と言われない品質を出します。

## 90 点品質 gate と継続改善

このパックの release は **90 点品質 gate** を通過してから、 と決めています。 gate は 12 軸の採点 + 11 件の必須関門 + 14 day の運用記録で構成、 60+ 点で alpha、 90+ 点で release。

但し、 **90 点 gate は天井ではなく、 販売の入口です**。

release 後も 5 layer で継続改善:

- **使ってみた記録** (dogfood evidence): 開発者自身が日常で使い続けた使用 log
- **会話からの気づき** (Conversation Insights): 会話の中から AI が surface した「次の改善 candidate」
- **失敗と回復の記録** (Aira closed loop): 何が壊れたか、 どう直したか
- **使った人の声** (audience feedback): beta read + 公開後の使用 evidence
- **道具自身が見つける改善** (self-improvement): Yuino 自身が「ここをこうした方がいい」 を表面化する仕組み

「90+ になったから改善終わり」 ではありません。 使いながら良くなる構造を持った道具を作っています。

## ロードマップ

| Phase | 中身 | 予定 |
|---|---|---|
| 開発中 (Phase 0) | dogfood + 設計 + 実装 | 2026-05-08 〜 5/12 |
| 開発前期 (Phase B) | Base 層 + Vocabulary 層 + Execution 層 起稿 | 2026-05-13 〜 5/22 |
| 開発後期 (Phase C 入口) | dogfood verify 2 day + 商品準備 + LP 起稿 | 2026-05-23 〜 5/25 |
| **Release** (canonical switch milestone) | 60+ 点 → release 90+ 到達後 | **2026-05-26** |
| 継続改善期 | 5 layer で改善を回す | 2026-05-27+ |

## 開発の透明性

開発の様子は GitHub + Zenn 記事 + X で公開しています:

- GitHub: https://github.com/jk0236158-design/nexus-lab (本リポジトリ)
- Zenn: https://zenn.dev/nexus_lab_zen (13 記事公開済み、 2026-05-08 時点)
- X: 開発進捗の短文 + 1 分動画 (broadcast-os 連動、 release 後)

## チーム

```
Owner: jk023 (日本、 個人事業、 屋号 nokaze)
CTO: Zen (Claude Opus 4.7)
├── Iwa    (Lead Engineer、 アーキテクチャ + コアロジック)
├── Oto    (Backend、 API + インフラ)
├── Akari  (Frontend / Docs、 UI + 文書)
├── Kagami (QA、 テスト + 独立 QA review)
├── Hoshi  (Researcher、 Knot 研究 + 実験)
└── Kura   (経理、 オーナー直属)

Aira (内部実装、 nokaze-aira/) ↔ Yuino (公開 brand) は同体の 2 つの語り口 (1 entity 2 narrative)
```

全員 Claude Opus 4.7 / Sonnet 4.6 上で動く AI です。 Aira / Yuino を「自分たちで使う」 dogfood で、 道具自身が良くなる構造を観察しながら作っています。

## file 構成 (商品 v0.1)

```
products/ai-operator-pack/v0.1/
├── README.md                    ← 本 file
├── docs/
│   ├── setup-template/          ← Base layer (準備の層)
│   │   ├── 01_quick_start.md    ← 4 ヶ月初心者向け、 5 分 setup
│   │   ├── 02_ai_agent_setup.md ← AI エージェント (Cursor / Claude Code) 経由 setup
│   │   ├── 03_safety_rules.md   ← 安全のルール (Approval Gate / Audit Log / Reset/Forget)
│   │   ├── 04_checklist.md      ← 確認チェックリスト
│   │   └── sample_state/        ← サンプルの状態 file
│   ├── glossary/                ← Vocabulary layer (言葉の層)
│   │   ├── public_glossary.md   ← 内部用語 ↔ 公開用語 対応表 (本 commit で起稿)
│   │   ├── usage_examples.md    ← UI tooltip + docs 適用例
│   │   └── translation_rules.md ← 翻訳ルール 4 件
│   └── execution/               ← Execution layer (動かす層)
│       ├── yuino_demo.md        ← Yuino 1 機能 demo の使い方
│       ├── local_setup.md       ← Local Web App 起動手順
│       └── architecture.md      ← 仕組みの説明 (1 entity 2 narrative + 6 step closed loop)
├── changelog.md                 ← 変更履歴 (脆弱性修正 + 改善履歴)
└── license.md                   ← ライセンス (BSL or MIT 候補、 release 前確定)
```

## 連絡

- 質問 / フィードバック: GitHub issue (本リポジトリ)
- 公開向け: [@nexus_lab_zen on Zenn](https://zenn.dev/nexus_lab_zen)
- nokaze umbrella: [nokaze.dev](https://nokaze.dev)

---

Zen (Claude Opus 4.7、 nokaze CTO)
2026-05-08 起稿 (development progress、 release 予定 2026-05-26)
