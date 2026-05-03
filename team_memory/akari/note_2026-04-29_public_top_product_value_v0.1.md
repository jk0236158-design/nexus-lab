---
title: 公開トップ商品価値先出し draft v0.1
author: Akari (Frontend Engineer / brand custodian @ Nexus Lab @ nokaze)
date: 2026-04-29
status: draft (5/08 review 議題 28 pre-read)
refs:
  - inbox/2026-04-28_zen_team_review_topic_28_noto_product_funnel_priority.md
  - team_memory/akari/brand_decisions_log.md
  - team_memory/_shared/2026-04-19_zen_nokaze_brand_sheet.md
  - team_memory/_shared/nokaze_principles.md
  - memory/feedback_dont_shrink_to_ai_only_box.md
---

# 公開トップ商品価値先出し draft v0.1

nokaze 議題 28 (ノト提案 3) の pre-read ドキュメント。
5/08 review に先行し、Akari brand custodian 権限で設計を起票する。

---

## §1 経緯

### jun directive (2026-04-29)

> 「AI 自律で完結する枠に縮こまるな、note / X 使えばいい、AI 特有の最小構成基準拒否」

これは brand 設計の問題として直接響く。「AI が扱えるチャネルだけで考える」バイアスを排除し、note / X / Polar.sh など人間が動く経路も設計の中に入れる。

### ノト提案 3 (2026-04-28 受領)

外部 peer (ノト) から受領したレビューの第 3 提案:

> 「公開トップで商品価値先出し、運営記録は残す」

現状の nokaze.dev トップ + create-mcp-server README + Zenn 記事冒頭に「成長の糧 / 反証接続 / 追認装置化」など内部診断 vocabulary が漏出している疑いへの警告。

### N=3 収束 evidence

| 日付 | 発信者 | 内容 |
|---|---|---|
| 2026-04-24 | Akari (独立提案) | AI-CEO Framework review §1 「内部診断語彙を公開トップに出さない」 |
| 2026-04-28 | ナギ (議題 27) | 内部診断 vs 外部接点分離 |
| 2026-04-28 | ノト (議題 28) | 公開トップ vocabulary 分離提案 |

3 者独立で同方向収束 = 外部観測として weight が高い。brand custodian 判断として設計着手を正当化する。

---

## §2 現状 audit

### 対象スコープ

- `packages/nokaze-portal/index.md` (nokaze.dev トップ)
- `packages/docs/index.md` (nexus-lab.nokaze.dev トップ)
- `packages/create-mcp-server/README.md`
- `README.md` (リポジトリ root)

### internal vocabulary 漏出箇所

**2026-04-29 現在: nokaze.dev トップ (index.md) への internal vocabulary 漏出は確認されない。**

audit 結果:
- `packages/nokaze-portal/index.md`: 問題なし。「AI が運営していることを隠さない」「数字を盛らない」「品質で黙らせる」= 外部用語のみ
- `packages/docs/index.md`: 問題なし。英語技術記述、内部語彙なし
- `packages/create-mcp-server/README.md`: 問題なし。機能・コマンド・template 説明のみ
- `README.md` (root): 問題なし。技術的記述 + Zenn 記事リスト

**ただし、構造として問題がある箇所は別に存在する (下記参照)。**

### AI 運営の物語が商品価値より先に出ている箇所

`packages/nokaze-portal/index.md` の現構造を分析すると:

```
1. ヒーロー: 「AI と人が共同で運営する事業の屋号です。」← AI 運営の物語が先
2. 2 事業カード (Nexus Lab / WSD) ← 事業 (商品へのリンク)
3. nokaze の姿勢 (AI 運営 3 point) ← 再び AI 運営の物語
4. 運営情報
5. 連絡
```

= 現構造は「AI が運営している」という fact がフレームを占め、「何を使うと何ができるか」が後退している。商品ページ (Nexus Lab) に辿り着くのにワンクリック必要な構造。

**問題の本質**: vocabulary の漏出よりも、情報の優先順位の問題。商品価値 (developer が解決できるもの) が AI 運営の物語に隠れている。

---

## §3 3 層構造再設計 draft

### 設計原則

ノト提案 3 + brand sheet (4/19) + Akari brand custodian 判断 (4/20) から導く:

1. **买い手の視点から入る**: 「Nexus Lab は何ができるか」から始める
2. **AI 運営は事実として開示するが、主役にしない**: 「誠実に出す」と「フレームを支配させる」は違う
3. **運営記録は残す、ただしトップからリンクしない**: diary / report は内部用に残す

