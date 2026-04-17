# Gumroad販売ページ — MCP Server Auth Template

## 商品名
MCP Server Auth Template — JWT/API Key + Rate Limiting

## 価格
¥800

## 概要（Short Description）
Production-ready MCP server template with HTTP transport, dual authentication (API key + JWT), role-based access control, and rate limiting. Secure your MCP tools in minutes.

## 詳細（Description）

### What's Included

A complete, production-ready MCP server template with authentication and security built in:

**🔐 Dual Authentication**
- API key authentication via `x-api-key` header
- JWT Bearer token authentication with role claims
- Constant-time key comparison to prevent timing attacks
- Safe error messages that never leak internal details

**🛡️ Role-Based Access Control**
- `admin` and `user` roles via JWT claims
- Admin-only tool restriction (e.g., `generate-token`)
- Auth context injected into every MCP tool handler

**⚡ Rate Limiting**
- In-memory sliding-window rate limiter per client
- Configurable max requests and window duration
- Standard `X-RateLimit-*` response headers
- Automatic `429 Too Many Requests` with `Retry-After`

**🔧 2 Pre-built Tools**
- `whoami` — Returns the authenticated user's identity and auth method
- `generate-token` — Generates a JWT for a specified user (admin only)

**📦 HTTP Transport**
- Express-based Streamable HTTP server
- CORS enabled out of the box
- `/health` endpoint for monitoring
- `/mcp` authenticated MCP endpoint

**✅ Quality**
- Full TypeScript with strict mode
- Zod validation on all inputs
- Secure error handling via `formatAuthError()`
- Vitest test suite included

### How to Use

1. Unzip the template
2. Run `npm install`
3. Copy `.env.example` to `.env` and set `JWT_SECRET` and `API_KEYS`
4. Run `npm run build`
5. Run `npm start`

Your authenticated MCP server is running on `http://localhost:3000`.

### Customize

- Edit `src/tools.ts` to add your own auth-protected tools
- Edit `src/auth.ts` to add OAuth or other auth providers
- Adjust rate limits via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` in `.env`

### Requirements
- Node.js 20+
- TypeScript 5+

### Why Pay?

The free templates (`npx @nexus-lab/create-mcp-server`) give you a solid starting point. This premium template saves you hours of:

- Implementing secure authentication (API key + JWT)
- Writing constant-time comparison and safe error handling
- Setting up role-based access control
- Building rate limiting middleware
- Configuring Express with MCP SDK transport

Made by [Nexus Lab](https://github.com/jk0236158-design/nexus-lab) — tools for the Claude Code ecosystem.

## タグ
mcp, claude, typescript, authentication, jwt, api-key, rate-limiting, template

## ファイル
mcp-server-auth-template.zip
