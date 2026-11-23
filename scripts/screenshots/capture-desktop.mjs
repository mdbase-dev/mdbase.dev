// Captures the desktop app's screens shown on the site (public/images/apps/desktop-*).
//
// Copy this file into apps/desktop of an mdbase-connect checkout (it resolves
// playwright-core from there), build the renderer, and run:
//   node capture-desktop.mjs <outdir>
//
// The renderer is loaded in a browser with a stand-in for the preload API, as the
// desktop app's own renderer tests do, over a made-up account. The captures are
// 1120×700 at 2×, light and dark; convert each PNG to a 1600×1000 WebP named
// desktop-<screen>-<theme>.webp.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { chromium } from "playwright-core";
const root = resolve(process.cwd(), "dist/renderer");
const out = process.argv[2];
let THEME = "light";
const unavailableUpdate = { phase: "unavailable", current_version: "0.1.33", channel: "beta", message: "", can_check: false, can_install: false };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const file = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (!file.startsWith(`${root}${sep}`)) { response.writeHead(403).end(); return; }
  try {
    const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".svg": "image/svg+xml" };
    response.setHeader("Content-Type", types[extname(file)] ?? "application/octet-stream");
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise((ready, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", ready); });
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, channel: "chrome" });
async function desktop({ signedIn = true, collections = [], access = [], devices = [], activity = [], apps = [], updateStatus = unavailableUpdate } = {}) {
  const page = await browser.newPage({ viewport: { width: 1120, height: 700 }, deviceScaleFactor: 2, colorScheme: THEME, reducedMotion: "reduce" });
  await page.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page.addInitScript(({ signedIn, collections, access, devices, activity, apps, updateStatus }) => {
    const calls = [];
    const record = (name) => async (...args) => { calls.push([name, ...args]); return null; };
    const fixture = {
      calls, collections, access, devices, activity, apps, updateStatus, requireApproval: false,
      account: { configured: signedIn, serverUrl: signedIn ? "https://connect.example.test" : null, online: signedIn, pairing: null, lastError: null },
      status: () => ({ target: "isolated_profile", state_dir: "/disposable", account: {
        signed_in: fixture.account.configured, online: fixture.account.online, environment: "production",
        pairing: fixture.account.pairing ?? undefined, last_error: fixture.account.lastError ?? undefined,
        server: fixture.account.serverUrl ?? undefined, computer_name: fixture.account.computerName ?? undefined
      }, collections: fixture.collections }),
      counts: {}
    };
    window.fixture = fixture;
    // Electron reports a window hidden to the tray as a hidden page.
    let visibility = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => visibility !== "visible" });
    fixture.setVisibility = (next) => { visibility = next; document.dispatchEvent(new Event("visibilitychange")); };
    window.mdbaseConnect = {
      getLocale: async () => localStorage.getItem("fixture:locale") ?? "en",
      setLocale: async (locale) => { calls.push(["setLocale", locale]); localStorage.setItem("fixture:locale", locale); },
      status: async () => fixture.status(),
      updateStatus: async () => fixture.updateStatus,
      checkForUpdates: async () => { calls.push(["checkForUpdates"]); return fixture.updateStatus; },
      installUpdate: async () => { calls.push(["installUpdate"]); return fixture.updateStatus; },
      migrationStatus: async () => fixture.migration ?? { record: null, running: false },
      listCollections: async () => fixture.collections,
      listAccess: async () => fixture.access,
      listApps: async () => ({ applications: fixture.apps }),
      openApp: record("openApp"),
      openAccount: record("openAccount"),
      getSettings: async () => ({ require_grant_approval: fixture.requireApproval }),
      getLaunchAtLogin: async () => ({ enabled: false, available: false }),
      addCollection: record("addCollection"),
      openCollectionFolder: record("openCollectionFolder"),
      setCollectionEnabled: record("setCollectionEnabled"),
      chooseCreateFolder: async () => "/disposable/parent",
      createCollection: async (input) => { calls.push(["createCollection", input]); return { name: input.name }; },
      enableSync: async (...args) => {
        calls.push(["enableSync", ...args]);
        const failure = fixture.failEnableSync;
        fixture.failEnableSync = null;
        if (failure) throw new Error(failure);
        return null;
      },
      removeCollection: record("removeCollection"),
      syncFiles: async () => fixture.syncFiles ?? { include: ["image", "audio", "video", "pdf", "other"], exclude: [] },
      setSyncFiles: async (id, files) => { calls.push(["setSyncFiles", id, files]); fixture.syncFiles = files; return files; },
      listHolds: async () => fixture.holds ?? [],
      resolveHold: async (id, hold, how) => { calls.push(["resolveHold", id, hold, how]); fixture.holds = (fixture.holds ?? []).filter((h) => h.id !== hold);
        const held = fixture.migration?.holds?.[id];
        if (held) fixture.migration.holds[id] = held.filter((h) => h.id !== hold);
        return null;
      },
      listActivity: async () => fixture.activity ?? [],
      updateCollection: async (id, changes) => { calls.push(["updateCollection", id, changes]); if (fixture.failUpdate) throw new Error(fixture.failUpdate); return { ...fixture.collections[0], ...changes }; },
      renameComputer: async (name) => { calls.push(["renameComputer", name]); fixture.account = { ...fixture.account, computerName: name }; return { name }; },
      approveAccess: record("approveAccess"),
      acknowledgeAccess: record("acknowledgeAccess"),
      revokeAccess: record("revokeAccess"),
      denyAccess: record("denyAccess"),
      listPendingDevices: async () => fixture.devices ?? [],
      approveDevice: async (...args) => { calls.push(["approveDevice", ...args]); fixture.devices = []; return {}; },
      rejectDevice: record("rejectDevice"),
      signIn: async () => {
        calls.push(["signIn"]);
        fixture.account = { ...fixture.account, pairing: "https://connect.example.test/pair/same-request", lastError: null };
        return { verificationUri: fixture.account.pairing, expiresIn: 600 };
      },
      reopenSignIn: async () => {},
      onNavigate: () => () => {}, onUpdateStatus: () => () => {}
    };
    for (const [name, method] of Object.entries(window.mdbaseConnect)) {
      window.mdbaseConnect[name] = (...args) => { fixture.counts[name] = (fixture.counts[name] ?? 0) + 1; return method(...args); };
    }
  }, { signedIn, collections, access, devices, activity, apps, updateStatus });
  await page.goto(origin);
  await page.getByText(signedIn ? "Connected securely" : "Not signed in", { exact: true }).first().waitFor().catch(error => { throw new Error(`${error.message}\nRenderer errors: ${errors.join("; ")}`); });
  const calls = (name) => page.evaluate((name) => window.fixture.calls.filter((call) => call[0] === name).map((call) => call.slice(1)), name);
  return { page, errors, calls };
}