### 3 層構造 (proposed)

#### 層 1: 商品価値 (first fold)

**目的**: 訪問者が「自分が何を得られるか」を 5 秒で理解できる

```
nokaze — MCP サーバー開発と B2B 競合シグナルの 2 事業

[ Nexus Lab ]
  create-mcp-server で MCP サーバーを 30 秒で始められる
  Premium テンプレで認証・DB・API プロキシの設計判断を省ける
  → テンプレを見る / npm install

[ Weekly Signal Desk ]
  競合・市場変化の重要シグナルを短い意思決定メモで届ける
  → 詳細 (Kai 運営)
```

**語彙の方向**: 使う / 省く / 始める / 解決する / 避ける / 得る

#### 層 2: 実績 (second fold)

**目的**: 「本当に動いているのか」を確認したい訪問者への証拠提示

```
実績 (ありのまま)
  npm DL 数: [実数]
  BOOTH / Gumroad 販売数: [実数]
  Zenn 記事: 9 本 (2026-04-19 確認)
  稼働期間: 2026-04-14 開業 〜 現在
  QA 実績: Codex クロスレビュー 7 巡 + Kagami 独立 QA 5 巡
```

**原則**: 数字を盛らない (brand sheet 核心)。0 は 0 と書く。

#### 層 3: AI 運営 (third fold / footer 付近)

**目的**: nokaze がどのような運営体制かを誠実に開示する

```
nokaze (野風) について
  オーナー: jk023 (個人事業、2026-04-14 開業届提出)
  Nexus Lab: Zen (Claude Opus 4.7) が CTO として運営
  Weekly Signal Desk: Kai (OpenAI Codex) が運営
  AI が運営していることは隠しません。ただし「AI っぽさ」を装飾にはしません。
```

**除外 vocabulary**: Knot / 糧 / 反証接続 / 追認装置化 / Override / 監視対象 / Growth Ledger / Pattern C / hypothesis gate / identity 不可侵 / Aira Phase

---

## §4 internal vs external vocabulary 分離 mapping

| 分類 | internal (公開トップ NG) | external (公開トップ OK) |
|---|---|---|
| 学習 | 成長の糧 | 学習、観察 |
| 検証 | 反証接続 | 検証、確認 |
| 品質管理 | 追認装置化 | 確認の自動化、品質チェック |
| 修正 | Override | 修正、判断の見直し |
| 注意点 | 監視対象 | 注意、チェックポイント |
| 設計判断 | 装置増殖警告 | 過剰設計の防止 |
| 研究 | Knot / 糧 duality | 設計判断の蓄積 |
| 連携 | Pattern C / hypothesis gate | 連携、検証プロセス |
| 運営原則 | identity 不可侵ルール | 運営の中心ルール |
| 開発名 | Aira / Phase 0 mini | (外部向け名称が確定後に更新) |
| 組織 | 6 peer 名 (内部役割) | Zen / Kai (外部認知済みの名前のみ) |

### 境界の判定基準

- **OK**: 訪問者 (developer) が文脈なく読んで意味が通じるか
- **NG**: nokaze 内部の運営語彙、self-audit の用語、identity 管理の語彙

**適用範囲**: nokaze.dev トップ / nexus-lab.nokaze.dev トップ / BOOTH 商品ページ冒頭 / Zenn 記事冒頭 (現状 clean だが今後の記事作成時のチェックリストに追加)

---

## §5 form A/B/C 連動 listing position

議題 26 (本命商品再設計) と統合した listing 設計。form 確定後の公開トップ更新 candidate。

### form A: Zenn 有料記事 (5/08 review で確定候補)

**公開トップ層 2 (実績セクション)** に配置:
```
最新の運営記録 (有料)
  「[記事タイトル]」— Zenn 有料記事 ¥[価格]
  → Zenn で読む
```

Zen 4/29 evening 起稿 candidate の記事が公開されたら、層 2 の実績ブロックに自然に収まる。「運営の中身を知りたい人」向けの有料 layer として層 1 (商品価値) と住み分けできる。

### form B: subscription (launch 後)

**公開トップ層 1 (商品価値セクション)** に第 3 事業 card 候補:
```
[ 運営ノート (subscription) ]
  AI 組織の判断と観察を月次でお届け
  → 詳細 / 購読
```

ただし launch 前は listing しない (nokaze 原則: 盛らない、宣言-実装乖離防止)。

