import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import { codeFigures, codeTitle, includeFiles, recordings } from "./src/markdown/doc-records.mjs";

const site = process.env.MDBASE_SITE_ORIGIN ?? "https://mdbase.dev";

export default defineConfig({
  site,
  trailingSlash: "always",
  // Compression drops the line break before an inline link, gluing it to the previous word.
  compressHTML: false,
  integrations: [sitemap()],
  build: {
    format: "directory"
  },
  // The documentation records in content/ (see src/content.config.ts).
  markdown: {
    processor: satteri({
      // Text is kept as written: no curly quotes or dashes added.
      features: { headingAttributes: true, smartPunctuation: false },
      mdastPlugins: [includeFiles, recordings],
      hastPlugins: [codeFigures]
    }),
    shikiConfig: {
      // Colours come from the --syntax-* roles in global.css.
      theme: "css-variables",
      transformers: [codeTitle]
    }
  }
});
