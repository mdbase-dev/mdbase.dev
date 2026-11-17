import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSpecPage } from "./spec-page.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const specDir = resolve(process.env.MDBASE_SPEC_DIR ?? join(root, "..", "mdbase-spec"));
const source = resolve(process.env.MDBASE_SPEC_SITE_DIST ?? join(specDir, "site", "dist"));
const destination = join(root, "dist", "spec");
const SUPPORT_FILES = ["IMPLEMENTING.md", "REFERENCE-RUNNER.md", "QUICK-REFERENCE.md"];
const siteOrigin = new URL(process.env.MDBASE_SITE_ORIGIN ?? "https://mdbase.dev").origin;

required(join(root, "dist", "index.html"), "Build mdbase.dev before importing the specification");
required(join(source, "spec.html"), "Build mdbase-spec/site before importing it");

mkdirSync(join(destination, "v0.2"), { recursive: true });

writeFileSync(
  join(destination, "index.html"),
  rewrite(readFileSync(join(source, "spec.html"), "utf8"), false)
);
writeFileSync(
  join(destination, "v0.2", "index.html"),
  rewrite(readFileSync(join(source, "spec-v0.2.html"), "utf8"), true)
);

for (const support of SUPPORT_FILES) {
  const path = join(specDir, "v0.2", support);
  if (existsSync(path)) copyFileSync(path, join(destination, "v0.2", support));
}

addSitemapRoutes();

console.log(`Imported specification pages from ${source}`);

function rewrite(html, archive) {
  const shellPath = join(destination, archive ? "v0.2/index.html" : "index.html");
  required(shellPath, "Build the shared specification shell before importing");
  const content = html
    .replaceAll('href="runtime.html"', 'href="/runtime/"')
    .replaceAll('href="/testbed/"', 'href="#section-14"')
    .replaceAll('href="spec-v0.2.html"', 'href="/spec/v0.2/"')
    .replaceAll('href="spec.html"', 'href="/spec/"')
    .replaceAll(
      "https://github.com/callumalpass/mdbase-spec",
      "https://github.com/mdbase-dev/mdbase-spec"
    )
    .replaceAll(
      'href="../examples/adapter-template.py"',
      'href="https://github.com/mdbase-dev/mdbase-spec/blob/main/examples/adapter-template.py"'
    )
    .replaceAll(
      'href="../examples/annotated-collection/"',
      'href="https://github.com/mdbase-dev/mdbase-spec/tree/main/examples/annotated-collection"'
    )
    .replaceAll(
      'href="./standard-packs/mdbase-runtime/0.2.0/"',
      'href="https://github.com/mdbase-dev/mdbase-spec/tree/main/standard-packs/mdbase-runtime/0.2.0"'
    )
    .replace(/<a href="\.\/person\.md">([^<]+)<\/a>/g, "<code>$1</code>")
    .replace(/<a href="\.\/project\.md">([^<]+)<\/a>/g, "<code>$1</code>")
    .replace(/href="\.\/\d{2}-[^"#]+\.md#([^"]+)"/g, 'href="#$1"')
    // Any other repository-relative document (release records, release
    // notes) is not published on this site, so link to it on GitHub. The
    // archive's support guides are copied beside it below, so they stay.
    .replace(
      /href="\.\/([^"#]+\.md)(#[^"]*)?"/g,
      (link, path, fragment = "") =>
        archive && SUPPORT_FILES.includes(path)
          ? link
          : `href="https://github.com/mdbase-dev/mdbase-spec/blob/main/${path}${fragment}"`
    );
  return renderSpecPage(readFileSync(shellPath, "utf8"), content, archive);
}

function addSitemapRoutes() {
  const path = join(root, "dist", "sitemap-0.xml");
  required(path, "Build the Astro sitemap before importing the specification");
  let sitemap = readFileSync(path, "utf8");
  for (const route of ["/spec/", "/spec/v0.2/"]) {
    const entry = `<url><loc>${siteOrigin}${route}</loc></url>`;
    if (!sitemap.includes(entry)) {
      sitemap = sitemap.replace("</urlset>", `${entry}</urlset>`);
    }
  }
  writeFileSync(path, sitemap);
}

function required(path, message) {
  if (!existsSync(path)) throw new Error(`${message}: ${path}`);
}
