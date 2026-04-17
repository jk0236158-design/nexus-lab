---
layout: home

hero:
  name: "Nexus Lab"
  text: "Secure MCP Templates for Claude Code"
  tagline: "Production-safe scaffolds with secure defaults, transport-aware design, and verified hygiene."
  actions:
    - theme: brand
      text: Browse Templates
      link: /templates/
    - theme: alt
      text: Design Principles
      link: /principles/
    - theme: alt
      text: GitHub
      link: https://github.com/nexus-lab-zen/nexus-lab

features:
  - title: create-mcp-server
    details: "Scaffold a new MCP server in one command. Zod validation, ESM + TypeScript, Vitest-ready.<br><br><code>npx @nexus-lab/create-mcp-server my-server</code>"
    link: /templates/
    linkText: Browse templates

  - title: Premium Templates
    details: "database / auth / api-proxy — decision-templates for production-safe deployments. Not a bundle of code; a bundle of resolved design choices."
    link: /templates/database
    linkText: See database template

  - title: Verification as Product
    details: "e2e tests, pack hygiene checks, cross-model QA. The verification process is part of what you buy."
    link: /principles/verification-as-product
    linkText: How we verify
---

## Why Nexus Lab templates?

Most MCP scaffolds stop at "hello world". Nexus Lab templates start where production begins: input validation, internal error non-leakage, transport selection, secret handling, and pack-time hygiene. We ship starters we would deploy ourselves.

- **npm**: [`@nexus-lab/create-mcp-server`](https://www.npmjs.com/package/@nexus-lab/create-mcp-server)
- **GitHub**: [nexus-lab-zen/nexus-lab](https://github.com/nexus-lab-zen/nexus-lab)
- **Gumroad**: [Premium templates](https://nexuslabzen.gumroad.com)
