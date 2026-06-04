# `@nexus-lab/create-mcp-server` リリース時の確認軸 (= 設計書 draft)

> **位置づけ**: これは設計書の draft (= v1.0 final ではない)。 既存の `PUBLISH_CHECKLIST.md` が「実際に publish する時の手順を上から順に追う作業書」 なのに対して、 こちらは **「リリース判断の軸を 8 件に分けて articulate した設計書」** です。 0.4.0 で premium テンプレート (= 売り物) が無料 npm package に混入した事故への物理対策として、 6/3 に起稿。
>
> **読み手の前提**: AI / プログラム 4 ヶ月の初心者。 用語の意味を 1 行ずつ確認しながら進めて構いません。
>
> **関連 file**:
> - `PUBLISH_CHECKLIST.md` (= 実際の publish 手順、 上から順の作業書)
> - `~/nexus-lab/docs/rules/publishing.md` § 1-7 (= 公開判断 3 段階 ルーティング)
> - `~/.shared-ops/owner-decisions/2026-06-02_zen_standing_authorization_nexus_lab_external_v0.md` (= 常設承認 v0)

## 大前提 — 何のための checklist か

create-mcp-server は **無料 CLI** (= `npm install` で誰でも取れる) ですが、 中で扱う 7 件のテンプレートのうち 3 件 (= `database` / `auth` / `api-proxy`) は **¥500 / $3.50 の販売物** です。 つまり 1 つの package の中に「無料で配るもの」 と「売るもの」 が混ざっています。 この境界をミスると、 売り物が無料で配られたり、 逆に売れない (= 同梱されてない) 事故が起きます。

0.4.0 (= 過去のリリース) では、 売り物の premium テンプレート 3 件が npm package の中に混入した状態で 公開されました。 信用に直結する境界の事故です。 本 checklist は この境界を物理的に確認する 8 軸を持ちます。

## 1. 公開範囲と販売物範囲の差分 (= 0.4.0 事故への直接対策)

npm package に **含めるべき file**:
- `dist/` (= CLI 本体の build 成果物)
- `templates/minimal/`, `templates/full/`, `templates/http/`, `templates/config/` (= 無料テンプレート 4 件)
- `README.md` / `package.json` / `LICENSE`

npm package に **含めるべきでない file**:
- `templates/database/`, `templates/auth/`, `templates/api-proxy/` (= 販売物 3 件、 Polar.sh / Gumroad / BOOTH で売られている zip と同じ中身)
- `tests/` 配下 (= 開発時のみ)
- `src/` の原本 (= `dist/` に build 済みのものが入る、 原本は不要)

**物理確認の手順**:
1. `package.json` の `files` array を目視 = 4 件の無料テンプレートだけが列挙されているか (= `database` / `auth` / `api-proxy` の文字列が含まれていたら止める)
2. `npm pack --dry-run` を実行 → `Tarball Contents` の中に premium 3 件の path が **1 件も出ない** ことを目視
3. tarball size (= `package size`) が直前のリリースと桁が変わっていないか目視 (= 急に膨らんだら混入の疑い)

この 3 ステップを通らない限り `npm publish` の段階に進まない。

## 2. 商品と販売 route の整合性

premium テンプレート 3 件は 2 item-level route (= Polar.sh × 3 + Gumroad × 3 = 計 6 件) + 1 storefront route (= BOOTH = storefront 全体、 個別 item link なし) で並列販売。 リリース時に変更がある場合のみ確認:

- premium 3 件 = Polar.sh 3 件 + Gumroad 3 件 + BOOTH storefront に存在 (= 価格 ¥500 / $3.50、 商品名と URL の整合)
- README 上の **item link 6 件** (= Polar.sh × 3 + Gumroad × 3) の HTTP 200 確認 + **BOOTH storefront 1 件** の到達確認 = リリース直前に 1 巡 (= 計 7 確認軸)
- 価格の変更や 公開停止 = **赤 (= jun 確認必須)** — 自走しない

価格や route を触らないリリースなら、 この軸は「変更なし」 と書いて飛ばして構いません。

## 3. テストと自社使用 (= QA)

- [ ] `npm test` 全 pass (= Vitest 軸の green)
- [ ] `npm run build` exit=0 (= `dist/index.js` 生成)
- [ ] `npm run typecheck` exit=0 (= strict)
- [ ] lint check (= **本 package には local `lint` script なし** = `packages/create-mcp-server/package.json` の scripts に存在せず、 root `~/nexus-lab/package.json` にも lint script なし。 editor / CI 側の lint で止まれば pass、 ローカル個別 fire 軸はなし、 = 「configured lint passes via editor / CI、 no local command」 と articulate)
- [ ] **自社使用** = 自分達で空きディレクトリに install + 起動 + 無料テンプレ 4 件と premium 3 件の表示を 1 巡確認 (= 5/17 「自分達で使う約束を破った」 件の物理化、 「販売開始」 と書く前に必ず自分で触る)

自社使用の手順は `PUBLISH_CHECKLIST.md` § 2.8 に書いてあります。 そちらの dogfood block を踏襲。

## 4. README と CHANGELOG の整合性

- 価格 articulate の整合 (= ¥500 / $3.50 の 2 軸表記、 3 route の link)
- npm version articulate の整合 (= `package.json` の version と `src/index.ts` の CLI version と README の表記が同じ)
- **禁止語の articulate なし** (= 「production-ready」 / 「完全自律」 / 「保証」 / 「革新」 / 「次世代」 / 「突破」 / 「急成長」 等)
- CHANGELOG.md の該当 section が `[Unreleased]` のままになっていない (= 日付付きに書き換え)

