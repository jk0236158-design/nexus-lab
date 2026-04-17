---
title: Transport Aware
---

# Transport Aware

MCP supports multiple transports. Most starters pick stdio silently. We make the decision visible.

| Transport | Use when |
|-----------|----------|
| **stdio** | Local process, invoked by Claude Code or a single client. |
| **Streamable HTTP** | Remote MCP server. This is the MCP-spec-recommended transport for remote. |
| **SSE** | Backward compatibility only. New servers should prefer Streamable HTTP. |

## Stateless vs stateful

The `http` template offers stateless-first defaults. Stateful sessions (cookie-bound, SSE-resumable) are opt-in and flagged in the README with their tradeoffs.

## Why the distinction matters

Picking the wrong transport is one of the most common sources of "works on my machine / fails in production" reports on MCP servers. Our templates make the choice and the reasoning explicit before you have code to unwind.
