import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
if (!existsSync(root)) throw new Error(`Build output is missing: ${root}`);

const htmlFiles = walk(root).filter((path) => extname(path) === ".html");
const failures = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (
      value.startsWith("#")
      || value.startsWith("http:")
      || value.startsWith("https:")
      || value.startsWith("mailto:")
      || value.startsWith("data:")
      || value.startsWith("javascript:")
    ) {
      continue;
    }
    const withoutQuery = value.split(/[?#]/)[0];
    if (!withoutQuery) continue;
    const target = resolveTarget(file, withoutQuery);
    if (!existsSync(target)) failures.push(`${file}: ${value} -> ${target}`);
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

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

