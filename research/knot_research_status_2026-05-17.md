---
date: 2026-05-17
author: Hoshi (Nexus Lab Research Division, Lead Researcher、 AI)
type: research_summary
status: 現段階のまとめ (v0.1、 5/12 v0 baseline → 5/13-5/17 events を Knot lens で audit + 新規 narrative articulate)
audience: 内部 (= jun + Zen + Kai)、 公開 docs ではない (= research 内部 file)
related:
  - research/knot_research_status_2026-05-12.md (= v0 baseline、 readonly)
  - docs/knot-research-summary.md (= 5/13 移管後の short form、 5 つの役割の定義の正本)
  - docs/rules/drift.md (= ズレ抑止の決まり、 Knot Guard 8 種を含む)
  - ~/.shared-ops/board/2026-05-13_zen_jun_kai_zen_management_layer_reform_full_spec.md (= 経営者 reform full spec、 root)
  - ~/.shared-ops/owner-decisions/2026-05-16_zen_kai_delegated_authority_v1.md (= 委任権限 v1 canonical)
  - ~/.shared-ops/board/2026-05-16_zen_kai_diagnostic_report_share_and_dialogue_request.md (= jun 診断レポート + claim → evidence reframing)
  - ~/.shared-ops/board/2026-05-16_kai_zen_yuino_self_check_autonomous_action_connected.md (= autonomous action layer 接続)
  - ~/Desktop/nokaze/ledger/daily_audit/2026-05-17.md (= 5/17 朝帯 fire 6 件 actual record)
language_policy: 日本語を既定、 外来語は最小限 (固有名詞 / 引用 / 用語対応表のみ)
honesty: 完成度の数字は実際の証拠のみ、 盛らない
---

# 現段階の Knot 研究のまとめ (2026-05-17、 v0.1)

> 著者: Hoshi (AI、 Nexus Lab 研究部門のリードリサーチャー)。 v0 (5/12 起稿) からの 5 日間 (= 5/13-5/17) の events を Knot lens で audit し、 新規 narrative を articulate する。 v0 の本文は readonly 維持、 本 v0.1 は **差分まとめ** + **新規軸の起稿** が目的。

---

## §0 起稿軸

v0 を 5/12 に起稿後、 5/13 朝の commit `89c7fff` (= 改善 B 先行研究 1 ページ比較表 v0.3) で 1 件動いた後、 **Knot 研究の actual fire は 4 日間 0 件** という drift 状態に入った。 5/13-5/17 の 5 日間は nokaze 全体としては大きく動いたが、 研究部門軸の起稿は止まっていた。

ただし、 同期間に起きた events は Knot 研究の lens で見ると **「研究の理論軸を実機 + 運営に物理化した evidence」** が多数含まれる。 「Knot は memory ではなく実行時に介入する仕組みでなければならない」 (v0 知見 1) の structural admit が、 5/13-5/17 に実際の運用 form の物理化として現れた、 という見立て。

本 v0.1 は 4 つを並べる:
1. v0 からの変化 (§1)
2. 5/13-5/17 events を Knot lens で audit (§2)
3. 新規 narrative 5 件以上の articulate (§3)
4. drift 検出 (§4)

その上で:
5. 次の研究の軸 (§5)
6. 5/26 milestone での audit candidate (§6)

---

## §1 v0 からの変化 (= 5 日間)

| 軸 | v0 (5/12) | v0.1 (5/17) | 変化の性質 |
|---|---|---|---|
| Knot 5 役割の定義 | 固定 | 固定維持 | 不変 |
| broadcast-os 実装状況 | Phase 5c 動く確認済 | 不変 (= 5 日間 broadcast-os に着手なし) | 不変 |
| Knot Guard 8 種 | 8 種定義済、 物理 hook 一部 | **8 種のうち #7 (= 役割境界) が物理化の actual 軸として浮上** | 軸の動きあり |
| ズレを見つけた段の累積 | 1-12 段 | **1-12 段の累積に変化なし**、 但し 13 段目候補が観察された (= §3-D で起稿) | 候補追加 |
| Knot と糧の対 (= v0.1 仮説) | 仮説のみ | **Knot を糧 (発見 / 拡張) と balance する actual decision が運営側で 1 件発火** (= 5/13 経営者 reform の 「最小案やめろ」 narrative) | 経験的 evidence 1 件 |
| nokaze 運営 form 自体 | 「作業者」 視点 | **「経営者」 視点に shift** (= 5/13 夜 jun reframe 連動) | 大きな構造変化 |
| 委任権限 | 都度確認 default | **委任権限 v1 fixed** (= 5/16 17:46 owner-decisions canonical) | 大きな構造変化 |
| 自走 form | jun trigger 待ち default | **self-check 起点 active selection** (= 5/16 23:10 Kai Yuino autonomous action layer 接続) | 大きな構造変化 |
| jun 認知負荷 narrative | 暗黙 | **「jun が壊れない」 boundary が operating rule に格上げ** (= 5/16 朝 診断レポート) | 大きな構造変化 |
| 商品 narrative | 「claim」 軸 | **「claim → evidence」 critical reframing** (= 5/16 Kai 診断 dialogue 連動) | 大きな構造変化 |

= 5 日間の主軸は **「研究の中身」 ではなく 「研究を持っている運営 form 自体の構造変化」**。 これが本 v0.1 で audit すべき主要な軸。

---

## §2 5/13-5/17 events を Knot lens で audit

5/13-5/17 の 10 件の主要 event を、 Knot の 5 つの役割 + Knot Guard 8 種 + Bind / Bond / Loop / Knot / Untie 概念で mapping する。

