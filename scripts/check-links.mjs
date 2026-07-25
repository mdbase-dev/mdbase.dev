import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
if (!existsSync(root)) throw new Error(`Build output is missing: ${root}`);

const htmlFiles = walk(root).filter((path) => extname(path) === ".html");
const failures = [];
const idsByFile = new Map();

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(/[A-Za-z)]<code|<\/code>[A-Za-z(]/g)) {
    failures.push(`${file}: inline code is joined to adjacent prose near byte ${match.index}`);
  }
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (
      value.startsWith("http:")
      || value.startsWith("https:")
      || value.startsWith("mailto:")
      || value.startsWith("data:")
      || value.startsWith("javascript:")
    ) {
      continue;
    }
    const [pathAndQuery, fragment] = value.split("#", 2);
    const withoutQuery = pathAndQuery.split("?")[0];
    const target = withoutQuery ? resolveTarget(file, withoutQuery) : file;
    if (!existsSync(target)) {
      failures.push(`${file}: ${value} -> ${target}`);
      continue;
    }
    if (fragment && extname(target) === ".html" && !ids(target).has(decodeURIComponent(fragment))) {
      failures.push(`${file}: ${value} -> missing fragment in ${target}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Checked ${htmlFiles.length} HTML files with no broken local links`);
}

function resolveTarget(from, value) {
  const base = value.startsWith("/")
    ? join(root, value)
    : resolve(join(from, ".."), value);
  if (extname(base)) return base;
  return value.endsWith("/") ? join(base, "index.html") : base;
}

function ids(path) {
  if (!idsByFile.has(path)) {
    idsByFile.set(
      path,
      new Set(
        [...readFileSync(path, "utf8").matchAll(/\sid="([^"]+)"/g)]
          .map((match) => match[1])
      )
    );
  }
  return idsByFile.get(path);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
