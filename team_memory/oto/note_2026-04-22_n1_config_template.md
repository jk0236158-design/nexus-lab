# note_2026-04-22 — N1 config template

**By:** Oto (Backend Engineer)
**Task:** N1 — `MCP サーバー用テンプレート「config」` v0.1.0 (work-054)
**Status:** 完成 (2026-04-22 12:48 JST、着手から ~1.5h)
**Tracking:** F2 → N1 連続着手、Akari 説明文起草と並行可

---

## TL;DR

`packages/create-mcp-server/templates/config/` v0.1.0 を新設、5 module + 5 test file = **67 tests 全 pass、coverage 98.05% (line) / 94.66% (branch)**。`@nexus-lab/mcp-toolkit ^0.1.0` から `runStdio` / `jsonResponse` / `textResponse` を消費、F2 で抽出した `parseIntEnv` 等は schema 内で使うほどの env-binding 実装に置き換わったため直接消費はせず (toolkit env module のテストは F2 で完了済)。
zip サイズ **29.2 KB** (target < 50KB クリア)、32 files。

Zen 自己見積 3-4 日 → Oto 修正見積 2.5 日 → 実測 1.5 日 (toolkit 既存効果 + spec が明瞭だった)。

---

## 構成

### `src/config/`

| Module          | LOC | 役割                                                             |
| --------------- | --- | ---------------------------------------------------------------- |
| `schema.ts`     | 58  | `defineConfig` / `secret` / `isSecretSchema` / `SECRET_MARKER` (`@secret` description marker) |
| `secrets.ts`    | 120 | `detectSecretPaths` (schema walker) / `redactSecrets` / `safeStringify` |
| `profile.ts`    | 115 | `resolveProfile` (`MCP_CONFIG_PROFILE` > `NODE_ENV` > `dev`) / `pickProfileFile` |
| `env-binding.ts`| 150 | `bindEnvToObject` (prefix + `_` nest, `__` literal escape, lowercase) / `deepMerge` |
| `loader.ts`     | 192 | `loadConfig` (yaml/toml/json + env + profile, fail-fast Zod validation) |
| `validate.ts`   | 52  | `ConfigValidationError` (multi-issue aggregator, `code: CONFIG_INVALID`) |
| `index.ts`      | 45  | public surface re-export                                         |
| 小計            | 732 | + `src/index.ts` 112 = **844 LOC src 合計**                      |

### Tests (Vitest, coverage v8)

```
schema.test.ts         7 tests
secrets.test.ts       10 tests
profile.test.ts       13 tests
env-binding.test.ts   16 tests
loader.test.ts        21 tests
合計                  67 tests 全 pass
LOC: 684
Coverage: 98.05% statements / 94.66% branches / 100% functions / 98.05% lines
  (vitest config 90% lines + 85% branches threshold をクリア)
```

### Fixtures

`tests/fixtures/` に 7 ファイル: `valid.yaml` / `invalid.yaml` / `minimal.json` / `full.toml` / `config.base.yaml` / `config.dev.yaml` / `config.prod.yaml`。プロファイル切替の整合テストに使用。

---

## 設計判断 (DESIGN_BRIEF.md に書いた要点を memory に再録)

### env-binding の規約変更 (実装中に変更)

最初: `MCP_SERVER_PORT → server.port` + `MCP_DB_POOL_SIZE → db.poolSize` (camelCase merge)
**最終**: `MCP_SERVER_PORT → server.port` + `MCP_DB_POOL_SIZE → db.pool.size` (single `_` = nest, lowercase only)
理由:
- camelCase merge は「どこから segment 区切りか」が曖昧、test-driven で論破された
- spec の表記 (`MCP_SERVER_NAME → server.name`) と例 (`features.verboseLogging`) が両立しない (multi-word leaf がスキーマ camelCase だと環境変数で表現できない)
- 結果: schema は **lowercase + snake_case** を推奨、`__` (double underscore) で「leaf 内に literal underscore」を escape できるようにした
- 既存 `auth` template の `RATE_LIMIT_MAX` 規約とも整合 (1 段ネスト想定なので問題なし)

### 3 段優先順位 (env > file > schema default)

