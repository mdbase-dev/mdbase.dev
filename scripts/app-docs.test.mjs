import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const videos = JSON.parse(read("src/data/doc-videos.json"));
const placements = {
  "reader-markdown": "src/pages/apps/reader/index.astro",
  "extension-capture": "src/pages/apps/reader/extension/index.astro",
  "reader-library": "src/pages/apps/reader/library/index.astro",
  "writer-paper": "src/pages/apps/writer/index.astro",
  "writer-book": "src/pages/apps/writer/chapters/index.astro"
};

test("Reader and Writer are listed with live applications and local documentation", () => {
  const catalogue = read("src/pages/apps/index.astro");
  for (const app of ["reader", "writer"]) {
    assert.ok(catalogue.includes(`https://${app}.mdbase.dev/`));
    assert.ok(catalogue.includes(`/apps/${app}/`));
  }
  assert.ok(catalogue.includes("https://reader.mdbase.dev/?preview=1"));
  assert.ok(catalogue.includes("https://lab.mdbase-writer.pages.dev/?demo"));
});

test("Every documentation navigation entry resolves to a site page", () => {
  const sections = read("src/data/docs-sections.ts");
  const links = [...sections.matchAll(/href: "([^"]+)"/g)].map((match) => match[1]);
  assert.ok(links.length > 0);
  assert.equal(links.filter((href) => href.startsWith("/apps/reader/")).length, 9);
  assert.equal(links.filter((href) => href.startsWith("/apps/writer/")).length, 6);
  for (const href of links) {
    const page = new URL(`src/pages${href}index.astro`, root);
    assert.ok(existsSync(page), `Missing navigation target: ${fileURLToPath(page)}`);
  }
  assert.match(sections, /value: release\.sdkVersion/);
});

test("Five sample recordings have local playable files, posters and text equivalents", () => {
  assert.deepEqual(Object.keys(videos).sort(), Object.keys(placements).sort());
  for (const [name, metadata] of Object.entries(videos)) {
    const mp4 = readFileSync(new URL(`public/videos/${name}.mp4`, root));
    const poster = readFileSync(new URL(`public/videos/${name}.jpg`, root));
    assert.equal(mp4.subarray(4, 8).toString(), "ftyp", `${name}: MP4 container`);
    assert.equal(poster.subarray(0, 2).toString("hex"), "ffd8", `${name}: JPEG poster`);
    assert.ok(metadata.title && metadata.description);
    assert.match(metadata.duration, /^\d+:\d{2}$/);
    assert.ok(metadata.width > 0 && metadata.height > 0);
    assert.ok(metadata.steps.length >= 4, `${name}: text description of the actions`);
    assert.ok(read(placements[name]).includes(`<DocVideo name="${name}" />`));
  }
});

test("Video controls are opt-in and have accessible labels and descriptions", () => {
  const component = read("src/components/DocVideo.astro");
  const attributes = component.match(/<video\s+([^>]+)>/)[1];
  assert.match(attributes, /\bcontrols\b/);
  assert.match(attributes, /\bplaysinline\b/);
  assert.match(attributes, /preload="none"/);
  assert.match(attributes, /poster=/);
  assert.match(attributes, /aria-labelledby=/);
  assert.match(attributes, /aria-describedby=/);
  assert.doesNotMatch(attributes, /\bautoplay\b|\bloop\b/);
  assert.match(component, /Text description of the recording/);
  assert.match(component, /download/);
});
