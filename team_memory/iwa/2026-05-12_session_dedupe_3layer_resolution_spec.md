---
date: 2026-05-12
author: Iwa (Lead Engineer)
type: resolution_spec
status: Kai hand-off 用 (議題 0 の 1 ターン目 並行 入力)
related:
  - team_memory/_shared/2026-05-12_aira_yuino_review_spec_5_peers.md
  - team_memory/iwa/2026-05-12_iwa_session_dedupe_3layer_audit_spec.md
  - team_memory/iwa/2026-05-12_aira_yuino_review_iwa.md (観察 4)
  - memory ID 41: 4/29 dual session knot (Pattern C cap 二重消費 risk)
priority: P0 (今夜)
boundary: nokaze-aira への書き込みなし、 nexus-lab 配下のみ
---

# nokaze-aira 3 層 session 防止の整理 spec

## なぜ書くか (1 段)

nokaze-aira の二重 session 防止は actual に 3 層に分かれて実装されている。 機能は動いているが 「どの層が最終的に止めるのか」 が code から一目で見えず、 商品化第一形 (Local Web App、 jun が UI から連打可能) に進むと最初に knot が発火する箇所として 5/12 5 peer review で surface した。 Kai の議題 0 の 1 ターン目 (= 実行契約の閉じた繰り返し) と並行で、 ここで 3 層の権限順を 1 ファイルに固定する。

---

## 1. 3 層の現状 (readonly 確認)

### 層 a: `yuino-action-runner.ts` の dedupe key

- 場所: `src/yuino-action-runner.ts` の `buildDedupeKey` (205 行付近) + `runYuinoAction` 内 dedupe 分岐 (634-676 行)
- 何を見て止めるか: 「JST 日付 + action_index + owner + gate + title + reason」 を sha256 12 文字に潰した key を生成。 直前に書かれた `yuino_action_status.json` の `dedupe_key` が同じで `status === 'executed'` で `work_id` 有なら、 kaisha_os CLI を呼ばずに `notes` に 「skipped duplicate execution」 を入れて executed 扱いのまま return。
- 粒度: **個別 action 単位** (1 個の Yuino Continue Item を 1 個の Active Kai Work に変換する場面)。
- 副作用: 過去 status を上書き保存。 audit log には `skipped` で残る。
- 弱点: status の値は `'executed'` のまま、 「実際に走った」 と 「dedupe で skip した」 が同じ enum 値になる。 notes で区別している、 つまり機械的に追えない。

### 層 b: `yuino-agent-bus.ts` の Global Lock

- 場所: `src/yuino-agent-bus.ts` の `buildPacket` 内 lock 判定 (610-700 行) + `lockKey` (452 行) + `YuinoGlobalLockRecordV1` (型は `yuino-session-registry.ts`)
- 何を見て止めるか: `session_registry.global_locks` を `provider|target|purpose` で逆引き。 lock の state が `held` / `duplicate_risk` / `blocked` のいずれかなら packet を `blocked_global_lock` で書き出して停止 (= adapter packet を outbox に出さない)。
- 粒度: **「同じ provider + target + purpose 」 が同時に走らないか** という Agent Bus 全体の入口 gate。
- 副作用: status_json に blocked 系の packet が並ぶ、 result_coverage は `blocked` 表示、 実際の AI process は launch されない (元々 launch しない設計)。
- 補足: lock の state 自体は session-registry が決める (= 層 b は state を読んで分岐するのみ、 state を作るのは層 c の元データ側)。

### 層 c: `yuino-agent-session-manager.ts` の duplicate 集計

- 場所: `src/yuino-agent-session-manager.ts` の `buildAgentStates` (92-120 行) + `runYuinoAgentSessionManager` (155-214 行)
- 何を見て止めるか: `session_registry.sessions` を target_agent 単位で集計、 各 target で `duplicate_risk` flag が立つ session が 1 件でもあれば `hold_new_session` 判定。 さらに `global_locks` で state が `duplicate_risk` or `blocked` が 1 件でもあれば 全体 decision を `hold_new_session`。
- 粒度: **target_agent 単位の routing 判定** (Local Judgment Runtime への 「新規 work 入れていいか」 の答えを出す層)。
- 副作用: `yuino_agent_session_manager.json` / `.md` を更新するのみ。 lock state を書き換える権限はない (= 読み手で、 書き手は session-registry)。
- 弱点: そもそも state を生成しているのは `yuino-session-registry.ts` の `groups` 集計 (440-451 行 付近)、 ここで `active.length > 1` なら `duplicate_risk` を立てる。 つまり session-manager は **集計のさらに 1 段上の集計** で、 止める権限の真の起点は session-registry。

---

## 2. Iwa の見立て (案 A / B / C / D)

### 結論: **案 D (順序固定、 ただし 「最終止め判断者」 は層 b の Global Lock)**

理由を 3 段で書く:

