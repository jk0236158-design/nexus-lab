# Yuino dogfood first day memo (jun 用、 2026-05-06 起稿)

5/06 夕方 jun 「yuino はもうやることないの?」 連動の dogfood first day 手順書。
jun が 30 分以内で完遂できる form。

## 0. 完遂までの所要時間 (目安)

- 設定確認: 5 分
- LIVE digest 1 回実行: 1-2 分 (Gemini API call 含む)
- output 確認 + Aira Observer state snapshot 取得: 5 分
- 計 約 15 分 (trouble shoot 含めて 30 分)

## 1. 設定の現状 (Zen が 5/06 夕方準備済み)

| 項目 | 状態 |
|---|---|
| yuino.config.yml | 配置済み (`nexus-lab/aira/yuino.config.yml`) |
| GEMINI_API_KEY (旧 aira キー、 5/06 jun decide で Yuino 用に label 変更) | `.env` に設定済み |
| 4 domain config | WSD / Nexus Lab / Product Design / Pricing/Finance |
| dry-run 動作確認 | 5/06 12:59 完了 (42 file ingest、 boundary pass) |
| 既存 first LIVE digest 履歴 | `data/digests/2026-04-29_aira_first_digest.md` + `2026-04-30_aira_first_digest.md` (4/29-4/30 first LIVE) |

= jun 側の追加設定作業は 「ほぼゼロ」、 LIVE digest を 1 回走らせるだけ。

## 2. LIVE digest 実行手順

### 2.1 環境変数の確認

```bash
cd C:/Users/jk023/nexus-lab/aira
cat .env
# GEMINI_API_KEY=<旧 aira キー、 Yuino 用に流用済み>
```

### 2.2 dry-run で再確認 (任意、 5/06 12:59 確認済み)

```bash
cd C:/Users/jk023/nexus-lab/aira
npm run yuino:digest:dry
```

期待 output:
- 4 domain mock summary 生成
- 42 file ingest
- boundary audit pass
- `data/digests/2026-05-06_yuino_digest.md` に DRY RUN file 配置

### 2.3 LIVE digest 実行

```bash
cd C:/Users/jk023/nexus-lab/aira
npm run digest
```

期待 output:
- 4 domain の actual digest summary (Gemini API 経由)
- Contradiction Notes (Yellow / Green / Red)
- WAIT Observations
- `data/digests/2026-05-06_yuino_digest.md` (LIVE 上書き or 別名で保存)
- API cost: ¥1-3 想定 (gemini-1.5-flash + 4 domain + 約 530KB ingest)

## 3. trouble shoot

### 3.1 「Failed to read config file」 エラー

- yuino.config.yml が見つからない → `ls C:/Users/jk023/nexus-lab/aira/yuino.config.yml` で確認、 不在なら本 memo の § 1 を再 review

### 3.2 「Gemini API key not set」 エラー

- .env が読まれていない → `npm run digest` を実行する dir が `nexus-lab/aira/` 内か確認 (相対 path で .env を読む)

### 3.3 「budget exceeded」 エラー

- 1 digest あたり $0.05 (= 約 ¥7) の上限超え → digest 内容が想定より長い場合、 `budget_per_digest_usd` を 0.10 に増やす (yuino.config.yml 編集)

### 3.4 「ingest 0 files」 エラー

- observer_scopes の path が間違い → 4 domain の path を確認、 Windows path 区切り文字 (`/` で記述、 `\` は escape 必要)

## 4. 4 domain config の構成説明

| domain | path | glob | max_files | 用途 |
|---|---|---|---|---|
| WSD | `~/.shared-ops/status/` | `kai_*.md` | 15 | Kai 関連 status (kai_status / kai_owner_digest 等) |
| Nexus Lab | `~/.shared-ops/status/` | `zen_*.md` | 15 | Zen 関連 status (zen_status / zen_today / zen_active_context_pack 等) |
| Product Design | `nexus-lab/aira/docs/` | `*.md` | 10 | Yuino + Aira 商品設計 doc (productization_design / phase1_specs_draft) |
| Pricing/Finance | `~/.shared-ops/inbox/` | `*kura*.md` | 10 | Kura return form + 経理 inbox (5/05 期限 return form 等) |

5/06 朝の Aira v0 全体 4 機能完遂 + 5/06 夕方の Aira ownership shift reform は status / inbox で観測される想定。

## 5. dogfood 期間中 (5/07-5/12) の運用

### 5.1 daily run

毎日朝 1 回 LIVE digest 実行 (jun が `npm run digest` を 1 回叩くだけ)。

### 5.2 output の review

`data/digests/<date>_yuino_digest.md` を read、 4 domain summary + Contradiction Notes + WAIT Observations を 5 分で目視確認。

### 5.3 Aira Observer 連動 (5/06 PM 完遂分)

Yuino digest 実行と並行して Aira Observer の state snapshot 取得も candidate (但し Aira は 5/07+ Kai 主導に移管中、 5/06-5/07 は移管期間で nexus-lab/aira/ remain で動作可)。

```bash
# Aira Observer state snapshot 単独実行 (cli wrapper 未起稿、 ad-hoc node script 経由 candidate)
# 5/07+ Kai 主導の nokaze-aira repo で cli 化検討
```

## 6. 5/13+ post-dogfood で audience facing reform

本 memo は jun 専用の internal memo。 audience facing 公開 setup 手順は 5/13+ Akari paraphrase pass で `SETUP_WITH_AI_AGENT.md` (5/04 起稿) と統合 reform 候補。

## 7. label 変更の物理作業 (jun が 5/06 夕方 1 分で完遂可)

memory `project_aira_api_broadcast_project_shared.md` 連動の label 変更:

```bash
# .env のコメント追記 (.env 自体は keep、 周辺 doc で label 明示)
# 既存:
#   GEMINI_API_KEY=<旧 aira キー>
# 変更後 (.env に label コメント追加):
#   # GEMINI_API_KEY: 旧 「aira」 キーを Yuino 用に流用 (5/06 jun decide、 既存 3 キー再振り分け)
#   GEMINI_API_KEY=<旧 aira キー>
```

実物理作業 = .env への 1 行コメント追加のみ (1 分以内)。

---

Zen (CTO @ Nexus Lab @ nokaze)
2026-05-06 夕方 起稿 (jun 「yuino はもうやることないの?」 連動の dogfood first day 手順書、 既存 3 キー再振り分け + Aira ownership shift Kai 主導 reform 連動)
