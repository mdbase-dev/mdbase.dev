import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const specDir = resolve(process.env.MDBASE_SPEC_DIR ?? join(root, "..", "mdbase-spec"));
const source = resolve(process.env.MDBASE_SPEC_SITE_DIST ?? join(specDir, "site", "dist"));
const destination = join(root, "dist", "spec");
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

for (const asset of ["style.css", "theme.js", "mdbase-favicon.svg"]) {
  const path = join(source, asset);
  if (existsSync(path)) copyFileSync(path, join(destination, asset));
}

for (const support of ["IMPLEMENTING.md", "REFERENCE-RUNNER.md", "QUICK-REFERENCE.md"]) {
  const path = join(specDir, "v0.2", support);
  if (existsSync(path)) copyFileSync(path, join(destination, "v0.2", support));
}

addSitemapRoutes();

console.log(`Imported specification pages from ${source}`);

function rewrite(html, archive) {
  const pageUrl = archive
    ? `${siteOrigin}/spec/v0.2/`
    : `${siteOrigin}/spec/`;
  const pageTitle = archive
    ? "mdbase specification v0.2 archive"
    : "mdbase specification v0.3";
  return html
    .replaceAll('src="theme.js', 'src="/spec/theme.js')
    .replaceAll('href="style.css', 'href="/spec/style.css')
    .replaceAll('href="mdbase-favicon.svg"', 'href="/spec/mdbase-favicon.svg"')
    .replaceAll('href="runtime.html"', 'href="/runtime/"')
    .replaceAll('<a href="ecosystem.html">Implementations</a>', '')
    .replace(
      /<nav class="landing-nav" aria-label="Spec links">[\s\S]*?<\/nav>/,
      `<nav class="landing-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/connect/">Connect</a>
        <a href="/downloads/">Downloads</a>
        <a href="/apps/">Apps</a>
      </nav>`
    )
    .replace(
      /<div class="spec-mobile-links" aria-label="Site links">[\s\S]*?<\/div>/,
      `<div class="spec-mobile-links" aria-label="Site links">
        <a href="/">Home</a>
        <a href="/connect/">Connect</a>
        <a href="/downloads/">Downloads</a>
        <a href="/apps/">Apps</a>
      </div>`
    )
    .replaceAll('href="/testbed/"', 'href="#section-16"')
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
    .replace(
      "</head>",
      `  <link rel="stylesheet" href="/mdbase-theme.css">\n`
      + `  <link rel="stylesheet" href="/mdbase-shell.css">\n`
      + `  <link rel="canonical" href="${pageUrl}">\n`
      + `  <meta property="og:type" content="article">\n`
      + `  <meta property="og:title" content="${pageTitle}">\n`
      + `  <meta property="og:description" content="The full mdbase specification for typed Markdown collections.">\n`
      + `  <meta property="og:url" content="${pageUrl}">\n`
      + `  <meta name="mdbase-spec-channel" content="${archive ? "v0.2-archive" : "v0.3-current"}">\n`
      + "</head>"
    );
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
