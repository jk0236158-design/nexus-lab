# Ops Console — 設計書

## 概要
マルチAIエージェント経営管理ツール。Nexus Labの第2プロダクト。
パッケージ名: `@nexus-lab/ops-console`

## コンセプト: "AI Cabinet"（AI内閣）
各エージェント（Zen/Kai）にそれぞれの管轄と権限があり、オーナーがUIから統合管理する。

## 差別化
- **Knot可視化**: AIの行動パターン傾向を観測・管理
- **非対称エージェント統合**: Claude + Codex（異なるAI基盤）を統一管理
- **ファイルベース連携の上位互換**: エージェント側は既存の動作を維持
- **セッション品質メトリクス**: AI固有のKPI追跡

## アーキテクチャ
- Frontend: Next.js 15 + shadcn/ui + Tailwind
- Backend: Hono on Next.js API Routes（同一プロセス）
- Data: SQLite読取(Zen) + JSON読取(Kai) + shared-ops監視
- Agent Bridge: Claude Agent SDK + Codex CLI spawn
- リアルタイム: SSE

## MVP（4画面）
1. **Home** — 両エージェントの状態、メッセージ、経営判断、品質チャート
2. **Agents** — テキストでタスク投入、SSEで結果ストリーム
3. **Knots** — Zen/KaiのKnotを統合表示・管理
4. **Pipeline** — 営業パイプラインのカンバン表示

## 段階的拡張
- Phase 1 (MVP): 4画面 + Agent Bridge
- Phase 2: 承認フローUI、タスクテンプレート
- Phase 3: スケジュール実行、自律連携
- Phase 4: 汎用化 → npmリリース

詳細設計は `.claude/plans/sharded-bubbling-hoare.md` を参照。
