---
title: Notes and citations
description: Write a literature note for each source, embed annotations in it, and keep citation data in CSL-JSON.
section: reader
---

## The literature note {#note}

Every source has a literature note: the Markdown body of its source record. Open it with **Open literature note**, or switch the source's tab to its note view. Reader never rewrites the note from your annotations. It contains only what you write or insert.

## Insert annotations and citations {#insert}

Use the insert menu in the note editor, or **Add to literature note** on an annotation:

- **Annotations** are inserted as embeds, so the note shows the current text of the highlight or comment. If you edit the annotation, the note shows the change.
- **Citation** inserts a Pandoc-style citation such as `[@morettiDistant13]` at the cursor. It needs the source to have citation data with a citation key.

```markdown title="literature note"
Argues that close reading scales poorly to large corpora. [@morettiDistant13]

![[annotations/ann_6f1c…]]

My disagreement: the sampling problem cuts both ways.
```

## Saving and conflicts {#saving}

The note saves automatically about a second after you stop typing. The same note can be open in several panes. They share its text but keep their own cursor, scroll position and undo history.

If a save fails, keep the note open and follow the retry prompt. Reader keeps recoverable source-note drafts in this browser, scoped to the collection and source. On reopening, review any recovered draft before saving it. Browser storage is best-effort and can be cleared; it is not a collection backup.

If the note changed in the collection while you were editing, Reader shows **This note changed in the collection** and lets you compare your draft with the collection version. Check the save status before closing. Annotation comments use a different, memory-only buffer.

## Citation data {#citation}

Citation data is optional. When you add it, it is stored as one CSL-JSON item in the source record's `csl` field, the format used by Zotero, Pandoc and most citation tools. Its `id` is the citation key, which must be unique in the collection.

Open **Open citation data** to edit it as a form or as raw CSL-JSON. Every official CSL field is kept exactly as entered, and less common fields can be added from the form. Problems are marked before you save. The **Missing citation data** lens in the library lists sources without it. The same source metadata and citekey are available in [mdbase writer](/apps/writer/citations/) when you open the same collection.

## Find citation details {#lookup}

**Find citation details** searches by DOI, ISBN, URL or title. Reader shows the details it found for you to review before saving. DOIs are looked up in the DOI registry. Everything else goes to Wikimedia's Citoid service. Only the identifier, address or title you searched for is sent; the result is not saved until you approve it.

## Export

| Command | Produces |
| --- | --- |
| **Export bibliography** | `references.json`, a CSL-JSON file of every source with citation data. You can also export only the sources selected in the library. |
| **Export current source** | A zip file with the source and annotation records as they are stored, a single Markdown file combining the note and its annotations, the source's references, and the original files. An `EXPORT-REPORT.md` lists anything that could not be included. |
