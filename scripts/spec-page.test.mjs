import assert from "node:assert/strict";
import { test } from "node:test";
import { renderSpecPage } from "./spec-page.mjs";

const shell = '<html><head><link href="/shared.css" rel="stylesheet"></head><body><header class="site-header">Shared header</header><nav><!-- spec-navigation:start --><!-- spec-navigation:end --></nav><article><!-- spec-content:start --><!-- spec-content:end --></article></body></html>';
const content = '<section id="section-00"><h1>Overview</h1><pre><code>$&amp; $` $\'</code></pre></section>';
const source = `<html><head><link href="style.css"></head><body><header class="spec-header">Old header</header><nav class="spec-sidebar" id="spec-sidebar"><a href="#section-00">Overview</a><div class="spec-mobile-links">Old links</div></nav><main class="spec-content">${content}</main><script>legacy()</script></body></html>`;

for (const archive of [false, true]) {
  test(`imports ${archive ? "archive" : "current"} content into the shared shell`, () => {
    const result = renderSpecPage(shell, source, archive);
    assert.ok(result.includes(content), "normative HTML must be unchanged");
    assert.ok(result.includes('href="#section-00"'));
    assert.ok(result.includes('class="site-header"'));
    assert.ok(result.includes('/shared.css'));
    assert.ok(result.includes(archive ? 'v0.2-archive' : 'v0.3-current'));
    assert.doesNotMatch(result, /legacy\(\)|Old header|Old links|href="style.css"/);
    assert.equal(renderSpecPage(result, source, archive), result, "repeat imports are safe");
  });
}

test("fails closed when the source layout or Astro shell changes", () => {
  assert.throws(() => renderSpecPage(shell, "<main>changed</main>", false), /missing its navigation or content/);
  assert.throws(() => renderSpecPage("<html></html>", source, false), /missing the navigation slot/);
});
