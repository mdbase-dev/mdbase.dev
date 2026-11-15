---
title: Library and views
description: Browse, filter, search and bulk-edit your sources, and save the result as a view in your collection.
section: reader
---

## Views and panes {#watch}

![Views, annotations and panes](/videos/reader-library.mp4)

## Open the library {#open}

Run **Open library** from the command palette. The library opens as a tab, so it can sit beside a document. Show sources as a table or as cards, and choose which columns the table shows. Any frontmatter field can be a column.

For a quick lookup without opening the library, use the Sources sidebar. Press <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>F</kbd>, or <kbd>/</kbd> when you are not typing, and search by title, author or tag.

## Lenses

Lenses are ready-made starting points:

- All sources, Recently opened, Currently reading and Unread inbox
- Has annotations and Missing citation data
- PDF, EPUB and Saved web pages

## Filter and sort {#filter}

Filter by reading status, format, tag, or conditions on any frontmatter field. Every condition must match. Sort by when a source was saved or last opened, title, creator, publication date, status, or any field.

## Search

The search box has three scopes:

| Scope | Searches |
| --- | --- |
| Library | Source details such as title, authors and tags. |
| Notes & annotations | Literature notes and annotation text. It does not search inside PDFs, EPUBs or saved pages. |
| Open documents | Text from loaded, supported document renderers. Unopened and suspended documents are not included, even if a suspended source still has a tab. |

## Reading status {#status}

Each source can have a reading status: inbox, queued, reading, finished, archived or abandoned. It is stored in the source record, so other apps can see it too.

## Edit several sources {#bulk}

Select sources in the table to set their reading status together, or to set any field to a value. Leaving the value empty removes that field from every selected source. You can also export a bibliography of just the selected sources. <kbd>Esc</kbd> clears the selection.

## Saved views {#views}

When a filtered, sorted arrangement is worth keeping, save it as a new view. Views are ordinary collection records implementing `mdbase.view`, normally in the `views` folder. The filter, sort and presentation can be reopened on another device or used by other mdbase tools. Choose **Save view** to update an editable Reader-owned view; save a new view to keep a separate arrangement.

## All annotations {#annotations}

Choose **Annotations** beside **Sources** in a library view to browse annotations across sources. Search by passage, note, source or tag, filter by type or tag, and sort by source or creation date. This arrangement can be saved as an annotation view too. The annotation text loads separately from the source list; wait for loading to finish before treating a search result or count as complete.
