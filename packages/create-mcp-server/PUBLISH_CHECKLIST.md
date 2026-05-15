# `@nexus-lab/create-mcp-server` publish 前 checklist

このメモは npm publish の手順を、AI / プログラム 4 ヶ月の前提でも上から順に実行できる粒度で書いたものです。
急ぐ作業ではないので、慌てず 1 行ずつ確認しながら進めてください。

> **大前提**
>
> - npm publish の物理 fire は **jun の明示 GO 後** のみ。
> - 「動くかなと思って試しに publish」 はしない (= 一度公開すると同じ version は二度と出せない、unpublish は 72 時間以内のみ、 npm registry の信用に直結)。
> - Gumroad / BOOTH の販売文言・価格は今回触らない。
> - 「数字盛らない」「外部告知は別軸」「Premium templates は revenue 本線ではない」 という前提の上での 信用回復としての棚直し。

## 0. 直前に確認すること

- [ ] **jun から明示 GO** が出ているか (= 板 or chat で 「create-mcp-server 0.5.2 publish GO」 等の明文)。
- [ ] CHANGELOG.md の `[0.5.2]` セクションが「Unreleased」のままになっていないか (= 日付に書き換えてからコミットする。例: `## [0.5.2] — 2026-05-XX`)。
- [ ] 過去 24 時間以内に同じ作業 PC で `npm publish` 失敗・retry が走っていないか (= 走っていたら一旦深呼吸して `npm view @nexus-lab/create-mcp-server version` で current registry version を再確認)。

## 1. version bump

`packages/create-mcp-server/package.json` の `"version"` を `"0.5.1"` → `"0.5.2"` に書き換えます。

```jsonc
// before
"version": "0.5.1",

// after
"version": "0.5.2",
```

理由: 後方互換を壊さない bug fix + 機能追加 (typecheck script + Premium redirect 表示 fix) のため、 semver の **patch bump**。

`src/index.ts` の CLI version 表記も同じ値に揃えます (= 起動時に `--version` で表示される文字列、 5/15 patch で 0.3.0 → 0.5.1 sync 済なので、 ここも 0.5.1 → 0.5.2)。

```ts
program
  .name("create-mcp-server")
  .description("Scaffold a new MCP server project with TypeScript and secure defaults")
  .version("0.5.2")  // ← 0.5.1 から書き換え
```

書き換えたら一度 commit して、CHANGELOG の release 日付も同じ commit で固定しておくと後追いが楽です。

## 2. 検証 (= 全部 ローカルで先に通す)

下の順番で 1 行ずつ実行。 1 つでも失敗したら publish は **止める**。

| step | コマンド | 期待 |
|------|---------|------|
| 2.1 | `cd packages/create-mcp-server` | 作業ディレクトリを揃える |
| 2.2 | `npm install` | 依存 install 済か確認 (= 既に install 済なら no-op) |
| 2.3 | `npm run typecheck` | exit=0 (= 型エラーがない) |
| 2.4 | `npm test -- --run` | 全 pass。 現在 7/7 pass。 1 つでも fail なら止める |
| 2.5 | `npm run build` | exit=0、 `dist/index.js` が生成される |
| 2.6 | `node dist/index.js --version` | `0.5.2` と表示される (= step 1 の version 書き換えが反映されているか確認) |
| 2.7 | `node dist/index.js --help` | Free 4 + Premium 3 全件が `--template` の説明に visible |

### 2.8 dogfood (= 実際に CLI を叩いて挙動確認)

作業 PC の `~/Downloads/` など、 git 管理外の空きディレクトリで実行。 終わったら全部消して構いません。

```bash
cd ~/Downloads

# Free template (= 普通に project が作られる)
rm -rf dogfood-free
node /path/to/nexus-lab/packages/create-mcp-server/dist/index.js dogfood-free -t config -y --no-install --no-git
# 期待: "✓ Project created successfully!" 表示 + dogfood-free/ ディレクトリ生成
ls dogfood-free
rm -rf dogfood-free

# Premium template (= redirect だけで stop、 ディレクトリ作られない)
rm -rf dogfood-premium
node /path/to/nexus-lab/packages/create-mcp-server/dist/index.js dogfood-premium -t database -y --no-install --no-git
# 期待: "★ Premium Template" 表示 + Gumroad URL のみ
#       "✓ Project created successfully!" は表示されない
#       dogfood-premium/ ディレクトリは作られない
ls dogfood-premium  # → No such file or directory が出れば正常
```

## 3. npm publish 直前の最終確認

