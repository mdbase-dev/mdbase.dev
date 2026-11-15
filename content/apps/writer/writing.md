---
title: Writing and reviewing
description: Write Markdown, label figures and headings, navigate the preview, and review comments and suggested edits.
section: writer
---

## Markdown and labels {#markdown}

Use Markdown headings, emphasis, lists, tables, links and footnotes. Writer also understands Pandoc citations and Quarto-style labels and references. This example uses a library citekey and an image stored in the collection:

```markdown title="manuscript body"
# Introduction {#sec-introduction}

A claim supported by a source [@smith2024, p. 12].

See @sec-introduction and @fig-results.

![Results](figures/results.png){#fig-results}

A sentence with a footnote.[^note]

[^note]: A longer explanation.
```

Replace `smith2024` with one of your source citekeys and the image path with your own file. Labels such as `{#sec-introduction}` identify headings; `@sec-introduction` refers to them. Figures use a `fig-` label. Keep labels unique across the whole manuscript.

Image paths are resolved relative to the record containing them. Store the image in the collection where Writer can read it. Missing files appear in Problems and can affect the downloaded document.

## Preview and navigation {#preview}

The preview typesets your manuscript as you type and follows the cursor's block. Click a preview block to jump to its Markdown. Hover over a citation to see its bibliography entry, or a cross-reference to see its target. <kbd>Ctrl</kbd>-click (<kbd>⌘</kbd>-click on a Mac) follows a reference.

Outline lists your sections and chapters with word counts. Manuscript search can find text across the included records and open the result in its editor. The command palette is another way to find sources or run commands.

## Problems

Writer marks unknown citekeys, missing labels, unavailable records and images, footnote problems, malformed LaTeX and typesetting errors at the affected Markdown line. Open Problems to jump to one. <kbd>F8</kbd> moves to the next problem; <kbd>Shift</kbd> <kbd>F8</kbd> moves back.

Unknown citekeys and labels can offer close matches. Problems with a manuscript setting take you to that field in Settings. Check Problems before exporting and review the downloaded document.

## Comments and suggestions {#comments}

Select text and choose a comment or suggested edit from the selection toolbar or command palette. Open Comments to read threads and reply. A suggested edit includes replacement text; accepting it changes the record through its editing session. Review the replacement before accepting.

Comments are collection records anchored to quoted text. Writer looks for the quote again after edits and reports a detached comment when it cannot find a reliable target. A comment can be signed with your collection person record when identity access is available; otherwise it is unsigned.

## Shortcuts

On macOS, use <kbd>⌘</kbd> in place of <kbd>Ctrl</kbd>. Writer's keyboard-shortcuts dialog lists the available commands.

| Keys | Action |
| --- | --- |
| <kbd>Ctrl K</kbd> | Open the command palette |
| <kbd>Ctrl Shift F</kbd> | Search across the manuscript's records |
| <kbd>Ctrl Shift E</kbd> | Find a source |
| <kbd>Ctrl ,</kbd> | Open manuscript settings |
| <kbd>Ctrl &#92;</kbd> | Show or hide the sidebar |
| <kbd>Ctrl Shift &#92;</kbd> | Cycle the editor/preview arrangement |
| <kbd>Ctrl Alt M</kbd> | Comment on a selection |
| <kbd>Ctrl Alt S</kbd> | Suggest an edit to a selection |
| <kbd>Ctrl Shift S</kbd> | Choose an export format |
| <kbd>F8 / Shift F8</kbd> | Next or previous problem |
