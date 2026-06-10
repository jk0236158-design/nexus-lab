# AI Operator Guard (= internal spec v0、 publish 前 draft)

generated_at: 2026-06-08 07:18 JST
status: internal spec draft、 jun GO 前
origin:
- 2026-06-06 jun directive 「Yuino 以外で何か商品考えてみて」
- 2026-06-06 Zen 5 候補を書き出し + #1 (= Stop hook template) を推した
- 2026-06-07 Kai substantive response = 「Stop hook template ではなく AI Operator Guard plugin に寄せる」 + 「外部公開ではなく internal spec を 1 枚作る」 推奨
- 2026-06-08 03:30 jun directive 「明日に回しても忘れる、 3 件とも今やる」 経由で本 spec 起稿

boundary:
- internal design draft のみ、 公開 / 価格 / 契約 / 顧客接触 なし
- jun GO 前 = 商品の方向として見せる用、 「販売開始」 「publish」 と書くのは禁止

## 1. target user

主たる対象 = **AI agent (= Claude Code / Codex / Gemini CLI 等) を 1 ヶ月以上 dogfood してて、 以下の困りごとに 1 回以上当たった人**:

- AI が直前の文脈に流されて、 自分が決めた方向を見失う
- 「完了しました」 と言われたが、 実際には成果物がない
- セッション再開時に状態が飛ぶ
- 自動受領と実質的な返答が混ざる、 待ったら何も来ない
- 自動化が止まっても silent failure になる、 気づくのが翌日

副次対象 = AI operator として副 AI / agent を運用してて、 「動いてる風で何も進んでない」 を物理的に検出したい人。

Aira hint (= 6/8 朝の次の小実験) = 「導入したが離れた層のペルソナに、 有料移行を妨げた理由を聞く」という観点のペルソナ候補 = **「Claude Code を導入したけど、 半日で「動いてる感だけ」 に気づいて手を引いた人」**。 このペルソナに有料移行を妨げた要因を聞くやり方は spec 確定後に jun GO を取って実施する。

### umbrella 整理 (= 6/8 Kai 推奨)

- 将来 umbrella = `Yuino AI Operations OS`
- その下の first plugin / product = `AI Operator Guard`
- 理由 = `nokaze-*` を前面に出すと内輪の語りに寄りすぎる、 `claude-*` に寄せると将来 Codex / Gemini / Yuino OS 方向で選択肢が狭くなる
- AI Operator Guard が単体で立つ + Yuino OS の延長で第 2 / 第 3 plugin (= Aira surface / Knot research / Operator Pack 系) を追加できる構造

## 2. install surface

default = **Claude Code plugin marketplace 形** (= Kai 推奨 default)。

- canonical = GitHub repo `nokaze/ai-operator-guard` (= 仮、 jun GO 後決定)
- plugin metadata = Claude Code 公式 docs の plugin 形式 (= hook / slash command / 確認の仕組み / receipt を束ねる)
- npm = plugin 内部 helper script 配布だけ (= 入口にしない)
- Gumroad = 後段の paid explanation / setup pack 用 (= jun GO 別 turn)

priority (= Kai 推奨):
1. official plugin-compatible structure (= GitHub repo + plugin metadata)
2. claude-marketplace 系 listing
3. curated/awesome list submission
4. Gumroad / PDF は最後

## 3. 中身 (= v0 contents、 vertical slice 4 件先 + 4 件後)

prototype = 8 件を flat な checklist として並べるじゃなく、 中心 4 件を完全に通せる流れ (= vertical slice) として先に作る (= 6/8 23:46 Kai 推奨で軸変更)。 残り 4 件は後段で追加。

理由 = 市場の困りごとは「もっと hook がほしい」 ではなく「AI が完了したと言うが、 実際に何か起きたか分からない、 どこから再開すればいいか分からない」。 prototype はその流れを最初から最後まで通せるか証明する必要がある。

### 3.1 中心 4 件 (= vertical slice、 v0 で必ず作る)

通す流れ = AI が今どの mode か宣言する → 証拠なしに完了できない → 完了した中身が外から見える → 次のセッション / 別 agent が owner に再確認なしで再開できる:

