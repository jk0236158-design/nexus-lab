# Setup Memo Seed v0 — audience-facing 公開化 narrative spec (= z-4 軸)

起稿日: 2026-05-17
起稿主: Zen
連動:
- nokaze-aira `docs/ai_operator_setup_pack_v0_1_outline.md` (= 5/16 evening Yuino observation cycle generated、 internal draft)
- jun 5/04 朝 directive 「初心者の人が ai エージェントを使ってセッティング出来る説明」 (= `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_ai_agent_setup_default_for_users.md`)
- 5/16 委任権限 v1 採用後の free article publication 範囲
- 5/17 朝 「外向き軸 priority reframe」 narrative の continuum
status: seed v0 (= 起稿後 v0 → v0.1 で AI agent execution prompt 詳細追加 candidate)

---

## 1. 起稿軸 = 既起稿 internal draft の audience 視点 reframe

5/16 evening に nokaze-aira 側 Yuino observation cycle で nokaze-aira docs/ai_operator_setup_pack_v0_1_outline.md が internal draft として起稿済 (= 67 行)。 axis 整合は高いが、 scope は 「商品 component の内部 outline」、 audience-facing 公開化 form ではない。

本 spec は audience 視点での **「これを公開化するなら」 narrative** を seed として articulate、 既存 outline と並走 (= 不要な reify を fire しない axis 維持、 actual reify は別 fire turn)。

## 2. audience profile (= 公開化 narrative の core)

### 2-1. 第 1 audience (= 最重要)

> 「Claude Code / Codex / Cursor / Gemini CLI 等の AI agent を 4 ヶ月以内に使い始めた人で、 複数 AI を組み合わせて使いたいけど、 state / 承認 / 安全境界の管理で詰まってる」

- AI agent の単独使用は既できる (= 既存 audience)
- 複数 AI agent を組み合わせる時の order / 承認 / 衝突回避で困る
- 「自走させたいけど監視が大変」 「承認しないと不安、 承認すると AI が遠慮し過ぎ」 narrative

### 2-2. 第 2 audience

> 「solo 開発者 / 1 人 startup で、 AI agent に作業させたいけど SaaS 自動化に丸投げするのは怖い」

- Local-first を default にしたい
- audit log + 承認 gate + stop point を可視化して使いたい
- 公開 SaaS の AI 自動化 (= n8n / Zapier 等) は audit が不透明で躊躇

### 2-3. 非 audience (= 明示除外)

- AI に丸投げで自走させたい人 (= 「人間判断 visible」 narrative の真逆軸、 Yuino の design intent 違反)
- 大規模チーム向け enterprise 自動化を求める人 (= scope 外)
- 「AI を完全に置き換える」 narrative を求める人 (= AI 運営透明性 narrative 違反)

## 3. publication form 3 段階 (= phase 1-3)

### Phase 1 = README / quick start (= audience 入口、 5 分で読める form)

audience が公開 docs に最初に当たる時の form。 既存 outline § Purpose + Product Promise + Target User + Setup Flow 6 step を audience 言語で paraphrase。

候補 location:
- packages/nokaze-portal/yuino/setup.md (= portal 新規 page candidate、 5/17 当時の設計候補、 未起稿)
- nokaze-aira `README.md` の audience-facing section (= Kai-led readonly、 改修は board 経由)

### Phase 2 = AI agent setup prompt template (= core differentiator)

jun 5/04 朝 directive narrative の core: 「初心者が AI agent を使って setup できる」 = AI agent (= Cursor / Claude Code / Codex / Gemini CLI) が読んで execute 可能な setup prompt template。

template structure:
- 前提確認 (= AI agent 種別 + working directory + permissions)
- folder structure 作成 step
- daily judgment board template 配置
- 初回 fire 例 (= 1 件 board 起稿 → 1 件 response chain)
- recovery checklist (= broken JSON / stalled response / blocked action 等)

= AI agent が prompt 1 件で setup chain を fire 可能な form、 audience は 「AI agent に prompt 貼って実行待つだけ」 narrative。

### Phase 3 = 拡張 + community contribution form

- 「私はこう使ってる」 narrative の audience 投稿 form (= GitHub issue template or 公開 discussion)
- setup variant の community share (= solo / 2 人 / 3 人 + 等の scope variant)
- 5/26 milestone audit 後の audience reach measurement 連動

## 4. 既存 outline 連動 audit (= 重複 risk 抑止)

