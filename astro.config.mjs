// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import remarkGfm from "remark-gfm";
import rehypeTableWrapper from "./src/plugins/rehype-table-wrapper.mjs";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  devToolbar: {
    enabled: false,
  },
  integrations: [react(), mdx(), sitemap()],

  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeTableWrapper],
    shikiConfig: {
      defaultColor: false,
      themes: {
        light: "github-light-high-contrast",
        dark: "github-dark",
      },
      wrap: true,
    },
  },

  prefetch: {
    prefetchAll: true,
  },

  output: "static",
  site: "https://rokajdnik.com",
});
