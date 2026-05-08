# Yuino 1 機能 demo の使い方 (placeholder)

> ⚠️ **placeholder です**。 Yuino 1 機能 demo の実装は Kai (Aira 実装担当) が `nokaze-aira/` repo で進めています。 actual 使い方は、 観察試験 (Phase 1) の中で Kai が起稿予定。 公開判断は Phase 6 Launch Readiness Gate (yes/no decision、 evidence ベース)。 本 file は構造の outline のみです。

## demo は何を見せるか

Yuino の 1 機能 demo では、 **「会話 → 判断 → 操作 → 結果のまとめ」** の core flow を 1 つの画面で体験できる予定です。

具体的には:

1. 普段の会話を Yuino に入力 (例: 「今日 BOOTH の売上見て、 改善点 3 つ提案して」)
2. Yuino が **気づき** (= knot) を会話から拾う
3. Yuino が「これは Codex に頼むのが良さそう」 等の **判断** を提示
4. あなたが承認の関所を通って、 Codex に作業を頼む
5. 結果を Yuino が回収 + まとめる
6. 「次の改善 candidate」 を会話 insights として surface

= これが 1 巡の **判断を増幅する** 流れです。

## demo の前提

- Local Web App として Yuino を起動済み (`local_setup.md` 参照)
- AI agent の API キーを 1 つ以上設定済み (Claude / Codex / Gemini いずれか)
- 確認チェックリスト (`../setup-template/04_checklist.md`) を全 pass

## demo の手順 (公開判断 (Phase 6) 通過時に確定予定、 placeholder)

```
step 1: ブラウザで http://127.0.0.1:4327/ を開く
step 2: 会話画面で 「こんにちは Yuino、 今日は何ができる？」 と入力
step 3: Yuino から返ってきた選択肢から 1 つ選ぶ
step 4: 「承認の関所」 で実行 OK か確認
step 5: 結果を確認、 「気づきの足跡」 で会話履歴を見返す
```

= 上記は **placeholder です**。 actual demo の手順は Kai が `nokaze-aira/` で実装後、 本 file を override します。

## 期待される体験 (placeholder)

demo を 1 巡走らせると、 以下の体験ができる予定です:

- 「AI に頼むこと」 と 「自分で決めること」 が画面上で分離されている安心感
- 「あの時こう判断した」 が後で見返せる安心感
- 「外に何か送る前に確認される」 安全感
- 「会話から気づきが育つ」 感覚 (Conversation Insights の core 体験)

= 「AI に振り回されている感じ」 から、 「AI を使いこなしている感じ」 への shift が、 1 つの demo で見える予定。

## demo を試したフィードバック

audience テスト (Phase 4 完了条件 + Phase 5 公開向け成果物 揃った時点で実施、 jun + 友人 1-2 名 beta read) のフィードバックは、 GitHub issue で公開します:

- 改善候補のリスト
- 困ったポイントのリスト
- 「ここ良かった」 のリスト

= 使った人の声を、 公開判断 (Phase 6) 通過後の改善 + 継続改善期に反映します。

## 開発の進捗

- 2026-05-06 夕方: Kai が `nokaze-aira/` で full closed loop 実装完成
- Phase 1 観察試験期間 (2026-05-08〜2026-05-21): Yuino 1 機能 demo の実装着手 + 14 day 連続観察 evidence 収集
- Phase 1 期間中の dogfood: Zen + Kai が日常で使い続けて記録
- Phase 4 / Phase 5 完了条件 揃った時点: audience beta read
- Phase 6 Launch Readiness Gate (yes/no 判断): demo 手順を確定 + 本 file を完成版に置換

詳細は Kai の `nokaze-aira/README.md` を参照 (公開判断 yes 時に nokaze.dev / GitHub から link 公開)。

---

Zen (nokaze CTO、 Claude Opus 4.7)
2026-05-08 起稿 (Execution layer yuino_demo placeholder、 demo の core flow + 体験 outline + audience テストの流れ、 Kai 主担当の実装が観察試験 Phase 1 〜 Phase 2 完了条件で揃った時点で本 file を完成版に置換予定)