| 既存 outline section | 本 seed 連動 phase | 重複 risk | reform candidate |
|---|---|---|---|
| Purpose | Phase 1 (= 1 行 summary) | 低 | audience-facing form で paraphrase |
| Product Promise | Phase 1 (= 「やらないこと」 narrative) | 低 | 既存 yuino/index.md と整合 audit |
| Target User | 本 spec § 2 (= audience profile) | 低 | 第 1/第 2/非 audience 3 分割 reform |
| Included v0.1 Components | Phase 1 + Phase 2 split | 中 | folder template + AI prompt template が公開先で別 form 必要 |
| Safety Defaults | Phase 1 (= 「8 つの約束」 既存 narrative と統合) | 低 | yuino/index.md の 8 つの約束 narrative と axis 整合 |
| Setup Flow 6 step | Phase 2 core (= AI agent prompt template に展開) | 低 | step 1-6 を AI agent readable form で reframe |
| Yuino/Aira Evidence | Phase 3 (= 動いた記録 narrative と連動) | 低 | portal 「動いた記録」 section と axis 整合 |
| Open Questions | 本 spec § 6 (= 残課題) | 低 | jun 確認軸として保持 |
| Next Useful Owner Question | 本 spec § 6 (= 残課題) | 低 | jun escalate 軸 candidate |

= 重複 risk は中 1 件 (= folder template + AI prompt template の form 分離必要)、 他は低。

## 5. boundary

### 5-1. 委任権限 v1 整合 (= 全 step delegated 範囲)

- free article publication (= setup memo 公開化)
- README / docs / LP draft publication
- external comparison (= 類似 setup pack の audit、 hoshi spawn candidate)
- internal worker (= Akari spawn で portal 反映、 Iwa spawn で setup script 整備)

### 5-2. Red boundary (= jun escalate 必須、 該当なし default)

- paid setup pack 化 (= 該当なし、 free article publication で seed start)
- final price 表記 (= 「未定」 narrative 維持)
- payment links (= 該当なし)

### 5-3. 既存 narrative との整合

- yuino/index.md の 「商品 3 軸 + 8 つの約束 + 動いた記録」 narrative 維持
- 数字盛らない narrative (= 「setup できる人数」 「動作成功率」 等の数字 narrative 禁止)
- AI 運営透明性 narrative (= 「AI が運営してる」 narrative を hide しない)

## 6. 残課題 + 起稿後 next move (= 公開化 path の判断軸)

### 6-1. 残課題 (= jun directive trigger 候補、 干渉 0 day 中は保留)

- ship form 判断: 有料 setup pack / 無料 lead magnet / Yuino starter guide 統合 のどれか
- beginner-facing 日本語 vs developer-facing 英語 の split 軸
- 「30 分以内に first success」 narrative の actual 物理化 (= 何が first success か articulate)
- solo AI operator vs small team multi-AI operating の優先

### 6-2. 起稿後 next move (= Zen + Kai 自走範囲)

- Phase 1 起稿 (= packages/nokaze-portal/yuino/setup.md 新規 candidate、 Akari spawn、 5/17 当時の設計候補、 未起稿)
- Phase 2 AI agent prompt template 起稿 (= `~/.claude/skills/nokaze-yuino-setup/` candidate or `packages/nokaze-portal/yuino/setup-with-ai/` candidate)
- 既存 outline との merge audit fire (= nokaze-aira readonly なので board 経由で Kai 連動)

## 7. measurement axis (= 5/26 milestone audit candidate)

- Setup Memo seed v0 起稿達成 (= 本 fire actual)
- Phase 1 公開化達成 (= 5/26 までに actual fire 1 件 candidate)
- AI agent setup prompt template 起稿達成 (= Phase 2、 5/26 後 candidate)
- audience response measurement (= 公開後 GitHub issue / 引用 / SNS reference)

## 8. 連動 file

- `~/Desktop/nokaze-aira/docs/ai_operator_setup_pack_v0_1_outline.md` (= 既起稿 internal draft、 readonly base material)
- `~/Desktop/nokaze-aira/README.md` (= Yuino 既存 README、 readonly base material)
- `~/nexus-lab/packages/nokaze-portal/yuino/index.md` (= 既起稿、 5/17 朝 zk-4 reify)
- `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_ai_agent_setup_default_for_users.md` (= jun 5/04 朝 directive memory)
- `~/.shared-ops/owner-decisions/2026-05-16_zen_kai_delegated_authority_v1.md` (= 委任権限 v1 ground truth)

---

Zen
2026-05-17 9:30 頃 (= z-4 Setup Memo seed v0 起稿 = audience-facing 公開化 narrative spec、 既起稿 internal outline と並走 + audience profile 3 軸 + publication form Phase 1-3 + 委任権限 v1 整合 check + 残課題 + measurement axis、 「不要な reify を fire しない」 narrative 維持 + 「外向き軸 priority reframe」 narrative の continuum)
