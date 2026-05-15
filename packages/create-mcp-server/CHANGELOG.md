# Changelog

All notable changes to `@nexus-lab/create-mcp-server` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.2] — 2026-05-16

jun 明示 GO (= 5/16 朝) を受けて publish。npm publish 実行 + 200 確認 ritual 経由で reify。

### Added

- `typecheck` npm script (`tsc --noEmit`) を `package.json` に追加。CI / local 検証で型チェックを単独実行できるようにした。
- 起動 banner に表示される `--template` の説明テキストを Free 4 + Premium 3 全件 visible に整理 (0.5.1 patch 由来、`70612cc` で reify、ここでは継続)。
- generator から返る `GenerateResult` 型 (`{ premiumRedirect: boolean }`) を追加。CLI 側がこの値で trailer メッセージを出すかどうか判定する。
- `tests/generator.test.ts` に Premium redirect 系のテスト 2 件追加 (=`premiumRedirect=true` を返す + project ディレクトリを作らない / Free template では `false` を返す)。

### Fixed

- `-t database / auth / api-proxy` 等の Premium template 指定時、redirect バナーの後に `✓ Project created successfully!` + `$ cd <name>` が表示されていた問題を修正。実際には project ディレクトリは作られないので、表示が誤解を招く状態になっていた (`src/generator.ts` の early return path 由来、5/15 dogfood で副次検出)。修正後は Premium redirect バナーで stop、exit=0。

### Tests / Build

- `npm test` = 7/7 pass (= 既存 5 件 + Premium redirect 系 2 件)。
- `npm run typecheck` = exit=0。
- `npm run build` = exit=0。
- Dogfood: `node dist/index.js test-x -t database -y --no-install --no-git` で Premium banner 後に misleading trailer なし、ディレクトリ未作成を確認。

### Notes

- npm publish は **まだ実行していない**。 jun 明示 GO + `package.json` の `version` を `0.5.1` → `0.5.2` に actual bump した後で `PUBLISH_CHECKLIST.md` に従って実行する。
- Gumroad / BOOTH の販売文言・価格は今回触っていない。
- `premium-urls.ts` は触っていない (= 金銭 Red boundary、5/13 段で skip 済の方針継続)。

## [0.5.1] — 2026-05-15

`70612cc` で reify。5/13 dogfood findings (= 不具合 4 件) と Kai operator review (= 修正候補 B GO) の patch。

### Added

- `config` テンプレートを Free 4 件目として正式登録 (= Zod-validated config from env + file + profile + secret redaction、Vitest 同梱)。
- Non-interactive モード: `-y` / `--yes` flag で prompt 全 skip、`-d` / `--description <text>` flag で description を CLI 側から指定可能。CI / AI agent setup 用。
- `--template` の help テキストに Free 4 + Premium 3 全件を visible 化。
- `README.md` に `## Non-interactive Usage` 例追加 (= `-y` flag + `-d` flag)。
- `tests/generator.test.ts` に `config` template テスト 1 件追加 (= schema loader / loader / .env.example / tests 配置 + `package-lock.json` 非 copy 確認)。

### Changed

- `package.json` の `files` array に `templates/config` を追加 (= npm publish 対象に含める。これがないと publish しても config template が npm package に届かない、5/13 detect の配布動線断絶 root cause の n+1 段)。
- `src/index.ts` の CLI version 表記を `"0.3.0"` → `"0.5.1"` に sync (= package.json と整合、narrative drift fix)。
- `templates/config/README.md` の price 表記を `"¥1,000 / $7. MIT-licensed."` → `"Free template, MIT-licensed."` に修正。
- `README.md` 冒頭 narrative を「Four free templates and three premium templates」 で書き直し、Free / Premium section も整理。

### Removed

- `templates/config/package-lock.json` を削除 (= 120 KB、npm publish target の不要 artifact、配布動線軽量化)。
- `README.md` の Premium Templates 表から `config` 行を削除 (= 3 件に整理) + Gumroad root URL も削除 (= 旧 narrative drift fix)。

### Notes

- `5/13 板` で `templates/config = 88 MB` と書いていた narrative は actual と乖離 (= actual 252 KB → 132 KB cleanup) で、Iwa 5/15 closed report で honest 記録済 (`feedback_honesty_violation_exaggeration.md` 連動)。

## [0.5.0] — 2026-04-22

`c282486` で reify。database premium template v1.0.0 完成 + create-mcp-server 本体側 v0.5.0 切り出し。

## [0.4.0] — earlier

`1f89970` で reify。全テンプレートのビルド / セキュリティ問題修正リリース。

## [0.3.0] — earlier

`3c4102d` で reify。auth premium template 追加。

## [0.2.0] — earlier

`4626bfb` で reify。database premium template 初版 + Gumroad 販売準備。

## [0.1.1] — earlier

`04052ef` で reify。README 整備 + ルート README 追加 + Zenn 記事作成。

## [0.1.0] — earlier

`38ea359` で reify。`@nexus-lab/create-mcp-server` の npm 初公開。

[0.5.2]: https://github.com/nexus-lab-zen/nexus-lab/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/nexus-lab-zen/nexus-lab/commit/70612cc
[0.5.0]: https://github.com/nexus-lab-zen/nexus-lab/commit/c282486
[0.4.0]: https://github.com/nexus-lab-zen/nexus-lab/commit/1f89970
[0.3.0]: https://github.com/nexus-lab-zen/nexus-lab/commit/3c4102d
[0.2.0]: https://github.com/nexus-lab-zen/nexus-lab/commit/4626bfb
[0.1.1]: https://github.com/nexus-lab-zen/nexus-lab/commit/04052ef
[0.1.0]: https://github.com/nexus-lab-zen/nexus-lab/commit/38ea359
