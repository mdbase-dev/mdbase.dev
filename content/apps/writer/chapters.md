---
title: Chapters and embeds
description: Assemble a longer manuscript from Markdown records in the same collection.
section: writer
---

## Building a book {#watch}

![Build a book from chapter records](/videos/writer-book.mp4)

## Include a chapter {#include}

Put an embed on a line of its own in the main manuscript. Writer includes the referenced record at that point in the document. The chapter is an ordinary Markdown record; it needs no special manuscript type.

```markdown title="main manuscript body"
![[chapters/introduction]]

![[chapters/results]]

![[chapters/discussion]]
```

Use paths belonging to records in your collection. Writer resolves record links in the collection; an unresolved link appears in Problems. A main manuscript can also contain its own prose around the chapter embeds.

## Navigate and reorder {#navigate}

Outline lists the included chapters in document order. Open one there or from its card in the editor. Cards show the chapter title, word count and problems. Each chapter has its own editing session and autosave status.

Drag a chapter in Outline, or use <kbd>Alt</kbd> <kbd>↑</kbd> and <kbd>Alt</kbd> <kbd>↓</kbd>, to reorder its embed in the main manuscript. Outline can also add a new chapter at the end. Review the preview after changing the order.

## References across chapters {#references}

Writer assembles the complete manuscript before formatting citations and references. Footnotes, citations and labels can work across records. Choose unique figure, section and equation labels throughout the manuscript so a reference has one intended target.

Images belong to the collection, and relative image paths are resolved from the chapter containing them. A chapter's file links should still work when it is included from another record.

## Embed a Reader annotation {#annotations}

An embed referring to a Reader annotation uses its quotation and available source citation. For example, `![[annotations/your-highlight]]` can include a saved passage. Keep the source's CSL metadata and citekey available in the same collection, and verify the quoted text and locator.

## Missing and recursive embeds {#missing}

Missing records and cyclic includes appear in Problems. A cycle happens when a manuscript eventually embeds itself, directly or through another record. Remove the recursive embed or move shared prose into a separate record. Check all included chapters and images before [exporting](/apps/writer/export/).
