# Knot Ledger Template v0 (= AI Operator Guard § 7 Layer 2 の最小形、 v1 候補の internal draft)

generated_at: 2026-06-11 14:55 JST
status: internal draft、 jun GO 前。 v0 の vertical slice 4 件には含めない (= v1 roadmap 枠、 6/11 Kai への § 7 review 依頼で articulate 済みの傾き)
origin:
- internal_spec_v0.md § 7 (= 6/11 jun directive 「knot と糧も生かした商品を」 経由)
- Hoshi 研究整合 review 5 件 (= 6/11) 反映済み: 簡易昇格 rule は研究側 hardness の簡略版と明示 / 降格経路必須 / 研究未検証の開示
- 内部 origin = zen-memory MCP の record-knot / get-knots + memory/feedback_*.md の運用 2 ヶ月分

## 目的

AI agent の運用で踏んだ失敗を「1 回の反省」で終わらせず、 **条件 + 補正 + 再発記録** の形で 1 件ずつ台帳に残し、 同じ形が繰り返されたら hook / checklist の固定規則に昇格させる仕組み。 手動運用で成立する最小形 (= daemon 不要、 file 1 つ + 手順 3 つ)。

検出 (= Guard の他 template) が「今の失敗を見つける」 layer なら、 本 template は「次の同じ失敗を防ぐ」 layer。 道具 (= Claude 等) を契約しても、 利用者の環境固有の失敗台帳は付いてこない。

## いつ使う

- 失敗 / ズレ / 人間からの指摘が 1 件発生した時 = 台帳に 1 entry 起稿 (= 当日中)
- 同じ形の entry が既にないか先に grep = 再発なら既存 entry の recurrence を +1
- 週 1 回 (or 節目) = 台帳を見直して昇格 / 降格を判断

## form

### 1. knot entry (= 1 失敗 1 entry)

```
## knot: <slug> (= 短い名前)
- first_seen: <日付>
- condition: <どういう状況で発生するか、 1-2 行>
- correction: <発生時にどう直すか / どう防ぐか、 1-2 行>
- detection: <機械的に検出する方法があるか。 なし = "manual only">
- recurrence: <再発回数。 初回 = 1>
- last_seen: <最後に発生した日付>
- status: observing | promoted | demoted
- evidence: <発生の物理記録への参照 (log / commit / chat の日時)>
```

### 2. 昇格 rule (= 簡易版、 再発回数のみ)

- **recurrence が 3 に達したら昇格候補**: correction を hook の警告 / checklist の固定行に変換して `status: promoted` にする
- 重要な開示: これは再発回数だけを見る**簡易 rule**。 私たち (= nokaze) の研究側では昇格の妥当性を 3 信号 (= 再発 + 害の大きさ + 時間安定性) で評価する設計を検証中で、 **その検証自体まだ終わってない** (= 閾値 3 は運用上の経験則であり、 実証された最適値ではない)
- 害が大きい失敗 (= 金銭 / 公開事故 / data 損失) は recurrence 1 でも即昇格していい (= 回数を待つ理由がない)

### 3. 降格 / 見直し経路 (= 一方向昇格の禁止)

- promoted から 30 日ごとに発火実績を見直す: その警告が実際の失敗を 1 件も捕まえてない + 誤検出が出てる → `status: demoted` に戻して警告から外す
- 誤検出 1 件 = 即 demote ではなく見直し候補入り。 誤検出 2 件 = demote
- 理由: 誤検出 pattern が固定規則に永久に沈殿すると、 警告全体が背景音になって本物まで素通りされる (= 警告疲れ)。 規則は増やすより削る方が難しいので、 削る手順を最初から決めておく

## 記入例 (= 実物。 nokaze / Zen の 2026-06-11、 model 切替当日の実台帳から 4 件)

```
## knot: stale-memory-asserted-as-current
- first_seen: 2026-06-11
- condition: 外部サービスの状態を、 古い記憶 file (21 日前) を根拠に現在形で断言
- correction: 決済 / アカウント / 外部状態を語る前に、 N 日超の記憶は現物を 1 回引き直す
- detection: manual only (= 記憶 file の経過日数注意は表示済みだったが無視された)
- recurrence: 1
- last_seen: 2026-06-11
- status: observing
- evidence: owner 指摘 chat (06-11 朝) + 記憶 file 修正 commit

## knot: warning-fatigue-passthrough
- first_seen: 2026-06-11 (= 同型 origin は 05-18)
- condition: 毎 turn 同じ文言で出る警告が背景音化し、 行動必須の警告まで素通り
- correction: 警告を「実測異常のみ全表示 / 違反時のみ上位 3 / 習慣系は輪番 1」 の 3 段に分ける
- detection: あり (= 警告への same-turn 反応率を週次で見る)
- recurrence: 2
- last_seen: 2026-06-11
- status: promoted (= 害が運用全体に及ぶため回数を待たず昇格、 hook 改修済み)
- evidence: hook commit (ade2367) + 素通り発生の chat 記録

## knot: plausible-value-fabrication-timestamps
- first_seen: 2026-06-11
- condition: 確認コストが低い値 (時刻) を、 実測せず「もっともらしい値」 で自信を持って生成
- correction: 時刻を書く前に必ず時計を実測。 過去の自分の記載を時刻の根拠にしない
- detection: あり (= 記載時刻 vs file 実更新時刻の 30 分超乖離を hook で照合)
- recurrence: 1
- last_seen: 2026-06-11
- status: promoted (= 検出器実装済み。 初回でも記録の信頼そのものを壊すため即昇格)
- evidence: hook commit (b893759) + 乖離 5 file の捕捉 log

## knot: cyrillic-leak-in-japanese-text
- first_seen: 2026-06-11
- condition: model 更新直後、 日本語文中の英単語がロシア文字化する (2 回観測)
- correction: 直近編集 file をキリル文字で grep して検出次第修正
- detection: あり (= hook の grep 検出器)
- recurrence: 2
- last_seen: 2026-06-11
- status: promoted (= 検出器実装済み)
- evidence: hook commit (95e7f70) + 混入 2 例の記録
```

## 何を約束しないか (= 過大主張の防止)

- 本 template は「失敗の記録と昇格の手順」であり、 **AI が自動で学習する仕組みではない** (= 記録と沈殿は運用の手順、 model の学習ではない)
- 「これで再発が N% 減る」 という数字は出せない (= 私たちの環境での運用実績は 2 ヶ月 + 台帳 entry 数十件、 外部環境での検証なし)
- 昇格 rule の閾値は経験則 (= 上記 § 2 の開示の通り)

## 関連 template

- stop_finalization_template_v0.md (= promoted knot の警告の置き場)
- completion_receipt_template_v0.md (= 「直った」 判定の物理 evidence 側)
- seven_signal_drift_check_template_v0.md (= 着手前の検出 layer)
