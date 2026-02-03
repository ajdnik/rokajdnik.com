// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  devToolbar: {
    enabled: false,
  },
  integrations: [react(), sitemap()],

  markdown: {
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
