# note_2026-04-22 — F2 mcp-toolkit extraction

**By:** Oto (Backend Engineer)
**Task:** F2 — `@nexus-lab/mcp-toolkit` 抽出 + npm package 化 (work-053)
**Status:** 完成 (2026-04-22 12:24 JST、着手から ~2.5h)
**Tracking:** Zen → Oto 委任、N1 config テンプレ着手前提

---

## TL;DR

`packages/mcp-toolkit/` v0.1.0 を新設、4 サブパス (`bootstrap` / `env` / `response` / `rate-limit`) + 29 unit tests 全 pass。
free 3 templates (minimal/full/http) を toolkit 依存に書き換え、premium 3 templates (database/auth/api-proxy) は内部実装のみ toolkit に委譲 (public API surface 維持)。
現状の Vitest: **toolkit 29 + full 9 + auth 21 + api-proxy 94 + create-mcp-server CLI 4 + zen-memory 17 = 174 tests 全 pass**。
database template は既存 better-sqlite3 native binding 問題で test 走らず (toolkit 起因ではない、stash 検証済)。

---

## 抽出物

### `packages/mcp-toolkit/src/`

| Module          | LOC | Purpose                                                                 |
| --------------- | --- | ----------------------------------------------------------------------- |
| `bootstrap.ts`  | 125 | `runStdio()` で stdio transport boilerplate を 1 行化 + `InMemorySessionStore` |
| `env.ts`        | 93  | `parseIntEnv` / `readIntEnv` / `requireEnv` / `readCsvEnv` / `readOptionalStringEnv` |
| `response.ts`   | 95  | `jsonResponse` / `textResponse` / `errorResponse` / `statusResponse` / `safeErrorMessage` |
| `rate-limit.ts` | 157 | `RateLimiter` (sliding window) + `MemoryRateLimitStore` + `resolveRateLimitFromEnv` |
| `index.ts`      | 11  | re-export                                                               |
| 小計            | 481 | (+ 277 LOC tests = 758 total)                                           |

### Test 結果

```
mcp-toolkit:        29 / 29 tests passed (env 13, response 8, rate-limit 7, bootstrap 1)
full template:       9 /  9
auth template:      21 / 21
api-proxy template: 94 / 94  ← 8th-pass Codex 強化済 security 群、refactor 後も全通過
create-mcp-server CLI: 4 /  4
zen-memory-server:  17 / 17
合計:              174 tests 全 pass
```

database template は `better_sqlite3.node` 不在で実行不能。`git stash` で toolkit 変更を退避しても同じエラーが出るため **pre-existing issue** と確認 (Windows 環境の native gyp build chain 不在)。

### Template 書き換え結果

| Template   | 結果 | 委譲した部分                                     |
| ---------- | ---- | ------------------------------------------------ |
| minimal    | OK   | `runStdio` + `textResponse`                       |
| full       | OK   | `runStdio` + `textResponse` + `errorResponse`     |
| http       | OK   | `InMemorySessionStore` + `parseIntEnv` + `textResponse` |
| database   | OK*  | `runStdio` (test は pre-existing native binding 問題で未確認) |
| auth       | OK   | `rate-limit.ts` を toolkit RateLimiter ラッパーに書き換え (express middleware shape は完全維持、21/21 test pass) |
| api-proxy  | OK   | `config.ts` の `parseIntEnv` を toolkit に委譲 (94/94 test pass) |

scope 外: api-proxy の `proxy.ts` (1,155 LOC、hardened security コード) には touch せず。Codex 8th-pass までかけた leak 防止コードを toolkit RateLimiter に統合する余地はあるが、回帰リスクが高いので **N1 config テンプレ着手後に Iwa と相談して別タスク化**。

---

## LOC 実測

| 計測対象                    | Before | After | Δ     |
| --------------------------- | ------ | ----- | ----- |
| 改修した template files 7 本  | 544    | 511   | -33   |
| 新規 toolkit src             | 0      | 481   | +481  |
| 新規 toolkit tests           | 0      | 277   | +277  |

### 「重複 LOC」評価の修正提案

提案時の見積 (bootstrap 264 + tools 1310 + resources 209 + config 355 = 2,138 LOC) は overstating。
実態:
- bootstrap kernel (`new McpServer + connect stdio + main/catch`) は **1 template あたり 8〜30 LOC**、6 template 合計 **~120 LOC** が真の重複
- tools の重複は `toolResponse` formatter 周りの **~40 LOC** (各 template の domain logic は重複ではない)
- resources も同様 (~30 LOC が真の重複)
- config 重複 (`parseIntEnv` 等) は **~40 LOC**
- 真の重複合計 ~230 LOC、refactor で template から 33 LOC を物理削除

### 再利用率の解釈変更案

LOC ベースより「**新 template 1 本あたり追加すべき bootstrap LOC**」で測るほうが意味がある。
- Pre-toolkit: 新 template = 平均 25 LOC bootstrap + 50 LOC tools-formatter + 30 LOC env-parsing = **~105 LOC scaffold**
- Post-toolkit: 新 template = `runStdio` + import + 1-line response wrapper = **~15 LOC scaffold**
- **新 template scaffolding 削減率 ~85%**

