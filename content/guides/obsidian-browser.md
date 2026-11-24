---
title: Edit an Obsidian vault in your browser
description: Open your vault folder as an mdbase collection. Use mdbase Editor to edit the Markdown body and YAML properties, then open the same file in Obsidian.
section: guides
---

Use the [Connect desktop app](/downloads/) on the computer that holds your vault, and [mdbase Editor](https://editor.mdbase.dev/) in the browser. You need an mdbase account and the path to your vault. Obsidian describes a vault as [a folder on your computer](https://obsidian.md/help/vault).

## 1. Make the vault available

In the desktop app, sign in and open **Collections → Add existing**. Select the vault folder. Open its actions menu and choose **Turn on sync**. If your vault already syncs with mdbase, use that collection.

Choose **Cloud copy** (the default) if you need access while your computers are off. mdbase can read this copy. For **Private**, open **Advanced**, select end-to-end encryption and confirm. To use Editor with a Private collection, keep a computer that serves it online.

![The sync dialog for Field research shows the end-to-end encryption option under Advanced.](/images/apps/vault-sync-light.webp)

## 2. Open the collection in Editor

Open [mdbase Editor](https://editor.mdbase.dev/) and choose **Choose a collection** in the collections sidebar. Sign in and select your vault. If another collection is already open, choose **Connect another collection**. Review the name and the requested permissions. Allow reading and editing. To create the example below, also allow creating records.

Check that the collection name in the rail matches the vault. **Saved only in this browser** indicates a local workspace. Connect the vault before you expect changes to appear on your computer.

![Editor’s collections sidebar shows Choose a collection above All notes and the local-only status at the bottom.](/images/apps/editor-chooser-light.webp)

## 3. Write a note and edit it

Select an existing note, or choose **New note**. For a new note, use **East bank survey** as the title and write the field instruction below. Check the suggested path and press **Ctrl Enter** (**⌘ Enter** on Mac) to create it.

![A new East bank survey draft in Editor, with a title and a field instruction before creation.](/images/apps/editor-draft-light.webp)

After the survey, open the note again. Add a second paragraph with your count. Editor saves edits to an existing note automatically. The screenshots use a browser-local sample so you can see the edit without granting access to a vault.

![Editor shows the saved survey with the instruction and a second paragraph recording six nesting pairs.](/images/apps/editor-survey-light.webp)

## 4. Check the Markdown and properties

Open **Note properties**. On a narrow screen, look under **More note actions**. In the properties panel, open **Property options → Edit as source**. Add the three frontmatter lines at the top of the note, then leave the field to save.

![The source view in Note properties shows the status property and both survey paragraphs.](/images/apps/editor-source-light.webp)

![Inspect the survey note’s Markdown in the browser.](/videos/editor-note.mp4)

With a connected collection, wait for the desktop app to finish syncing. Open the same note in Obsidian. This is the file to check:

```markdown title="East bank survey.md"
---
status: counted
---
# East bank survey

Return at low tide to count the nesting pairs.


Counted six pairs on the east bank.
```

![Obsidian opens the East bank survey file with the counted status in Properties and both paragraphs in the note.](/images/apps/obsidian-survey-light.webp)

The browser runs mdbase Editor with its own commands and views. Your Obsidian plugins and workspace layout live in Obsidian. If both apps edit the same note, review Editor’s **This note changed elsewhere** prompt before choosing which version to keep. See [editing and conflicts](/apps/editor/notes/#conflicts) or [give Claude read access to the vault](/guides/claude-obsidian/).
