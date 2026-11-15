---
title: Saving and collection data
description: Understand where your manuscript lives, how edits save, and what to do about a conflict or failed save.
section: writer
---

## Manuscript records {#records}

A manuscript is a Markdown record implementing `dev.mdbase.writer.manuscript`. Its body is your writing; frontmatter holds its title, authors, abstract, layout, citation style and language. The following example uses the starter type's field names:

```markdown title="illustrative manuscript record"
---
type: writer-manuscript
title: A research paper
authors:
  - name: Alex Researcher
    affiliation: Example University
template: article
csl: chicago-notes-bibliography
lang: en-GB
---
# Introduction

A claim supported by a source [@smith2024, p. 12].
```

Chapters remain separate Markdown records. Reader sources hold their own citation data and annotations, and comments use collection records too. Other mdbase tools can read these records. Writer does not delete or rename them.

## Autosave {#saving}

Manuscript text, chapter text and settings save through Connect record sessions. Each included record has its own session. Watch the save status and wait for changes to be saved before closing, reloading or changing collections.

A failed save displays **Not saved**. The editor keeps the current text, and saving retries when you type. Keep the tab open while restoring access. If saving still fails, copy your writing somewhere safe before reloading; do not assume an unsent edit is in the collection.

## Conflicts

If a record changes elsewhere while you are editing it, Writer reports the conflict. **Keep mine** retains your version; **Use theirs** adopts the collection version. Check both versions and copy any text you need before choosing. A conflict in one chapter belongs to that chapter's record.

## Browser state {#device}

Layout, zoom, theme and the last-used export format are remembered in the browser. These preferences are separate from the manuscript settings stored in the collection. Browser state is not a backup of your writing.

## Access and availability {#access}

You approve Writer's collection access through Connect. A Private collection needs one of your devices online to serve it. If a collection cannot be opened, follow the reconnect prompt, check its availability or choose another collection.

When reporting a problem, include the browser, steps to reproduce and the displayed error. Remove private manuscript text, paths and credentials. Keep your collection backups independent of the browser.
