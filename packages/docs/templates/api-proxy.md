---
title: api-proxy template
description: Agent-safe upstream proxy with path-pivot protection
---

# api-proxy

<!-- BUYER PATH (Akari fills in) ======================================== -->

::: tip For buyers
<!-- FILL: Who is this for? -->
**Who it's for**: _(Akari to write — e.g. "Claude Code devs wrapping an existing REST/HTTP API as an MCP server, concerned about agent-driven path pivots or secret leakage.")_

<!-- FILL: What it prevents / shortens -->
**What it prevents / shortens**: _(Akari to write — e.g. "Prevents path-pivot (LLM constructing unintended upstream URLs), secret bleed into responses, and unbounded fan-out.")_

<!-- FILL: What's in the zip -->
**What's in the zip**: _(Akari to write — list: src/proxy/, src/allowlist/, tests/, README, LICENSE, package.json, .env.example.)_

<!-- FILL: Known constraints / not for -->
**Known constraints**: _(Akari to write — e.g. "Allowlist-based path routing (not regex wildcards); upstream must be REST/JSON; no streaming upstream yet in v1.")_

<!-- FILL: Shortest path to running -->
**Shortest path to running**:
```bash
unzip api-proxy-template.zip && cd api-proxy-template
cp .env.example .env  # set UPSTREAM_BASE_URL, UPSTREAM_API_KEY
npm install
npm test
npm run dev
```

<!-- FILL: Next action -->
**Next action**: [Buy on Gumroad](https://nexuslabzen.gumroad.com/l/bktllv) · [Template source preview](https://github.com/nexus-lab-zen/nexus-lab/tree/master/packages/create-mcp-server/templates/api-proxy)
:::

<!-- END BUYER PATH ===================================================== -->

---

<!--@include: ../../create-mcp-server/templates/api-proxy/README.md-->
