---
name: mdbase.dev
description: Product and developer-documentation system for the mdbase ecosystem.
colors:
  canvas: "oklch(98.8% 0.004 250)"
  surface: "oklch(96.8% 0.008 250)"
  ink: "oklch(21% 0.018 255)"
  ink-soft: "oklch(39% 0.016 255)"
  line: "oklch(88% 0.012 250)"
  blue: "oklch(46% 0.12 238)"
  signal: "oklch(69% 0.15 142)"
dark-colors:
  canvas: "oklch(17.5% 0.012 255)"
  surface: "oklch(21% 0.016 255)"
  ink: "oklch(93% 0.008 255)"
  ink-soft: "oklch(76% 0.012 255)"
  line: "oklch(31% 0.016 255)"
  blue: "oklch(74% 0.11 238)"
  signal: "oklch(76% 0.13 142)"
typography:
  display: "Atkinson Hyperlegible"
  body: "Atkinson Hyperlegible"
  utility: "Azeret Mono"
rounded:
  default: "4px"
---

# Design System: mdbase.dev

## Direction

The site feels like an annotated folder on a clear desk. Real Markdown,
manifests, permissions, and route labels carry the visual identity. The
signature element is a live-looking but deterministic routing field: one
collection boundary connected to several applications through an explicit
Connect authorization gate.

The color strategy is restrained for documentation and committed in the
landing hero. A cool blue field identifies Connect and a small green signal
marks an active, authorized route. Surfaces use blue-tinted paper rather than
pure white or black.

## Typography

Atkinson Hyperlegible is the reading and display face. Azeret Mono is reserved
for file paths, package names, versions, operation names, and structural labels.
Display headings use compact line-height and visible weight contrast. Prose
stays within 72 characters.

## Layout

The landing page uses an asymmetric two-column opening, then alternates full
width ruled sections with narrow reading measures. SDK pages use a persistent
left index, a 72-character article column, and an optional right table of
contents on wide screens. Mobile collapses navigation into native disclosure
controls without hiding primary actions.

## Motion

Only the routing field moves, using slow opacity and transform changes that
communicate an authorized request travelling between an app and its collection.
All motion stops under reduced-motion preferences. Layout never animates.