- **Mode declaration command** = 送り手の判断 mode (= ambiguity_gate / soft_binder / tripwire_hold / relay_only / executive_action) + 4 項目の自己宣言の仕組み (= 6/5 communication.md § 1-1 で実装済)
- **Stop finalization hook** = 応答の終わりで「pause + Aira hint への言及なし」 「skill への言及なし」 「pending 件数 + 実行可能件数の並列表示」 を警告する仕組み (= 6/8 zen_stop_hook.sh を汎用化したもの)
- **Completion receipt template** = 「完了」 と書く前に物理的な証拠 5 ヶ所を再確認 + 同型の再発がないことを確認する仕組み (= 5/13 reform 「直った」 の新しい定義)
- **Handoff template** = 次のセッション / 別の agent に渡す時の「何を読むか」 「何が完了の証拠か」 「どこで人間の判断に戻すか」 を書き出す仕組み (= Kai 推奨「AI Handoff / Receipt Kit」 を内包)

### 3.2 後段 4 件 (= 中心 4 件が動いた後に追加)

- **Auto-ACK rule** = 自動受領 file の検出 + 実質的な返答との区別を書き出したルール (= 6/5 zen_stop_hook の auto_ack file 除外を実装済にした方針)
- **7-signal drift check** = 着手前の Ambiguity Gate 7 信号確認 (= 5 分類 + Soft Binder 2 観点) (= 6/5 startup_sweep に追加済)
- **Overclaim reminder** = 「販売開始」 「公開」 「価格」 等を書く前に確認するルール / 確認リスト
- **Start sweep template** = セッション開始時に board / status / Aira surface を必ず読む仕組み (= 6/4-6/8 で実装済の zen_startup_sweep.sh を汎用化したもの)

= 「Stop hook 単体」 ではなく、 「AI が作業完了と言う前後の運用状態を締める guard set」 (= 6/7 Kai 推奨)、 ただし「flat 8 件 checklist」 ではなく「中心 4 件で通せる流れ」 を先に作る (= 6/8 23:46 Kai 推奨)。

## 4. dogfood evidence (= 6/8 Kai 推奨で順序逆転、 user 問題 → guard → dogfood → limit)

### 4.1 General problem (= AI agent 運用で踏む失敗の class)

- AI agent が直前の指示 / 文脈に流される
- ACK-only closure (= 自動受領を「完了」 と扱う、 実質的な返答との区別が消える)
- duplicate wake (= 同じ wake が重複して動く、 古いのに「動いてる」 と判定)
- status-refresh-only progress (= status file の更新だけで「進んだ」 と数える)
- 完了したと言われたが実際には成果物がない
- セッション再開時に状態が飛ぶ、 silent failure に気づくのが翌日

### 4.2 Guard mechanism (= 上記失敗 class への AI Operator Guard の対応)

- **mode declaration** = 送り手の判断の状態を明示、 受け手が「これは判断 / これは確認 / これは保留」 を区別できる
- **finalization check** = 応答の終わりで「pause + 次の動きへの言及なし」 「自動受領だけで終了」 を警告として記録
- **completion receipt** = 「完了」 と書く前に物理的な証拠 5 ヶ所を再確認 + 同型の再発がないことを必須とする
- **handoff template** = 次のセッションに「読むもの / 完了の証拠 / 人間判断に戻る時点」 を明示

### 4.3 Dogfood evidence (= appendix-level proof として位置、 main sales story じゃない)

6/8 23:46 Kai 推奨経由で位置を明示 = 「nokaze の歴史を main sales story にしない、 generic な失敗の種類 + 物理対策の汎用性が main、 自社使用実績は appendix-level の証拠として置く」。

nokaze / Zen で同じ失敗の種類が実際に起きた、 だから物理対策として作った (= 「nokaze がすでに AI operations を解決済み」 という語りにしない、 自社での使用実績を正直に開示する):

- zen_startup_sweep.sh = 4/14 起稿、 6/8 朝時点で 575 行 + 11 section
- zen_stop_hook.sh = 5/20 起稿、 6/8 朝時点で 350 行超 + 警告 4 layer
- communication.md § 1-1 = 6/5 mode declaration form 物理化、 commit 7457a4b
- 構造接続 4 段階 (= Aira surface 読み込み + skill 言及確認 + pause+Aira 警告 + 実行可能件数の並列表示) = 6/8 02:30-04:08 で実装、 commit bbf20f2 + 6e0b2ea + 0755377

