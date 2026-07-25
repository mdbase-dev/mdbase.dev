import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://mdbase.dev",
  trailingSlash: "always",
  integrations: [sitemap()],
  build: {
    format: "directory"
  }
});

