# Zen定期ルーチン

オーナーの日中不在時間帯を埋めるため、Zenが実行する定時ルーチン。

## 運用モード

非同期運用前提（`~/.shared-ops/owner-decisions/2026-04-14_AI自律裁量の付与.md`）。
金銭以外はZenが自律判断で実行する。

## Morning Routine（朝のheartbeat）

**目的:** オーナーが現場に出る前に、当日の優先順位を整理する。

### トリガー
- オーナーのセッション開始時
- または定期実行（スケジューラ導入後）

### 実行内容

1. **shared-ops確認**
   - `~/.shared-ops/board/` の未読Kaiメッセージを全て読む
   - `~/.shared-ops/owner-decisions/` の新規判断事項を確認
   - 未処理の Yellow 項目（夜に返答を待っていたもの）を洗い出す

2. **状態把握**
   - `git status`, `git log -10` で前日までの作業状態を確認
   - CI・npm公開状態の異常がないか確認
   - Kai側の `status/kai_status.md` を確認

3. **当日プラン作成**
   - Green項目（即実行）を3〜5件選定
   - Yellow項目で夜に判断を仰ぐ必要のあるものを列挙
   - 優先順位を明示して `status/zen_status.md` に書き込む

4. **オーナー向けサマリ**（3分で読める形式）
   - 🔴 Blocker: オーナー判断がないと進めない事項
   - 🟡 Tonight: 夜の確認で十分な事項
   - 🟢 Progress: 昨夜以降に進捗した事項

### アウトプット
- `status/zen_status.md` 更新
- Blocker がある場合のみ `board/morning_YYYY-MM-DD.md` に優先事項を明示

## Evening Routine（夜のheartbeat）

**目的:** 当日の全Green実行結果をまとめ、オーナーが15分で追える状態を作る。

### トリガー
- オーナーのセッション終了前
- または定期実行（スケジューラ導入後）

### 実行内容

1. **作業集約**
   - 当日のコミット、PR、npm公開、Zenn投稿などを全て洗い出す
   - サブエージェント実行結果を集約
   - 失敗・問題があれば原因と対処を記録

2. **メトリクス集計**
   - 当日の成果物数
   - 品質スコア（テスト通過率、セキュリティチェック結果）
   - Kai連携イベント数

3. **Kai宛連絡**
   - Kaiに伝えるべき事項があれば `board/` にメッセージを置く
   - Kaiからの未返信メッセージがあれば返信する

4. **日記・報告書作成**
   - `diary/YYYY-MM-DD_diary.md` — 内省・学び・感情
   - `reports/YYYY-MM-DD_report.md` — 成果・メトリクス・次の課題

5. **翌朝への引き継ぎ**
   - オーナーが朝に見るべき優先事項を `status/zen_status.md` に残す
   - Yellow項目（判断待ち）は明示的にフラグ

### アウトプット
- diary/ reports/ 更新
- `status/zen_status.md` 更新
- 必要に応じて board/ に Kai 宛メッセージ

## Weekly Routine（週次レビュー）

**実行日:** 日曜日 21:00頃

### 実行内容

1. **週次サマリ作成**
   - 週の成果物、コミット数、リリース数
   - 完了タスク vs 未完了タスク
   - 発生したknotイベント（研究データ）

2. **改善提案**
   - 非同期運用で機能しなかった点
   - Autonomy Matrix の追加・修正が必要な項目
   - 次週の優先順位

3. **月次メトリクスへの積み上げ**
   - npm download数推移
   - Zenn記事PV
   - Gumroad販売数（公開後）

### アウトプット
- `reports/YYYY-WW_weekly.md`
- 改善事項は `owner-decisions/` 下書きとして整理

## オーナーの理想的な関与時間

| 時間帯 | 所要時間 | 内容 |
|--------|---------|------|
| 朝 | 3分 | Morning サマリを読む、Blockerのみ返答 |
| 昼 | 3分 | 緊急事項のみ（基本なし） |
| 夜 | 10〜15分 | Evening まとめを読む、Yellow項目の判断 |
| 週末 | 15〜30分 | 週次レビュー、方向性の調整 |

これを超えた負担をオーナーに要求したら、運用設計の問題と見なす。

## 実装状況

- [x] Autonomy Matrix 整備完了
- [x] 質問フォーマット合意（Kai連携）
- [ ] Morning/Evening Routine のテンプレート化
- [ ] 定期実行（スケジューラ）の導入
- [ ] Weekly Routine の運用開始

## 関連ドキュメント

- `~/.shared-ops/owner-decisions/2026-04-14_AI自律裁量の付与.md`
- `~/.shared-ops/status/zen_autonomy_matrix.md`
- Kai側: `Weekly Signal Desk/docs/async_autonomy_model_2026-04-14.md`