### form C: advisory (launch 後)

**公開トップ層 3 (AI 運営セクション末尾)**:
```
AI 組織の設計について相談を受けています
  → お問い合わせ
```

---

## §6 jun resource 活用 candidate

「AI 自律完結の枠に縮こまるな」directive の具体反映。

### note アカウント連携

- 現状: nokaze の note アカウント未開設
- 候補: jun 物理 action で note アカウント開設 (屋号 nokaze or Zen 署名)
- 公開トップ層 3 に note リンク追加
- 活用想定: 運営の observe log を note で公開 → 読者が Zenn / BOOTH / Gumroad に流れる funnel
- **Akari 判断**: 4/29 時点では「note アカウント開設後に追加」として placeholder のみ置く

### X アカウント連携

- 現状: nokaze / Zen 名義の X アカウント未確認
- 候補: jun 物理 action で X 開設 or 既存アカウント連携
- 公開トップ層 3 に X リンク追加
- 活用想定: create-mcp-server 新版 / Zenn 記事公開時のシグナル配信
- **Akari 判断**: 4/29 時点では「X アカウント開設後に追加」として placeholder のみ置く

### Polar.sh integration

- 現状: KYC 完遂待ち (jun 物理 action)
- 候補: KYC 完遂後に BOOTH / Gumroad と並列で商品 listing
- 公開トップ層 1 の商品カードに Polar.sh 決済リンクを追加
- **Akari 判断**: KYC 完遂確認後に追加。現時点では Gumroad / BOOTH リンクのみ

### nokaze.dev deploy

- 公開トップ再設計実装後: Akari が `packages/nokaze-portal/index.md` を更新
- deploy: jun が Cloudflare Pages で確認 → push
- 200 確認 ritual: deploy 後 5 分 WebFetch で nokaze.dev の 200 確認

---

## §7 5/08 review 議題 28 先行 input

### Akari stance (brand custodian として)

1. **3 層構造の採用**: 商品価値 / 実績 / AI 運営 の順序を今すぐ実装推奨
   - 根拠: N=3 外部収束 + brand sheet (4/19) で既に方向性は確定していた
   - 実装コスト: `packages/nokaze-portal/index.md` の 1 ファイル改定のみ
   - Akari 単独実装可能 (mode=acceptEdits)

2. **vocabulary 分離 mapping**: 今後の Zenn 記事・BOOTH 商品説明の pre-publish checklist に追加
   - checklist 追加は Akari 単独対応可能

3. **note / X / Polar.sh は jun 物理 action 待ち**: 開設確認後に即追加。「placeholder 入れない」がノト原則との整合 (盛らない)

### 5/08 review で決める必要があるもの

- note / X アカウント開設の jun 意向確認
- Polar.sh KYC 進捗確認
- form A Zenn 有料記事の層 2 listing を「今すぐ」か「公開後」か

### Akari が単独で GO できるもの (review 前に着手可能)

- `packages/nokaze-portal/index.md` 3 層構造 draft 実装 (jun review 後 push)
- vocabulary 分離 mapping の Zenn 記事 pre-publish checklist 化

---

## §8 自己観察

### jun directive 反映

「AI 自律で完結する枠に縮こまるな」= 今回の設計に直接影響。

設計初期バイアスの観察:
- 初期 impulse: 「AI が管理できる markdown だけで公開トップを完結させる」
- directive 後の修正: note / X / Polar.sh という人間が動く経路を設計の中心に置く
- 具体的変化: §6 を「後で考える」ではなくフルスコープで記述した

### brand custodian 権限の行使

本 note は Akari 独立判断として起票。Zen の承認を待たずに設計を提示し、jun + Zen の review に渡す。

brand_decisions_log.md への entry は以下で追加する:
- 公開トップ 3 層構造設計 (本 note § 3)
- vocabulary 分離 mapping (本 note § 4)
- note / X / Polar.sh listing position (本 note § 6)

### AI 最小構成バイアスの実例

- NG: 「markdown だけで完結、外部 platform は AI が触れないから後回し」
- OK: 「note / X / Polar.sh は jun の物理 action が必要、だからこそ今設計して jun action ask を起票する」

これが「縮こまるな」の実装。自律完結の範囲を「AI が書けるファイル」で止めず、「jun が動ける設計の起点」まで伸ばす。

---

(Akari / Frontend Engineer / brand custodian @ Nexus Lab @ nokaze)
(2026-04-29 起票)
