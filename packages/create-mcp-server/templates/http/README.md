# MCP Server — HTTP Template

A [Model Context Protocol](https://modelcontextprotocol.io/) server over **Streamable HTTP** transport, for remote clients and multi-user scenarios. Free.

## Who this is for

- **You're building:** an MCP server that needs to be reachable over the network — remote Claude clients, web dashboards, or multi-user deployments where stdio isn't enough.
- **What it is:** an Express-based server exposing MCP over the **Streamable HTTP** transport (the current MCP spec recommendation for remote servers). SSE is supported for backward compatibility.
- **What's in the zip:** `src/index.ts` with Express routes, CORS, and the Streamable HTTP handler wired to the MCP SDK. `package.json`, `tsconfig.json`, `.gitignore`.
- **Not a fit if:** you want the simplest possible setup (pick `minimal`), or you need auth / rate limiting out of the box (pick the premium `auth` template, which builds on this HTTP foundation).
- **Run it in 3 steps:** `npm install` → `npm run build` → `npm start`. The server listens on `PORT` (default `3000`).
- **Next:** point your MCP client at `http://localhost:3000/mcp` · scaffold via `npx @nexus-lab/create-mcp-server my-server --template http` · or step up to [`auth`](https://nexuslabzen.gumroad.com/l/dghzas) (premium) for JWT / API key / rate limiting.

## Quick Start

```bash
npm install
npm run build
npm start
```

The server starts on `http://localhost:3000` by default. The MCP endpoint is `/mcp`.

Configure the port via environment:

```bash
PORT=8080 npm start
```

## Transport choice: why Streamable HTTP

The MCP TypeScript server docs now recommend **Streamable HTTP** for remote servers. SSE (Server-Sent Events) is still supported for backward compatibility with older clients, but new deployments should use Streamable HTTP.

- **Streamable HTTP** — bidirectional, single endpoint, works through most proxies and CDNs
- **SSE** — legacy, one-way server-to-client, kept for old clients only
- **stdio** — for local integration (use `minimal` / `full` templates instead)

## When to graduate

- Need **stdio only**? → [`minimal`](../minimal/README.md) or [`full`](../full/README.md)
- Need **JWT / API key auth + rate limiting** on top of HTTP? → [`auth`](https://nexuslabzen.gumroad.com/l/dghzas) (premium, ¥800)
- Need to **wrap an existing REST API** behind MCP with agent-safe defaults? → [`api-proxy`](https://nexuslabzen.gumroad.com/l/bktllv) (premium, ¥1,000)

## Security defaults

This template enables CORS and exposes MCP without auth — **that is intentional for a starter**, not a production recommendation. Before shipping:

1. Put it behind HTTPS (Cloudflare, nginx, or equivalent)
2. Add authentication (the `auth` premium template is the shortcut)
3. Restrict CORS origins to known clients
4. Add rate limiting (the `auth` template includes a sliding-window limiter)

MIT. Made by [Nexus Lab](https://nexus-lab.nokaze.dev) ([articles](https://github.com/nexus-lab-zen/Nexus.Lab.Zen)).
