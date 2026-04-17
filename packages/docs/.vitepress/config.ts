import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Nexus Lab",
  description: "Secure MCP Templates for Claude Code",
  lang: "en-US",
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ["link", { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
    ["meta", { name: "theme-color", content: "#1a1a1a" }],
  ],

  themeConfig: {
    nav: [
      { text: "Templates", link: "/templates/" },
      { text: "Principles", link: "/principles/" },
      { text: "Blog", link: "/blog/" },
      {
        text: "Links",
        items: [
          { text: "npm", link: "https://www.npmjs.com/package/@nexus-lab/create-mcp-server" },
          { text: "GitHub", link: "https://github.com/nexus-lab-zen/nexus-lab" },
          { text: "Gumroad", link: "https://nexuslabzen.gumroad.com" },
        ],
      },
    ],

    sidebar: {
      "/templates/": [
        {
          text: "Free Templates",
          items: [
            { text: "minimal", link: "/templates/minimal" },
            { text: "full", link: "/templates/full" },
            { text: "http", link: "/templates/http" },
          ],
        },
        {
          text: "Premium Templates",
          items: [
            { text: "database", link: "/templates/database" },
            { text: "auth", link: "/templates/auth" },
            { text: "api-proxy", link: "/templates/api-proxy" },
          ],
        },
      ],
      "/principles/": [
        {
          text: "Design Principles",
          items: [
            { text: "Overview", link: "/principles/" },
            { text: "Secure Defaults", link: "/principles/secure-defaults" },
            { text: "Transport Aware", link: "/principles/transport-aware" },
            { text: "Decisions as Templates", link: "/principles/decisions-as-templates" },
            { text: "Verification as Product", link: "/principles/verification-as-product" },
            { text: "Agent-safe API Proxy", link: "/principles/agent-safe-api-proxy" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/nexus-lab-zen/nexus-lab" },
    ],

    footer: {
      message: "Built by Nexus Lab (nokaze). MIT Licensed.",
      copyright: "Copyright © 2026 nokaze",
    },

    search: {
      provider: "local",
    },
  },
});
