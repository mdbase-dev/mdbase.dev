---
title: Reading and annotating
description: Highlight passages, comment on them, capture areas of a PDF, and bookmark your place.
section: reader
---

## Reading

Reader opens PDFs, EPUBs and saved web pages. Open a document's contents from the document toolbar. **Enter reading mode** (<kbd>Ctrl</kbd> <kbd>.</kbd>) hides everything except the document. Press it again or <kbd>Esc</kbd> to leave.

Text size, typeface and line length can be changed from **Text and display** in the header. These apply to EPUBs and saved web pages. PDFs keep their layout. When you come back to a source, Reader restores its saved reading position when it matches the open document.

## Highlight a passage {#highlight}

Select text in the document. A toolbar appears next to the selection:

- **Highlight** (<kbd>H</kbd>) saves the passage as a highlight straight away.
- **Comment** (<kbd>C</kbd>) opens a comment field. Choose **Save highlight** to save the highlight with your comment.
- **Copy text** copies the passage, and **Copy with citation** copies it as a quote citing the source.

<kbd>Esc</kbd> dismisses the toolbar. By default, selecting text does not create an annotation until you choose an action. Use the colour controls to choose a highlight colour; highlights are also identified by their text and annotation details.

If you highlight a lot, set **Selecting text** to **Highlight at once** in **Text and display**. Every selection is then saved as a highlight as soon as you make it.

## Capture a PDF area {#area}

For a figure, table or equation in a PDF, choose **Select area** in the document toolbar and drag across the part of the page you want. The captured image is saved as a PNG file in the collection's `files` folder, and the annotation embeds it. You can add a comment before saving. A new crop is held in memory until it is saved; reloading can lose the unsaved image and comment.

## Comment on the source {#comment}

**New comment** in the annotation panel records a thought about the source as a whole, with no passage attached.

## Bookmarks {#bookmark}

**Bookmark this position** in the document toolbar, or the command of the same name, saves your current place as an annotation. The document must be open.

## The annotation list {#list}

Open a source's **Annotations** view, or the side panel while reading. You can search annotations, filter them to highlights, area captures, comments on the source, bookmarks or those with commentary, and order them by position in the document or newest first.

**Show in document** jumps to an annotation's passage. **Add to literature note** embeds it in the source's note. See [Notes and citations](/apps/reader/notes/).

## Edit and delete {#edit}

Comments save automatically about a second after you stop typing. If a save fails, your text stays in the editor with **Retry save**. Unsaved comments are kept in memory only, so a forced reload or a crash can lose text that was not saved yet. Reader warns you before you close a tab with unsaved changes.

If the annotation was changed elsewhere, for example in another app, Reader keeps your version and lets you compare it with the collection version before choosing. An annotation can be edited in one pane at a time.

Deleting an annotation asks for confirmation. If literature notes embed it, Reader lists them first, because those embeds will break.

## When a file changes {#changed-files}

Each annotation records the exact version of the file it was made on. Reader will not silently move an annotation to a passage it cannot confirm.

- PDF highlights and bookmarks stay attached when a PDF is re-saved without its pages changing, for example after a metadata edit.
- Web page highlights are found again by their quoted text.
- EPUB positions belong to one version of the book. After the file changes, Reader checks the quoted text before it follows an old position.

## Connection and unsaved work {#connection}

Reader needs Connect access to open collection files and save changes. A document already loaded may remain readable during a connection failure, but this is not an offline-library mode. The former **Available offline** feature has been removed.

Wait for annotation saves to finish before closing or reloading. Pending annotation text and new PDF crops are held in memory. Literature notes have a separate local-draft recovery path; see [Saving and conflicts](/apps/reader/notes/#saving).
