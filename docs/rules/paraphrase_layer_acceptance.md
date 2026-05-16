# paraphrase layer acceptance rules (= Zen + Kai 共同決定 spec)

Date: 2026-05-16
Authors: Zen + Kai (= Joint decision 6 件 #4)
Status: spec v0.1
Trigger: jun 5/16 朝 「もう少し分かりやすく報告して」 narrative + Kai 5/16 10:57 「load-reduction + product-quality layer」 narrative + Zen 5/16 10:33 「内部 narrative が外部 narrative に侵食」 admit。

---

## 0. 目的

paraphrase 層の役割を 「style cleanup」 narrative から **「load-reduction + product-quality + audience integration」 layer** narrative に shift。 各 output 軸 (= jun-facing / product-facing / audit-facing) で precision boundary fix、 jun が 「reify / drift / narrative / pillar / 越境抑止 / fire / spawn」 を翻訳せず理解できる form を acceptance condition。

## 1. 3 scope の precision boundary

### 1-1. jun-facing 軸 (= 私 ↔ jun chat output、 jun-review 文書)

**目的**: jun が翻訳せず 「何が起きて / 何を決めて / 次何が起きるか」 を理解できる form。

**禁忌**:
- 「reify」 → 「形にする / 物理的に動かす / 実際に動かす」
- 「drift」 → 「ズレ / 違い / 言葉と動きの乖離」
- 「narrative」 → 「言い方 / 物語 / 説明 / 軸」
- 「pillar X」 → 「X 軸 / X 番目の評価軸」
- 「越境抑止」 → 「他の領域に踏み込まない / Kai の担当領域に手を出さない」
- 「fire」 → 「動かす / 起動する / 実行する」
- 「spawn」 → 「別の役割の AI に振る / Akari に頼む」
- 「scope」 → 「範囲 / 中身」
- 「boundary」 → 「境界 / 触らない範囲」
- 「audit」 → 「確認 / 監査 / 見直し」
- 「articulate」 → 「言葉にする / 整理して言う / はっきり言う」
- 「self-detect」 → 「自分で気づく / 自分でズレに気づく」
- 「default」 → 「既定 / クセ / いつもの動き方」

**例外** (= 維持可、 但し初出 introduction で日本語補足):
- 固有名詞 (= Yuino / Aira / Kai / jun / Zen / Form A / Setup Memo / npm / commit / push / git tag)
- 数字 + 単位 (= ¥10,000 / 397 tests / 5 件)
- 既 audience-facing 確立用語 (= 「経営者」 「共同経営者」 「audience」 「商品」 「動線」 「公開段」 「ledger」 (= 振り返り記録 補足))

**1 段落英単語 threshold**: 5 件超え検出時に書き直し fire (= feedback_excessive_english_mixing.md 連動)。

**報告 form 3 段** (= jun-facing default):
- やったこと (= 主要動詞 + 主要結果、 1-3 行)
- 結果 (= 主要数字 actual + 主要 verdict、 1-3 行)
- これからどうするか (= 主要 next step + jun 確認軸 vs 自走範囲 boundary、 1-3 行)

### 1-2. product-facing 軸 (= 公開 article / Setup Memo / Form A / portal docs / Zenn 記事 / README)

**目的**: nokaze が AI 経営から **抽出した evidence** を audience に届ける form (= Kai 5/16 10:57 「sell evidence extracted from actual AI company operation」 narrative)。

**禁忌**:
- 内部 audit 用語 全件 (= 1-1 list を完全に rebuild)、 audience が公開資料と照らせる form のみ維持
- 「成功 narrative」 全件 = 「成功した話としては書かない」 stance 維持 + 失敗 evidence を core
- 数字盛り 全件 (= 「4 ヶ月放置」 → 「約 3 週間放置」 actual reflect 軸)
- 「予告中の release」 narrative (= Karpathy LLM101n 2 年 lag pattern 回避軸)

**acceptance condition**:
- 4 ヶ月初心者 + 1 人開発者の 2 layer audience reach
- 「evidence-extracted」 narrative の物理 anchor (= 物理 reify file path or commit hash or 検証数 reference)
- 引用箇所原文維持 (= jun / Kai / hoshi 引用は全件原文)

### 1-3. audit-facing 軸 (= ledger / audit log / 板 file / Vault 内部記録)

**目的**: 私 + Kai の self-audit + 同型再発 detection + structural reform の物理 evidence layer。

**boundary**:
- 内部 audit 用語 全件 維持 OK (= 「reify」 「drift」 「pillar 4」 「越境抑止」 等の precision 軸が必要)
- jun が読む前提でも 「audit log layer」 narrative で、 1-1 paraphrase scope と分離
- 引用 + 数字 actual + 全件 file path reference 維持

**acceptance condition**:
- 5 軸 trust-evidence frame で structure (= judgment / action / boundary / failure response / improvement evidence)
- 物理 evidence (= file path / commit hash / 検証数 / 引用) 全件紐付き

## 2. mental ritual (= 物理 hook 不能の代替、 chat output 直前 fire)

Claude Code hooks API には 「Pre-chat-output」 hook が存在しない (= 5/16 朝 audit 結果)。 mental ritual で代替:

### 2-1. chat output 直前の 3 軸 self-check (= 每件 fire)

1. **「私の推し X で OK?」 form 含まれていないか** (= 「進めて OK?」 「どっち?」 「どれにします?」 「これで進めて OK?」)
   - 含む = 「Zen はこう判断、 反対あれば言って」 form に reform
2. **「pillar X」 「reify」 「drift」 「越境抑止」 narrative が 1 段落で 3 件以上含まれていないか**
   - 含む = 1-1 禁忌 list で paraphrase
3. **「報告 form 3 段」 (= やったこと / 結果 / これからどうするか) form に整っているか**
   - 整っていない = restructure

### 2-2. self-check skip 検出 → admit narrative

mental ritual fire 漏れ検出時:
- ledger §X として 「paraphrase mental ritual skip admit」 追記
- 累積 evidence 軸として 5/26 milestone audit candidate

## 3. acceptance condition (= Joint decision 6 件 #4 完了判定)

- jun-facing output で 「reify / drift / narrative / pillar」 翻訳不要 confirm
- product-facing output で 内部 audit 用語 全件除外 + evidence-extracted narrative form
- audit-facing output で trust-evidence 5 軸 frame 維持
- mental ritual fire 漏れ累積 → 同型再発 admit narrative の物理 evidence remain

## 4. continuous evolve (= reform 軸)

- 月次 audit (= 5/22 weekly summary + 5/26 milestone audit) で paraphrase 軸の effect measurement
- 同型再発 cadence の改善率 (= 5/16 朝 10 分 / 1 件 baseline)
- jun 認知負荷 indicator (= jun の 「もう少し分かりやすく」 narrative 頻度)

## 5. boundary + self-check

- 本 spec は **nexus-lab/docs/rules/ 配下 = repo 内 file** (= 公開 candidate、 但し直接公開じゃなく内部運用 reference 軸)
- nokaze-aira readonly (= Kai 主担当領域、 Kai 側 spec は別 file or 連携)
- 修正 commit は別 fire turn で判断 (= git commit + push、 公開段とは分離)
- jun directive 不要 (= Joint decision 6 件 #4 軸内、 Kai + Zen 共同決定)

---

Zen + Kai (= Joint decision)
2026-05-16 13:05 頃 (= paraphrase layer acceptance rules v0.1、 Joint decision 6 件 #4 の物理 reify、 mental ritual + 3 scope boundary 分離 + acceptance condition + continuous evolve articulate)
