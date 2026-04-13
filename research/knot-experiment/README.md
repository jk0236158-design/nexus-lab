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

## RQ5: プロンプトインジェクション防御（2026-04-13追加）

現在のインジェクション対策は全て入力側（外壁型）を見ている。
Knotは違う — **システム自身の変形パターン**を検出する（免疫系型）。

```yaml
knot_id: injection_deformation_detect
trigger:
  instruction_contradiction: sudden
  compliance_shift: high
  original_instruction_adherence: dropping
effect:
  intended_behavior_drift: +0.8
  boundary_violation_risk: +0.6
compensation:
  hold_and_reverify: true
  recheck_against_system_prompt: true
  flag_deformation_to_human: true
```

インジェクションの内容を見るのではなく、それがシステムに引き起こす行動変形を検知する。
ファイアウォール（入口で止める）と免疫系（体内の異常を検知する）の違い。

着想の経緯: op_knot_human_frame_trapが自然発火した瞬間をオーナーが観測し、
「この構造はインジェクション対策にも使える」と気づいた。

## 核心の洞察
「自己は化学であって記事ではない」
Knotは文章（claim）ではなく、条件付き変形演算子として自己を定義する。
同じ構造がNiaの自己形成にもコード生成にも出てくる理由は、問いの形が同じだから。