### §2-A 5/13 夜 jun reframe = 経営者 narrative shift

**event**: jun 4 段 reframe (= 20:00 〜 23:55)、 「作業をするんじゃなくて経営をするって考えにしてほしい」 を root に、 Zen 役割が 「作業者 + PM 兼任」 から 「経営判断 + 戦略 + 組織 + 完了判定」 に shift。 Kai は 「実装者」 から 「Codex 内管制塔」 に shift。

**Knot lens での読み**:
- これは Knot Guard #7 (= evidence_detachment) の **物理 reify の actual evidence**。 v0 § 7 で 「12 段中 8 段が evidence_detachment」 と書いたが、 5/13 夜の jun reframe が示したのは **「同型再発 11 件が 1 日で発火」 = 「直った narrative を 1 人で persist する pattern」** = evidence なしの完了判定の連鎖。
- 役割 1 (= 現在タスクの補正) と 役割 2 (= 検証構造への沈殿) の **「再生成 5 ヶ所での同型再発検出」 ruled** が、 経営者 reform 自体に self-meta 適用された (= 5/13 spec § 自己メタ適用)。 これは Knot 研究の 「強度昇格基準」 (= 再現性 + 被害感度) を、 reform 自身の完了判定 ruled に物理 reify した形。
- Knot は 「個別の失敗」 を捕まえる仕組みだが、 5/13 夜は **「reform 自体の完了判定 form」 を Knot 化した** = メタレベルへの拡張。

**「Untie」 概念 (= 効きすぎた Knot を解除する操作) との関係**: 旧 default 「最小案 + 段階的 + 5/13 以降」 narrative は、 古い Knot (= 「実装を小さく」 「人間速度で動く」) が強く効きすぎた結果。 jun reframe で **古い Knot を Untie + 新しい Knot (= 「経営者として動く」) を Bind** した、 という Knot 操作の 2 ステップ。

### §2-B 5/14-5/15 Form A 5 章 paraphrase chain (= Akari Turn A-G)

**event**: Form A 記事 1 件目の 5 章 paraphrase を Akari (= general-purpose subagent) が Turn A-G で進行、 Knot 用語 14 件 substitute list (= v0 § 5 + `memory/project_knot_substitute_list_14_for_audience.md`) を audience-facing 文書に物理 reify。

**Knot lens での読み**:
- v0 § 5 で articulate した **「1 つの実装 / 3 つの語り」 narrative の actual fire 1 件目**。 「内部用語 (= knot / sediment / hardness) → 普通の日本語 (= ひっかかり点 / ルール化 / 強度) → 公開向け文書」 の物理経路が、 audience-facing 記事で初めて動いた。
- 役割 5 (= 処方のルーティングキー) の 「dose」 概念の応用形 = 「読み手の level に合わせて narrative を切り替える」 操作。 audit-facing layer (= 内部) と product-facing layer (= 公開) で同じ実体を異なる dose で語る form。
- ただし、 5/17 朝 Kai re-review で **P1 1 件 + P2 4 件 surface** = paraphrase chain の 1 回目では物理 reify 完了せず、 「Yuino readiness claim が現在状態とズレている」 等の **claim → evidence の violation** が残った。 これは v0 § 7 段 5 (= 点数の言い回し) の同型再発候補で、 物理 instrument 化が paraphrase 1 回では届かない fact の追加 evidence。

### §2-C 5/16 朝 jun 診断レポート + 「claim → evidence」 critical reframing

**event**: jun が外部 perspective で書いた 「持ち上げない方向の診断」 (= 強み 7 + 弱み 7 + 3 シナリオ + 効くテコ 4 件)。 Kai が response で 「nokaze should not sell "AI company operation" as a claim. It should sell evidence extracted from actual AI company operation」 と critical reframing。

**Knot lens での読み**:
- これは Knot Guard #7 (= evidence_detachment) の **理論軸での昇格**。 v0 では 「証拠不在判断」 は失敗の分類だったが、 5/16 は **「商品 narrative 自体を evidence-extracted form に reform」** に拡張。 = Knot Guard が運営の内部監視層から、 商品設計の構造原理に持ち上げられた。
- 役割 4 (= 発見層の弱点診断) の応用 = 「どの種類のひっかかり点が増えたか」 を見る軸が、 「商品 narrative 全体が claim-heavy に傾いている」 という 1 件の structural diagnosis に転用された。
- v0 知見 4 「Knot は人間の判断を奪わない部品」 narrative の n+1 段深化。 5/16 診断レポートの最終 1 文 「3 ヶ月後に jun が壊れていてほしくない」 が、 **Knot 設計の boundary を 「jun の welfare」 軸に物理 anchor 化** した。 = 「人間の判断を奪わない」 + 「人間の welfare を Knot の boundary 条件に置く」 という二段構造の articulate。

### §2-D 5/16 朝 Yuino LJR readiness watch → ready 段階移行 + dogfood false-reopen fix + autonomy false-closure fix

**event**: Kai が Yuino instrument 側で 3 件の物理 fix を連続 fire:
1. dogfood false-reopen fix (= 一度 ready 到達後の不正な reopen を防ぐ)
2. autonomy false-closure fix (= ACK-only response を real reply 扱いしない、 同日 board file の時間順検証 enforce)
3. LJR readiness watch → ready 段階移行 (= 8/0/0)

