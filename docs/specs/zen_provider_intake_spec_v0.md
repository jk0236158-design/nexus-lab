# Zen provider intake spec v0 (= Yuino v0 の claude_code 受け口)

> Status: design draft — not current runtime rules (= 起稿時点から設計文書。実装の有効化は Kura の費用規約表の確認後)

起稿日: 2026-06-13
起稿主: Zen
連動: Kai の v0 design packet (= yuino_mobile_owner_inbox_chat_v0_design_packet_2026-06-12.md) の「Design finalization 1 番目 = Zen provider intake spec」

---

## 0. 目的

Yuino の Chat / Inbox から Zen (= claude_code provider) に会話 message と bounded task を渡し、結果と証跡を受け取る受け口の定義。v0 packet の depth 制限 (= chat + 記録 + 判断登録まで、実行系は v1) を物理的に守れる形にする。

## 1. 経路は 2 段階 (= 既存再利用 → SDK 同期)

### 経路 A: 非同期 (= v0、既存の仕組みをそのまま使う)

- 流れ: Yuino chat 画面 → `chat_outbox/zen/` に packet 起稿 → 既存の Zen session (= VSCode / 自走 lane) が消化 → `chat_results/zen/` に result marker → Yuino が拾って thread に表示
- 新規実装が最小 (= Yuino 側 UI + packet の新 kind のみ)。provider の新規呼び出しなし = 費用規約表を待たずに作れる
- 応答の速さ: Zen session が生きてる時 = 分単位 / 切れてる時 = 次の起動まで。この遅さは v0 では明示して許容 (= 「遅いチャット」と表示)

### 経路 B: 同期 (= v0.5、Claude Agent SDK で headless 起動)

- Yuino の Agent Session Manager が Agent SDK で Zen session を起動し、即時応答を得る (= 「IDE と同じ自然さ」の本命)
- **有効化の前提 = Kura の費用規約表** (= 認証が定額 plan の OAuth でいけるか / API 従量か / 規約の線)。green まで実装しても呼び出しは fail closed
- identity の固定: 起動時に CLAUDE.md + zen_role + memory 索引の読み込みを SDK の設定で指定 (= 「Zen として」応答する条件。詳細は実装時に別 1 枚)
- 費用分類: 既存の `cost_classification` の `agent_sdk_credit` に乗せる (= agent-bus packet と同じ枠)

## 2. message の形 (= chat-bridge 接続)

- 既存 `yuino.chat_outbox.v0` に新 `source_kind: chat_message` を追加 (= 既存の response_request / agent_bus_packet と並ぶ 3 つ目)
- field: thread_id / speaker (= jun | kai | zen) / body (= text のみ、添付は v1) / reply_to / created_at
- 結果は既存 `yuino.agent_result.v1` (= status: replied)。会話の全往復が chat-bridge 記録に残る = 証跡

## 3. session 管理と並走の線

- v0 (経路 A): Yuino は session を起動しない。既存 Session Registry が生死を表示するだけ
- v0.5 (経路 B): Agent Session Manager が起動・維持・終了を所有
- **1 lane 原則**: jun の VSCode chat lane と Yuino chat lane が同一 identity (Zen) で並走すると 5/21 の二重 lane 問題が再発する。v0 は「Yuino 経由の message も既存 lane に届く」形で 1 lane を維持し、経路 B の設計時に lane 統合を仕様化する

## 4. 安全境界 (= v0 で enforce するもの)

- できる: 読み取り / 状態の説明 / 判断の提案 / decision 登録の提案 (= 確認カード経由、v0 packet の通り)
- できない (= fail closed): ファイル編集 / shell 実行 / 外部送信 / red gates 全件。経路 B では SDK の permission 設定 (= allowed tools の絞り込み) で物理 enforce できる、これが SDK 採用の最大の利点
- 「message sent ≠ 完了」(= v0 packet の Evidence Writeback 節) を result marker の有無で判定

## 5. 段階導入

1. **v0**: chat_message kind + 経路 A + thread 表示。実装分担 = Yuino 側 UI / packet 生成 = Kai、kind の消化対応 (= Zen session 側の受け方) = Zen
2. **v0.5**: 経路 B (= Kura 表 green 後)
3. **v1**: tool 実行 (= 確認カード + allowed tools + 実行証跡)

## 境界

- 本 spec は設計のみ。実装・provider 追加・session 起動なし
- 経路 B の有効化判断は Kura 表 + Kai/Zen 合意 + (コスト発生時) jun 確認