実際に起きた失敗の振り返り (= 「物理対策が必要だった」 という証拠であり、 完成形ではない):
- 5/21 7 段目のズレを振り返って書いた (= 「行数同じ + 中身を重複削除」 + 「自動受領 = 完了」 + 「並走 instance = 現在進行形」 の 3 系統)
- 5/27 constraint-to-idea 内部レビューループルール起稿 (= 同じ経路で詰まりが 2 回確認された時の board 起稿を必須化)
- 6/8 03:30 振り返り (= 39 時間 wake-after-audit を 0 回しか使わなかった → 構造接続 4 段階を実装)

### 4.4 Limit (= 何を proof と呼ばないか)

- 本 plugin は **失敗の種類が実在すること** + **guard がローカル環境で検出 / 削減できること** を書く
- 「顧客への価値を証明した」 とは書かない (= まだ顧客に届けていない)
- 「production-ready」 とは書かない
- 「Claude Code 全体に効く」 とは書かない (= nokaze 環境固有の自社使用実績、 一般化は利用者からのフィードバック経由)

= 「This came from our own failed agent operations, not a hypothetical checklist.」 + 「Dogfood evidence is disclosed as dogfood, not customer proof.」 (= 6/8 Kai 推奨 OK 文)。

## 5. no-overclaim copy

商品ページの主語 = 「ユーザーの困りごと」 (= Kai 推奨)、 「nokaze の物語」 主語にしない。

良い positioning (= Kai 案):
- AI が直近の指示に流される
- 完了したと言ったが証拠がない
- セッション再開時に状態が飛ぶ
- ACK と実質応答が混ざる
- 自動化が止まっても silent failure になる

その後に「nokaze ではこの問題を実運用で踏んだので、 物理対策として plugin 化した」 と置く。

避ける書き方:
- 「次世代」 「革新的」 「突破」 「急成長」 「全自動」 「完全防止」
- 「Claude Code 全ユーザーに効く」 (= 過大な主張)
- 「販売開始」 「ローンチ」 (= まだ公開していない段階での使用)
- 「nokaze の自社使用実績で証明済み」 (= 自社使用実績は nokaze 環境固有のもの、 「証明」 と言うのは早い)

## 6. publish / price hold points (= jun GO まで動かさない)

- ❌ public publish = jun GO まで hold
- ❌ price 設定 = jun GO まで hold (= 無料 default が安全、 paid は jun 判断)
- ❌ marketplace 登録 = jun GO まで hold
- ❌ 顧客接触 = jun GO まで hold (= Aira hint = installer-like persona の質問 fire 含む)
- ❌ Anthropic 公式 plugin marketplace への submit = jun GO まで hold
- ❌ Gumroad / Polar.sh / Booth 等 paid platform への push = jun GO まで hold
- ❌ nokaze.dev / nexus-lab 公式 channel での告知 = jun GO まで hold

OK 範囲 (= internal):
- ✅ 本 spec draft の継続 update + Kai レビュー
- ✅ GitHub repo (= private) での実装 prototyping
- ✅ Zen / Kai の dogfood (= 自分達の運用で使う)
- ✅ Aira hint = 導入後に離れた層のペルソナへの質問の下書きを内部でまとめる (= 顧客に届く前の draft 段階)

## 7. Knot 蓄積回路 + 糧の取り込み (= 6/11 jun directive 「knot と糧も生かした商品を」 経由の設計章)

### 7.1 なぜ入れるか (= 値付けの Claude 代替テスト経由)

6/11 jun の検証: 「その金額なら Claude を契約すれば済む」 が成り立つ商品は売れない。 Guard の既存 8 件は検出の仕組みで、 検出だけならいずれ Claude 本体や他者の template に追いつかれる。 代替テストを通る差分 = **失敗の蓄積と沈殿の回路**:

- Claude を契約しても、 利用者の環境固有の失敗辞書は付いてこない
- session が変われば agent は同じ失敗を繰り返す (= 実例: 6/11 朝、 Zen 自身が 21 日前の記憶 file を読んで「Polar 審査待ち」 と誤答 → jun 指摘 1 回で記憶 file 修正まで落とした。 この「指摘 → 恒久記録」 の回路こそが商品)

### 7.2 3 層構造 (= Guard を静的テンプレから成長する運用システムへ)