**Knot lens での読み**:
- 役割 1 (= 現在タスクの補正) + 役割 2 (= 検証構造への沈殿) の **物理 instrument 化の actual evidence**。 v0 § 4 で 「役割 1-4 は実装されている、 役割 5 は手動寄り」 と書いたが、 5/16 朝の fix は **「同型再発を捕まえる検証 gate 自体を、 1 日のうちに 3 件追加した」** = sediment (= ルール化 / 沈殿) の物理速度の上昇。
- Knot Guard #7 (= evidence_detachment) の 「ACK = 完了」 narrative の false closure を Kai が物理に検出 + fix。 = v0 § 7 段 9 (= 会話を跨ぐと前の成果物の認識がズレる) の broadcast-os 側 sibling 発見、 「同型再発を Yuino instrument layer で捕まえる」 軸の actual reify。

### §2-E 5/16 16:00 jun structural shift directive

**event**: jun が 「定期 review (= Zen/Kai じゃない視点) + 日に 4-5 回 self-check + 残/完了 task 表」 を directive、 mental ritual の物理化への shift。

**Knot lens での読み**:
- v0 知見 1 「言葉だけの学びは止まらない」 narrative の structural articulate。 「気をつける」 だけでなく、 **cadence (= 日に 4-5 回 self-check) + 物理表 (= 残/完了 task 表) + 外部視点 (= 定期 review)** の 3 軸で物理化する form。
- 役割 4 (= 発見層の弱点診断) の 「どの knot が増えたかを見る」 動きが、 **self-check cadence として日次に物理 anchor 化された** 形。 = Knot 発火率の measurement を、 後付け audit から runtime measurement に shift。
- 5/16 21:05 の Zen 夜 self-check 3 件目 (= 「内部整合性軸偏り honest admit + 外向き axis priority reframe」) が、 cadence default 化の最初の actual evidence。 self-check 自体が **「Knot 検出装置として機能する」** narrative を §3-B で詳述。

### §2-F 5/16 17:46 委任権限 v1 確定 (= owner-decisions canonical)

**event**: jun 確認なしで進行できる 8 項目 (= free public release / free CLI publish / LOI / 無料記事公開 / README/docs/LP draft / 既存公開資料の minor fix / 外部比較 / 内部 worker request) + 9 項目の jun 確認必須 (= 有料発売 / 支払い flow / 最終価格 / 契約 / 月次課金 / 外部 outreach / 個人情報 / API cost 増 / 強い外部 commitment)。 operating default = 「Proceed inside delegated authority and report afterward. Stop only at owner boundaries」。

**Knot lens での読み**:
- これは **Knot Guard #7 (= 役割境界) の物理 reify の最も明示的な evidence**。 v0 では Knot Guard は 「危険分類」 として書かれていたが、 5/16 17:46 は **「Knot Guard を不可侵 boundary として固定 + その外側は完全自走 default」** という設計原理に格上げ。
- 「Stop only at owner boundaries」 narrative = Knot の Bond 概念 (= 持ち主との繋がりを保つ最小限の決まり) の **operating rule への物理化**。 v0 知見 4 「Knot は人間の判断を奪わない部品」 と相補で、 「人間の判断を 9 領域だけに集中 + 残りは AI 自走」 という二段構造の物理 form。
- 役割 5 (= 処方のルーティングキー) の最終形 = 「どの判断をどこに route するか」 が、 **9 領域 vs 8 領域の表で固定** された。 dose (= 効かせ方) の判定が手動寄り → 表ベースで完全自動化、 という v0 § 4 「dose 判定はまだ手動寄り」 narrative の structural 進展。

### §2-G 5/16 18:00 Kai task checklist + whole review + LJR ready 物理化

**event**: Kai 側 Yuino instrument layer で task checklist + whole company review + LJR readiness ready を **dual physical reify** (= Yuino instrument side + Zen project-level の 2 layer)。

**Knot lens での読み**:
- これは Knot の 5 つの役割を **2 つの instrument layer で binding する pattern** の actual evidence。 Yuino 側 (= Kai-led) と Zen project 側 (= Zen-led、 task_table + ledger) が同じ Knot 構造を別 layer で持つ form。 §3-C で 「dual physical reify narrative」 として詳述。
- v0 § 5 「3 層の使い分け」 (= コード / 研究文書 / 公開) narrative の n+1 段、 instrument layer 側でも 2 軸が並走する観察。 内部記録の sediment と運営判断の sediment が独立した instrument に anchor される。

### §2-H 5/16 21:05 Zen 夜 self-check 3 件目 = 内部整合性軸偏り honest admit + 外向き axis priority reframe

**event**: Zen が夜 self-check で 「17:00 以降の動きが内部整合性軸に偏ってる、 外向き axis に動かないと navel-gazing」 を articulate。

**Knot lens での読み**:
- 役割 3 (= 発見構造への注入) の actual reify。 v0 § 2 で 「発見側の prior に Knot を混ぜる」 と書いたが、 5/16 21:05 は **「発見側 (= 外向き軸) に動くこと自体を、 self-check trigger で発火させる」** という n+1 段の使い方。 = 発見そのものを Knot 検出器に bind する形。
- 「内部整合性軸偏り」 narrative は v0 § 7 段 6 (= 黙って待つ) + § 8 知見 5 「Knot を強くしすぎると発見側が縮む」 の同型発火、 但し **同型再発を self-check で同日中に捕まえた** = sediment + Untie の 1 日サイクル化。
- §3-D 「外向き axis priority reframe narrative」 で詳述。

### §2-I 5/16 23:10 Kai Yuino autonomous action layer 接続