- [ ] `npm whoami` で publish 用の npm account にログイン済か確認 (= 想定 = `nexus-lab` org に publish 権限のあるアカウント)。
- [ ] `npm view @nexus-lab/create-mcp-server version` で registry 上の current version 取得 (= `0.5.1` が出ているはず)。
- [ ] CHANGELOG.md の `[0.5.2]` セクションが書き終わっていて、 該当 commit が main / master に乗っているか確認。
- [ ] `packages/create-mcp-server/package.json` の `files` array に `templates/config` が含まれているか確認 (= 5/15 patch の root cause、 ここが欠けると publish しても config template が npm tarball に届かない)。
- [ ] `git status` で意図しない差分が残っていないか確認 (= 特に `dist/` を gitignore していて手元だけ build artefact が残っていないか)。

## 4. npm publish (= dry run → actual)

dry run で 先に「何が registry に上がるか」 を一度物理確認します。

```bash
cd packages/create-mcp-server
npm publish --dry-run
```

出力の `Tarball Contents` セクションで以下が含まれているか目視:

- [ ] `dist/index.js`, `dist/generator.js`, `dist/prompts.js`, `dist/premium-urls.js` (= ESM ビルド成果物一式)
- [ ] `templates/minimal/`, `templates/full/`, `templates/http/`, `templates/config/` の中身
- [ ] `README.md`
- [ ] `package.json`
- [ ] `LICENSE` (もしあれば)

`Tarball Details` の `package size` / `unpacked size` が直前の 0.5.1 と桁違いに大きく / 小さくなっていないか目視 (= 5/13 「88 MB」 narrative drift の再発防止)。

問題なければ本番 publish:

```bash
npm publish --access public
```

`--access public` を **必ず付ける** (= `@nexus-lab/` scope が私的 publish 扱いされるのを避ける)。

## 5. publish 直後の 200 確認 ritual

CLAUDE.md の Workflow Rules に従い、 外部観測まで取れて初めて 「公開成立」。

- [ ] `npm view @nexus-lab/create-mcp-server version` で `0.5.2` が返ってくる。
- [ ] `npm view @nexus-lab/create-mcp-server dist-tags` で `latest: 0.5.2` を確認。
- [ ] ブラウザで https://www.npmjs.com/package/@nexus-lab/create-mcp-server を開いて 0.5.2 が表示される。
- [ ] `cd /tmp && npx -y @nexus-lab/create-mcp-server@0.5.2 dogfood-after-publish -t config -y --no-install --no-git` で project 生成成功 (= templates/config が tarball に同梱されている確認、 5/13 不具合の再発防止)。
- [ ] Premium redirect の挙動も npx 経由で再確認: `npx -y @nexus-lab/create-mcp-server@0.5.2 dogfood-after-publish-premium -t database -y --no-install --no-git` で 「Project created successfully!」 が **表示されない** ことを確認。

## 6. git tag

```bash
git tag -a create-mcp-server-v0.5.2 -m "create-mcp-server 0.5.2"
git push origin create-mcp-server-v0.5.2
```

monorepo なので tag 名に package 名を含めておくと、 後で複数 package で publish した時に区別できます。

## 7. 触らないもの (= 今回のスコープ外、 確認だけ)

| 範囲 | 状態 |
|------|------|
| Gumroad の販売文言 / 価格 | **触らない**。 5/15 jun directive で 「外部告知 / 価格変更 / 販売文言の公開反映」 は止める範囲。 |
| BOOTH の販売文言 / 価格 | **触らない**。 同上。 |
| 外部告知 (Zenn / X / Polar) | **しない**。 Premium templates は revenue 本線ではない、 信用回復としての棚直しに留める。 |
| `src/premium-urls.ts` | **触らない**。 金銭 Red boundary、 5/13 段で skip 済の方針継続。 |
| 他 templates (minimal / full / http / database / auth / api-proxy) の中身 | **触らない**。 別軸の作業。 |

## 8. 失敗・想定外時の判断

- `npm publish` でエラーが出た場合 (= 例: `403 Forbidden` / `EOTP` / `409 Conflict`)、 retry の前に **必ず 1 度止まる**。 erros を board に貼って jun + Zen + Kai と相談してから次手を決める。
- `npm publish --dry-run` の出力で想定外のファイルが含まれている / 想定のファイルが含まれていない場合、 publish は中止して `package.json` の `files` array と `.npmignore` (もしあれば) を audit。
- 「数字盛らない」 原則: 公開後に Zenn / X / 板で言及するときは 「Premium templates が壊れていた状態を直した、 信用回復として publish した」 が骨。 「revenue が伸びる」 narrative は前提に乗せない。

---

最後の確認: ここまで全 checkbox を埋め終わってから、 報告 form 3 段 (= やったこと / 結果 / これからどうするか) を `~/.shared-ops/board/` に置いて、 Zen と jun に publish 完了の board を渡す。
