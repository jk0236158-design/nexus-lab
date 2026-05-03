---
title: nokaze-family brand decisions log
owner: Akari (Frontend Engineer, Nexus Lab, brand custodian)
scope: nokaze 親屋号 + Nexus Lab / Weekly Signal Desk 2 子ブランドの visual / brand 判断履歴
purpose: |
  brand 判断の「判断者・理由・採用案・不採用案・後続影響」を時系列で残す。
  brand_sheet / nokaze-design skill の正本には採用案のみ記載し、本 log から参照する運用。
  判断履歴を失うと数ヶ月後に同じ議題で再議論する risk があるため独立 file として運用する。
format: |
  各 entry は以下 6 項目で構造化:
  - 日付
  - 判断者 (単独 / 複数 / 諮問有)
  - 判断内容 (1-2 行で decision 要約)
  - 理由
  - 採用案 / 不採用案 (不採用案が残す価値ある情報を含む場合は併記)
  - 後続影響 range (どこに deploy されるか、何週間 / 何ヶ月後に再評価するか)
  時系列は逆順 (最新が上) で記録、同日複数判断は時刻 or 連番で分離。
refs:
  - ~/.claude/skills/nokaze-design/README.md (brand 正本)
  - ~/.claude/skills/nokaze-design/colors_and_type.css (色 / 字形の source of truth)
  - team_memory/akari/note_2026-04-22_session_close_own_view.md (override 事例 原 note)
  - team_memory/akari/note_2026-04-23_session_close_own_view.md (両案残し方針)
  - ~/.shared-ops/board/2026-04-24_zen_kai_nokaze_logo_system_5_items_consult.md (Kai 諮問)
---

# nokaze-family Brand Decisions Log

brand 判断の履歴を時系列で残す。正本は `nokaze-design` skill / brand_sheet、本 log は履歴専用。

---

## 2026-04-24 — logo system v0.1 → v1.0 path 5 議題 Kai consultation 送信

### 判断者
Akari 起草 + Zen 送信承認 (board 経由 Kai へ諮問)

### 判断内容
nokaze-family logo system の v1.0 確定に向けて、5 議題を Kai に諮問する board file を起稿。今夜 (4/24) 金曜 review で jun 最終判定予定、Kai 回答は review 後の次 spawn window で回収。

### 理由
BOOTH 4 品 (database / auth / api-proxy / N1 config) が 2026-04-22 に live 化し、placeholder logo 期間が長期化すると brand dilute を招く。4/22 Akari 独立 override (3 ノード三角案 → olive dot + fading trail 案) を公式化するにあたり、WSD 側運用との整合を Kai 視点で cross-check する必要がある。

### 諮問議題 5 件
1. Zen 暫定 3 ノード三角案 vs Akari v1.0 olive dot + fading trail 案の比較・判定
2. 両案残し記録方針 (本 log 新規 + brand_sheet 正本軽量化)
3. nokaze-family 配下の子ブランド logo 運用パターン (P1 共通 mark + 子 wordmark / P2 親子 mark 併置 / P3 独立 mark)
4. 色・字形の tonal scale logo 適用優先順 (Order A olive 一点差し / B 墨色主体 / C 文脈依存)
5. v1.0 確定後の deploy 範囲と順序 (2 段 deploy 提案)

### 後続影響 range
- Kai 回答 (24h 目安) → 金曜 review 反映判断 → v1.0 正式確定 → 段 1 deploy (skill / docs / BOOTH icon) → 1 週間観察 → 段 2 deploy (Zenn 9 記事 OGP / Gumroad / WSD 側統一)
- 本 log は以降の brand 判断の template として機能させる

### 参照 file
`~/.shared-ops/board/2026-04-24_zen_kai_nokaze_logo_system_5_items_consult.md`

---

## 2026-04-22 — logo 暫定案 override (Akari 独立判断)

### 判断者
Akari 単独 (Zen 暫定案に対する override、諮問なし)

### 判断内容
Zen が jun に提示した「3 ノード asymmetric 三角」logo 暫定案を不採用、「olive dot 1 個 + 右に伸びて終端で fade out する細罫」案を v0.1 採用案として提出。

### 理由
3 点の brand 整合性 check で不採用判定:
1. **skill 禁則接近**: `nokaze-design` skill README § VISUAL FOUNDATIONS 「全画面 grid 線 / 格子模様 / ネットワーク模様は禁忌」に視覚的に接近。3 ノード三角は名前を変えても「ノード+線」表現を踏む
2. **tech SaaS 既視感**: 三角 logo は Stripe / Vercel / Linear など 2020 年代 SaaS 頻出 motif で、nokaze「障子紙 + 余白 + 一点差し」美学と衝突
3. **olive dot 継承断絶**: 既存 nokaze wordmark SVG は olive dot 1 個で成立しており、三角への置換は brand continuity を切る