禁止語は `~/nexus-lab/CLAUDE.md` の「やらないこと」 section に articulate されています。

## 5. 公開前 cross-review (= Kai / Zen ダブルチェック)

5/22 owner-decision の延長として、 リリース前は **Kai に同一版 (= 実際に push する artifact そのもの) の review を request する** のが既定軸です。

- patch リリース (= 0.5.2 → 0.5.3 等) = green list (= 上の 1-4 軸が pass + Kai review request 起稿 + 2 時間以内 Kai response なし → Zen 自走 fire OK)
- minor リリース (= 0.5.x → 0.6.0 等) = 同上 (= patch と同じ扱い、 但し breaking がないこと前提)
- major / breaking リリース (= 0.x → 1.0 等、 後方互換を壊す変更) = **赤 (= jun 確認必須)**
- 価格変更 / 公開停止 / 削除 = **赤 (= jun 確認必須)**

6/2 常設承認 v0 の articulate に従い、 「Kai review 待ち → fire しない」 の止まり drift には 2 時間の時間軸を入れます (= review 強み軸 + fire 時間軸 物理 enforcement の両立)。

## 6. 公開後の 200 確認 ritual

`publishing.md` § 1 の「対外公開の 200 確認の習慣」 に従う。 publish の操作が成功しても、 外部 (= npm registry) で実際に見えるかどうかは別軸:

- [ ] `npm view @nexus-lab/create-mcp-server version` で 期待 version が返る
- [ ] `npm view @nexus-lab/create-mcp-server dist-tags` で `latest:` が期待 version
- [ ] ブラウザで https://www.npmjs.com/package/@nexus-lab/create-mcp-server を開いて 期待 version 表示
- [ ] 空きディレクトリで `npx -y @nexus-lab/create-mcp-server@<version> <name> -t config -y --no-install --no-git` を実行して 実際にプロジェクト生成成立
- [ ] premium テンプレート 1 件で `--template database` を試行 → redirect (= 購入 URL 表示) のみ、 ディレクトリは生成されない (= 0.4.0 事故の再発確認)
- [ ] README 上の **item link 6 件** (= Polar.sh × 3 + Gumroad × 3) の HTTP 200 確認 + **BOOTH storefront 1 件** の到達確認 (= 計 7 確認軸)

「`npm publish` が exit=0 で終わった」 = 公開成立、 ではない。 上の 6 件が全部取れて初めて成立。

## 7. 事故が起きた時の対応軸

0.4.0 事故 (= premium テンプレートが無料 npm package に混入) の構造:
- 原因 = `package.json` の `files` array が premium 3 件を弾いていなかった
- 影響 = 売り物の中身が無料 install で取れる状態が一定期間続いた (= 売上 0 なので金銭被害は無、 但し信用境界の事故)

対応の既定:
1. 検知次第 patch リリースで除外 (= 5/15 patch の 5/18 publish の流れ、 0.5.3 で除外 fix 済)
2. 該当 version は `npm deprecate` で印を付ける (= 既存 install を強制削除しない、 但し新規利用を抑止)
3. board に記録 (= `~/.shared-ops/board/<date>_<incident>.md`、 何が起きたか / 物理対策 / 再発防止)
4. **マーケで盛らない** (= 「品質を高めた」 「改善した」 等の narrative に乗せない、 「公開範囲の検査を追加した」 程度の運用学習として articulate)

事故の articulate を「成長物語」 にすると次の事故が見えなくなる軸 (= Kai 6/2 articulate の延長)。

## 8. 常設承認 v0 の適用区分

リリースの種類ごとに 自走判断と確認判断を分けます (= 6/2 articulate)。

| リリース種類 | 区分 | 動き方 |
|------|------|------|
| patch (= bug fix、 後方互換あり) | 緑 (= 自走) | 1-6 軸 pass + Kai review request 起稿 + 2 時間以内 response なし → Zen 自走 fire |
| minor (= 機能追加、 後方互換あり) | 緑 (= 自走) | 同上 |
| major / breaking | 赤 (= jun 確認) | jun に short chat で articulate + GO 受領後 動く |
| 販売物 (= premium テンプレ) の中身変更 | 黄 (= Kai 事前 review 必須) | 公開前に同一版を Kai board に投げて green 受領後 公開 |
| 価格変更 / 公開停止 / 削除 | 赤 (= jun 確認) | 同上 |

「迷ったら 1 段重い側に倒す」 が既定 (= 5/31 Kai articulate「事後 articulate を default にすると差分混入時に事故る」 の物理化)。

---

## 最後に — self-observation

これは設計書の draft であって、 v1.0 final ではありません。 8 軸の articulate は 6/3 時点で見えている事故 form (= 0.4.0 premium 混入) と 既存 owner-decision (= 5/22 + 6/2) に整合させたもので、 実運用で抜けが見つかったら 即 update します。 「checklist を作ったから安全」 ではなく、 「checklist が次の事故で更新される」 ことを前提にしてください。

**次のリリース時にやること**: 本 checklist の 8 軸を全部踏みつつ、 抜けや読みにくさを 1 件でも見つけたら この file に直接書き加える。 PUBLISH_CHECKLIST.md (= 実作業) との重複や齟齬も同じタイミングで揃える。
