---
title: Secure Defaults
---

# Secure Defaults

Every template ships with the following already wired in:

- **Input validation** via Zod schemas on every tool input (min / max / type).
- **Internal-error non-leakage**: helpers like `formatDbError()` / `formatAuthError()` return user-safe strings and preserve detailed logs server-side.
- **Secret handling**: `.env.example` files list required secrets; no secrets committed; timing-safe comparison where applicable.
- **Secure header defaults** for HTTP transports.

The goal is that a newly scaffolded server is _not_ a tutorial toy. It is a starter you could hand to a junior engineer without adding a security review to the backlog.

## What this is not

- Not a substitute for threat modeling specific to your deployment.
- Not a replacement for your production secret manager.
- Not a promise of "vulnerability-free" — templates evolve as the MCP spec and dependencies evolve.
