---
title: Design Principles
description: The 5 axes that distinguish Nexus Lab templates
---

# Design Principles

Nexus Lab templates compete on **quality × originality × continuity**, not speed or volume. The five axes below describe how we decide what goes into a template and what stays out.

We do not compete with generic scaffolds, framework libraries (fastmcp, mcp-framework), or full OpenAPI auto-conversion tools (@orval/mcp). We compete with production-safe defaults that the above leave to the user.

## The 5 axes

1. **[Secure Defaults](/principles/secure-defaults)** — input validation, internal-error non-leakage, secret hygiene baked in.
2. **[Transport Aware](/principles/transport-aware)** — stdio / Streamable HTTP / stateless / stateful are design decisions, not accidents.
3. **[Decisions as Templates](/principles/decisions-as-templates)** — premium templates sell resolved design choices, not code volume.
4. **[Verification as Product](/principles/verification-as-product)** — e2e tests, pack hygiene, and cross-model QA are part of what ships.
5. **[Agent-safe API Proxy](/principles/agent-safe-api-proxy)** — proxy templates treat agent-driven misuse (path pivots, secret bleed) as a first-class concern.

## Why these five

Rather than "another MCP starter", we ship the parts a team would otherwise have to decide, implement, and harden themselves. The premium templates are not priced on line count — they are priced on the design time we saved the buyer.
