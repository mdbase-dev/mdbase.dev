---
title: Writing notes
description: Create, edit, find and organise the Markdown records in a collection.
section: editor
---

## Create a note {#create}

Choose **New note** or press <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>N</kbd>. A note is not written to the collection until you create it, so you can fill in everything first:

- **Type.** Pick one of the collection's types, or **General note** for a note without a type.
- **Required properties.** The fields the type requires are shown up front. Nested objects and lists follow the type's schema.
- **Path.** The Editor suggests where the file will live. Edit it to choose another folder or file name. A new folder appears once its first note is created.

Press <kbd>Ctrl</kbd> <kbd>Enter</kbd> to create the note.

## Write

The body is plain Markdown. Changes save automatically. Type <kbd>/</kbd> at the start of a line for Markdown commands such as headings, lists, tasks, quotes, code blocks, tables and links.

<kbd>Ctrl</kbd> <kbd>B</kbd> and <kbd>Ctrl</kbd> <kbd>I</kbd> set bold and italic, <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>C</kbd> sets inline code, <kbd>Ctrl</kbd> <kbd>K</kbd> adds a link, and pasting a URL over selected text turns it into a link. <kbd>Tab</kbd> and <kbd>Shift</kbd> <kbd>Tab</kbd> indent and outdent list items.

**Quiet Markdown**, on by default, softens Markdown punctuation away from the line you are editing and makes task checkboxes clickable. Vim key bindings can be turned on in Settings. See [Shortcuts and settings](/apps/editor/shortcuts/).

## Properties

Open **Note properties** to see and edit frontmatter. It has three views:

| View | Shows |
| --- | --- |
| Fields | Structured inputs based on the note's types, including dates, links, lists and nested objects. |
| JSON | The frontmatter stored in the file, as JSON. |
| Source | The exact Markdown file, including YAML frontmatter and body. |

## Find notes {#find}

- **Quick open** (<kbd>Ctrl</kbd> <kbd>P</kbd>) searches titles, paths, properties and text. Start with <kbd>&gt;</kbd> to search actions instead.
- Folders, Tags and By type in the collection rail filter the note list. Its view options sort by modified date, title or path.
- <kbd>Alt</kbd> <kbd>J</kbd> and <kbd>Alt</kbd> <kbd>K</kbd> move to the next and previous note. <kbd>Alt</kbd> <kbd>←</kbd> and <kbd>Alt</kbd> <kbd>→</kbd> go back and forward through notes you opened.
- <kbd>Ctrl</kbd> <kbd>F</kbd> finds text within the open note.

## Rename and move {#rename}

Click the path in the note header to rename or move the Markdown file; the new path must end in `.md`. If other notes link to it, the Editor asks whether to **Rename and update links**, which rewrites those links, or **Rename only**. Otherwise it renames the file and updates links straight away.

## Check a note {#check}

**Check note**, in the note's action menu, validates the note against its types and reports any fields that do not fit. Links that do not resolve are marked in the editor as you write.

## Edits made elsewhere {#conflicts}

Every save checks that the file has not changed since the Editor read it. If another app, a text editor or another person changed the note, the Editor does not overwrite it. It shows **This note changed elsewhere** and lets you compare the title and body before choosing **Keep my edits** or **Use latest**.

Edits that were not saved, for example because the browser closed, stay in this browser for up to seven days. Reopening the note offers **Restore unsaved edits** or **Discard recovered edits**.

## Delete a note {#delete}

**Delete note** is in the note's action menu. It asks for confirmation, then removes the Markdown file from the collection.
