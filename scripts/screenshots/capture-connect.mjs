// Captures the Connect web screens shown on the site (public/images/apps/connect-*).
//
// Run from an mdbase-connect checkout, with its review server running:
//   PORT=4811 pnpm portal:review --no-build
//   node <site>/scripts/screenshots/capture-connect.mjs <outdir>
//
// The review server serves the real portal over a made-up account. The captures are
// 1120×700 at 2×, light and dark; convert each PNG to a 1600×1000 WebP named
// connect-<shot>-<theme>.webp. The fixture's app address and one collection name are
// rewritten so the screens match the rest of the site.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const require = createRequire(process.cwd() + "/");
const { chromium } = require("@playwright/test");
const { scenarios, clock } = await import(pathToFileURL(process.cwd() + "/apps/portal/tests/review/scenarios.mjs"));
const out = process.argv[2];
const base = "http://127.0.0.1:4811";
const shots = [
  { file: "approve", scenario: "authorization-review", keepPending: true },
  { file: "collections", scenario: "typical-account" },
  { file: "sharing", scenario: "collection-access", scrollTo: "People & sharing" },
  { file: "account-home", scenario: "home" }
];
const strip = value => {
  if (Array.isArray(value)) return value.map(strip);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === "pending_authorizations" ? [] : strip(v)]));
  return value;
};
const browser = await chromium.launch({ channel: "chrome", args: ["--proxy-server=http://127.0.0.1:9", "--proxy-bypass-list=127.0.0.1;localhost;[::1]"] });
for (const shot of shots) {
  const scenario = scenarios.find(s => s.name === shot.scenario);
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: 1120, height: 700 }, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: "reduce", locale: "en-AU", timezoneId: "Australia/Melbourne" });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date(clock));
    await page.route("**/v1/**", async route => {
      const response = await route.fetch();
      let body = await response.text();
      if (!(response.headers()["content-type"] ?? "").includes("json")) return route.fulfill({ response, body });
      body = body.replaceAll("https://tasknotes.mdbase.dev", "https://app.tasknotes.dev").replaceAll("Research index", "Journal");
      if (!shot.keepPending) { try { body = JSON.stringify(strip(JSON.parse(body))); } catch {} }
      await route.fulfill({ response, body });
    });
    await page.goto(`${base}/__review/scenario/${shot.scenario}?latency=0`);
    await page.getByText(scenario.ready, { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    if (shot.scrollTo) await page.getByText(shot.scrollTo, { exact: false }).first().evaluate(node => {
      const top = node.getBoundingClientRect().top;
      let scroller = node.parentElement;
      while (scroller && !(scroller.scrollHeight > scroller.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(scroller).overflowY))) scroller = scroller.parentElement;
      (scroller ?? document.scrollingElement).scrollBy(0, top - 150);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${shot.file}-${theme}.png` });
    await context.close();
    console.log(shot.file, theme);
  }
}
await browser.close();
