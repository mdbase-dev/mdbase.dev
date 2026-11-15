---
title: Types
description: Define the shape of a collection's notes, how notes are assigned to types, and how types work with other apps.
section: editor
---

## What a type is {#what}

A type is a Markdown file in the collection's types folder. It names a kind of record, such as a task or a person, and describes its frontmatter fields with JSON Schema. The Editor uses types to build property forms, check notes, and suggest links. Other apps use the same files. The format is defined in the [mdbase specification](/spec/).

Open **Types** from the collection rail to see every type. Changing types needs the collection's definition management permission, which the Editor requests when you approve it.

## Create a type {#create}

In the Types list, choose **Add a type**, then one of:

- **New type** starts from an empty definition. Give the type a unique name and add your own fields.
- **Ready-made types** is a catalog. Each type comes with an application contract, so apps built for that contract can use your notes. Adding one creates a new, editable type. Existing files are never overwritten. Installing one needs permission to install type packs; without it, the catalog offers to request that access.

## Fields

The visual editor covers the field shapes most collections need: text, numbers, dates and times, choices, links, lists, nested objects, lists of objects, and required fields. You can also set **Read defaults**, which are used when a note leaves a property out. Source files stay unchanged.

Link rules say which fields point to other records, which types they may point to, and whether the target must exist. Uniqueness rules require a value to be unique within the type, across the collection, or among records that match a path pattern.

Anything the visual editor cannot represent stays in the YAML source, marked where it appears. Switch to **YAML** to edit the complete definition directly.

## Type membership {#membership}

**Type membership** decides which notes belong to the type. A note that names a type in one of the collection's type keys (`type` or `types` by default) belongs to the types it names, and the automatic rules below are skipped. Otherwise the note belongs when every configured condition matches:

| Condition | Matches when |
| --- | --- |
| Path | Its path matches one of the path patterns. |
| Field presence | Its frontmatter contains all the listed fields. |
| Expression | Each extra rule on its fields is true. These rules are edited in YAML. |

Some collections turn explicit assignment off. Then every note is classified by the other rules.

## Collection behaviour {#behaviour}

**Collection behaviour** controls how the type appears and acts across tools: the field used as a record's name, description and colour, an icon, and a path policy. The path policy tells tools where to put new records of this type and how to name them. Changing it affects future files only. Existing files are not moved.

## Works with applications {#apps}

An application contract describes the fields an app expects, such as a task manager's due date and status. **Works with applications** connects a type to an installed contract and maps each contract field to one of your field names. The app reads your notes through that mapping, and your notes keep their own field names. A mapping copies values as they are. It does not convert them.

The Editor suggests contracts that might fit, based on field names and shapes. Check that the meanings match before you accept a suggestion.

## Review and save {#save}

A type change can affect every note of that type. Before saving, the Editor shows the fields added, changed and removed, the YAML differences, and which existing notes would need attention. You can open the list of affected notes. The collection checks the complete definition when you confirm.