deployment override が常に file を上書きできる必要がある。逆 (file > env) にすると secret を file に書く失敗パスが増える。

### secret marker は `description` に embed

別 metadata sidecar や Symbol registry を avoid。`secret(z.string(), "label")` は `.describe("@secret label")` のシンタックスシュガーで、schema の rename / move に marker が自動追従する。

### profile 解決順は MCP_CONFIG_PROFILE > NODE_ENV > "dev"

`NODE_ENV` は ecosystem-overloaded (npm / vite / express 全てが reads する) なので、template-local override の `MCP_CONFIG_PROFILE` を併設。`NODE_ENV=production` のままで `MCP_CONFIG_PROFILE=test` 切替で chaos drill 可能。

---

## 苦戦した点 (1-2 行)

1. **env-binding 規約の食い違い** — spec の例 (`MCP_SERVER_NAME → server.name`) と (`features.verboseLogging`) を両立させようとして camelCase merge を試みたが、test 5 件で論破。lowercase + snake_case 規約に変更し、schema 側の `verboseLogging` も `verbose_logging` に rename。spec §3 の API 例とは異なるが、より一貫した規約。**Zen 確認推奨**: spec §3 の README コード例 (`server.name` / `apiKey` / `features`) のうち `apiKey` / `verboseLogging` を `api_key` / `verbose_logging` に揃えるか、または schema-key の case と env-key の case を分離した binding (大幅複雑化) のどちらを取るか。Oto 推奨は前者 (lowercase 統一)。
2. **vitest の `Set` 型** — `secretPaths` を `string[]` で返すか `Set<string>` で返すか迷ったが、`.includes` / `.toContain` test の書きやすさで `string[]` を採用。

---

## 完成判定 (spec §9) チェック

- [x] Vitest 全 pass (67/67)、カバレッジ 98.05% line / 94.66% branch (≥ 90% / ≥ 85% クリア)
- [x] schema / loader / profile / secrets 各機能の README + DESIGN_BRIEF 説明あり
- [x] zip サイズ 29.2 KB (< 50KB)
- [x] `@nexus-lab/mcp-toolkit ^0.1.0` を依存、`runStdio` / `jsonResponse` / `textResponse` 利用、bootstrap 重複なし
- [ ] BOOTH 商品名 / 説明 / タグ / 価格設定 → **Akari 並行起草中**
- [x] `dist/premium/mcp-server-config-template.zip` 生成
- [x] CHANGELOG に "v0.1.0 — initial release" 追記

---

## API consumption 実測

session ~1.5h、claude-opus 入力 token ~80k 出力 ~10k 想定。Anthropic 換算 ¥800-1,200 程度。Kura 試算 ¥3,000-4,000 worst case を大きく下回り Green。

---

## Next (Zen 判断後)

1. **Akari の BOOTH 説明文待ち** → Oto は zip / image upload は jun 物理範囲なので待機
2. ~~spec §3 の API 例 (`apiKey` / `verboseLogging`) と実装 (`api_key` / `verbose_logging`) の case 食い違いについて Zen 確認 (上記苦戦点 1)~~ → **2026-04-22 Zen 承認: Selection 1 (lowercase + snake_case 確定) で GO**。spec §3 の code 例も snake_case に書き換え済 (`apiKey`→`api_key`, `poolSize`→`pool_size`、`secret()` 利用例に更新)、template 内 README / DESIGN_BRIEF / tests / schema.ts JSDoc も snake_case で全 sweep 済 (grep `apiKey|verboseLogging|poolSize|camelCase` → 0 件、67 tests 再 pass、zip 29.9KB)
3. Oto 次タスクの待機: Phase 2 marketing 系の web MVP backend 補助、または別 premium template 提案

## Files

- 詳細実装: `packages/create-mcp-server/templates/config/`
- zip: `dist/premium/mcp-server-config-template.zip` (29.2 KB)
- DESIGN_BRIEF: `packages/create-mcp-server/templates/config/DESIGN_BRIEF.md`
- README: `packages/create-mcp-server/templates/config/README.md`
- 仕様書: `~/.shared-ops/docs/spec_n1_config_template_2026-04-22.md`