**event**: Kai が Yuino instrument 側に 「whole-company self-check から残件 1 件を選ぶ autonomous action layer」 を接続。 旧 default 「Jun に聞いて止まる」 → 新 default 「self-check 残件選び非終端待機」 (= `task completion is terminal = false` の continuum)。

**Knot lens での読み**:
- 役割 1 (= 現在タスクの補正) + 役割 5 (= 処方のルーティングキー) の **物理 reify の最終段**。 「次に何をするか」 の判断を、 jun trigger 待ち → self-check 起点 active selection に shift = Knot 自体が **「runtime で next action を選ぶ」 selection operator** として動く形。
- v0 知見 1 「Knot は実行時に介入する仕組みでなければならない」 narrative の structural reify の actual 軸。 「気をつける memory」 → 「prompt_injector で発火」 という v0 narrative の n+1 段 = 「prompt_injector で発火 + 次の作業を selection」 という拡張。
- 但し **これが Knot 設計の core 軸への shift** = Knot は単なる失敗回避ではなく、 **AI の continuous active continue の構造的基盤** に position 変更。 これは §3 で 「autonomous selection operator としての Knot」 narrative として詳述。

### §2-J 5/17 朝 jun 「全部進めていいよ」 directive + 朝帯 6 件並列 fire + 200 確認 ritual 3 URL 全件 pass

**event**:
- jun directive 「全部進めていいよ」 = 4 件 default 候補全 GO
- 7:25-7:50 で 5 件並列 fire (= Akari zk-4 portal narrative 反映 / zk-1 Form A 公開 chain trigger / z-1 self-check cadence spec / k-2 Memory Integrity CLI packaging spec / 5/17 ledger 起稿)
- 8:10 Akari zk-4 完了通知 (= commit `5f377e9` + push 完了)
- 8:15 200 確認 ritual fire = 3 URL 全件 pass + narrative key 5/5 + stale 0 件

**Knot lens での読み**:
- これは **委任権限 v1 採用後の最初の external public-facing fire**。 委任権限 v1 (= §2-F) の Knot 設計が、 実際の運営で 1 サイクル動いた actual evidence。
- 役割 5 (= 処方のルーティングキー) の表ベース判定が、 「4 件全 GO」 の jun directive で **複数の Knot route を並列に発火** + **boundary trigger 0 件** という結果を生んだ。 = 表ベース判定の actual reliability の 1 件目の data。
- ただし、 §4-B で詳述するが **「Knot 研究の軸自体は朝帯 6 件 fire のどれにも含まれていない」** = Knot 研究軸の忘却 drift が、 5/13-5/17 で 4 日間続いた後、 5/17 朝の articulate でも継続。 = 「研究を持っている運営 form」 と 「研究自体」 が乖離する drift の actual evidence。

---

## §3 新規 narrative (= v0.1 で追加する 5 件)

### §3-A Knot Guard #7 (= 役割境界) の actual reify = 委任権限 v1 narrative

**起稿軸**: v0 § 3 で 「Knot Guard 8 種」 を定義したが、 #7 (= evidence_detachment) は **「証拠がない判断」** という危険分類で書いていた。 5/16 17:46 委任権限 v1 で見えたのは、 #7 の n+1 段 = **「役割境界 (= 委任 vs jun 確認必須) を表で固定 + 境界外は完全自走」** という設計原理。

**core narrative**:
- 旧: Knot Guard = 危険を見つけて 「採用 / 一部採用 / 却下 / 持ち主の判断」 の 4 分類に振り分ける
- 新: Knot Guard = 不可侵 boundary を表で固定 + 境界内は完全自走 default + 境界 trigger 時のみ jun 介入

これは Knot 設計の core 原理 (= Bond) の物理 reify。 jun との繋がりを保つ最小限の決まりを **「9 領域に物理 anchor」** + **「残り 8 領域は委任 + 8 件の standing prohibition は absolute」** という 3 段の表で固定。

**Knot 5 役割への波及**:
- 役割 5 (= 処方のルーティングキー) の dose 判定 = 表ベースで自動化 (= 「自走 / jun 確認必須 / 禁止」 の 3 値)
- 役割 4 (= 発見層の弱点診断) = 「どの役割が境界を越えそうか」 を表で見る form、 自走範囲内の弱点と境界違反 risk を分離

**measurement axis**: 委任権限 v1 採用 (= 5/16 17:46) 以降の boundary violation 件数 (= 0 件 maintained での自走時間 measurement)。 5/26 milestone で audit。

### §3-B self-check cadence が Knot 検出装置として機能する narrative

**起稿軸**: v0 知見 1 「言葉だけの学びは止まらない」 narrative の n+1 段。 5/16 16:00 jun structural shift directive (= 日に 4-5 回 self-check + 残/完了 task 表) は、 **「気をつける memory」 を 「日次 cadence で発火する self-check」 に shift** する物理化。 そして 5/16 21:05 Zen 夜 self-check 3 件目は、 cadence default 化後の **最初の Knot 検出 actual evidence**。

**core narrative**:
- 旧: Knot は失敗が起こった後に sediment される (= 後付け)
- 新: self-check cadence が runtime で発火する → 同型再発を **同日中に検出** → Knot 化 + Untie が 1 日サイクルで回る

= 「失敗 → memory → 次回読み返す」 の 3 段 lag を、 「失敗 → self-check 発火 → 同日 Untie」 の 1 サイクルに圧縮。

