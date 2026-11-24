export const escapeHtml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The window bar shows a web app's address, or the desktop app's name.
export const hosts = {
  "editor-chooser": "editor.mdbase.dev",
  "editor-source": "editor.mdbase.dev",
  "editor-survey": "editor.mdbase.dev",
  "editor-draft": "editor.mdbase.dev",
  "readwise-result": "reader.mdbase.dev",
  "readwise-preview": "reader.mdbase.dev",
  "readwise-input": "reader.mdbase.dev",
  "survey-note": "mdbase CLI",
  tasknotes: "app.tasknotes.dev",
  editor: "editor.mdbase.dev",
  reader: "reader.mdbase.dev",
  writer: "writer.mdbase.dev",
  "connect-approve": "connect.mdbase.dev",
  "connect-collections": "connect.mdbase.dev",
  "connect-sharing": "connect.mdbase.dev",
  "mcp-permissions": "connect.mdbase.dev",
  "vault-sync": "mdbase Connect",
  "desktop-home": "mdbase Connect",
  "desktop-collections": "mdbase Connect"
};

// On a phone a whole window is too small to read, so each capture names the part
// worth showing there: its left and top edges, width and height, as fractions of
// the capture. Opening the screenshot shows all of it.
const crops = {
  "editor-chooser": [0, 0, 0.62, 0.68],
  "editor-source": [0.44, 0.03, 0.55, 0.85],
  "editor-survey": [0.32, 0.05, 0.66, 0.72],
  "editor-draft": [0.32, 0.05, 0.66, 0.72],
  "readwise-result": [0.09, 0.35, 0.78, 0.64],
  "readwise-preview": [0.09, 0, 0.77, 0.65],
  "readwise-input": [0.08, 0.35, 0.79, 0.62],
  "survey-note": [0.015, 0.01, 0.84, 0.5],
  tasknotes: [0.2, 0.02, 0.62, 0.62],
  editor: [0.25, 0, 0.62, 0.62],
  reader: [0.2, 0.08, 0.6, 0.6],
  writer: [0, 0, 0.62, 0.62],
  "connect-approve": [0.19, 0.09, 0.62, 0.89],
  "connect-collections": [0.21, 0.02, 0.62, 0.62],
  "connect-sharing": [0.19, 0.52, 0.79, 0.36],
  "mcp-permissions": [0.22, 0.1, 0.58, 0.8],
  "vault-sync": [0.24, 0.2, 0.52, 0.6],
  "desktop-home": [0.22, 0.03, 0.4, 0.5],
  "desktop-collections": [0.22, 0.03, 0.6, 0.5]
};

export function shotWindow(name, alt, eager = false) {
  if (!Object.hasOwn(hosts, name)) throw new Error(`Unknown screenshot: ${name}`);
  const [x, y, w, h] = crops[name];
  const crop = `--crop-x:${x};--crop-y:${y};--crop-w:${w};--crop-ratio:${(1.6 * w / h).toFixed(3)}`;
  const images = ["light", "dark"].map(theme =>
    `<img class="app-shot__image app-shot__image--${theme}" src="/images/apps/${name}-${theme}.webp" alt="${escapeHtml(alt)}" width="1600" height="1000" loading="${eager ? "eager" : "lazy"}" decoding="async"${theme === "dark" ? " data-markdown-ignore" : ""}>`
  ).join("");
  return `<div class="app-shot__window" data-view-image="${hosts[name]}" tabindex="0" role="button" aria-label="Enlarge the screenshot: ${escapeHtml(alt)}">
    <div class="app-shot__bar" aria-hidden="true"><span>${hosts[name]}</span><svg class="app-shot__enlarge" viewBox="0 0 16 16"><path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5l-4.5 4.5M2.5 13.5 7 9" /></svg></div>
    <div class="app-shot__crop" style="${crop}">${images}</div>
  </div>`;
}