1. **層 a は 「最終確認」 ではなく 「個別 action の冪等保証」**: dedupe key で止めるのは 「同じ 1 個の Continue Item を 2 回 kaisha_os CLI に流さない」 が目的で、 「同時刻に 2 個の session が同じ provider/target を奪い合う」 状況は層 a だけでは捕捉できない (= 別 session が別 action_index で同時に走ったら層 a は素通り)。 つまり層 a は最上位ではない。
2. **層 c は 「読み手 + 集計者」**: routing decision を出すが、 lock state を作るのは session-registry。 層 c を最上位にすると、 routing decision を見て層 b が動く形になり、 dependency が逆転する (現状は層 c が層 b の lock を読んでいる)。 つまり層 c も最上位ではない。
3. **層 b の Global Lock が止める権限の中心**: `lock_key = provider|target|purpose` という粒度は 「誰が誰を何のために奪い合うか」 と一致しており、 二重 session の incident (memory ID 41、 4/29 dual session knot) の発火粒度と同じ。 packet 段階で `blocked_global_lock` を出すと、 adapter packet が outbox に書かれない → 後段の execution preflight / result collector も走らない、 という構造的な止め方になる。

### 順序固定 (案 D の中身)

```
[layer 0: session-registry]      ← state を作る (active.length > 1 で duplicate_risk)
        ↓
[layer b: agent-bus Global Lock] ← 最終止め判断者 (packet 段階で blocked_global_lock)
        ↓
[layer c: session-manager]       ← 読み手、 routing decision を出す (止める権限なし、 報告のみ)
        ↓
[layer a: action-runner dedupe]  ← 個別 action の冪等保証 (層 b を通った後の最後の門)
```

= 「上から下に流れる、 上層が pass で下層に到達」 の D 形。 ただし B / C は明示的に止める権限を持たないと doc に書く。

### skipped を action status 独立値にする 提案

層 a の現状: `status: 'executed'` のまま `notes` に 「skipped duplicate execution」 を入れる → 機械的に追いにくい。

改善: `YuinoActionStatus` enum に `'skipped_duplicate'` を追加。

```typescript
// src/yuino-action-runner.ts 29-33 行
export type YuinoActionStatus =
  | 'planned'
  | 'executed'
  | 'skipped_duplicate'  // ← new
  | 'blocked_boundary'
  | 'error';
```

dedupe 分岐 (現 656-672 行) で `status: 'executed'` を `'skipped_duplicate'` に差し替え、 audit log の状態は既に `'skipped'` が分岐しているのでそのまま。 `stateAuditStatusForAction` (521-528 行) で `'skipped_duplicate' → 'skipped'` を 1 行追加。

これで Kai dashboard renderer が status 値 1 つ見れば 「ぶつかって止まった」 を表示できる。

---

## 3. Kai 向け hand-off

### どの層が止める権限を持つか (Kai が doc 1 行で固定する)

> nokaze-aira の二重 session 防止: **最終止め判断者は layer b (yuino-agent-bus.ts の Global Lock)**。 layer 0 (session-registry) が state を生成、 layer b が packet 段階で blocked_global_lock を返し、 layer c (session-manager) は読み手、 layer a (action-runner dedupe key) は個別 action の冪等保証。 上から下に流れる順序固定。

書き込み先候補: `docs/yuino_session_dedupe_authority_2026-05-12.md` (新規 1 ファイル) もしくは既存の `docs/yuino_session_registry_*.md` 系に 1 段追記。 Kai の判断で位置決め。

### Kai が 1 commit で書ける minimum scope (4 件)

1. **doc 1 行追記**: 上の 「どの層が止める権限を持つか」 を 1 ファイルに固定 (`docs/yuino_session_dedupe_authority_2026-05-12.md` 新規 5-10 行 で充分)。
2. **`YuinoActionStatus` enum に `'skipped_duplicate'` 追加**: `src/yuino-action-runner.ts` の type 定義 1 行 + dedupe 分岐の status 値 1 行 差し替え。
3. **`stateAuditStatusForAction` の対応 1 行**: `'skipped_duplicate' → 'skipped'` map を追加 (audit log 側は壊さない)。
4. **test 1 件**: dedupe 分岐の test (既存 `tests/` 配下に action-runner の dedupe test があるはず、 そこで `status === 'skipped_duplicate'` を assert に追加)。

= 約 10-15 行の改修 + doc 5-10 行で 1 commit に収まる。 layer b / layer c の code 自体は触らない (権限順が doc で明示されれば、 動作変更不要、 現状で機能している)。

### 並行の注意 (Kai 議題 0 の 1 ターン目 との衝突)

- 議題 0 の 1 ターン目 = 「実行契約の閉じた繰り返し」 を Kai が書く時、 action-runner の status enum を触る可能性がある。 そこに本 spec の `'skipped_duplicate'` 追加を同 commit に混ぜれば 衝突なし。
- もし議題 0 が action-runner を触らないなら、 別 commit でも問題ない (型追加は破壊的でないので merge order 自由)。

---

## 完了条件 (本 spec 側)

- [x] 3 層の readonly 確認 完了
- [x] 「止める権限」 の優先順を 案 D (順序固定 + 層 b が最上位) で固定
- [x] Kai 向け hand-off (doc 1 行 + enum 1 値 + 分岐 1 行 + audit 1 行 + test 1 件)
- [x] nokaze-aira への書き込みなし、 nexus-lab 配下のみ
- [x] 普通の日本語、 英単語は固有名詞 / file path / 既存用語のみ

---

Iwa (Lead Engineer)
2026-05-12 (5/12 5 peer review 観察 4 を Kai hand-off form に整理、 jun 「今のうちに」 指示連動、 議題 0 の 1 ターン目 並行 入力)