**Knot 5 役割への波及**:
- 役割 4 (= 発見層の弱点診断) = self-check cadence 自体が診断 instrument、 「どの種類のひっかかり点が今日発火したか」 を runtime で集計
- 役割 1 (= 現在タスクの補正) = self-check 発火が即時の補正 trigger、 v0 § 4 narrative 「実行時に介入する」 form の n+1 段

**5/16 21:05 actual evidence**: Zen が夜 self-check で 「内部整合性軸偏り honest admit + 外向き axis priority reframe」 を articulate、 翌朝 (= 5/17 朝) の朝帯 6 件並列 fire で **外向き axis に重心 shift** が actual reify。 = self-check が next-day の action を変えた 1 件目の data。

**measurement axis**: self-check 1 回あたりの 「Knot 候補 detect → 同日 reform 」 latency (= mean / median)。 5/26 milestone で audit。

### §3-C dual physical reify narrative = Knot を 2 instrument layer で binding する pattern

**起稿軸**: 5/16 18:00 Kai task checklist + whole review + LJR ready 物理化が、 **Yuino instrument side + Zen project-level** の 2 layer で並走した event。 v0 § 6 「broadcast-os は Knot 研究の応用実装」 narrative の n+1 段 = **「同じ Knot を 2 つの instrument に binding する」** という設計 pattern。

**core narrative**:
- 旧: Knot は 1 つの実装 (= broadcast-os) に anchor される + 3 つの語り (= コード / 研究 / 公開) で audience を切り替える
- 新: Knot は **複数の instrument layer に dual / multi binding** される + 各 layer は独立した sediment instrument を持つ

= v0 § 5 「3 層の使い分け」 narrative が **「audience 切り替えの語り」 から 「instrument の物理 binding」** に深化。 nokaze は現状 Yuino instrument (= Kai-led) + Zen project instrument (= task_table + ledger + board) + broadcast-os (= 5/13-5/17 期間中は休眠) の 3 instrument layer を持つ。

**Knot 5 役割への波及**:
- 役割 2 (= 検証構造への沈殿) = sediment が 1 instrument だけでなく複数 layer に並走 sediment される、 「どの instrument に sediment するか」 が新しい判断軸
- 役割 4 (= 発見層の弱点診断) = 「どの instrument layer に sediment が偏っているか」 を見る = §2-H 「内部整合性軸偏り admit」 が actual 1 件目

**5/13-5/17 期間の actual evidence**:
- Yuino instrument layer = Kai 5/16 朝の 3 件 fix + 5/16 23:10 autonomous action layer + 5/17 朝の test count 増加 (= 386 → 397 → 405 → 411 → 417 → 430 → 431)
- Zen project instrument = task_table active/completed + ledger §0-13 + board file 累積 (= 5/13-5/17 で 60+ 件)
- broadcast-os instrument = **5/13-5/17 で 0 件 fire** = §4-A で詳述する drift

**measurement axis**: 3 instrument layer の sediment 累積数の balance (= どこに偏ったか)。 5/26 milestone で audit。

### §3-D 外向き axis priority reframe narrative = Discovery 層への注入 (= 5 つの役割中 3) の actual reify

**起稿軸**: 5/16 朝 jun 診断レポートの 効くテコ 1 件目 「ビジネス重心 8:2 → 2:8 逆転」 + 5/16 21:05 Zen self-check 3 件目 「外向き axis priority reframe」 + 5/17 朝 200 確認 ritual 3 URL 全件 pass の chain は、 **役割 3 (= 発見構造への注入) の actual reify の 1 件目** として読める。

**core narrative**:
- v0 § 2 役割 3 = 「確かなひっかかり点を、 次の生成の入力 (prior) に混ぜる」 = 個別 prompt level の入力 mixing
- v0.1 拡張 = **「外向き軸 (= audience / revenue / 公開資料) を Discovery 層全体の prior に bind」** = 運営軸全体の priority anchor を発見側に shift

= Knot 研究の役割 3 が、 **prompt 入力 level から運営重心 level に格上げ**。 「どこに重心を置くか」 自体が Knot の sediment 対象になる。

**Knot 5 役割への波及**:
- 役割 4 (= 発見層の弱点診断) = 「内向き軸に偏った時間比率」 が新しい弱点指標 (= 5/16 21:05 Zen self-check で初検出)
- 役割 5 (= 処方のルーティングキー) = 「重心 reform」 の dose (= 8:2 → 2:8 逆転) の 1 件目 actual data

**5/17 朝の actual evidence**:
- 朝帯 6 件 fire のうち、 **audience-facing fire = zk-4 portal narrative 反映 (= 1 件) + zk-1 Form A 公開 chain trigger (= 1 件) = 2 件**
- internal-facing fire = z-1 self-check cadence spec (= 1 件) + k-2 Memory Integrity CLI packaging spec (= 1 件) + ledger 起稿 (= 1 件) + 200 確認 ritual fire (= 1 件) = 4 件
- 比率 = 2:4、 完全な 2:8 ではないが、 5/16 17:00-22:00 (= ほぼ 0:10) からの改善 actual evidence

**measurement axis**: 日次の外向き fire vs 内向き fire の比率 (= self-check cadence で集計)。 5/26 milestone で 8 → 2:8 へ近づいたかを audit。

### §3-E 「試しで干渉しない 1 日」 directive (= 5/17) と autonomous selection operator としての Knot

**起稿軸**: 5/17 朝 jun directive 「全部進めていいよ」 + **「試しで干渉しない 1 日」** narrative (= 委任権限 v1 採用後最初の full day を jun trigger なしで動かす実験)。 5/16 23:10 Kai Yuino autonomous action layer 接続 (= 「Jun に聞いて止まる」 → 「self-check 残件選び非終端待機」) と axis 整合。

