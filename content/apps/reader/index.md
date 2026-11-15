---
title: Get started
description: mdbase Reader turns an mdbase collection into a reading library for PDFs, EPUBs and saved web pages.
section: reader
---

> <strong id="status">Reader is prerelease software.</strong>
>
> Keep backups of important collections and check the save status before closing or reloading. Sources, notes and annotations remain ordinary mdbase records.

## What it is {#what}

Reader is for reading, annotating, organising and citing source material. Each source, such as a paper, a book or an article, is a Markdown record in your collection. Its file sits beside it, and every highlight or comment is a separate Markdown record. Other mdbase tools, a text editor or Obsidian can read the collection records and files. See [How Reader stores data](/apps/reader/data/). To write a manuscript using your library's citations and highlights, open [mdbase writer](/apps/writer/) with the same collection.

Reader works with Cloud copy and Private collections. Reader reaches a Private collection through one of your devices, so keep one online, such as a computer running the [desktop app](/downloads/).

## Highlight to Markdown {#watch}

![Highlight a passage, get a Markdown file](/videos/reader-markdown.mp4)

See also the recordings for [views and panes](/apps/reader/library/#watch) and [web capture](/apps/reader/extension/#watch).

## Open a collection {#open}

1. Open [reader.mdbase.dev](https://reader.mdbase.dev/) and connect a collection.
2. Sign in to mdbase Connect. If you do not have an account, [sign up](https://connect.mdbase.dev/signup) first.
3. Choose the collection you want to use as your library.
4. Review and approve Reader's access to that collection.

You can use an existing collection or a new, empty one. Reader keeps its records in their own folders, so it can share a collection with notes from other apps.

## Reader setup {#setup}

The first time you open a collection, Reader may show **Set up this reading collection**. It lists the exact changes it needs: the source and annotation contracts and two starter types, `reader-source` and `reader-annotation`. Nothing else in the collection changes. Choose **Apply reviewed setup** to add them.

You can adapt the starter types later, for example in the [mdbase Editor](https://editor.mdbase.dev/). Reader reads your records through its contracts, so your types can use their own field names.

## The workspace {#workspace}

| Area | What it holds |
| --- | --- |
| Sources sidebar | Find a source by title, author or tag, and see open and recent sources. |
| Library | Every source as a table or cards, with filters and saved views. |
| Documents | Each open source in a tab, showing its document, literature note, annotations or citation. |
| Side panel | Annotations and details for the source you are reading. |

Tabs and panels can be moved and split. Drag a tab onto another tab strip to move it, or onto the edge of a pane to split. A tab's context menu and the pane's **⋯** menu offer the same actions without dragging. Your arrangement is saved per collection, and **Reset pane arrangement** in the command palette restores the default without closing tabs. On a phone, one pane is shown at a time.

Press <kbd>Ctrl</kbd> <kbd>K</kbd> (<kbd>⌘</kbd> <kbd>K</kbd> on a Mac) to search sources and run any command.

## Switch collections {#switch}

Open the collection-name menu in the header to choose another connected collection or connect a new one. Review any pending saves before switching. If a collection is unavailable, follow Reader's reconnect or access-review prompt.

See [Support](/support/) to report bugs or request help. Remove private notes, collection paths and credentials from reports.
