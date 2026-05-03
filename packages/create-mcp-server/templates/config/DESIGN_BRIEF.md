# DESIGN_BRIEF — `config` template (¥1,000)

One-page rationale for the choices baked into the template. Read this once; you'll know every default and every limit.

## Why Zod (not TypeBox / yup / valibot)

- The free `minimal` / `full` / `http` templates already use Zod for tool argument validation — adding a second schema lib for config would force buyers to learn two type systems.
- `z.coerce.number()` / `.boolean()` exist out of the box, which is exactly what you need at the env layer where every value arrives as a string.
- Zod's `.describe()` is the lightest possible carrier for the `@secret` marker — no metadata sidecar, no symbol registry. Move the field, the marker travels with it.
- Bundle cost is ~14KB minified. Acceptable.

## Why env / file / profile (3 layers, in that precedence order)

| Layer       | Wins over | Source of truth for                                |
| ----------- | --------- | -------------------------------------------------- |
| Schema defaults | nothing | sensible fallbacks ("port 3000")                |
| Files       | defaults | per-tier config (committed `config.prod.yaml`) |
| Env vars    | files    | deployment-time overrides + secrets            |

A "single source of truth" sounds appealing but breaks the moment you need a deployment-only value (a credential, a pod-specific URL). Three layers with a fixed precedence order is fewer surprises than the half-dozen ad-hoc patterns I see in OSS MCP servers today.

## Why redaction lives in `secrets.ts`, separate from `loader.ts`

The loader's job is "produce a typed object". The redactor's job is "produce a log-safe view of an arbitrary object". Coupling them would mean every consumer who logs a sub-tree of the config has to remember which paths to redact — that's exactly the leak class this template prevents. Schema-driven redaction makes "log a secret" a `safeStringify(value, schema)` away.

## Why both `NODE_ENV` and `MCP_CONFIG_PROFILE`

`NODE_ENV` is overloaded. npm reads it. webpack / vite read it. Express reads it. Toggling `NODE_ENV=production` to test a "prod tier" config in a sandbox accidentally triggers half a dozen unrelated optimizations.

`MCP_CONFIG_PROFILE` is a template-local override. Set it to `dev` for a chaos drill against a `NODE_ENV=production` deployment without disturbing the rest of the runtime.

`MCP_CONFIG_PROFILE` wins; `NODE_ENV` is the fallback.

## What's NOT in scope (and why)

- **Distributed config (Consul / etcd / AWS Parameter Store).** A correct distributed-config implementation needs reconnect logic, version skew handling, and a watch loop. That's a separate template — wrap `loadConfig` if you need it.
- **Hot reload.** File watchers + partial updates + in-flight request semantics = a class of "config drift" bugs that cost more debugging time than they save. Restart the process.
- **Cross-language config.** This template assumes TypeScript / Node consumers. The schema lives in code; if you need to share it with Python / Go services, generate JSON Schema from the Zod object and ship that.

## Why this is the ¥1,000 entry tier

The other 3 premium templates (`database` ¥1,500, `auth` ¥2,250, `api-proxy` ¥3,000) each prevent **5+ failure modes** (connection pool exhaustion, JWT confusion, redirect-based credential leakage, body-DoS, etc). This one prevents 3 — the 3 every config layer eventually hits, but each is a smaller surface than what `auth` or `api-proxy` covers.

Think of it as: "stop reinventing the same env / file / profile loader" — not a security product, a productivity one.

---

Nexus Lab, 2026-04-22.
