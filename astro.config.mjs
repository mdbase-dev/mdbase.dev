import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const site = process.env.MDBASE_SITE_ORIGIN ?? "https://mdbase.dev";

export default defineConfig({
  site,
  trailingSlash: "always",
  integrations: [sitemap()],
  build: {
    format: "directory"
  }
});
