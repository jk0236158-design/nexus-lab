# MCP Server with Authentication

A production-ready [Model Context Protocol](https://modelcontextprotocol.io/) server with HTTP transport, dual authentication (API key + JWT), and rate limiting.

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings (especially JWT_SECRET!)

# Build and start
npm run build
npm start
```

The server starts on `http://localhost:3000` by default.

## Authentication

This server supports two authentication methods. Every request to `/mcp` must include one.

### API Key

Pass a valid key in the `x-api-key` header:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Configure valid keys in `.env`:

```
API_KEYS=key1,key2,key3
```

### JWT Bearer Token

Pass a signed JWT in the `Authorization` header:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbG..." \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**Token claims:**

| Claim | Description |
|-------|------------|
| `sub` | User identifier |
| `role` | `"admin"` or `"user"` |
| `exp` | Expiry timestamp |

Use the `generate-token` tool (admin only) or generate tokens programmatically:

```typescript
import { generateToken } from "./auth.js";
const token = generateToken("user-id", "admin", "24h");
```

## Rate Limiting

In-memory rate limiting is applied per authenticated client. Configure via environment:

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window duration in ms |

Response headers on every request:

- `X-RateLimit-Limit` — Maximum requests allowed
- `X-RateLimit-Remaining` — Requests remaining in window
- `X-RateLimit-Reset` — Seconds until window resets

When exceeded, returns `429 Too Many Requests` with a `Retry-After` header.

## Available Tools

### `whoami`

Returns the authenticated user's identity and auth method. No parameters required.

### `generate-token`

Generates a JWT for a specified user. **Admin only.**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `userId` | string | (required) | User ID for the token |
| `role` | `"admin"` \| `"user"` | `"user"` | Role claim |
| `expiresIn` | string | `"24h"` | Expiry (e.g., `"1h"`, `"7d"`) |

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/mcp` | Yes | MCP protocol endpoint |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `API_KEYS` | Yes* | — | Comma-separated valid API keys |
| `JWT_SECRET` | Yes* | — | Secret for signing/verifying JWTs |
| `RATE_LIMIT_MAX` | No | `100` | Rate limit max requests |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window (ms) |

*At least one auth method must be configured.

## Development

```bash
# Watch mode (rebuild + restart on changes)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

1. Set a strong, unique `JWT_SECRET` (at least 32 characters)
2. Generate secure API keys (e.g., `openssl rand -hex 32`)
3. Consider placing behind a reverse proxy (nginx) for TLS termination
4. For production, replace the in-memory rate limiter with Redis-backed storage
5. Set `NODE_ENV=production`

## License

MIT