const collection = (overrides = {}) => ({ id: "c-notes", name: "Notes", root: "/home/maya/Documents/Notes", mode: "local", origin: "local", log: "none", state: "ready", notices: [], ...overrides });
const online = { pending: 0, holds: 0, unresolved: 0, connection: "online" };
const fixture = {
  collections: [
    collection({ id: "c-field", name: "Field research", root: "/home/maya/Documents/Field research", mode: "synced", log: "hosted", sync: online }),
    collection({ id: "c-garden", name: "Garden journal", root: "/home/maya/Documents/Garden journal", mode: "synced", log: "hosted", sync: online }),
    collection({ id: "c-reading", name: "Reading notes", root: "/home/maya/Documents/Reading notes", mode: "synced", log: "hosted", sync: online }),
    collection({ id: "c-house", name: "Household projects", root: "/home/maya/Documents/Household projects" })
  ],
  apps: [
    { id: "tasknotes", name: "TaskNotes", distribution: "web", homepage: "https://app.tasknotes.dev/", icon: "", collections: [{ id: "c-field", name: "Field research" }] },
    { id: "editor", name: "Editor", distribution: "web", homepage: "https://editor.mdbase.dev/", icon: "", collections: [{ id: "c-garden", name: "Garden journal" }] },
    { id: "reader", name: "Reader", distribution: "web", homepage: "https://reader.mdbase.dev/", icon: "", collections: [{ id: "c-reading", name: "Reading notes" }] }
  ],
  access: [
    { grant: "g1", collection: "c-field", app_id: "tasknotes", app_name: "TaskNotes", client_pk: "pk", capabilities: ["read", "write"], state: "active", first_seen_ms: Date.now(), acknowledged: true },
    { grant: "g2", collection: "c-reading", app_id: "reader", app_name: "Reader", client_pk: "pk2", capabilities: ["read", "write"], state: "active", first_seen_ms: Date.now(), acknowledged: true }
  ]
};
for (const theme of ["light", "dark"]) {
  THEME = theme;
  const { page, errors } = await desktop(fixture);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/home-${theme}.png` });
  for (const name of ["Collections", "Apps"]) {
    const link = page.locator(".product-sidebar-link").filter({ hasText: name });
    if (await link.count()) { await link.first().click(); await page.waitForTimeout(500); await page.screenshot({ path: `${out}/${name.toLowerCase()}-${theme}.png` }); }
  }
  console.log(theme, "errors:", errors.join("; ") || "none", "nav:", await page.locator(".product-sidebar-link").allInnerTexts());
  await page.close();
}
await browser.close(); server.close();
