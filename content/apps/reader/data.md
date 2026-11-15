---
title: How Reader stores data
description: The folders, records and fields Reader writes, so other tools can read and change them.
section: reader
---

Everything Reader saves is an ordinary Markdown record or file in your collection. There is no separate Reader database. You can read, edit, back up or move the records with any tool.

## Collection layout {#layout}

```text title="collection"
sources/
  src_7d7c62fd-….md          one record per source
annotations/
  ann_fa4cdc4f-….md          one record per annotation
files/
  reader/src_7d7c62fd-…/
    distant-reading.pdf      the source's original file
  annotation-9b21….png       an area capture
views/
  reading-this-month.md      a saved library view
_types/
  reader-source.md
  reader-annotation.md
```

This is an illustrative layout for the starter types; names and type folders follow the collection's configuration. Imported files go under `files/reader/imports`. Record links point to source paths, so tools such as Obsidian can resolve them.

## Source records {#sources}

A source record describes one work. Its body is your literature note.

```markdown title="sources/src_7d7c62fd-….md"
---
type: reader-source
id: src_7d7c62fd-…
title: Distant Reading
kind: document
authors: [Franco Moretti]
saved_at: 2026-08-10T06:17:37.487Z
reading:
  status: reading
documents:
  - file: '[[files/reader/src_7d7c62fd-…/distant-reading.pdf]]'
    file_id: 019fea51-…
    role: primary
    format: pdf
    media_type: application/pdf
    revision: sha256:c8b2e7…
csl:
  id: morettiDistant13
  type: book
  title: Distant Reading
---
Argues that close reading scales poorly to large corpora. [@morettiDistant13]

![[annotations/ann_fa4cdc4f-…]]
```

| Field | Holds |
| --- | --- |
| `id`, `title`, `kind`, `saved_at` | Required. The source's stable identity, title, kind and when it was added. |
| `authors`, `published`, `url`, `description`, `language`, `tags` | Optional details shown in the library. |
| `documents` | The source's files. Each entry links to a file and records its format and the SHA-256 revision that was saved. |
| `reading` | Reading status, progress from 0 to 1, and the saved position associated with a document file. |
| `relations` | Links to related sources. |
| `csl` | One CSL-JSON item. Its `id` is the citation key. |

Unknown fields are kept, so you can add your own.

## Annotation records {#annotations}

Each highlight, comment, bookmark or area capture is its own record. Its body holds the quoted passage, your comment, or both.

```markdown title="annotations/ann_fa4cdc4f-….md"
---
type: reader-annotation
id: ann_fa4cdc4f-…
source: '[[sources/src_7d7c62fd-…|Distant Reading]]'
annotation_type: highlight
motivation: commenting
color: yellow
document:
  file: '[[files/reader/src_7d7c62fd-…/distant-reading.pdf]]'
  file_id: 019fea51-…
  revision: sha256:c8b2e7…
target:
  quote:
    exact: the trouble with close reading
    prefix: 'And '
  pdf: { … }
created_at: 2026-08-11T09:02:14.120Z
created_by: dev.mdbase.reader
tags: []
---
> the trouble with close reading

This is the claim to test against the sampling chapter.
```

| Field | Holds |
| --- | --- |
| `source` | A link to the source record. |
| `annotation_type` | `highlight`, `note` (a comment on the source), `bookmark` or `area`. |
| `document` | The file and the exact revision the annotation was made on. |
| `target` | Where the annotation points: the quoted text with its surrounding context, plus a PDF position, EPUB CFI or web page selector. |
| `locator` | A readable position label, such as a page. |
| `motivation`, `color`, `tags` | Why it was made, its colour and its tags. |
| `created_at`, `modified_at`, `created_by` | When and by which app it was made. |

## Types and contracts {#types}

Reader reads and writes through two application contracts, `dev.mdbase.reader.source` and `dev.mdbase.reader.annotation`. The starter types `reader-source` and `reader-annotation` implement them with the field names shown above. A collection can use its own types and field names instead, as long as they implement the contracts. See [Contracts and adapters](/sdk/contracts/).

The starter types assign records by folder and fields: records in `sources` with `id`, `title` and `kind` are sources, and records in `annotations` with `id`, `source` and `annotation_type` are annotations.

## What stays on the device {#device}

- Pane arrangement and display preferences.
- Literature note drafts that have not reached the collection yet.
- Connect access grants used by this browser, subject to your collection approval.

Pending annotation comments and new PDF crops are held in memory and can be lost on reload. Local source-note drafts are best-effort browser recovery, not backups. Reader no longer provides the former offline-document copy feature.

Open [mdbase writer](/apps/writer/) with the same collection to reuse citation metadata and Reader quotations in manuscripts.
