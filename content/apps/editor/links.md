---
title: Links, embeds and files
description: Connect notes to each other, include one note inside another, and attach files.
section: editor
---

## Link to a note {#links}

Type <kbd>[[</kbd> and start typing a title or path. The Editor suggests notes and files from the collection and completes the link:

```markdown title="note.md"
[[projects/alpha]]
[[projects/alpha|Project Alpha]]
[[projects/alpha#Goals]]
[[projects/alpha#^decision-1]]
```

After a note name, type <kbd>#</kbd> to link to one of its headings, or <kbd>#^</kbd> to link to a block. Links are stored as ordinary Markdown wikilinks, so other mdbase tools and Obsidian read them the same way. Links that do not resolve to a note are marked as you write.

## Link with @ {#mentions}

Typing <kbd>@</kbd> at the start of a line, after a space or after an opening bracket opens the same suggestions and inserts a `[[wikilink]]`. To limit suggestions to one type, type <kbd>@/</kbd>, choose the type, and continue typing. For example, `@/person/sam` suggests only records of the `person` type that match "sam".

## Embed a note or file {#embeds}

Add <kbd>!</kbd> before a link to show its content inside the current note. You can embed a whole note, a section or block of it (`#^id`), or a file:

```markdown title="note.md"
![[meeting-notes#Decisions]]
![[Attachments/diagram.png]]
![[Attachments/contract.pdf]]
```

The embedded content is read from the other file each time, so it stays up to date. The Editor tells you when an embed points to a missing note or heading, matches more than one note, or would include itself.

## Backlinks

**Backlinks** lists every note that links to the one you are reading. The button in the note header shows how many there are.

## Attach files {#attachments}

Choose **Attach file…** from the note's action menu. Each file is uploaded to an `Attachments` folder next to the note, and an embed or link to each file is added to the note. You can choose several files at once. An existing file with the same name is never replaced. The new file gets a numbered name instead. Images, PDFs, audio, video and text files preview in the Editor. Other files show their name and path and are stored as they are, for other tools to open.

If the Editor's approval does not include file access, the menu shows **Request attachment access** instead, which asks you to approve it in Connect.
