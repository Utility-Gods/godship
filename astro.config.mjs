import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import remarkMermaid from "remark-mermaid";

// https://astro.build/config
export default defineConfig({
  site: "https://utilitygods.com",
  integrations: [
    tailwind(),
    mdx({
      remarkPlugins: [remarkMermaid],
    }),
    sitemap(),
    icon({
      include: {
        mdi: ["*"],
        gridicons: ["*"],
        ph: ["*"],
      },
    }),
  ],
});
