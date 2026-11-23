// Draws the social share image (public/og-card.jpg, 1200×630) from the homepage's
// own sky, with the mark, the wordmark and the site's line in its typefaces.
//
// Run from an mdbase-connect checkout (for its Playwright), with this site's dev
// server running:
//   node <site>/scripts/screenshots/capture-og-card.mjs http://127.0.0.1:4321 <out.png>
// then convert the PNG to a JPEG at quality 88.
import { createRequire } from "node:module";
const require = createRequire(process.cwd() + "/");
const { chromium } = require("@playwright/test");
const [base, out] = process.argv.slice(2);

const bars = [
  [22, 22, 20], [50, 22, 20], [78, 22, 20], [22, 44, 12], [42, 44, 56, true],
  [22, 66, 28], [58, 66, 40], [22, 88, 20], [50, 88, 20], [78, 88, 20]
];

const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, colorScheme: "light", deviceScaleFactor: 1 })).newPage();
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.evaluate((bars) => {
  // Keep only the sky; the card's own contents go on top of it.
  for (const selector of [".site-header", "main", "#diagram", ".site-footer", ".motion-control", ".home-skip-link"]) {
    document.querySelectorAll(selector).forEach((node) => node.remove());
  }
  const card = document.createElement("div");
  card.style.cssText = "position:fixed;inset:0;z-index:10;color:var(--color-text);";
  card.innerHTML = `
    <svg viewBox="18 18 84 84" style="position:absolute;right:140px;top:110px;width:300px;height:300px">
      ${bars.map(([x, y, width, accent]) => `<rect x="${x}" y="${y}" width="${width}" height="10" fill="${accent ? "var(--color-accent)" : "currentColor"}"/>`).join("")}
    </svg>
    <div style="position:absolute;left:84px;bottom:86px">
      <div style="font:500 64px/1 var(--mono);letter-spacing:-0.02em">mdbase</div>
      <div style="margin-top:26px;max-width:11.5em;font:600 38px/1.2 var(--sans);letter-spacing:-0.015em">Structured data in ordinary Markdown files</div>
    </div>`;
  document.body.append(card);
}, bars);
await page.waitForTimeout(2500);
await page.screenshot({ path: out });
await browser.close();
