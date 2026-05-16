import { defineConfig } from "vitepress";

export default defineConfig({
  title: "nokaze",
  description: "AI 共同運営の屋号。Nexus Lab と Weekly Signal Desk の 2 事業を束ねる。",
  lang: "ja",
  lastUpdated: true,
  cleanUrls: true,

  head: [
    /* nokaze theme-color: 墨色 (sumi-bg、 nokaze-design skill 由来) */
    ["meta", { name: "theme-color", content: "#0F0F0F" }],
    /* preconnect for Google Fonts (Noto Serif/Sans JP + JetBrains Mono via theme/style.css) */
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
  ],

  themeConfig: {
    /* logo に nokaze wordmark を採用 (skill assets 由来) */
    logo: "/assets/nokaze-wordmark.svg",
    siteTitle: false, /* logo 内に「野風 nokaze」 が含まれるので title 重複を避ける */

    nav: [
      { text: "Nexus Lab", link: "/nexus-lab/" },
      { text: "Weekly Signal Desk", link: "/weekly-signal-desk/" },
      { text: "Yuino", link: "/yuino/" },
      {
        text: "Links",
        items: [
          { text: "nexus-lab.nokaze.dev", link: "https://nexus-lab.nokaze.dev" },
          { text: "Articles (GitHub)", link: "https://github.com/nexus-lab-zen/Nexus.Lab.Zen" },
          { text: "Zenn (nexus_lab_zen)", link: "https://zenn.dev/nexus_lab_zen" },
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
