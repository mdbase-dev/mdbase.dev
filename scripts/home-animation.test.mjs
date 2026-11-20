import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/mdbase-murmuration.js', import.meta.url), 'utf8');
const homepage = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const scenes = [...homepage.matchAll(/data-scene="([^"]+)"/g)].map(match => match[1]);

// Exercise the real scene builders with a deterministic canvas/browser stub.
// Real font metrics and screenshots are checked separately in Chromium.
function harness(width, height, { theme = 'light', tokens = {} } = {}) {
  const listeners = new Map();
  const paints = { dots: new Set(), labels: new Set(), outlines: new Set() };
  const context = new Proxy({
    globalAlpha: 1,
    font: '14px sans-serif',
    clearRect() { Object.values(paints).forEach(colors => colors.clear()); },
    fillRect() { paints.dots.add(this.fillStyle); },
    fillText() { paints.labels.add(this.fillStyle); },
    stroke() { paints.outlines.add(this.strokeStyle); },
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
    body: { append(element) { element.attached = true; } },
    createElement: () => ({ style: {}, remove() { this.attached = false; } }),
    fonts: { ready: { then() {} } },
    addEventListener() {},
  };
  const sandbox = {
    document, innerWidth: width, innerHeight: height, devicePixelRatio: 1,
    scrollY: 0, matchMedia: () => ({ matches: true, addEventListener() {} }),
    getComputedStyle: element => ({
      colorScheme: theme,
      getPropertyValue: name => tokens[name] ? `light-dark(${tokens[name].join(', ')})` : '',
      get color() {
        assert.ok(element.attached);
        const [, name, fallback] = /^var\((--[\w-]+), (.*)\)$/.exec(element.style.color);
        return tokens[name]?.[theme === 'dark' ? 1 : 0] ?? fallback;
      },
    }),
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    addEventListener: (name, callback) => listeners.set(name, callback),
    performance: { now: () => 0 },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(source.replace('      syncPalette();\n      resize();', `
      globalThis.inspect = () => ({ diagram, particles, activeScene });
      globalThis.select = name => setScene(name, chapters.findIndex(c => c.dataset.scene === name));
      globalThis.fitLabel = fitNodeLabel;
      syncPalette();
      resize();`), sandbox);
  sandbox.paints = paints;
  sandbox.setTheme = value => {
    theme = value;
    listeners.get('mdbase:themechange')();
  };
  return sandbox;
}

test('canvas paints resolved theme colors on startup and after toggling the theme', () => {
  const app = harness(1440, 1000, { theme: 'dark', tokens: {
    '--color-text': ['#222222', '#eeeeee'],
    '--color-text-soft': ['#555555', '#cccccc'],
    '--color-text-muted': ['#777777', '#aaaaaa'],
  } });
  assert.ok(app.paints.dots.has('#cccccc'));

  app.select('collection');
  app.setTheme('light');
  assert.ok(app.paints.dots.has('#222222'));
  assert.deepEqual([...app.paints.labels], ['#222222']);
  assert.ok(app.paints.outlines.has('#777777'));

  app.setTheme('dark');
  assert.ok(app.paints.dots.has('#aaaaaa'));
  assert.deepEqual([...app.paints.labels], ['#eeeeee']);
  assert.ok(app.paints.outlines.has('#aaaaaa'));
});

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

test('sharing shows both roles connected and a removed member with no connection', () => {
  const app = harness(1440, 1000);
  app.select('sharing');
  const { diagram } = app.inspect();
  assert.deepEqual(Array.from(diagram.nodes, node => node.label),
    ['shared collection', 'Viewer · reads', 'Editor · reads and edits', 'Member removed']);
  assert.equal(diagram.edges.length, 2);
  const removed = diagram.nodes.find(node => node.id === 'sharing-removed');
  assert.equal(removed.kind, 'replica');
  for (const edge of diagram.edges) {
    const end = edge.from.at(-1);
    assert.ok(!(end.x >= removed.box.x && end.y >= removed.box.y && end.y <= removed.box.y + removed.box.h));
  }
});

test('the sync note sits under the log, clear of every edge', () => {
  const app = harness(1440, 1000);
  app.select('sync');
  const { diagram } = app.inspect();
  const log = diagram.nodes.find(node => node.id === 'sync-log');
  assert.equal(diagram.notes.length, 1);
  const note = diagram.notes[0];
  assert.ok(note.y > log.box.y + log.box.h);
  // Each wrapped line is narrower than the log, and every edge ends on the log's sides.
  for (const line of note.text.split('\n')) assert.ok(line.length * 17 * 0.5 < log.box.w);
  for (const edge of diagram.edges) {
    const end = edge.from.at(-1);
    assert.ok(Math.abs(end.x - log.box.x) < 1 || Math.abs(end.x - (log.box.x + log.box.w)) < 1);
  }
});

test('an unexpectedly long label falls back to bounded ellipsis', () => {
  const app = harness(320, 640);
  const heading = app.fitLabel('Unexpectedlylonglabel extra words', { w: 75, h: 50 });
  assert.ok(heading.lines.some(line => line.endsWith('…')));
  assert.ok(heading.height + heading.padding <= 50);
});
