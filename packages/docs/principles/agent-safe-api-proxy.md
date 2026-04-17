---
title: Agent-safe API Proxy
---

# Agent-safe API Proxy

The `api-proxy` template is not a general-purpose REST proxy. It is a proxy **hardened against agent-specific failure modes**.

## The three agent-specific risks

1. **Path pivot**: the LLM constructs a request to an upstream URL the operator never intended to expose. Mitigation: allowlist-based path routing, not regex wildcards.
2. **Secret bleed**: upstream errors, headers, or debug responses leak API keys or connection strings into the MCP response. Mitigation: response-side scrubbing and `formatUpstreamError()`.
3. **Unbounded fan-out**: a single tool call triggers dozens of upstream requests via agent looping. Mitigation: per-session request budgets and explicit limits.

## Where this sits relative to @orval/mcp

`@orval/mcp` converts OpenAPI → MCP automatically. That is a different value proposition: coverage and speed. We do not compete there. Our positioning is **the secure wrapper you would want when exposing a sensitive upstream to an agent**, which the auto-generated version cannot express because the risks are context-dependent.

## Related

- [api-proxy template](/templates/api-proxy)
- [Secure Defaults](/principles/secure-defaults)
