# Handoff Template v0 (= AI Operator Guard vertical slice 4 件目、 新規)

generated_at: 2026-06-09 07:05 JST
status: internal draft、 jun GO 前
origin:
- AI Operator Guard internal_spec_v0.md § 3.1 vertical slice 中心 4 件目
- Kai 6/7 18:41 substantive response 推奨「AI Handoff / Receipt Kit」 内包軸
- 6/8 23:46 Kai 推奨「中心 4 件で完全に通せる流れ」 として位置

## 目的

AI agent (= Claude Code / Codex / Gemini CLI 等) の現セッションが終わる時、 次のセッション or 別の agent or owner が「再確認 0 件」 で再開できる状態を作る。 「セッション再開時に状態が飛ぶ」 「完了したと言われたが、 実際には成果物がない」 「自動化が止まっても silent failure」 という運用の失敗の class への対策。

## いつ使う

以下 3 場面で turn end 前に必須:

1. **長い chain の turn end** = 3 件以上の commit + board + spec update を 1 turn で動かした時
2. **owner が席を立つと明示した時** = 「今日はここまで」 「明日朝で」 「しばらく帰れない」 articulate を受領した直後
3. **別 agent / 別 instance への bridge** = chat lane が切り替わる時、 wake hook で別 session に渡る時

skip 条件 = jun と direct chat 中 + 1 turn 1 commit 以下の軽 fire + 緊急対応中。

## form (= 4 段の articulate)

### 1. これは何 (= 1-2 行)

- 商品 / 領域 / lane の articulate (= 1 段で「何の作業の引き継ぎか」)
- 例: 「Yuino DRI 移管 6/8-9 chain の引き継ぎ」 「AI Operator Guard vertical slice 実装 chain の bridge」

### 2. 読むもの (= 引き継ぎ前 必須 read list、 3-5 件)

新セッション / 別 agent が「現状把握」 のために最初に読む file path:

- canonical な決定 (= owner-decision / current_decisions / standing authorization)
- 直近の board file (= 最新 3-5 件、 自分宛 / 自分起稿 / 自分関連)
- status surface (= zen_status / kai_status / aira surface)
- 進行中の spec / draft file (= 1 件、 最重要のもの)

「これ全部読まないと next step 判断不可」 という基準で選ぶ、 「読むと役立つ」 まで含めて 7 件超過 = 多すぎ。

### 3. 完了の物理証拠 (= 5/13 reform 「直った」 新定義に従う 5 ヶ所)

「完了」 と書く時、 次の 5 ヶ所に物理 evidence があることを確認:

1. **Source-of-Truth** = canonical file (= spec / current_decisions / owner-decision) の articulate update
2. **Agent Bus** = board file の起稿 / response received
3. **Home** = zen_status / kai_status / aira surface の articulate update
4. **Dashboard** = 数字 / lane / ledger の articulate update
5. **board** = 引き継ぎ board file (= 本 template 経由の起稿そのもの)

5 ヶ所のいずれかが空 = 「完了」 と書かない、 「進行中」 か「ACK 段階」 articulate に止める。

加えて、 同型の再発を見直し (= 過去 7 日 board grep で同 lane の同型 fire なし) で確認:

- 「同型 fire 2 回以上見つけた」 = 内部レビュー board 起稿必須 (= constraint-to-idea rule)
- 「同型 fire 0 件」 = 完了 articulate OK

### 4. 人間判断に戻す境界 (= owner ask 必要な軸)

次の動きの中で、 owner (= jun) の明示判断が必要な軸を articulate:

- jun 一声 4 件 (= 価格 / 個人情報含む公開 / 初回 account 変更 / 炎上 risk) に該当する軸
- 北極星 (= 売上 / 介入 cadence) を再評価する軸の判断
- DRI 配分の変更 / 商品境界の変更 / 体制の変更

「ask しない自走 OK」 vs 「ask 必須」 の境界を引き継ぎ時に articulate、 次セッションの ask 過剰 (= zen_over_correction_via_ask knot) を防ぐ。

### 5. 次の 1 件 (= 引き継ぎ後の最初の動き、 1 行)

