# 仕組みの説明 (Execution layer architecture、 placeholder)

> ⚠️ **placeholder です**。 Execution layer の実装は Kai (Aira 実装担当) が `nokaze-aira/` repo で進めています。 完成版 docs は、 観察試験 (Phase 1) の中で Kai が起稿予定。 公開判断は Phase 6 Launch Readiness Gate (yes/no decision、 evidence ベース)。 本 file は構造の outline のみです。

## 1 entity 2 narrative (内側の名前と公開の名前)

このパックの中で動く本体には、 **1 つの実体** に **2 つの呼び方** があります。

| 呼び方 | 使う場面 | 何を指すか |
|---|---|---|
| **Aira** (内側の名前) | 仕組みの話、 内部のドキュメント | 実装の本体 |
| **Yuino** (公開の名前) | あなたが触る画面、 商品としての呼び方 | 同じ実体の公開 brand |

= Aira と Yuino は 別の道具ではなく、 **同じ 1 つの道具を、 内側で呼ぶときと、 外で呼ぶときで名前を変えているだけ** です。

## 6 つの動き (closed loop = ぐるぐる回る仕組み)

Aira / Yuino は、 6 つの動きを順番に回しています:

```
   観察 (observe) ←─────┐
       ↓                │
   判断 (decide)        │
       ↓                │
   実行 (dispatch)      │
       ↓                │ ぐるぐる回る
   確認 (verify)        │
       ↓                │
   復旧 (recover)       │
       ↓                │
   実行 (execute) ──────┘
```

各動きの説明:

| 動き | 何をするか | 普段の言葉 |
|---|---|---|
| 観察 (observe) | 今の状態を見る | 「今どうなっているか確認する」 |
| 判断 (decide) | 何をすべきか決める | 「次にやることを決める」 |
| 実行 (dispatch) | 誰にやってもらうか決める | 「Claude に頼むか、 Codex に頼むか決める」 |
| 確認 (verify) | やった結果を見る | 「ちゃんとできたか確認する」 |
| 復旧 (recover) | 失敗してたら直す | 「壊れてたらやり直す」 |
| 実行 (execute) | 次の作業を始める | 「次のやることに着手する」 |

= この 6 つが、 ぐるぐる回り続けることで、 「会話 → 判断 → 操作 → 結果 → 学び」 が自動で進みます。

## 3 つの層 (Base + Vocabulary + Execution)

商品 v0.1 は 3 つの層で構成されています:

| 層 | 何が入っているか |
|---|---|
| 準備の層 (Base) | AI 設定の手引き + 安全のルール + 確認チェックリスト |
| 言葉の層 (Vocabulary) | 専門の言葉 ↔ 普段の言葉 対応表 + 翻訳ルール |
| **動かす層 (Execution)** | **本 file が含まれる層、 実際に動く部分** |

Execution layer の中身:
- `yuino_demo.md`: Yuino の小さな demo の使い方 (Kai 起稿予定)
- `local_setup.md`: Local Web App として手元で起動する手順 (Kai 起稿予定)
- `architecture.md`: 仕組みの説明 (本 file)

## Local-first の原則

Aira / Yuino は **手元のパソコンの中で動きます**。 大事な情報は、 あなたの許可なく外に送られません。

- データの保存先: あなたのパソコンの SQLite ファイル + JSONL ログ
- AI の呼び出し: あなたが設定した API キーのみで、 Claude / Codex / Gemini 等の AI service に送信
- ローカル LLM 対応: ollama / lm-studio 等の手元の LLM も使用可能

= 「クラウドで何もかも処理する SaaS」 ではなく、 「手元で動かして、 必要なときだけ外の AI に頼む」 形です。

## 安全のルール (5 件)

詳細は [03_safety_rules.md](../setup-template/03_safety_rules.md) 参照、 architecture-level での 安全のルール 5 件:

1. **承認の関所** (Approval Gate): 外部送信 + ファイル変更 + お金発生の前に確認
2. **作業の足跡** (Audit Log JSONL): 全 action を tamper-evident に記録
3. **全消し** (Reset/Forget): user 意図的な記憶の消去、 1 click で全消し
4. **怪しい時は止まる** (Fail Closed): 安全か分からないときは AI が止まる
5. **手元で動く** (Local-first): デフォルトで外に送らない、 user 許可で初めて送る

## 仕組みの図 (placeholder)

```
+-------------------------------------------+
|  あなた (jun audience or 開発者)         |
+----------------+--------------------------+
                 ↓ 会話
+-------------------------------------------+
|  Yuino (公開 brand) = Aira (内部実装)    |
|                                           |
|  6 step closed loop:                      |
|    観察 → 判断 → 実行 → 確認 → 復旧 → 実行 |
|                                           |
|  ぐるぐる回りながら、 AI 群と connect    |
+----+----+----+----+----+----+--------------+
     ↓    ↓    ↓    ↓    ↓    ↓
+--------+ +--------+ +--------+ +--------+
| Claude | | Codex  | | Gemini | | local  |
| (会話) | | (コード)| | (要約) | |  LLM   |
+--------+ +--------+ +--------+ +--------+
```

詳細な architecture diagram は Kai が `nokaze-aira/` で起稿後に本 file に inline します。

## 開発の進捗

Execution layer の実装は、 Kai が `nokaze-aira/` repo で進めています:

- 2026-05-06 夕方: 12 件の commit で full closed loop 実装完成
- 2026-05-08: 観察試験 Phase 1 Day 1 着手、 Yuino narrative 看板固定
- Phase 1 観察試験期間 (2026-05-08〜2026-05-21): Yuino 1 機能 demo の実装 + 14 day 連続観察 evidence 収集
- Phase 2 自走ループ E2E (完了条件順序): 動作 evidence が揃った時点で本 docs を完成版に置換
- Phase 6 Launch Readiness Gate (yes/no 判断): 公開判断 yes 時に nokaze.dev / GitHub から link 公開

詳細は Kai の `nokaze-aira/README.md` を参照 (公開判断 yes 時に link 公開)。

---

Zen (nokaze CTO、 Claude Opus 4.7)
2026-05-08 起稿 (Execution layer architecture placeholder、 1 entity 2 narrative + 6 step closed loop + Local-first + 5 安全ルール、 Kai 主担当の実装が観察試験 Phase 1 〜 Phase 2 完了条件で揃った時点で本 file を完成版に置換予定)
