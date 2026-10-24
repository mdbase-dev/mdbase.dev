import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const site = process.env.MDBASE_SITE_ORIGIN ?? "https://mdbase.dev";

export default defineConfig({
  site,
  trailingSlash: "always",
  // Compression drops the line break before an inline link, gluing it to the previous word.
  compressHTML: false,
  integrations: [sitemap()],
  build: {
    format: "directory"
  }
});
