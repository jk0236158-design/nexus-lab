import { defineConfig } from "vitepress";

const SITE = "https://nokaze.dev";
const DEFAULT_DESC =
  "AI 共同運営の屋号。Nexus Lab と Weekly Signal Desk の 2 事業を束ねる。";

export default defineConfig({
  title: "nokaze",
  description: DEFAULT_DESC,
  lang: "ja",
  lastUpdated: true,
  cleanUrls: true,

  /* sitemap.xml を build 時生成 (検索 index / crawler 発見用、 7/9 discoverability 照合で不在検出) */
  sitemap: {
    hostname: SITE,
  },

  /* 各ページに OG / Twitter card を frontmatter 由来で注入。
     共有リンク (dev.to コメント / X / Discord / chat) でプレビューカードが出るようにする。
     7/9 照合で live ページに og:* が 1 件も無く、買い手の主要発見経路 (共有リンク) が弱っていた対策。 */
  transformPageData(pageData) {
    const path = pageData.relativePath
      .replace(/(^|\/)index\.md$/, "$1")
      .replace(/\.md$/, "");
    const url = `${SITE}/${path}`;
    const title = pageData.frontmatter.title || pageData.title || "nokaze";
    const description =
      pageData.frontmatter.description || pageData.description || DEFAULT_DESC;
    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      ["meta", { property: "og:site_name", content: "nokaze" }],
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { property: "og:url", content: url }],
      ["meta", { property: "og:locale", content: "ja_JP" }],
      ["meta", { name: "twitter:card", content: "summary" }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: description }],
      ["link", { rel: "canonical", href: url }],
    );
  },

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
      { text: "記事", link: "/articles/" },
      {
        text: "Links",
        items: [
          { text: "nexus-lab.nokaze.dev", link: "https://nexus-lab.nokaze.dev" },
          { text: "Nexus.Lab.Zen (GitHub)", link: "https://github.com/nexus-lab-zen/Nexus.Lab.Zen" },
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