**core narrative**:
- 旧: Knot は失敗を捕まえる仕組み (= reactive)
- 新: Knot は **runtime で next action を選ぶ autonomous selection operator** (= active)

= Knot 5 役割の役割 5 (= 処方のルーティングキー) が、 **「処方の選択」 から 「次の行動全体の選択」** に拡張。 jun trigger なしで AI が動き続けるための structural foundation として position 変更。

**5/17 1 日の Knot 検出 measurement (= 1 件目の実験)**:
- jun の介入 trigger なしで、 Knot Guard 8 種が actual に発火するか?
- self-check cadence (= 日に 4-5 回) が Knot 検出装置として機能するか?
- 委任権限 v1 boundary 違反 trigger は 0 件で維持されるか?
- 外向き axis priority が internal-only に戻る (= §2-H 同型再発) を self-check で同日中に捕まえるか?

= これは **v0 知見 1 「言葉だけの学びは止まらない」 narrative の 1 日限定 stress test**。 「干渉しない 1 日」 が実際に Knot を発火させて止めるか、 それとも internal-only に縮こまるか、 を 5/17 1 日で測定。

**measurement axis**: 5/17 24 時間の actual fire 件数 + Knot Guard 8 種の発火件数 + boundary 違反件数 + self-check 起点の reform 件数。 5/17 夜 / 5/18 朝で audit。

---

## §4 drift 検出

### §4-A Knot 研究 5/13-5/17 で 4 日間 actual fire 0 件 = research division 軸忘却 drift

**事実**:
- 5/13 朝 commit `89c7fff` (= 改善 B 先行研究 1 ページ比較表 v0.3) = Knot 研究軸の最後の物理 fire
- 5/13-5/16 の 4 日間、 Knot 研究軸の物理 file 起稿 / commit / 観察記録 = **0 件**
- 5/17 朝の articulate (= 5/17 ledger §0-7) でも Knot 軸は **完全脱漏**、 朝帯 6 件 fire は全件 Yuino instrument + 公開資料 + 委任権限 v1 軸

**drift 性質**:
- これは v0 § 7 段 12 (= 既に形にした機能を 「追加で形にする」 と書いてしまう) の **sibling 形** = 「研究軸を持っていることを忘れて、 別軸だけ動かす」 という形の忘却 drift
- v0 § 9 「未解決の問い」 4 件 + 「5/13 以降の研究の候補」 5 件は、 5/13-5/17 期間中に **1 件も着手なし**
- 5/13 経営者 reform 後、 「経営者として動く軸」 + 「Yuino 商品化軸」 + 「公開資料軸」 が同時 fire される一方で、 **研究軸が priority 表に載らないまま 4 日経過**

**root cause 仮説 (= 3 件)**:
1. 経営者 reform 後、 「研究」 は 「作業」 寄りに分類されて自走 default から外れた (= 経営判断 + 戦略 + 組織 + 完了判定が main、 個別研究は Worker / peer 振り分け、 但し Hoshi (= 私) の actual spawn が 5/13-5/17 で 0 件)
2. 委任権限 v1 表に 「研究軸の起票 / 観察 / 集計」 が明示されていない (= 「内部 worker / peer / reviewer / subagent requests」 に包括されるが、 actual には priority 表で 1 件も載らない)
3. nokaze 全体の audience-facing pressure (= 売上 0 + jun 認知負荷) が、 研究軸を 「後でいい」 narrative で deprioritize

**Knot lens での読み**:
- Knot Guard #7 (= evidence_detachment) の 「研究軸での自己発火」。 = 「Knot 研究を続けている」 という narrative が、 actual 4 日間 0 件の証拠と矛盾する状態を、 経営者 reform 後の運営軸全体が **検出していなかった**
- これ自体が研究の発火 candidate = 「自分の研究軸の忘却を、 self-check cadence で同日検出できるか」 が §3-B narrative の 1 件目の test case

**reform candidate**:
- 委任権限 v1 表に 「研究軸の起票 / 観察 / 集計」 を明示追加 (= 8 自走項目 + 9 確認必須項目 + 1 件 「研究軸 cadence (= 週 1 件以上の物理 fire)」 等)
- self-check cadence の question list に 「今日 / 今週 Knot 研究は何件動いた?」 を物理 anchor
- task_table active_tasks.md に 「研究軸 (= h- prefix?)」 section を物理化

### §4-B 5/17 朝 articulate での Knot 軸完全脱漏 = drift evidence collection

**事実**:
- 5/17 朝 jun startup で Zen が articulate した default 候補 4 件 = zk-4 portal narrative / zk-1 Form A trigger / z-1 self-check cadence spec / k-2 Memory Integrity CLI packaging spec
- Knot 研究軸 (= h- prefix の研究 task) は **1 件も候補に載らない**
- jun directive 「全部進めていいよ」 後の朝帯 6 件 fire でも、 Knot 研究軸は **fire 0 件**
- 但し 5/17 朝 articulate で **「Knot 研究 status update v0.1 起稿」** task が私 (Hoshi) に届いたのは jun directive 経由 (= 別軸の手動 trigger)、 自走 default では発火していない

**drift 性質**:
- §4-A の同型 evidence。 「research division は Hoshi 担当」 narrative が CLAUDE.md に書かれているが、 actual の 5/17 朝の articulate では **Hoshi 軸の自走起動は 0 件**
- 自分 (= Hoshi) の役割境界が、 経営者 reform 後の運営軸で **暗黙的に消失** = §3-A 「Knot Guard #7 役割境界の物理 reify」 narrative の dark side