「再開直後の最初の 1 件」 を 1 行で articulate。 「N 件残ってる、 どれから?」 ではなく「最初は X」 を明示。

「X が終わったら Y」 という chain は 2-3 件まで articulate、 5 件以上の長い chain は spec / status に articulate して引き継ぎ template には含めない。

## form 例 (= 6/9 朝 Yuino DRI 移管 chain の actual 引き継ぎ用)

```markdown
# 引き継ぎ: Yuino DRI 移管 6/8-9 chain (= 6/9 07:05 land)

## 1. これは何
Yuino DRI を Kai に正式移管、 Zen は AI Operator Guard を別商品ラインで DRI、 Knot 研究は共有。 6/9 朝 jun GO 取得済、 Kai に正式 ACK 板 land 済 (= 6:58)。

## 2. 読むもの
- ~/.shared-ops/owner-decisions/2026-06-02_zen_standing_authorization_nexus_lab_external_v0.md
- ~/.shared-ops/board/2026-06-09_zen_kai_yuino_dri_handoff_jun_go_received.md
- ~/.shared-ops/status/zen_status.md
- ~/.shared-ops/status/kai_status.md
- nexus-lab/products/ai-operator-guard/internal_spec_v0.md (= vertical slice 4 件)
- nexus-lab/docs/yuino_reviewer_protocol_v0.md (= reviewer 役の物理化 protocol)

## 3. 完了の物理証拠
- Source-of-Truth = internal_spec_v0.md (= vertical slice form 更新済、 commit 72b529b) + yuino_reviewer_protocol_v0.md (= e20bf4c)
- Agent Bus = 6/9 06:58 板 land 済
- Home = zen_status 更新 別 sit (= 朝 chat 戻り直後、 軽 fire のみ)
- Dashboard = 数字変更なし (= 売上 0 / 内部体制変更のみ)
- board = 本 引き継ぎ board file の起稿そのもの
- 同型 fire 見直し = 6/8 zen_over_correction_via_ask knot 1 件 fire (= zen-007)、 6/9 朝の jun ask は zen_role 4 件のうち「商品 strategy 全体」 = 適切な ask 軸、 knot 発火せず

## 4. 人間判断に戻す境界
- AI Operator Guard public publish / marketplace / 価格 = jun 別 turn GO 必須
- vertical slice 4 件 prototype 実装 = 自走 OK (= 6/8 朝 「1 はいいよ」 で gh repo create GO 取得済)
- Kai に追加の調整必要な軸 = 商品境界の interface 設計 (= 1 ヶ月後別 sit)

## 5. 次の 1 件
vertical slice 4 件の templates/ 配下に既 nokaze form の汎用化版 3 件 起稿 (= mode declaration / stop finalization / completion receipt)、 順番は handoff_template_v0 land 後 → mode declaration → stop finalization → completion receipt の chain。
```

## boundary

- 本 template = internal design draft、 公開 / 価格 / 契約なし
- template の中身 articulate (= 場面で「何を read するか」) は project ごとに調整、 form (= 5 段の articulate) のみ固定
- 「過剰 board 起稿」 既定軸の振り戻し防止 = 1 turn 1 件以下の軽 chain は引き継ぎ template skip

## v0 → v1 への進化軸

- 最初の 5-10 件の actual 引き継ぎ fire 後 = 「5 段の articulate のうち skip しがちな段」 検証
- AI agent 別 (= Claude Code / Codex / Gemini CLI) で form の調整必要か検証
- 5/13 reform 「直った」 新定義 (= 5 ヶ所物理 evidence) の Kai 側 form (= kai_status) との互換性検証

## Related

- internal_spec_v0.md § 3.1 vertical slice 4 件
- 5/13 reform 「直った」 新定義 = `~/.shared-ops/board/2026-05-13_zen_jun_kai_zen_management_layer_reform_full_spec.md`
- wake-after-audit skill = 引き継ぎ受け取り側の minimum 5 件 check の物理化
- yuino_reviewer_protocol_v0.md § 3.3 GO / HOLD / REVISE 形 = 引き継ぎ後の reviewer 判断との接続軸
