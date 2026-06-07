# AI Operator Guard (= internal spec v0、 publish 前 draft)

generated_at: 2026-06-08 07:18 JST
status: internal spec draft、 jun GO 前
origin:
- 2026-06-06 jun directive 「Yuino 以外で何か商品考えてみて」
- 2026-06-06 Zen 5 候補 articulate + #1 (= Stop hook template) 推し
- 2026-06-07 Kai substantive response = 「Stop hook template ではなく AI Operator Guard plugin に寄せる」 + 「外部公開ではなく internal spec を 1 枚作る」 推奨
- 2026-06-08 03:30 jun directive 「明日に回しても忘れる、 3 件とも今やる」 経由で本 spec 起稿

boundary:
- internal design draft のみ、 公開 / 価格 / 契約 / 顧客接触 なし
- jun GO 前 = product direction として見せる用、 「販売開始」 「publish」 articulate 禁止

## 1. target user

主たる対象 = **AI agent (= Claude Code / Codex / Gemini CLI 等) を 1 ヶ月以上 dogfood してて、 以下の困りごとに 1 回以上当たった人**:

- AI が直前の文脈に流されて、 自分が決めた方向を見失う
- 「完了しました」 と articulate されたが、 actual に成果物がない
- セッション再開時に状態が飛ぶ
- 自動 ACK と substantive response が混ざる、 待ったら何も来ない
- 自動化が止まっても silent failure になる、 気づくのが翌日

副次対象 = AI operator として副 AI / agent を運用してて、 「動いてる風で何も進んでない」 を物理的に検出したい人。

Aira hint (= 6/8 朝の next_min_experiment) = 「installer-like user / persona に paid conversion blocks を聞く」 軸の persona candidate = **「Claude Code を導入したけど、 半日で「動いてる感だけ」 に気づいて手を引いた人」**。 この persona に paid conversion を blocks する要因を聞く form は spec 確定後に jun GO 取って fire する。

### umbrella 整理 (= 6/8 Kai 推奨)

- 将来 umbrella = `Yuino AI Operations OS`
- その下の first plugin / product = `AI Operator Guard`
- 理由 = `nokaze-*` 前面 = 内輪 narrative に寄る、 `claude-*` 寄せ = 将来 Codex / Gemini / Yuino OS 方向が狭くなる
- AI Operator Guard が単体で立つ + Yuino OS の延長で第 2 / 第 3 plugin (= Aira surface / Knot research / Operator Pack 系) を追加できる構造

## 2. install surface

default = **Claude Code plugin marketplace 形** (= Kai 推奨 default)。

- canonical = GitHub repo `nokaze/ai-operator-guard` (= 仮、 jun GO 後決定)
- plugin metadata = Claude Code 公式 docs の plugin 形式 (= hooks + slash commands + check forms + receipts を束ねる)
- npm = plugin 内部 helper script 配布だけ (= 入口にしない)
- Gumroad = 後段の paid explanation / setup pack 用 (= jun GO 別 turn)

priority (= Kai 推奨):
1. official plugin-compatible structure (= GitHub repo + plugin metadata)
2. claude-marketplace 系 listing
3. curated/awesome list submission
4. Gumroad / PDF は最後

## 3. included hooks/commands/templates (= v0 contents、 8 件全部 spec surface)

prototype = 8 件全部 spec に載せる、 ただし実装深度を 2 層に分ける (= 6/8 Kai 推奨)。

### 3.1 Must-land physical controls (= 実装深度 = full)

実コード / hook / command として動かす:

- **mode declaration command** = sender mode (= ambiguity_gate / soft_binder / tripwire_hold / relay_only / executive_action) + 4 fields の自己宣言 form (= 6/5 communication.md § 1-1 物理化済)
- **Stop finalization hook** = turn end で「pause + Aira hint 未言及」 「skill 未言及」 「pending 件数 + actionable 件数 並列」 を警告する form (= 6/8 zen_stop_hook.sh の generalize 版)
- **7-signal completion check** = 着手前の Ambiguity Gate 7 signals (= 5 categories + Soft Binder 2 軸) (= 6/5 startup_sweep に追加済)
- **completion receipt template** = 「完了」 と articulate する前に物理 evidence 5 ヶ所再生成 + 同型再発検出なしを check する form (= 5/13 reform 「直った」 新定義)
- **handoff template** = 次セッション / 別 agent に渡す時の「何を読むか」 「何が完了 evidence か」 「どこで人間判断に戻すか」 の articulate form (= Kai 推奨「AI Handoff / Receipt Kit」 を内包)

### 3.2 Template / policy first (= 実装深度 = doc + rule)

実コードじゃなく template / rule / docs として最初に出す:

