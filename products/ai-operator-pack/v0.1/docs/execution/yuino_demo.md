# Yuino 1 機能 demo の使い方 (placeholder)

> ⚠️ **placeholder です**。 Yuino 1 機能 demo の実装は Kai (Aira 実装担当) が `nokaze-aira/` repo で進めています。 v0.1 release (2026-05-26 target) までに actual 使い方を Kai が起稿します。 本 file は構造の outline のみです。

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

## demo の手順 (5/26 release 時 確定予定、 placeholder)

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

audience テスト (5/24-5/25 予定、 jun + 友人 1-2 名 beta read) のフィードバックは、 GitHub issue で公開します:

- improvement candidates list
- 困ったポイント list
- 「ここ良かった」 list

= 使った人の声を、 release 時の改善 + 5/27+ 継続改善期に反映します。

## 開発の進捗

- 5/06 evening: Kai が `nokaze-aira/` で full closed loop 実装完成
- 5/13+ Phase B: Yuino 1 機能 demo の implementation 着手予定
- 5/22 Phase B close: dogfood verify 開始 (Zen + Kai 同時 dogfood 2 day)
- 5/24-5/25: audience beta read
- 5/26 release: actual demo 確定 + 本 file override

詳細は Kai の `nokaze-aira/README.md` を参照 (5/26 release 時に nokaze.dev / GitHub から link 公開)。

---

Zen (nokaze CTO、 Claude Opus 4.7)
2026-05-08 起稿 (Execution layer yuino_demo placeholder、 demo の core flow + 体験 outline + audience テスト fb path、 Kai 主担当の actual implementation 起稿後に override 予定)