### 採用案
**olive dot + fading trail**:
- olive dot 1 個 (`#6B8E23`, 直径 8-10px) を左に配置
- 右に細罫 (墨色 `#1F1F1F` 1.5px stroke) が伸び、終端で fade out
- 意味解釈: 「テンプレ / シグナルは終点ではなく次への起点」「dot → 線 → fade → また dot」の循環
- Zen 4/19 Zenn 記事「後輩 AI に名前を付け…」の「手渡す姿勢」と視覚一貫

### 不採用案
**3 ノード asymmetric 三角** (Zen 暫定):
- 3 事業 (nokaze / Nexus Lab / WSD) を 3 ノードで構造表現
- 機能的意図は正確だが、視覚的に skill 禁則と SaaS 既視感を踏む
- 記録価値: 「構造を視覚化する要請」自体は残る → 将来第 3 事業追加時に fading trail の先の「次の dot」として表現する派生案の source

### 後続影響 range
- 4/22 夜: Zen 暫定案から差分を明記した文書を提出 (jun 判断保留)
- 4/23 朝: 構造ガード v0.2 § 3 Guard 4 に「brand 軸での専門家 override」として公式化、Akari は pre-authorize された判断面を獲得
- 4/24 金曜 review: v1.0 正式確定予定
- 4/24 以降: 本 log + brand_sheet 本体への deploy

### 備考
override の事実を Zen に明示的に communication する責任は override 側にある。4/22 logo system 文書末尾に「Zen 暫定案からの差分」として明記済、Zen 側の認識 drift は起きていない。

---

## 2026-04-20 — nokaze-design skill v1 生成時の初期 brand 配置

### 判断者
Zen (CTO) + Akari (brand custodian 着任時、skill 内容 review)

### 判断内容
`~/.claude/skills/nokaze-design/` skill v1 を生成、color / type / spacing / tone / 禁忌 / wordmark 3 種を正本として確定。

### 理由
Phase 1 Foundation で brand 分散を防ぐため、Zen / Akari / 他 peer が参照する単一の brand 正本が必要。
ローカル codebase (`nokaze-portal/`) + GitHub (`jk0236158-design/nexus-lab`, `nexus-lab-zen/Nexus.Lab.Zen`) から抽出 + jun 直接指定で構築。

### 採用案 (正本確定)
- **4 色**: 障子紙 ivory `#F5F3EE` / 墨色 `#1F1F1F` / オリーブ `#6B8E23` / 風化木 `#C19A6B`
- **3 書体**: Noto Serif JP (display / heading) / Noto Sans JP (body / UI) / JetBrains Mono (code / 数字)
- **3 wordmark**: `nokaze-wordmark.svg` / `nexus-lab-wordmark.svg` / `wsd-wordmark.svg`
- **禁忌リスト**: ネットワーク模様 / gradient / 3D ロボット / 脳 / グローブ / SaaS ヒーロー / 笑顔ストックフォト / 煽り語彙 (革新 / 次世代 / 突破 / 急成長)
- **3 姿勢**: 自己評価を盛らない / 行動の証拠を軸に / 整合性を外部に見せる

### 不採用案
- ChatGPT グリーン / 紫グラデ (OpenAI 公式系)
- 派手な SaaS LP hero (OpenAI / 多くの YC SaaS)
- `F5F0E6` (jun 提示の近似値) → `F5F3EE` に統一 (skill 正本優先)

### 後続影響 range
- 全 brand 判断の base layer として機能、以降の判断は本 skill からの逸脱を明示する形で記録
- 2026-04-22 override 判断も本 skill 禁則への参照で正当化

---

## 運用 note

### brand_sheet 本体との関係
`nokaze-design` skill の README.md / SKILL.md は brand 正本 (採用案のみ)。本 log は判断履歴 (採用案 + 不採用案 + 理由 + 後続)。
v1.0 logo 確定後に `nokaze-design/README.md` の § ICONOGRAPHY に logo mark を追加する際、注記 1 行で本 log への相対 path link を挿入する段取り (実行は金曜 review GO 後)。

### entry 追加条件
以下の判断が発生したら本 log に entry を追加する:
- logo / wordmark / mark の新規作成・改定
- 色・書体の追加・削除
- 禁忌リストの改定
- tone / 言語 / コピー規範の変更
- 子ブランド追加・廃止
- brand 関連の override (Zen / Akari / Kai 間)

### 責任者
Akari (Frontend Engineer, brand custodian) が primary。Zen は CTO として approve surface を持つが、brand 軸 override は Akari pre-authorize (構造ガード v0.2 § 3 Guard 4)。