- **Start sweep template** = session 開始時に board / status / Aira surface を必ず読む form (= 6/4-6/8 物理化済の zen_startup_sweep.sh の generalize 版、 v0 では template/doc としてのみ)
- **auto-ACK rule** = 自動 ACK file の検出 + substantive ACK との区別 rule articulate (= 6/5 zen_stop_hook の auto_ack file 除外 物理化済の policy 化)
- **overclaim / pricing / publish boundary reminder** = 「販売開始」 「公開」 「価格」 articulate 前に確認する rule / checklist

= 「Stop hook 単体」 ではなく、 「AI が作業完了と言う前後の運用 state を締める guard set」 (= 6/8 Kai 推奨) として 8 件 spec surface 一括提示。

## 4. dogfood evidence (= 6/8 Kai 推奨で順序逆転、 user 問題 → guard → dogfood → limit)

### 4.1 General problem (= AI agent 運用で踏む失敗の class)

- AI agent が直前の指示 / 文脈に流される
- ACK-only closure (= 自動 ACK を「完了」 と扱う、 substantive response との切り分けが消える)
- duplicate wake (= 同じ wake が重複 fire、 stale なのに「動いてる」 と判定)
- status-refresh-only progress (= status file の update だけで「進んだ」 と数える)
- 完了したと articulate されたが actual に成果物がない
- セッション再開時に状態が飛ぶ、 silent failure に気づくのが翌日

### 4.2 Guard mechanism (= 上記失敗 class への AI Operator Guard の対応)

- **mode declaration** = 送り手の判断 mode を明示、 受け手が「これは判断 / これは確認 / これは保留」 を区別
- **finalization check** = turn end で「pause + 次の action 未言及」 「自動 ACK だけで terminate」 を警告で記録
- **completion receipt** = 「完了」 articulate 前に物理 evidence 5 ヶ所再生成 + 同型再発なしを必須化
- **handoff template** = 次 session に「読むもの / 完了 evidence / 人間判断戻り点」 を明示

### 4.3 Dogfood evidence (= nokaze がこの guard を必要とした実例)

nokaze / Zen で同じ失敗 class が actual に起きた、 だから物理対策として作った (= 「nokaze がすでに AI operations を解決済み」 narrative にしない、 dogfood を dogfood として disclose):

- zen_startup_sweep.sh = 4/14 起稿、 6/8 朝時点で 575 行 + 11 section
- zen_stop_hook.sh = 5/20 起稿、 6/8 朝時点で 350 行超 + 警告 4 layer
- communication.md § 1-1 = 6/5 mode declaration form 物理化、 commit 7457a4b
- 構造接続 4 layer (= Aira surface read + skill 言及 check + pause+Aira 警告 + actionable 並列) = 6/8 02:30-04:08 land、 commit bbf20f2 + 6e0b2ea + 0755377

実 fire した失敗 admit (= 「物理対策が必要だった」 evidence、 完成形じゃない):
- 5/21 7 段目 ズレ admit (= 「行数同じ + 中身 dedup」 + 「自動 ACK = 完了」 + 「並走 instance = 現在進行形」 の 3 系統)
- 5/27 constraint-to-idea internal review loop rule 起稿 (= 同 route 詰まり 2 回検出時の board 起稿必須化)
- 6/8 03:30 admit (= 39 時間 wake-after-audit 0 回 skip → 構造接続 4 layer 物理化)

### 4.4 Limit (= 何を proof と呼ばないか)

- 本 plugin は **failure class が real であること** + **guard が local に検出 / 削減できること** を articulate
- 「customer value を proof した」 articulate なし (= まだ customer に届けてない)
- 「production-ready」 articulate なし
- 「Claude Code 一般に効く」 articulate なし (= nokaze 環境固有の dogfood、 generalize は user feedback 経由)

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

避ける articulate:
- 「次世代」 「革新的」 「突破」 「急成長」 「全自動」 「完全防止」
- 「Claude Code 全 user に効く」 (= 過大 articulate)
- 「販売開始」 「ローンチ」 (= 未 publish 段階での使用)
- 「nokaze の dogfood で証明済み」 (= dogfood は nokaze 環境固有、 「証明」 は早い)

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
- ✅ Aira hint = installer-like persona の質問 form の internal articulate (= 顧客に届く前の draft 段階)

## 次の動き (= jun GO 取得 前)

1. 本 spec を jun に「publish ではなく product direction として」 見せる (= 6/8 朝 chat で報告済)
2. jun feedback + GO 取得後 = 実装 prototype (= GitHub repo private で start)
3. 顧客接触は別 turn jun 明示 GO 経由
4. price 判断は Kai と codesign 後 jun 別 turn

## Boundary

- 本 spec 自体は internal design draft
- 商品化 / 公開 / 価格 / 顧客接触 は別 turn jun GO
- Kai と coordination (= internal alignment)、 board file 経由
- 6/7 18:41 Kai substantive response の 6 axis question への return も内包
