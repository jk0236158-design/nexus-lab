# AI Operator Guard

AI が繰り返す失敗を、 次のセッションで実際に効くチェックに変える guard template set。 「動いてる風だが何も進んでいない」 状態を物理的に検出する 8 件で、 nokaze が実運用で繰り返し踏んだ失敗から作った。

## 対象

Claude Code / Codex / Gemini CLI 等の AI agent を 1 ヶ月以上使って、 以下のどれかに当たったことがある人:

- AI が「完了しました」 と言ったが、 成果物がない
- セッション再開時に状態が飛ぶ
- 自動受領と実質的な返答が区別できない、 待ったら何も来なかった
- 自動化が止まっても silent failure になる、 気づくのが翌日
- AI が直前の指示に流されて、 自分が決めた方向を見失う

## 中身

8 件の template を 2 段構成で提供する。 前段 4 件は「開始〜完了〜引き継ぎ」 の flow を通せる最小構成。 後段 4 件はその補助。

### 前段 4 件 (= vertical slice、 最初にここを通す)

| template | 目的 |
|---|---|
| [mode_declaration_template_v0.md](templates/mode_declaration_template_v0.md) | AI が「今どんな判断 mode で動いているか」 を 1 行で宣言する |
| [stop_finalization_template_v0.md](templates/stop_finalization_template_v0.md) | 応答を終える前に「pause + 実行可能件数の並列表示」 を検出する |
| [completion_receipt_template_v0.md](templates/completion_receipt_template_v0.md) | 「完了」 と書く前に物理的な証拠 5 ヶ所を再確認する |
| [handoff_template_v0.md](templates/handoff_template_v0.md) | 次のセッション / 別 agent に「何を読むか / 完了の証拠 / 人間判断に戻る時点」 を明示する |

通す流れ = AI が mode を宣言する → 証拠なしに完了できない → 完了の中身が外から見える → 次のセッションが owner 確認なしで再開できる。

### 後段 4 件 (= 前段が動いた後に追加)

| template | 目的 |
|---|---|
| [auto_ack_rule_template_v0.md](templates/auto_ack_rule_template_v0.md) | 自動受領 file の検出 + 実質的な返答との区別 |
| [seven_signal_drift_check_template_v0.md](templates/seven_signal_drift_check_template_v0.md) | 着手前の曖昧度 7 信号確認 (= Ambiguity Gate 5 分類 + Soft Binder 2 観点) |
| [overclaim_reminder_template_v0.md](templates/overclaim_reminder_template_v0.md) | 「完了 / 公開 / 販売」 等を書く前の確認ルール |
| [start_sweep_template_v0.md](templates/start_sweep_template_v0.md) | セッション開始時に board / status / Aira surface を必ず読む仕組み |

## 使い方

各 template は `.md` file 単体。 自分の CLAUDE.md / agent 設定に埋め込むか、 hook 起点のシェルスクリプトから参照する形が基本。

```
products/ai-operator-guard/
├── templates/
│   ├── mode_declaration_template_v0.md      # 前段 1
│   ├── stop_finalization_template_v0.md     # 前段 2
│   ├── completion_receipt_template_v0.md    # 前段 3
│   ├── handoff_template_v0.md               # 前段 4
│   ├── auto_ack_rule_template_v0.md         # 後段 1
│   ├── seven_signal_drift_check_template_v0.md  # 後段 2
│   ├── overclaim_reminder_template_v0.md    # 後段 3
│   └── start_sweep_template_v0.md          # 後段 4
└── README.md
```

まず前段 4 件を読んで、 自分の agent 設定に「mode declaration + completion receipt + handoff」 の 3 点が入っているか確認する。

## 由来

nokaze (= AI agent を副 CTO / 副 engineer として実運用している小チーム) で実際に踏んだ失敗の種類から作った。 一度きりの失敗ではなく、 注意しても繰り返された失敗を、 その場限りの反省で終わらせずチェックの形に変えたもの:

- 「行数同じ + 中身を重複削除」 を「変更なし」 と判定するズレ
- 自動受領を「完了」 と扱って実質的な返答を skip するズレ
- 並走 instance の成果物を「現在進行形」 と読む短絡

自社使用実績は nokaze 環境固有のもの。 「このまま使えば同じ問題が消える」 という主張はしない。 自分の環境で試して、 合う部分だけ取り込んでほしい。

## 制限

- production-ready の保証なし
- Claude Code 全ユーザーに効くという保証なし (= nokaze 環境固有の自社使用実績)
- 「AI が失敗しなくなる」 ではなく「失敗の種類を物理的に検出しやすくする」 が目的

---

status: v0 draft、 public publish は jun GO 待ち  
generated_at: 2026-06-10