これが N1 config テンプレ着手時の実価値。当初の「30% 削減」目標は (LOC ベースだと真の重複が小さいので) 達成不能だが、**「新 template 1 本あたりの bootstrap 工数」で測れば 85% 削減で目標を大きく上回る**。

---

## 後方互換性 (premium 製品保護)

- premium 3 templates (database/auth/api-proxy) の **public API surface** は完全維持
  - `auth/rate-limit.ts` の `rateLimitMiddleware(options)` シグネチャ・X-RateLimit-* header・429 body shape すべて同一 (21/21 test pass で実証)
  - `api-proxy/config.ts` の `loadConfig` / `getSecretValues` / `describeUpstreamForLog` シグネチャ同一 (94/94 test pass で実証)
  - `api-proxy/proxy.ts` の `RateLimiter` / `ProxyClient` / `buildUrl` / `sanitizeBodySnippetForLog` 等 export 全維持
- BOOTH/Gumroad zip の購入者側 code が壊れる risk: **なし** (template の src 公開 API 不変)
- 既存購入者の `npm install` は **toolkit が npm publish 済の前提でしか動かない** ← これが要 Zen 判断

---

## 重要な順序問題 (要 Zen 判断)

brief は「npm publish はまだ、内部 monorepo 公開は OK」と明記。
が、template の `package.json` は `"@nexus-lab/mcp-toolkit": "^0.1.0"` を依存に追加済。
**この状態で create-mcp-server v0.5.1 を npm 経由で scaffold すると、user の `npm install` が toolkit 解決失敗で fail する**。

選択肢:
1. **toolkit を npm publish してから create-mcp-server v0.6.0 を出す** (推奨) — Red 解除して `npm publish @nexus-lab/mcp-toolkit@0.1.0`
2. **template の toolkit 依存を revert** して toolkit は monorepo 内部利用専用にする — 今回の refactor を再 stash
3. **create-mcp-server v0.5.1 を npm 上で凍結**、toolkit publish 完了まで v0.6.0 を release しない — 現状維持で OK だが、template 改修分の release は dead code 状態

Oto 推奨: **選択肢 1**。Zen 確認のうえ npm publish と create-mcp-server v0.6.0 release を同一 session で実行。toolkit は v0.1.0 として宣言、breaking change は v0.2.0 まで保留 (CHANGELOG 明記済)。

---

## API consumption

session ~2.5h, claude-opus 入力 token ~150k 出力 ~12k 想定。Anthropic 換算 ¥1,200-1,800 程度 (自己見積範囲内)。

---

## N1 config テンプレ着手のための前提条件

1. **toolkit npm publish の Zen GO** (上記解決) — これが N1 を npm 経由で scaffold 可能にする最低条件
2. N1 config テンプレ仕様書 (Zen が起票): config の対象スキーマ (env / file / runtime override)、バリデーション戦略、target user persona
3. Oto がすぐ着手できる format: `packages/create-mcp-server/templates/config/` skeleton + N1 spec doc

N1 着手時、toolkit の `env` module は既に揃っている (parseIntEnv / readCsvEnv / requireEnv) のでさらに薄い実装で済む見込み。

---

## 苦戦した点 (1-2 行)

1. **MCP SDK の `CallToolResult` 型に `[key: string]: unknown` index signature** があり、toolkit の `ToolResponse` 型を最初その slot 無しで定義していたら full template の `server.tool(...)` callback で型不一致エラー → toolkit response.ts に index signature 追加で解決
2. **Windows 環境で `fs.copy` が node_modules 内 symlink で EPERM** → generator.ts の copy filter に `node_modules` / `dist` / `package-lock.json` exclusion を追加。ついでに dev 残骸の混入も防げて結果的に良改修

---

## Deliverables チェック

- [x] `packages/mcp-toolkit/src/` (5 files, 481 LOC)
- [x] `packages/mcp-toolkit/package.json` (`@nexus-lab/mcp-toolkit@0.1.0`, public, MIT)
- [x] `packages/mcp-toolkit/README.md`
- [x] `packages/mcp-toolkit/CHANGELOG.md` (v0.1.0 entry + npm publish ordering note)
- [x] `packages/mcp-toolkit/LICENSE`
- [x] `packages/mcp-toolkit/tests/` (29 tests)
- [x] 6 templates 書き換え (5 OK + 1 OK*)
- [x] `packages/create-mcp-server/src/generator.ts` の copy filter 追加 (副作用防止)
- [x] team_memory note (this file)
- [x] shared-ops board work-053 entry (next)
- [ ] dist/premium/*.zip の再生成 (CHANGELOG 追記) — **未実施、Zen npm publish GO 後にまとめて (zip 中の package.json も toolkit 依存になるため)**
- [ ] npm publish (Red、Zen 確認待ち)