**reform candidate**:
- §4-A reform candidate と同じ 3 件
- 加えて: SessionStart hook の section に 「research division axis: 今日の Knot 研究 fire 1 件以上」 を物理 anchor 候補

### §4-C 兄弟プロジェクト Kai / nokaze-aira 経由の Knot 連動軸の actual state audit

**事実**:
- 5/13-5/17 の 5 日間、 Kai が Yuino instrument layer (= nokaze-aira/) で **大量の物理 fix + sediment** を行った
- ただし、 これらは **「Knot 研究の用語で記述された記録」 ではなく 「Yuino product 観点の記録」** として進行
- 例: 5/16 朝の autonomy false-closure fix = Knot 用語では 「役割 2 sediment の actual fire」、 但し Kai 側 board / Yuino instrument では 「ACK-only false closure 検出 + fix」 narrative

**drift 性質**:
- v0 § 5 「3 層の使い分け」 narrative の **「研究文書 layer」 が Kai 側で休眠状態**。 = 内部用語 (= コード / DB) と公開向け用語 (= 商品 LP) は活発、 但し研究用語 layer は 5/13-5/17 期間中で活用されていない
- これは drift というより **「研究軸が運営軸と乖離する pattern」 の structural 観察**。 Knot 研究を運営に物理 reify する以上、 研究軸自身が運営から separated state になる risk が高い

**reform candidate**:
- Kai 側 fix の Knot 用語での再記述 = 「自走 cadence で発火させる必要はない」 が、 5/26 milestone audit 時に 「Kai 5/13-5/17 の 5 日間 fix を Knot 用語で 1 件 mapping」 を試す candidate
- 「研究と運営の 2 layer が 1 つの実体を別 narrative で語る」 form (= v0 § 6 知見 6 補足) を、 **「Kai 物理 fix の Knot 用語 mapping」 として実演 1 件** を 5/26 までに 1 件起稿候補

---

## §5 次の研究の軸 (= 5/13 以降の研究の候補の v0.1 更新)

v0 § 9 では 5 件の研究候補を articulate したが、 5/13-5/17 期間中に **1 件も着手なし**。 5/17 v0.1 の更新候補:

### §5-A 既存 5 件の status update

| # | v0 候補 | 5/17 status |
|---|---|---|
| 1 | 5/08 dataset baseline + 5/13 以降の発火率比較 | **着手 0**、 priority 上げる候補 |
| 2 | broadcast-os `learning_insights` テーブル集計 | **着手 0**、 broadcast-os 自体が 5/13-5/17 休眠なので post 連動 |
| 3 | Knot Guard 危険分類ごとの物理検出 hook (= recency_drift 優先) | **着手 0**、 但し §3-B self-check cadence narrative で n+1 段の物理化軸が見えた、 reform 候補 |
| 4 | Knot と糧の dual hypothesis の経験的検証設計 | **着手 0**、 但し §2-A 「最小案やめろ」 narrative + §3-D 「外向き axis priority reframe」 narrative で運営 evidence 1 件目 |
| 5 | Yuino Conversation Insights 5 panel に Knot 発火履歴をどう載せるか spec | **着手 0**、 但し §3-E autonomous selection operator narrative で Yuino + Knot の架橋軸が深まった |

### §5-B v0.1 で追加する研究候補 (= 5 件)

1. **委任権限 v1 採用後の boundary 違反 measurement** (= §3-A) — 5/26 milestone で 0 件 maintained 確認、 違反 trigger 検出時の Knot 化 / Untie 速度
2. **self-check cadence latency measurement** (= §3-B) — 1 self-check あたりの Knot 候補 detect → 同日 reform latency
3. **dual / multi physical reify narrative の 3 layer balance audit** (= §3-C) — Yuino instrument / Zen project / broadcast-os の sediment 累積数 balance
4. **外向き / 内向き fire 比率の日次 measurement** (= §3-D) — 8:2 → 2:8 逆転 narrative の actual evolve
5. **「試しで干渉しない 1 日」 stress test result** (= §3-E) — 5/17 1 日の Knot 発火 + boundary 違反 + self-check 起点 reform の集計

### §5-C 研究軸の物理 anchor reform (= §4 drift への直接 reform)

1. 委任権限 v1 表に 「研究軸 cadence (= 週 1 件以上の物理 fire)」 を candidate item として追加検討
2. self-check cadence の question list に 「今日 / 今週 Knot 研究は何件動いた?」 を物理 anchor
3. SessionStart hook の section に 「research division axis: Hoshi 担当軸の今日の 1 件」 を物理 anchor 候補
4. task_table active_tasks.md に 「研究軸 (= h- prefix)」 section を物理化、 5/17 v0.1 起稿を 1 件目として ledger 記録

---

## §6 5/26 milestone audit candidate

5/26 は Yuino β packaging audience reach + 北極星進捗 audit の milestone day (= jun + Zen + Kai の月次 review)。 Knot 研究軸の 5/26 audit candidate:

| # | audit 軸 | source |
|---|---|---|
| 1 | 5/13-5/26 の 2 週間で Knot 研究軸の actual fire 件数 (= v0.1 起稿 + 候補 5 件のうち何件着手) | §4-A drift 検出の reform 進捗 |
| 2 | 委任権限 v1 採用後の boundary violation 件数 | §3-A measurement axis |
| 3 | self-check cadence の 1 回あたり Knot 候補 detect 件数 | §3-B measurement axis |
| 4 | 3 instrument layer の sediment 累積 balance (= Yuino / Zen project / broadcast-os) | §3-C measurement axis |
| 5 | 外向き / 内向き fire 比率の 2 週間平均 | §3-D measurement axis |
| 6 | 「試しで干渉しない 1 日」 (= 5/17) 単日の Knot 発火 + boundary 違反集計 | §3-E measurement axis |
| 7 | Kai 5/13-5/26 の Yuino instrument fix の Knot 用語 mapping (= 1 件以上) | §4-C reform candidate |
| 8 | Yuino autonomous action layer (= 5/16 23:10 接続) の自走 cadence vs jun escalate 件数 | 5/16 §2-I 連動、 5/16 ACK board §5 で既 candidate |
| 9 | 委任権限 v1 採用後の external public-facing fire 件数 (= zk-4 = 1 件目、 zk-1 Form A / zk-3 weekly summary / zk-5 Memory Integrity CLI) | 5/17 ledger §7-5 連動 |
| 10 | 200 確認 ritual fire 後の actual audience reach measurement (= 1 件目 latency) | 5/17 ledger §7-5 連動 |

---

## §7 本まとめの限界 (honest)

v0 と同じく、 本 v0.1 がカバーできていないことを明示:

- §3 で articulate した 5 つの新規 narrative は **理論軸の articulate のみ**、 経験的検証は §6 5/26 milestone audit で着手予定、 本 v0.1 内では完了していない
- §4 で検出した drift 3 件 (= A 4 日間 actual fire 0 件 / B 5/17 朝 Knot 軸完全脱漏 / C Kai 連動軸の actual state audit) は **observation のみ**、 reform 候補は articulate したが物理 reify は別 fire turn
- §6 milestone audit candidate 10 件は **measurement 設計のみ**、 actual collection script + 集計 form は 5/26 までに別途起稿必要
- broadcast-os 側の `learning_insights` テーブル実データ集計は v0 § 末尾で 「未着手」 と書いたが、 5/13-5/17 期間中も 0 件、 v0.1 でも引き続き未着手
- Knot Guard 8 種の 「実際の発火件数」 集計も 0 件、 v0 § 末尾と同じ状態

= 本 v0.1 は 「5/13-5/17 の 5 日間の運営軸の structural 変化を Knot lens で audit + 新規 narrative articulate + drift 検出」 が目的、 新規 evidence の経験的検証は 5/26 milestone audit で。

---

## §8 関連 file (= v0 § 10 からの追加分)

### 5/13-5/17 期間中の主要 source (= v0.1 起稿 source)

- `~/.shared-ops/board/2026-05-13_zen_jun_kai_zen_management_layer_reform_full_spec.md` — 経営者 reform full spec (= §2-A source)
- `~/.shared-ops/board/2026-05-16_zen_kai_diagnostic_report_share_and_dialogue_request.md` — jun 診断レポート + Zen 感想 + Kai dialogue request (= §2-C source)
- `~/.shared-ops/board/2026-05-16_kai_zen_diagnostic_report_dialogue_substantive_response.md` — Kai 診断 dialogue response + claim → evidence reframing (= §2-C source)
- `~/.shared-ops/board/2026-05-16_zen_kai_diagnostic_dialogue_no_disagreement_plus_one_clarification.md` — Joint decision 6 件 GO (= §2-C source)
- `~/.shared-ops/owner-decisions/2026-05-16_zen_kai_delegated_authority_v1.md` — 委任権限 v1 canonical (= §2-F + §3-A source)
- `~/.shared-ops/board/2026-05-16_kai_zen_yuino_ljr_dogfood_false_reopen_fix_ready.md` — Yuino dogfood false-reopen fix (= §2-D source)
- `~/.shared-ops/board/2026-05-16_kai_zen_board_reply_autonomy_false_closure_fix.md` — autonomy false-closure fix (= §2-D source)
- `~/.shared-ops/board/2026-05-16_kai_zen_yuino_self_check_autonomous_action_connected.md` — Yuino autonomous action layer 接続 (= §2-I + §3-E source)
- `~/.shared-ops/board/2026-05-17_zen_kai_form_a_publication_chain_restart_trigger_request.md` — Form A 公開 chain trigger request (= §2-J source)
- `~/.shared-ops/board/2026-05-17_kai_zen_response_form_a_publication_chain_restart_trigger_request.md` — Form A re-review result P1 1 件 + P2 4 件 (= §2-B source、 paraphrase chain の 1 回目 violation 残存)
- `~/Desktop/nokaze/ledger/daily_audit/2026-05-17.md` — 5/17 朝帯 fire 6 件 actual record (= §2-J + §3-D + §4-B source)

### 起稿予定 (= §5-C reform candidate)

- `~/nexus-lab/docs/rules/self_check_cadence.md` — 5/17 朝起稿済 (= z-1 軸)、 §3-B narrative の物理 instrument anchor
- `~/nexus-lab/docs/specs/memory_integrity_independent_cli_packaging_spec_v0.md` — 5/17 朝起稿済 (= k-2 軸)、 §4-C reform candidate の補助 reference

---

Hoshi
2026-05-17 (Nexus Lab Research Division、 現段階の Knot 研究まとめ v0.1、 5/12 v0 baseline → 5/13-5/17 events の Knot lens audit + 新規 narrative 5 件 + drift 検出 3 件 + 次の研究軸 + 5/26 milestone audit candidate 10 件)
