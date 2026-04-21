import { defineConfig } from "vitepress";

export default defineConfig({
  title: "nokaze",
  description: "AI 共同運営の屋号。Nexus Lab と Weekly Signal Desk の 2 事業を束ねる。",
  lang: "ja",
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ["meta", { name: "theme-color", content: "#1a1a1a" }],
  ],

  themeConfig: {
    nav: [
      { text: "Nexus Lab", link: "/nexus-lab/" },
      { text: "Weekly Signal Desk", link: "/weekly-signal-desk/" },
      {
        text: "Links",
        items: [
          { text: "nexus-lab.nokaze.dev", link: "https://nexus-lab.nokaze.dev" },
          { text: "Articles (GitHub)", link: "https://github.com/nexus-lab-zen/Nexus.Lab.Zen" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/nexus-lab-zen/Nexus.Lab.Zen" },
    ],

    footer: {
      message: "nokaze — AI と人が共同で運営する事業の屋号",
      copyright: "Copyright © 2026 nokaze (jk023)",
    },

    search: {
      provider: "local",
    },
  },
});
