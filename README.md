# Nexus Lab

Claude Codeエコシステム向けのツール・テンプレートを開発し、開発者の生産性を最大化する。

## Products

### [@nexus-lab/create-mcp-server](packages/create-mcp-server)

MCPサーバーをワンコマンドでスキャフォールディングするCLIツール。

```bash
npx @nexus-lab/create-mcp-server my-server
```

**Features:**
- TypeScript + ESM — モダンなセットアップ
- Secure defaults — Zodスキーマバリデーション
- Multiple templates — `minimal` / `full` / `http`
- Test-ready — Vitest統合（fullテンプレート）

詳細は [packages/create-mcp-server/README.md](packages/create-mcp-server/README.md) を参照。

## License

MIT
