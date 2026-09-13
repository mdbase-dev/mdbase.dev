import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/mdbase-murmuration.js', import.meta.url), 'utf8');
const homepage = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const scenes = [...homepage.matchAll(/data-scene="([^"]+)"/g)].map(match => match[1]);

// Exercise the real scene builders with a deterministic canvas/browser stub.
// Real font metrics and screenshots are checked separately in Chromium.
function harness(width, height, reducedMotion = true) {
  const context = new Proxy({
    globalAlpha: 1,
    font: '14px sans-serif',
    measureText(text) {
      return { width: text.length * Number.parseFloat(this.font) * 0.5 };
    },
  }, { get(target, key) { return key in target ? target[key] : () => {}; } });
  const canvas = { getContext: () => context, style: {} };
  const chapters = scenes.map(scene => ({
    dataset: { scene }, classList: { toggle() {} },
    getBoundingClientRect: () => ({ top: 0, height }),
  }));
  const document = {
    querySelector: selector => selector === '#diagram' ? canvas : {
      getBoundingClientRect: () => ({ bottom: width <= 350 ? 137 : 107 }),
    },
    querySelectorAll: () => chapters,
    documentElement: { style: { setProperty() {} }, addEventListener() {}, scrollHeight: height * 8 },
    fonts: { ready: { then() {} } },
    addEventListener() {},
  };
  const sandbox = {
    document, innerWidth: width, innerHeight: height, devicePixelRatio: 1,
    scrollY: 0, matchMedia: () => ({ matches: reducedMotion }),
    getComputedStyle: () => ({ colorScheme: 'light', getPropertyValue: () => '' }),
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}, addEventListener() {},
    performance: { now: () => 0 },
  };
  vm.runInNewContext(source.replace('      syncPalette();\n      resize();', `
      globalThis.inspect = () => ({ diagram, particles, activeScene });
      globalThis.select = name => setScene(name, chapters.findIndex(c => c.dataset.scene === name));
      globalThis.fitLabel = fitNodeLabel;
      syncPalette();
      resize();`), sandbox);
  return sandbox;
}

for (const [width, height] of [[320, 640], [390, 844], [820, 1000], [821, 900], [1024, 768], [1440, 1000]]) {
  test(`all homepage scenes have bounded labels and particle targets at ${width}px`, () => {
    const app = harness(width, height);
    for (const scene of scenes) {
      app.select(scene);
      const { diagram, particles, activeScene } = app.inspect();
      assert.equal(activeScene, scene);
      assert.equal(particles.length, 361);
      for (const node of diagram.nodes) {
        const heading = node.heading;
        assert.ok(heading.height + heading.padding <= node.box.h, `${scene}: ${node.label} height`);
        for (const line of heading.lines) {
          assert.ok(!line.includes('…'), `${scene}: ${node.label} truncated`);
          assert.ok(line.length * heading.size * 0.5 <= node.box.w - heading.padding * 2,
            `${scene}: ${node.label} width`);
        }
      }
      for (const particle of particles) {
        assert.ok(Number.isFinite(particle.tx) && Number.isFinite(particle.ty));
        assert.ok(particle.tx >= 0 && particle.tx <= width);
        assert.ok(particle.ty >= 0 && particle.ty <= height);
      }
    }
  });
}

test('sharing is hosted-only, has two non-directional memberships, and no data-transfer particles', () => {
  const app = harness(1440, 1000);
  app.select('sharing');
  const { diagram, particles } = app.inspect();
  assert.deepEqual(Array.from(diagram.nodes, node => node.label), ['Hosted collection', 'Viewer', 'Editor']);
  assert.equal(diagram.edges.length, 2);
  assert.ok(diagram.edges.every(edge => edge.relationship));
  assert.ok(particles.every(particle => particle.path === null));
});

test('removing an app preserves every record and leaves only the approved app connected', () => {
  for (const reducedMotion of [true, false]) {
    const app = harness(390, 844, reducedMotion);
    app.select('sharing');
    const targets = Array.from(app.inspect().particles, particle => [particle.tx, particle.ty]);
    app.select('access');
    const { diagram, particles } = app.inspect();
    assert.deepEqual(Array.from(particles, particle => [particle.tx, particle.ty]), targets);
    assert.equal(diagram.edges.length, 1);
    const approved = diagram.nodes.find(node => node.id === 'retained-app');
    assert.equal(diagram.edges[0].from[0].x, approved.box.x);
    assert.ok(particles.every(particle => particle.path === null));
  }
});

test('an unexpectedly long label falls back to bounded ellipsis', () => {
  const app = harness(320, 640);
  const heading = app.fitLabel('Unexpectedlylonglabel extra words', { w: 75, h: 50 });
  assert.ok(heading.lines.some(line => line.endsWith('…')));
  assert.ok(heading.height + heading.padding <= 50);
});
