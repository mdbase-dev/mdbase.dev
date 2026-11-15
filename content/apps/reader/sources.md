---
title: Adding sources
description: Add PDFs, EPUBs and web pages, or start from a DOI, arXiv ID, ISBN or PubMed ID.
section: reader
---

Choose **Add source** in the library, or run **Add source…** from the command palette. You can add a file or paste a link or identifier.

## Add a file {#file}

Choose a PDF, an EPUB, or a web page you saved earlier. You can also drop a file onto Reader. The original file is stored unchanged in your collection, and Reader creates a source record that points to it.

## Add a link or identifier {#link}

Paste a web address, DOI, arXiv ID, ISBN or PubMed ID into **Link or identifier** and choose **Add**. Reader shows each step as it works: fetching the page, looking up citation details, or looking for an open-access PDF.

## Web pages {#web}

For a web address, Reader fetches the page and saves a readable copy. If the address points to a PDF, it saves the PDF instead. When the page cannot be fetched, Reader may find citation details and offer to save a citation-only source. Review that offer before accepting it.

Pages behind a sign-in or paywall cannot be fetched this way. Use the [browser extension](/apps/reader/extension/), which saves the page you are already viewing, or save the page yourself and add the file.

## Identifiers

For a DOI, arXiv ID, ISBN or PubMed ID, Reader first looks up the citation details. For a DOI or arXiv ID, it then looks for a freely available PDF. It tries direct PDF links first, then open-access article pages. Paywalled and blocked sites are skipped.

If no PDF is found, you can keep a source with citation details and attach a file later. Review any follow-up message: **Open source** opens a source already added, while a citation-only offer needs your approval. If citation data could not be stored, Reader says so; use the source's citation tab to review or add it.

## What is sent where {#privacy}

| Step | Service | What is sent |
| --- | --- | --- |
| Fetching a web page or PDF | Reader's capture service | The address to fetch. Private and local network addresses are refused. |
| DOI and arXiv citations | The DOI registry (doi.org) | The DOI only. |
| Other citations: ISBN, PubMed, URL or title | Wikimedia Citoid | The identifier, address or title only. |
| Open-access search for a DOI | OpenAlex, and Unpaywall where enabled | The DOI only. PDFs it finds are then fetched by Reader's capture service. |
| Open-access search for an arXiv ID | arXiv, through Reader's capture service | The arXiv ID only. |

Citation lookups send the identifier, address or search text needed for that lookup, not your notes or annotations. Fetching a page sends its address; check that it does not contain a private access token. See the [privacy policy](/privacy/) for data handling.
