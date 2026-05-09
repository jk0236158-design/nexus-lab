# AI Operator Pack v0.1 (development progress、 商品 publish 前)

> ⚠️ 開発中です。 まだ販売開始していません。 観察負荷試験 (Phase 1: 2026-05-08〜2026-05-21) + Launch Readiness Gate (Phase 6: yes/no 判断、 evidence ベース) を経てから release します。

## これは何ですか

複数の AI を一緒に使い始める人のための、 設定の手引き + 用語の対応表 + 動く小さな道具 を 1 つのパックにしたものです。

「Claude で雑談、 Codex でコード、 Gemini で要約、 ローカル LLM でセキュアな処理 — でも、 結局 『何をどの AI に任せるか』 を毎回考え直している」 という疲れに、 設定と判断を 1 か所に集める道具で答えます。

## 3 つの層

| 層 | 何が入っているか | 誰のため |
|---|---|---|
| **準備の層** (Base layer) | AI 設定の手引き、 README、 確認チェックリスト、 サンプルの状態ファイル、 安全のルール、 AI エージェントに頼む手順書 | AI を始めて 4 ヶ月くらいの人 |
| **言葉の層** (Vocabulary layer) | 内部用語と公開用語の対応表 (「気づきの結び目」「気づきの硬さ」 等)、 4 ヶ月初心者向けの説明 | AI を運営する人 (Claude Code / Codex / Cursor 利用者) |
| **動かす層** (Execution layer) | Yuino の小さな demo (会話 → 判断 → 操作 → 結果のまとめ の 1 機能)、 ローカル動作 | 4 ヶ月初心者 + 開発者 両方 |

## Yuino (動かす層 の中核) — 商品 narrative 3 軸

[Yuino LP draft](yuino_lp_draft.md) — 1 文の定義 + できること 5 軸 + 開発状況誠実版

| 軸 | 商品文書 |
|---|---|
| 1. **Local Web App first** | [Yuino LP draft](yuino_lp_draft.md) (3 段階移行: Phase 1 Local Web App → Phase 2 Tauri Desktop → Phase 3 Web SaaS) |
| 2. **Conversation Insights** | [yuino_conversation_insights.md](yuino_conversation_insights.md) (4+1 panel 構造、 Knot 研究接続) |
| 3. **Security 絶対妥協なし** | [yuino_security_promise.md](yuino_security_promise.md) (8 軸 安全 narrative) |
| setup | [yuino_setup_with_ai_agent.md](yuino_setup_with_ai_agent.md) (AI エージェント経由 4 ヶ月初心者 form) |

## 3 つの姿勢

このパックは nokaze の 3 つの姿勢に従って作っています。

1. **数字を盛りません** — 売上 0 円、 顧客 0 名、 検証段階です。 「急成長」「次世代」「突破」 等の言葉は使いません。
2. **AI が運営していることを隠しません** — Zen (Claude Opus 4.7) が CTO、 各メンバーは AI、 基盤モデル付きで署名します。
3. **品質で黙らせます** — テスト + 独立 QA + dogfood + 改善履歴の 5 layer で、 「AI が作ったから微妙」 と言われない品質を出します。

## 公開判断と継続改善

このパックの公開は、 evidence (= 動いた記録 + 失敗の記録 + 復旧の記録) が揃った時点で **Launch Readiness Gate (Phase 6)** で **「公開する / しない」 を yes/no で決定** します。 採点ではなく、 evidence ベースの判断です。

判断の材料 (内部参照、 audience-facing の score 表示はしません):

- 観察試験 14 day の記録 (Phase 1)
- 自走ループの動作記録 (Phase 2)
- オーナー負荷の圧縮 evidence (Phase 3)
- 初心者 first-run の通り抜け evidence (Phase 4)
- 公開向け 1 ページ説明の readiness (Phase 5)
- 失敗 + 復旧 + 監査の記録 + 「まだ公開しない」 list

公開後も 5 layer で継続改善:

- **使ってみた記録** (dogfood evidence): 開発者自身が日常で使い続けた使用 log
- **会話からの気づき** (Conversation Insights): 会話の中から AI が surface した「次の改善 candidate」
- **失敗と回復の記録** (Aira closed loop): 何が壊れたか、 どう直したか
- **使った人の声** (audience feedback): beta read + 公開後の使用 evidence
- **道具自身が見つける改善** (self-improvement): Yuino 自身が「ここをこうした方がいい」 を表面化する仕組み

「公開したら改善終わり」 ではありません。 使いながら良くなる構造を持った道具を作っています。

## ロードマップ

開発の流れは Kai (Aira 実装担当) が起稿した [Yuino/Aira Roadmap](https://github.com/jk0236158-design/nexus-lab/blob/master/aira/docs/yuino_aira_roadmap.md) に整合。 日付が決まっているのは **観察試験期間 (Phase 1)** だけ、 他のフェーズは 「完了条件で次に進む」 順序です (人間の時間で恐れない、 完了像から始める)。

| Phase | 中身 | 期間 / 完了条件 |
|---|---|---|
| **Phase 1: 観察負荷試験** (date 固定) | 商品 v0.1 起稿 + 動作確認 + 自社利用 evidence | **2026-05-08 (Day 1) 〜 2026-05-21 (Day 14)** |
| Phase 2: 自走ループの完成 (date なし) | Kai 依頼 → Yuino 判断 → Zen 返信 → 結果記録 の e2e | 完了条件: 重複 wake 抑止 + 結果監査 動作 |
| Phase 3: オーナー負荷の圧縮 | jun が確認する量を減らす | 完了条件: 「次に必要な質問」 が 1 件に集約 |
| Phase 4: 初心者向け体験 | 内部用語なしで使える | 完了条件: first-run flow + Reset/Forget が分かる |
| Phase 5: 外部価値の生産 | 商品 / 1 page 説明 / 短い動画 / X / Zenn | 完了条件: nokaze 内部を説明せずに 1 件理解できる成果 |
| **Phase 6: Launch Readiness Gate** | dogfood → 限定 release の判断 | **yes/no 決定 (score ではない)、 evidence ベース** |
| Phase 7: 配布と収益実験 | 1 channel 試験 + 反応記録 | 完了条件: 反応 / 混乱 / 摩擦の記録 |

「点数が揃ったから公開」 ではなく、 「evidence が揃ったら Phase 6 で yes/no 判断」 form です。 評価は判断の材料、 自動公開の条件ではありません。

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
2026-05-08 起稿 (development progress、 観察試験 Phase 1 = 2026-05-08〜2026-05-21、 公開 = Phase 6 Launch Readiness Gate で yes/no 判断)
