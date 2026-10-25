---
name: mdbase.dev
description: Product and developer documentation for the mdbase ecosystem.
colors:
  paper: "oklch(99.5% 0.002 255)"
  paper-soft: "oklch(97.5% 0.004 255)"
  ink: "oklch(21% 0.018 255)"
  ink-soft: "oklch(39% 0.014 255)"
  line: "oklch(92% 0.006 255)"
  accent: "oklch(45% 0.105 238)"
typography:
  display: "Atkinson Hyperlegible"
  body: "Atkinson Hyperlegible"
  utility: "Azeret Mono"
rounded:
  default: "4px"
---

# Design System: mdbase.dev

## Direction

mdbase is understated. Pages sit on **Silver sky**: a pale blue-grey canvas
(`oklch(97% 0.009 245)`, dark `oklch(20.5% 0.018 245)`) with soft cloud and fine
grain. Text stays on clean canvas; the sky lives at the edges and never sits
under body copy. Fine rules, plain language and small structural labels carry
the hierarchy.

Colour roles come from `mdbase-connect/packages/ui/styles.css` and are
synchronised by the build. The site overrides only the canvas, in
`src/styles/global.css` and `src/styles/home.css`.

The mark is the square-bar icon (`src/components/BrandMark.astro`). It sits
beside the wordmark in the header, and a hover ripple runs through the bars in
reading order, matching the apps. The favicon and the social card
(`public/og-card.png`, 1200×630) use the same mark.

The homepage pairs a moving sky (`public/mdbase-atmosphere.js`) with one field
of 361 record particles (`public/mdbase-murmuration.js`). The field begins as a
murmuration and becomes concrete diagrams as the reader scrolls: files, apps,
editing, sync, Cloud copy and Private, permissions, and sharing. Canvas
surfaces, labels, edges and particles use the page's colour roles. Dashed boxes
mark copies that are offline, locked or removed; they keep a solid surface so
they read against the sky.

## Typography

Atkinson Hyperlegible is the reading and display face. Azeret Mono is reserved
for paths, package names, versions, operations, and structural labels. Page
titles are large and regular (about 2.4rem); section headings are 1.3rem
semibold; body text is 17px. Reading columns use a 72ch measure.

## Layout

The homepage has long chapters in a left reading column, a fixed canvas on the
right, and a chapter index in the left gutter on wide screens. On narrow
screens, the canvas moves above each chapter. Interior pages open with a
visible title and lede (`.page-intro`) under a still band of sky at the top
right; documentation pages keep their three-column layout. Navigation, buttons,
tables, callouts, and footer links remain visually quiet.

## Motion

Only the homepage moves: the sky drifts and the particle field explains the
current chapter. A "Pause motion" control stops both. Reduced-motion
preferences stop the sky and place particles directly into each formation.
The header mark's hover ripple is the only motion on interior pages, and it
also respects reduced motion.

## Language

Use literal headings and ordinary sentences. State the current artifact,
profile, security boundary, or release status directly. Avoid slogans,
competitive framing, and language that comments on how candid or precise the
site itself is. Avoid correlative contrast constructions such as “not X, but
Y,” “without X,” and “rather than X.” State the relevant behavior directly.
