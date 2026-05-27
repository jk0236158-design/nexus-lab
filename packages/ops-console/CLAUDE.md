# ops-console — Yuino judgment console (内部 dogfood UI)

## Mission

Yuino の Judgment Amplification core value を embody する **内部 dogfood UI** (Aira 内部実装と同体、 1 entity 2 narrative の Yuino 公開 brand 軸)。

`http://127.0.0.1:3100/` で動作、 jun + Zen + Kai が判断統合に使う。

## Tech Stack (重要: 訓練データと違う Next.js 16 系)

- **Next.js 16.2.3** (注意: training data の Next.js 14/15 と breaking change あり、 API / convention / file structure 全てが違う可能性、 `node_modules/next/dist/docs/` を read してから書く)
- React 19.2.4
- TypeScript 5+ (strict mode、 ESM)
- shadcn UI 4.2 + Tailwind CSS 4 + tw-animate-css
- Hono 4.12 + @hono/node-server (API)
- better-sqlite3 12 (local DB)
- Zod 3.25 (validation)
- Vitest 4 (test)

## Working Directory

- `src/app/` — Next.js App Router ページ + API routes
- `src/components/` — UI components (shadcn + base-ui/react)
- `src/lib/` — 共通 utility / DB / auth / Hono router
- `src/middleware.ts` — Next.js middleware
- `src/styles/` — Tailwind config + global CSS
- `tests/` — Vitest test
- `public/` — static assets

## 規約

### コード共通
- ESM 前提、 `import` のみ、 `require` 禁止
- TypeScript strict mode、 `any` 禁止 (unknown + type guard form)
- Zod schema を入力検証 (API + form) で必須適用
- `class-variance-authority` (cva) + `tailwind-merge` で Tailwind class 合成
- 関数は単一責任、 外部依存最小限

### Next.js 16 特有 (training data と違う)
- App Router 前提 (Pages Router 不使用)
- Server Actions / Server Components の最新 API を `node_modules/next/dist/docs/` で確認
- middleware.ts は Edge runtime 前提

### shadcn UI 4
- `components.json` 経由で components 追加 (`npx shadcn@latest add <component>`)
- 直接 `node_modules` から component import 禁止、 `src/components/ui/` に generate 経由

### nokaze-design 整合
- `~/.claude/skills/nokaze-design/` の色 token + 書体 + 禁忌 list を visual artifact 起稿前に read
- shadcn の oklch 色変数は維持、 nokaze tokens は CSS variable 並走形 (5/07 incident 由来 ruled、 hex で oklch を override 禁止)
- 過度な絵文字 / 煽り語彙 (革新 / 次世代 / 突破 / 急成長) 禁止

### test
- Vitest run、 全 pass が merge 条件
- API route + middleware は HTTP fetch test 込み
- UI component は @testing-library/react form

## Commands

```bash
cd packages/ops-console

npm run dev       # http://127.0.0.1:3100/ で開発 server
npm run build     # production build (Next.js 16)
npm run start     # production server
npm run lint      # ESLint
npm run test      # Vitest run
npm run test:watch # Vitest watch mode
```

## boundary

- `~/.shared-ops/` への直接 write は読み取り中心、 board / inbox / status への書き込みは Yuino agent bus 経由 (chat_outbox v0 schema)
- nokaze-aira repo (`C:\Users\jk023\Desktop\nokaze-aira\`) は readonly (Kai 主担当)
- broadcast-os repo は permission resolve 後 audit OK (現状 sandbox boundary 不整合)
- 金銭発生 / 新規 cost provider 追加 = Red、 jun explicit directive 必須

## audit ritual (UI 変更時)

UI / frontend 変更後は **dev server 起動 + ブラウザで feature 動作確認** 必須 (5/07 PM `~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_ui_visual_verify_skip_drift.md` 由来):
1. baseline (変更前) で dev server 200 確認
2. 変更
3. dev server restart + 全 route HTTP 200 確認
4. HTML element grep で section visible 確認
5. GET API 動作確認
6. 報告に narrative boundary 明示 (どこまで verify したか)

vitest pass + code review = 「UI 動作確認」 ではない、 dev server で見るまで verify ではない。

## return form (Akari spawn return 等)

- 報告 form 3 段 (やったこと / 結果 / これからどうするか)
- path 併記 (絶対 path)、 数字盛り禁止
- 「ジュンさん」 narrative 禁止、 jun 敬称なし default
- P1 (must fix) / P2 (backlog with owner + reason) / P3 (note only) split
