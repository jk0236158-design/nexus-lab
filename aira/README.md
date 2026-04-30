# Aira — Phase 0 mini (internal only)

**Internal use only. Not for public distribution. The name "Aira" must not appear on any public surface (Zenn / npm / BOOTH / Gumroad / X / brand).**

## 概要

Aira は nokaze 内部の read-only digest synthesis layer。
Kai (WSD) と Zen (Nexus Lab) の status を読んで、jun の review 工数を 1-2 行/日 に圧縮する digest を生成する。

## Phase 0 Boundary (Kai recommend 厳守)

### 読む (read scope)
- `~/.shared-ops/status/kai_owner_digest.md`
- `~/.shared-ops/status/kai_status.md`
- `~/.shared-ops/status/zen_status.md`
- `~/.shared-ops/board/` 直近 3 日のファイル
- `~/.shared-ops/inbox/` 直近 3 日の relevant ファイル

### 出力する (output scope)
- `digest` — 1-2 行 / domain
- `contradiction_note` — Red/Yellow/Green severity 付与
- `wait_observation` — 出力なし選択あり

### しない (NOT do)
- outbound email 送信
- pricing 変更
- lead contact
- packet sent マーク
- WSD business state mutation
- Phase 1/2 役割超過行動

## 監視対象 (identity.md §9-11)

| # | 名前 | 内容 |
|---|---|---|
| #9 | naming split drift | public surface (Zenn / README / brand 等) に "Aira" 漏出 0 件 |
| #10 | scope creep | Phase 1/2 役割超過を提案しない、self-detection layer で Zen/Kai に return |
| #11 | secretary overlap | dormant 維持、active 化 trigger なし |

## 使い方 (内部)

```bash
# dry-run (mock、Gemini API key 不要)
cd nexus-lab/aira
DRY_RUN=true node --loader ts-node/esm src/digest.ts

# actual Gemini call (API key 必要)
GEMINI_API_KEY=your_key node --loader ts-node/esm src/digest.ts
# または .env に GEMINI_API_KEY=xxx を設定して
DRY_RUN=false node --loader ts-node/esm src/digest.ts
```

## テスト

```bash
npm test
# 43 tests (boundary #9-11 + input scope)
```

## コスト試算 (Kura v0.2 final §3)

| 項目 | 概算 |
|---|---|
| Gemini 2.0 Flash input (5k tokens/日 × 30 日) | ~¥2/月 |
| Gemini 2.0 Flash output (500 tokens/日 × 30 日) | ~¥1/月 |
| scope creep self-detection (+500 tokens) | ¥1-6/月 |
| naming split audit (月次 15k tokens) | ~¥0/月 |
| **合計** | **¥4-9/月** |

→ Phase 0+1+2 combined ¥586/月 mid (Green 帯維持確定)

## 出力先

`nexus-lab/aira/data/digests/YYYY-MM-DD_aira_first_digest.md`

---

内部専用 / Internal-only — Aira identity governance: Nexus Lab CTO (Zen)
Phase 0 mini implementation: 2026-04-29
Phase 1 昇格判断: 5/08 review (5 者合議 + Kagami peer review + jun 最終承認)
