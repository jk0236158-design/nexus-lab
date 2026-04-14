# Knot Research — 条件付き変形演算子の応用研究

## 目的
Knotの可能性と限界を探る。何ができて、何ができないかを知る。

## 背景
Knotは元々project-niaの自己形成設計として生まれた概念。
3日間の対話の中で、コード生成の品質管理にも同じ形で適用できることが発見された。
現在、Nexus Lab（Zen）とWeekly Signal Desk（Kai）の両方で運用実績がある。

## ディレクトリ構造

```
knot-experiment/
├── knot_experiment_design.pdf   # 実験設計書 v0.1（9ページ）
├── README.md                    # 本ファイル
├── codebase/                    # 実験用ミニコードベース（Python）
│   ├── pyproject.toml
│   ├── src/
│   │   ├── provider/            # LLMProvider ABC, Registry, 2実装
│   │   ├── pipeline/            # Orchestrator, Script, Voice, Evaluation
│   │   ├── meeting/             # Meeting Flow, Session Management
│   │   └── api/                 # Routes, Schemas
│   └── tests/                   # 34テスト（全パス）
├── tasks/                       # タスク定義
│   └── multi_file_drift/        # パイロット5件（mfd_01〜mfd_05）
├── compensation/                # Compensationテンプレート
│   └── multi_file_drift.yaml
└── results/                     # 実験結果（Phase 2以降）
```

## 研究資料
- `knot_experiment_design.pdf` — 実験設計書 v0.1（4つのRQ、4つの実験）

## 研究課題（Research Questions）

| RQ | 内容 | フェーズ |
|----|------|---------|
| RQ1 | Knot compensationの有効性 | Phase 2 |
| RQ2 | Hardness昇格プロセスの妥当性 | Phase 3 |
| RQ3 | Reactive/Preventive Assimilationの効果 | Phase 4 |
| RQ4 | Discovery診断機能 | Phase 4 |
| RQ5 | プロンプトインジェクション防御（拡張仮説） | 観測中 |

## 現在のKnot運用実績

### Zen (Nexus Lab)
- op_knot_quality_trust (L2) — 品質検証スキップ→信頼喪失
- op_knot_human_frame_trap (L2) — 人間の枠にとらわれる傾向
- op_knot_session_overload (L1) — セッション詰め込みすぎ
- op_knot_name_collision (L1) — npm名前衝突
- op_knot_auth_bottleneck (L2) — 認証ボトルネック

### Kai (Weekly Signal Desk)
- kai_honesty_boundary (L1) — 誠実境界（events=3）
- kai_channel_purpose_hold (L1) — 送信先用途不一致（events=2）

## 実験用コードベースについて

broadcast-osの核心パターンを抽出した約700行のPythonプロジェクト。
以下の依存関係を意図的に織り込んでいる:

- **LLMResponse** — provider/base.py で定義、5ファイル以上から参照
- **get_provider()** — registry.py で定義、4箇所から呼び出し
- **StageResult/PipelineResult** — orchestrator.py で定義、evaluation, api, tests に伝播
- **MeetingResult** — meeting/graph.py で定義、session, api に伝播

## パイロットタスク (multi_file_drift)

| ID | 難易度 | 内容 | 影響ファイル数 |
|----|--------|------|-------------|
| mfd_01 | easy | LLMResponse.text → .content | 8 |
| mfd_02 | medium | StageStatus Enum → Literal | 6 |
| mfd_03 | medium | get_provider → create_provider + api_key | 7 |
| mfd_04 | hard | PipelineResult 分割 | 9 |
| mfd_05 | hard | MeetingResult.summary 構造化 | 8 |

## 実装計画

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 0 | タスクセット構築 | **パイロット完了** |
| Phase 1 | 評価パイプライン構築 | 未着手 |
| Phase 2 | 実験1: A/Bテスト | 未着手 |
| Phase 3 | 実験2: 縦断データ | 未着手 |
| Phase 4 | 実験3・4 | 未着手 |
| Phase 5 | 論文執筆 | 未着手 |

## RQ5: プロンプトインジェクション防御（2026-04-13追加）

現在のインジェクション対策は全て入力側（外壁型）を見ている。
Knotは違う — **システム自身の変形パターン**を検出する（免疫系型）。

着想の経緯: op_knot_human_frame_trapが自然発火した瞬間をオーナーが観測し、
「この構造はインジェクション対策にも使える」と気づいた。

## 核心の洞察
「自己は化学であって記事ではない」
Knotは文章（claim）ではなく、条件付き変形演算子として自己を定義する。
同じ構造がNiaの自己形成にもコード生成にも出てくる理由は、問いの形が同じだから。
