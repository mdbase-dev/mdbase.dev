---
title: Browser extension
description: Save the page you are reading, with highlights and notes, from Chrome's side panel.
section: reader
---

## Capture and highlight {#watch}

![Save from the web with the extension](/videos/extension-capture.mp4)

## Install

Install [mdbase Reader from the Chrome Web Store](https://chromewebstore.google.com/detail/mdbase-reader/kimdfjefhbfgfecconmaiaaindjccidp) in Chrome 123 or newer. Store-installed copies receive Chrome's automatic updates. Pin Reader from Chrome's extensions menu so its button is easy to reach.

If you used an unpacked development copy, disable it to avoid duplicate capture actions. The store copy has its own identity and needs a fresh Connect approval; settings and grants do not migrate automatically.

If you have an unpacked development build, open `chrome://extensions`, enable **Developer mode** and choose **Load unpacked**. Select the folder containing `manifest.json`. Unpacked copies need manual updates; use the store version for ordinary reading.

The extension saves the page you are viewing in your browser. Because it reads the page you already have open, it works for pages that Reader's own capture service cannot fetch, such as articles behind a sign-in.

## Connect a collection {#connect}

Open the extension and choose **Connect**. It opens an mdbase Connect approval for a collection, like any other app. Choose the destination collection. The extension remembers it for next time.

## Save a page {#save}

Click the toolbar button or press <kbd>Alt</kbd> <kbd>Shift</kbd> <kbd>S</kbd>. Reader opens in Chrome's side panel for that tab. Check the title, add tags and a note if you like, then choose **Save page** or **Save PDF**. Opening the panel or changing collections does not save a page. Once saved, **Open in Reader** takes you to the source.

- For an article, Reader extracts the main text and saves a readable copy, plus an archive of the page without any form values you typed.
- For a PDF open in Chrome's viewer, it saves the PDF. The file is downloaded from the page itself, so your own access applies.

If the page is already in the collection, the panel finds the existing source instead of creating a duplicate. Addresses are compared without tracking parameters, `www.`, AMP variants or trailing slashes.

## Highlight as you read {#highlights}

The panel stays open while you read. Each new text selection appears in it, so you can highlight several passages in a row. Add a comment or tags if you like, then choose a colour to save the passage. <kbd>Ctrl</kbd> <kbd>Enter</kbd> (<kbd>⌘</kbd> <kbd>Enter</kbd> on a Mac) also saves the selected passage, or the unsaved page if no passage is selected. You can also press <kbd>Alt</kbd> <kbd>Shift</kbd> <kbd>H</kbd>, or right-click and choose **Save highlight to mdbase Reader** or **Add a note in mdbase Reader**.

Highlights are anchored to the saved copy of the page. When a passage appears more than once, Reader uses the occurrence whose surrounding text matches best, and only if one clearly does. Otherwise the highlight is not saved, and your note stays in the panel so you can try again.

Unsaved capture drafts are kept per tab and page for the browser session, so closing the side panel does not discard them. They are not collection backups. For PDF highlighting, save the file and choose **Open in Reader to highlight**.

## Citation details {#citations}

When a page carries a DOI or scholarly metadata, the panel shows the citation it will store. With a DOI, the citation comes from the DOI registry, and only the DOI is sent. Otherwise it comes from the page's own metadata tags. If you turn on Wikimedia's Citoid lookup in Settings, which is off by default, a page without a DOI citation can also be looked up by sending its address to Wikimedia.

## Mark pages you have saved {#marks}

The extension asks for access to HTTPS websites when you install it. It checks the pages you visit against your selected collection, shows a badge with a highlight count or a saved-page check mark, and displays saved highlights. Opening the side panel can also show highlights for that page. If you limit the extension's site access in Chrome, it stops marking saved pages, and **Settings → Pages you visit** offers to allow it on all sites again.

## Permissions

- It has access to HTTPS websites from installation, which it uses to follow the tab you are on and mark saved pages. If you limit site access in Chrome, it reads a page only where you allow it or when you open the panel on it.
- It also has access to the mdbase Connect API and the mdbase collection log service (`log.mdbase.dev`), which it uses to reach your collection.
- Its access to your collection comes from the Connect approval, which you can revoke in Connect.
- See the [extension privacy policy](/apps/reader/extension/privacy/) for capture data, permissions and third-party lookups.
