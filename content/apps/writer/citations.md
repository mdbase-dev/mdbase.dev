---
title: Sources and citations
description: Cite the sources in your Reader library and insert highlighted quotations into a manuscript.
section: writer
---

## Use your Reader library {#library}

Connect Writer to the collection containing your [Reader library](/apps/reader/). Each citable source has CSL-JSON citation metadata with a citekey in `csl.id`. The manuscript uses that citekey; the source record and its metadata remain in the collection.

Add sources and review their citation data in [Reader's citation editor](/apps/reader/notes/#citation). Citekeys must be unique. If a source has no citation data, add it before trying to cite the source in Writer.

## Insert a citation {#insert}

1. Open **Sources**, or press <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>E</kbd> (<kbd>⌘</kbd> on a Mac).
2. Search by author, title, year or citekey.
3. Select a source, add a page number if needed, and insert its citation.

Sources already cited in the manuscript appear before the rest of the library. The panel marks the source under your cursor and can step through its citations. You can also type `@` or `[@` in the editor to open source completion suggestions.

```markdown title="Pandoc citations"
A parenthetical citation [@smith2024].

A specific passage [@smith2024, p. 12].

Several sources [@smith2024; @jones2023].
```

Replace the example citekeys with your own. Hover a citation to inspect its bibliography entry.

## Reader quotations {#quotations}

Sources can show quotations from Reader annotations. Insert one to bring the highlighted text into the manuscript with its citation and available page information. Check the quotation and page against the original source before using it in submitted work.

[Embedding an annotation record](/apps/writer/chapters/#annotations) is another way to use a quotation. Quoted text and commentary stay separate; commentary is not part of the source's words.

## Style and language {#style}

Choose **Citation style** and **Language** in Manuscript settings. Six citation styles and eight locales are bundled. A `.csl` file in the collection can provide another citation style. The selected style controls author/date or note-style formatting, bibliography entries and repeated citations across all included chapters.

Preview and Word export use the same citation metadata and style, with separate rendering engines. Review both the citation text and bibliography in the final export.

## Missing or unknown sources {#missing}

An unknown citekey appears in Problems and may offer a similar known key. Check its spelling, the selected collection and the source's citation data. Editing a source citekey can leave older manuscript citations unresolved; update those references as well.

[Write a thesis in Markdown with citations](/guides/markdown-thesis/) follows one source from the library into a downloadable manuscript and bibliography.
