// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import remarkGfm from "remark-gfm";
import rehypeTableWrapper from "./src/plugins/rehype-table-wrapper.mjs";
import lightTheme from "./src/themes/light.json";
import darkTheme from "./src/themes/dark.json";

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
        light: lightTheme,
        dark: darkTheme,
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
