# Knot Research — 条件付き変形演算子の応用研究

## 目的
Knotの可能性と限界を探る。何ができて、何ができないかを知る。

## 背景
Knotは元々project-niaの自己形成設計として生まれた概念。
3日間の対話の中で、コード生成の品質管理にも同じ形で適用できることが発見された。
現在、Nexus Lab（Zen）とWeekly Signal Desk（Kai）の両方で運用実績がある。

## 研究資料
- `knot_experiment_design.pdf` — 実験設計書 v0.1（4つのRQ、4つの実験）
- `knot_process.md` — Knotが生まれるまでの3日間の記録

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

## 核心の洞察
「自己は化学であって記事ではない」
Knotは文章（claim）ではなく、条件付き変形演算子として自己を定義する。
同じ構造がNiaの自己形成にもコード生成にも出てくる理由は、問いの形が同じだから。
