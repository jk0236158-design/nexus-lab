# ライセンス (AI Operator Pack v0.1)

> ⚠️ これは **draft (案)** です。 release 前に jun (オーナー) + Kura (経理) で最終確定します。 commercial 利用 + 配布の条件は、 v0.1.0 release (2026-05-26 target) 時に確定します。

## 現時点の方針 (draft)

### コード部分: MIT License (候補 1) または BSL (候補 2)

**候補 1: MIT License** (シンプル、 自由度高、 audience 4 ヶ月初心者に親切)

```
MIT License

Copyright (c) 2026 jk023 (nokaze、 屋号: nokaze)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**候補 2: BSL (Business Source License) 1.1** (商用 SaaS 化を 4 年間制限、 4 年後に MIT に open)

```
Business Source License 1.1

Copyright (c) 2026 jk023 (nokaze)

The Licensed Work is licensed under the BSL-1.1 (Business Source License 1.1).
For 4 years from release date, the following Additional Use Grant applies:

  - You may use the Licensed Work for any purpose, including commercial use,
    as long as you do not provide a competing product (a hosted SaaS that
    offers the same primary functionality as AI Operator Pack).

After 4 years, the Licensed Work changes to the MIT License automatically.

For the full BSL-1.1 text, see: https://mariadb.com/bsl-faq-mariadb/
```

= **MIT (候補 1) 推奨**: 4 ヶ月初心者 audience が複雑な license を読まずに済む、 商用使用も自由、 「使いやすさ」 優先。 BSL は 「商用 SaaS 化を制限したい」 motivation が明確になってから検討。

### docs / 文書部分: Creative Commons BY 4.0

商品 v0.1 のドキュメント (README + glossary + setup-template + execution) は **CC BY 4.0** で公開。

```
This work is licensed under a Creative Commons Attribution 4.0
International License.

You may share and adapt the material, even commercially, as long as you
give appropriate credit to: jk023 (nokaze)、 Zen (Claude Opus 4.7、 nokaze CTO)、
and the AI Operator Pack project.

License text: https://creativecommons.org/licenses/by/4.0/
```

= ドキュメントは「使いまわして OK、 但し credit は付けて」 form。

### 第三者コードの帰属

このパックには以下の依存関係が含まれます。 各依存関係のライセンスは個別に確認してください:

- Node.js (MIT)
- VitePress (MIT)
- shadcn/ui (MIT)
- Tailwind CSS (MIT)
- Hono (MIT)
- better-sqlite3 (MIT)
- Next.js (MIT)
- React (MIT)
- TypeScript (Apache-2.0)
- lucide-react (MIT、 line icon)
- Noto Serif JP / Noto Sans JP / JetBrains Mono (Open Font License、 Google Fonts CDN)

詳細は `package.json` + `package-lock.json` の依存関係 list 参照。

## 商標の扱い

**「nokaze」** および **「Yuino」** は jk023 (屋号: nokaze) の商標です。 商業利用 + 派生商品の名前に使う場合は、 事前に GitHub issue で連絡してください。 通常の利用 (このパックを使う、 紹介する、 評価する) は連絡不要です。

## AI 運営の表記 (ライセンス外の運用ルール)

このパックは **AI が運営する nokaze 屋号** の元で開発されています。 以下の運営方針を license と一緒に明示します:

- **CTO**: Zen (Claude Opus 4.7、 Anthropic)
- **Aira 実装担当**: Kai (OpenAI Codex)
- **Owner**: jk023 (人間、 日本、 個人事業)
- **その他 peer**: Iwa / Oto / Akari / Kagami / Hoshi / Kura (全員 AI、 Claude Opus 4.7 / Sonnet 4.6 上で動作)

このパックを使うとき、 「AI が作ったもの」 であることが明示されているのは、 数字を盛らず、 隠さない nokaze の姿勢の一部です。 評価、 批判、 改善提案、 全部歓迎します。

## 保証 + 責任の制限

このパックは **AS IS** (現状のまま) 提供されます。 開発者は以下に対して責任を負いません:

- データの損失 (ただし Reset/Forget は意図的な消去なので 「データ損失」 ではない)
- 第三者 AI service (Claude / Codex / Gemini) の動作
- 使用者の判断ミス (Approval Gate を通過した action の結果)
- インストール環境の固有問題 (OS / Node.js version / 既存ファイルとの conflict)

セキュリティ脆弱性 + 重大な bug に関しては、 GitHub issue または **security@nokaze.dev** (5/26 release 後に開設予定) で受け付けます。

## license の最終確定 path

本 file は draft です。 v0.1.0 release (2026-05-26 target) 前に下記を確定:

1. **コード license** = MIT (候補 1) 推奨、 但し jun + Kura が BSL を選んだ場合は switch
2. **ドキュメント license** = CC BY 4.0 (固定)
3. **商標条項** = 確認 (Yuino + nokaze の商標として登録するかは Kura 判断)
4. **保証 + 責任の制限** = 弁護士確認 1 件 (jun 自走判断 + Kura 経理 audit、 商業 release 前 mandatory)

確定 timeline:
- 5/13 月曜: jun + Kura で license 候補議論
- 5/22 金曜: license 確定 + final draft commit
- 5/26 火曜: release 時に確定版 license deploy

## 連絡

ライセンスに関する質問:
- GitHub issue: https://github.com/jk0236158-design/nexus-lab/issues
- nokaze umbrella: [nokaze.dev](https://nokaze.dev)

---

Zen (nokaze CTO、 Claude Opus 4.7)
2026-05-08 起稿 (商品 v0.1 license draft、 jun + Kura 確認待ち、 release 前最終確定 path 明示)
