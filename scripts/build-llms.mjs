// Writes Markdown copies of the built pages for language models and other
// text tools: an index.md beside each searchable page, /llms.txt listing them,
// and /llms-full.txt with every page in one file.
//
// A page is included when its <main> carries data-pagefind-body, the same rule
// the site search uses, so noIndex pages and the archived specification stay out.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import TurndownService from "turndown";

const root = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
if (!existsSync(root)) throw new Error(`Build output is missing: ${root}`);

const origin = (process.env.MDBASE_SITE_ORIGIN ?? "https://mdbase.dev").replace(/\/$/, "");

// Sections of /llms.txt, matched by path prefix in order. The first match wins.
const sections = [
  { title: "Product", match: (path) => ["/", "/connect/", "/downloads/", "/beta/"].includes(path) },
  { title: "Applications", match: (path) => path.startsWith("/apps/") },
  { title: "SDK", match: (path) => path.startsWith("/sdk/") },
  {
    title: "Specification, runtime and contracts",
    match: (path) => ["/spec/", "/runtime/", "/contracts/"].some((prefix) => path.startsWith(prefix))
  },
  { title: "Policies and support", match: () => true }
];

export function pageToMarkdown(html, turndown = createTurndown()) {
  const main = html.match(/<main\b([^>]*)>([\s\S]*?)<\/main>/);
  if (!main || !/\bdata-pagefind-body\b/.test(main[1])) return null;
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").replace(/ \| mdbase$/, "");
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
  const body = turndown.turndown(main[2]).replace(/\n{3,}/g, "\n\n").trim();
  return { title, description, body };
}

export function createTurndown() {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*"
  });
  turndown.remove(["script", "style", "canvas", "svg", "button", "video", "noscript"]);
  turndown.addRule("ignored", {
    filter: (node) => node.getAttribute?.("data-pagefind-ignore") != null || node.getAttribute?.("aria-hidden") === "true",
    replacement: () => ""
  });
  // The docs title block repeats the title and description given above the body,
  // and a code block's caption only labels the copy button's target.
  turndown.addRule("repeatedChrome", {
    filter: (node) =>
      (node.nodeName === "HEADER" && node.classList?.contains("docs-title"))
      || (node.nodeName === "FIGCAPTION" && node.parentNode?.classList?.contains("code-block")),
    replacement: () => ""
  });
  turndown.addRule("fencedLanguage", {
    filter: (node) => node.nodeName === "PRE" && node.firstChild?.nodeName === "CODE",
    replacement: (_content, node) => {
      const code = node.firstChild;
      const language = (code.getAttribute("class") ?? "").match(/language-(\S+)/)?.[1] ?? "";
      const text = code.textContent.replace(/\n$/, "");
      const fence = text.includes("```") ? "~~~~" : "```";
      return `\n\n${fence}${language === "text" ? "" : language}\n${text}\n${fence}\n\n`;
    }
  });
  // Site-relative links become absolute, so the Markdown works outside the site.
  turndown.addRule("absoluteLinks", {
    filter: (node) => node.nodeName === "A" && node.getAttribute("href"),
    replacement: (content, node) => {
      const href = node.getAttribute("href");
      // Heading permalinks ("#") add nothing once the page is Markdown.
      if (!content.trim() || content.trim() === "#") return "";
      const absolute = href.startsWith("/") ? `${origin}${href}` : href;
      // Links laid out in a row, as in the app catalogue, need a separator.
      const separator = node.nextElementSibling?.nodeName === "A" ? " · " : "";
      return `[${content}](${absolute})${separator}`;
    }
  });
  turndown.addRule("images", {
    filter: "img",
    replacement: (_content, node) => {
      const alt = node.getAttribute("alt");
      return alt ? `\n\n*Image: ${alt}*\n\n` : "";
    }
  });
  return turndown;
}

function decode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .trim();
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "pagefind" ? [] : walk(path);
    return entry.name === "index.html" ? [path] : [];
  });
}

function sitePath(file) {
  const directory = relative(root, dirname(file)).split(sep).join("/");
  return directory ? `/${directory}/` : "/";
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const turndown = createTurndown();
  const pages = walk(root)
    .map((file) => ({ file, path: sitePath(file), page: pageToMarkdown(readFileSync(file, "utf8"), turndown) }))
    .filter(({ page }) => page)
    .sort((a, b) => a.path.localeCompare(b.path));

  for (const { file, path, page } of pages) {
    const markdown = `# ${page.title}\n\n> ${page.description}\n\nSource: ${origin}${path}\n\n${page.body.replace(/^# .*\n+/, "")}\n`;
    writeFileSync(join(dirname(file), "index.md"), markdown);
  }

  const grouped = sections.map((section) => ({ ...section, pages: [] }));
  for (const entry of pages) grouped.find((section) => section.match(entry.path)).pages.push(entry);

  const index = [
    "# mdbase",
    "",
    "> mdbase keeps structured data in ordinary Markdown files. A collection is a folder of Markdown records plus type definitions; apps built on mdbase Connect read and change those files with the permissions you grant, and Connect syncs and shares them across devices.",
    "",
    "Every page below is also available as Markdown at the linked index.md. The normative specification is at /spec/. All pages in one file: " + `${origin}/llms-full.txt`,
    ""
  ];
  for (const section of grouped) {
    if (section.pages.length === 0) continue;
    index.push(`## ${section.title}`, "");
    for (const { path, page } of section.pages) {
      index.push(`- [${page.title}](${origin}${path}index.md): ${page.description}`);
    }
    index.push("");
  }
  writeFileSync(join(root, "llms.txt"), index.join("\n"));

  const full = pages
    .map(({ path, page }) => `# ${page.title}\n\nSource: ${origin}${path}\n\n${page.body.replace(/^# .*\n+/, "")}`)
    .join("\n\n---\n\n");
  writeFileSync(join(root, "llms-full.txt"), `${full}\n`);

  console.log(`Wrote Markdown for ${pages.length} pages, llms.txt and llms-full.txt`);
}
