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

mdbase is understated. The site uses a nearly white paper surface, fine rules,
plain language, and small structural labels. The visual hierarchy follows the
content and its technical structure.

Light and dark themes use the color roles defined in
`mdbase-connect/packages/ui/styles.css`. The dark canvas is a soft charcoal
(`oklch(17.5% 0.012 255)`), with raised surfaces at 19.5% and 23.5% lightness.
The build synchronizes those values from Connect so the two sites retain the
same theme contract.

The homepage is based directly on
`mdbase-connect/docs/mdbase-configurations-v2.html`. Its signature is one field
of 361 record particles. The field begins as a murmuration and becomes concrete
collection, structure, authority, permission, and access diagrams as the reader
scrolls. This is the only expressive visual element. Canvas surfaces, labels,
edges, and particles use the same light and dark color roles as the page. The
introductory field uses the soft text and accent roles; later scenes use accent
particles to distinguish metadata, hosted authority, and moving packets.

## Typography

Atkinson Hyperlegible is the reading and display face. Azeret Mono is reserved
for paths, package names, versions, operations, and structural labels. Headings
are compact and leave room for their explanatory text. Reading columns use a
72ch measure. Sections can contain as much detail as their subject requires.

## Layout

The homepage has six long chapters in a left reading column and a fixed canvas
on the right. On narrow screens, the canvas moves above each chapter. Interior
pages use low, ruled page openings and narrow documentation columns. Navigation,
buttons, tables, callouts, and footer links remain visually quiet. A reading
wash sits between the homepage canvas and its copy, becoming opaque before the
mobile text region begins.

## Motion

Only the homepage particle field moves. Its transformations explain the current
chapter. Reduced-motion preferences place the particles directly into each
formation. Coarse-pointer screens up to 820px use the same static formations to
reduce battery use during the mobile reading journey. Interior pages do not use
decorative animation.

## Language

Use literal headings and ordinary sentences. State the current artifact,
profile, security boundary, or release status directly. Avoid slogans,
competitive framing, and language that comments on how candid or precise the
site itself is. Avoid correlative contrast constructions such as “not X, but
Y,” “without X,” and “rather than X.” State the relevant behavior directly.
