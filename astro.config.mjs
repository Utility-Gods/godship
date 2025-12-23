import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import remarkMermaid from "remark-mermaid";

// https://astro.build/config
export default defineConfig({
  site: "https://www.utilitygods.com",
  integrations: [
    tailwind(),
    mdx({
      remarkPlugins: [remarkMermaid],
    }),
    sitemap({
      serialize(item) {
        return item;
      },
    }),
    icon({
      include: {
        mdi: ["*"],
        gridicons: ["*"],
        ph: ["*"],
      },
    }),
  ],
});
