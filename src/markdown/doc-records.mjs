// Markdown pipeline for the documentation records in content/.
//
// content/_types/doc-page.md documents the authoring conventions. Here we
// caption code, include example files and render media with their controls.
import { escapeHtml, shotWindow } from "./app-shot.mjs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const videos = JSON.parse(readFileSync(resolve(root, "src/data/doc-videos.json"), "utf8"));

/** Parses `key="value"` pairs from a code block's info string. */
export function parseMeta(meta) {
  const attributes = {};
  for (const match of (meta ?? "").matchAll(/([\w-]+)="((?:[^"\\]|\\.)*)"/g)) {
    attributes[match[1]] = match[2].replace(/\\"/g, '"');
  }
  return attributes;
}

/** The text a `file=` code block stands for. */
export function includedText(attributes) {
  const path = resolve(root, attributes.file);
  if (!path.startsWith(`${resolve(root, "examples")}/`)) {
    throw new Error(`Code blocks can only include files under examples/: ${attributes.file}`);
  }
  const text = readFileSync(path, "utf8");
  if (!attributes.pick) return text.replace(/\n$/, "");
  const value = JSON.parse(text)[attributes.pick];
  if (value === undefined) {
    throw new Error(`${attributes.file} has no "${attributes.pick}" key`);
  }
  return JSON.stringify({ [attributes.pick]: value }, null, 2);
}

export function videoFigure(name) {
  const video = videos[name];
  if (!video) throw new Error(`Unknown recording /videos/${name}.mp4`);
  const src = `/videos/${name}.mp4`;
  const titleId = `video-${name}-title`;
  const descriptionId = `video-${name}-description`;
  return [
    `<figure class="doc-video">`,
    `<figcaption id="${titleId}"><strong>${escapeHtml(video.title)}</strong><span>${escapeHtml(video.duration)}</span></figcaption>`,
    `<video controls playsinline preload="none" poster="/videos/${name}.jpg" width="${video.width}" height="${video.height}" aria-labelledby="${titleId}" aria-describedby="${descriptionId}">`,
    `<source src="${src}" type="video/mp4" />`,
    `<p><a href="${src}">Download the recording</a> to watch it in a video player.</p>`,
    `</video>`,
    `<p id="${descriptionId}">${escapeHtml(video.description)} Silent recording with on-screen captions and sample data.</p>`,
    `<details><summary>Text description of the recording</summary><ol>${video.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol></details>`,
    `<p class="doc-video-download"><a href="${src}" download>Download MP4</a></p>`,
    `</figure>`,
  ].join("");
}

export const includeFiles = {
  name: "mdbase-include-files",
  code(node, ctx) {
    const attributes = parseMeta(node.meta);
    if (!attributes.file) return;
    if (node.value.trim()) {
      throw new Error(`A code block with file="${attributes.file}" must be empty`);
    }
    ctx.replaceNode(node, { ...node, value: includedText(attributes) });
  },
};

export const recordings = {
  name: "mdbase-recordings",
  paragraph(node, ctx) {
    const [only] = node.children;
    if (node.children.length !== 1 || only.type !== "image") return;
    const shot = only.url.match(/^\/images\/apps\/([\w-]+)-light\.webp$/);
    if (shot) {
      ctx.replaceNode(node, { type: "html", value: `<figure class="app-shot">${shotWindow(shot[1], only.alt)}</figure>` });
      return;
    }
    const match = only.url.match(/^\/videos\/([\w-]+)\.mp4$/);
    if (!match) return;
    ctx.replaceNode(node, { type: "html", value: videoFigure(match[1]) });
  },
};

/** Shiki transformer: carries a code block's title to the <pre>. */
export const codeTitle = {
  name: "mdbase-code-title",
  pre(node) {
    const { title } = parseMeta(this.options.meta?.__raw);
    if (title) node.properties.dataTitle = title;
  },
};

/** Wraps each highlighted block in the site's captioned code figure. */
export const codeFigures = {
  name: "mdbase-code-figures",
  element: {
    filter: ["pre"],
    visit(node, ctx) {
      const { dataTitle: title, "data-title": rawTitle, dataCaptioned, ...properties } = node.properties ?? {};
      // The wrapped <pre> is visited again inside its new figure.
      if (dataCaptioned !== undefined) return;
      const language = properties.dataLanguage ?? "text";
      const pre = { ...node, properties: { ...properties, dataCaptioned: "" } };
      ctx.replaceNode(node, {
        type: "element",
        tagName: "figure",
        properties: { className: ["code-block"] },
        children: [
          {
            type: "element",
            tagName: "figcaption",
            properties: {},
            children: [
              { type: "element", tagName: "span", properties: {}, children: [{ type: "text", value: String(title ?? rawTitle ?? language) }] },
              {
                type: "element",
                tagName: "button",
                properties: { type: "button", dataCopyCode: "" },
                children: [{ type: "text", value: "Copy" }],
              },
            ],
          },
          pre,
        ],
      });
    },
  },
};
