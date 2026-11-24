---
title: Importing a library
description: Bring sources, files, highlights and notes from Zotero or Readwise Reader into an mdbase collection.
section: reader
---

> **Importing is experimental.**
>
> Try it on a new or test collection first. An import only adds records and files. It does not change your Zotero or Readwise library.

## Start an import {#start}

Run **Import a library…** from the command palette, or open [Reader's import page](https://reader.mdbase.dev/import). Choose Zotero or Readwise Reader. Keep the import tab open while it runs.

## From Zotero {#zotero}

Zotero imports bring references, original files, notes, collections and Zotero's own annotations. They use a small Zotero plugin that writes an export folder for Reader.

1. Download the Zotero exporter (`.xpi`) from the import page. It supports Zotero 10.0.x.
2. In Zotero, choose **Tools → Plugins → Install Plugin From File…** and select the file.
3. Choose **Tools → Export for mdbase Reader…** and save the export folder.
4. In Reader, select the whole exported folder. Do not select Zotero's data directory.

The experimental exporter includes all of **My Library**, not a selected collection or group library. Finish syncing and avoid editing Zotero while exporting. Only a completed export can be imported.

Reader checks every payload file against its checksum before collection writes. Selecting a folder needs a supporting browser such as Chrome. Export bundles contain private notes and attachment content; keep them private.

## From Readwise Reader {#readwise}

Readwise imports bring Reader documents and files, plus highlights from classic Readwise sources such as Kindle, Apple Books and Instapaper. Classic sources import as metadata and highlights, without the book text.

1. Get your [Readwise access token](https://readwise.io/access_token) and paste it into Reader.
2. Choose whether to include unsaved Feed items. Archived library items are always included.
3. Choose **Scan Readwise library**.

The token stays in memory in that browser tab and is sent only to Readwise. The importer only reads from Readwise. Scanning reads metadata, highlights and saved article pages. Original PDFs and EPUBs are downloaded only after you confirm. A large library can take several minutes to scan.

## Review and confirm {#review}

Reader shows what it found: the number of sources, annotations and notes, and the content files and their size. Then choose a destination collection. If the collection does not have Reader's setup yet, you review and apply it first. Nothing is written until you confirm.

Imported files are stored under `files/reader/imports`. When the import finishes, **Open imported collection** takes you to it.

## Stopping and resuming {#resume}

Choose **Stop safely** to pause an active import. Everything already written is kept, and **Resume import** continues the confirmed job. The job stays bound to its destination; switching collections cannot redirect it.

After reloading, reselect the same export folder or reconnect Readwise, choose the same collection and scan again. Check the destination before resuming. Records already imported are kept; review the completion warnings for missing or unavailable content.

For a worked example with a book, a highlight and the resulting file, see [Export Readwise highlights to Markdown](/guides/readwise-markdown/).
