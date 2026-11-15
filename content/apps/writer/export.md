---
title: Layouts and export
description: Choose the manuscript's appearance and download PDF, Word or a Pandoc/Quarto bundle.
section: writer
---

## Manuscript settings {#settings}

Open **Settings** to edit title, subtitle, authors, abstract, date, citation style, layout and language. Enter authors one per line; `Name; Affiliation` adds an affiliation. Settings update the manuscript's frontmatter and preview as you edit.

A problem with a setting appears beside that field. Check the save status after changing settings, just as you do after writing body text.

## Layouts

The bundled **Article** and **Thesis** layouts typeset the manuscript with appropriate title and document structure. You can also choose a Typst template stored as a `.typ` file in the collection. Custom layouts require Typst knowledge and a template function accepting title, subtitle, authors, abstract, date and body.

A collection template is one file: files it imports are not loaded. Its layout affects the PDF. A manuscript's citation style can be a bundled style or a `.csl` file in the collection.

## Export formats {#formats}

Open the menu beside **Export** to choose a format. The main button repeats the format you used last in this browser. You can also open the export menu with <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>S</kbd> (<kbd>⌘</kbd> on macOS).

| Format | Contents |
| --- | --- |
| PDF | The typeset manuscript using the selected layout. It is available once the manuscript typesets. |
| Word (DOCX) | An editable document with formatted citations, resolved cross-references and Word document styles. |
| Pandoc bundle (ZIP) | Materialised Markdown, references, citation style and supporting files for building with Pandoc or Quarto. Follow the bundle's README. |

Exports are generated in the browser. The first Word export downloads about 16 MB of additional software. Keep the tab open while it prepares the file. A slow first export does not mean the manuscript needs to be reopened.

## PDF and Word differences {#differences}

PDF uses the Typst layout; Word uses its own styles and Pandoc's document structure. Word is not a page-for-page copy of the preview. A custom Typst layout uses article styles for Word output. The bundled article and thesis layouts have their corresponding Word reference styles.

The Word export resolves cross-reference numbers before conversion. A Pandoc/Quarto bundle leaves cross-references for the external build tools; follow its instructions for Quarto or an appropriate Pandoc filter.

## Check before sharing {#check}

Review Problems and export warnings, then inspect the downloaded file. Missing records or images can leave output incomplete. Check page breaks, figures, cross-references, citations and bibliography before submitting or sharing. The bundle includes manuscript text and supporting content; treat it as private research material.