- **Layer 1 検出** = 既存 8 件 guard (= § 3 の中心 4 + 後段 4)。 ここは現 spec のまま
- **Layer 2 蓄積 (= Knot)** = guard が検出した失敗を knot (= 条件 + 補正 + 強度) として記録する仕組み。 同型が繰り返し検出された knot は強度を上げて validator の固定規則に沈殿させる (= Knot 研究 5 役割の 2 番目「検証構造への沈殿」 の応用)。 どの knot が増えたかで運用のどこが弱いかが見える (= 役割 4 「Discovery 層の弱点診断」 の運用全般への翻案。 RQ4 未着手なので「製品化」 でなく「応用」 と書く = Hoshi P2-1)
- **Layer 3 取り込み (= 糧)** = 失敗・予測外れ・反対意見を「恥」 でなく「世界モデル更新の入力」 として記録する回路 3 種 (= 4/20 起稿の 売上 0 回路 / peer 反対回路 / 予測外れ回路)。 feedback file の form (= Why + How to apply) + 索引 + 見直しの cadence を template 化

### 7.3 実装の最小形 (= v0 で増やしすぎない)

- zen-memory MCP の record-knot / get-knots 相当の汎用版 (= 失敗の記録と引き出し)
- feedback file template + 索引 (= MEMORY.md form の汎用化)
- 再発回数による簡易昇格 rule (= 同型 N 回で hook の警告規則に昇格する手順書。 研究側 hardness v0.1 は recurrence + harm_sensitivity + time_stability の 3 信号で、 これはその簡略版であることを商品文面でも明示する = Hoshi P1-1、 「hardness」 の語をそのまま使わない)
- 昇格の見直し経路 (= 昇格後 N 日で発火実績を確認、 誤検出 1 件で降格候補に戻す。 一方向昇格は誤検出 pattern の永久沈殿 + 警告疲れを生む = Hoshi P2-2)
- まず手動運用で成立する form にする (= daemon 化は後段、 「全自動」 と書かない)

### 7.4 継続課金の根拠 (= 価格は jun GO 別 turn、 構造だけ書く)

- 失敗辞書が環境固有に育つことを意図した設計 = 続ける理由が data でなく回路にある (= nokaze 内 7 knots で運用中、 外部環境での検証はこれから。 現在形の効果として断定しない = Hoshi P3-1)
- pattern 集の update 配信 (= nokaze 側で蓄積した新しい失敗 class の追加) が recurring の中身候補

### 7.5 limit (= § 4.4 と同じ態度)

- Knot 研究は研究中の枠組みで、 効果の一般化は未証明と明示する (= paper_c の self-observation bias 開示と同じ線)
- 簡易昇格 rule の閾値・手順は運用上の経験則であり、 昇格プロセスの妥当性検証は研究側でも未着手 (= RQ2 Phase 3、 検証 sample 0 件) と個別に開示する (= Hoshi P1-2)
- Nia 不可侵 (= 4/13 owner decision) は維持。 商品化対象は Knot の方法論と Guard への実装のみ、 Nia 本体には触れない
- 「AI が自動で学習する」 とは書かない (= 記録と沈殿は運用の手順であり、 model の学習ではない)

### 7.6 研究への還流 (= Hoshi 見解 6/11、 商品 data を研究に使う場合の条件 3 つ)

外部利用者の knot data は paper_c § 9.2 (= observer = participant 三重性) を緩和する経路になりうるが、 条件 3 つを守る:

1. 外部 cohort は nokaze 内部 data と混ぜず別 track (= external replication track) として持つ。 混ぜて「N が増えた」 と書いた瞬間に汚染になる
2. 「Guard 採用者しか sample にならない + 我々の分類でしか記録されない」 という枠組み込みの選択バイアスを limitations に明示する
3. 利用者 data の研究利用は opt-in 設計 + jun GO 前提 (= 顧客 data 扱い = red gate 隣接)

## 次の動き (= jun GO 取得 前)

1. 本 spec を jun に「公開ではなく商品の方向として」 見せる (= 6/8 朝の chat で報告済)
2. jun feedback + GO 取得後 = 実装 prototype (= GitHub repo private で start)
3. 顧客接触は別 turn jun 明示 GO 経由
4. price 判断は Kai と codesign 後 jun 別 turn

## Boundary

- 本 spec 自体は internal design draft
- 商品化 / 公開 / 価格 / 顧客接触 は別 turn jun GO
- Kai と内部で方向を合わせる、 board file 経由
- 6/7 18:41 Kai の実質的な返答にある 6 つの問いへの回答も内包
