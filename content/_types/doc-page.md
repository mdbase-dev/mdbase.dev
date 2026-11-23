---
kind: mdbase.type
name: doc-page
version: 1
description: One page of the documentation on mdbase.dev.
match:
  path_glob: "**/*.md"
schema:
  dialect: json-schema-2020-12
  value:
    $schema: "https://json-schema.org/draft/2020-12/schema"
    type: object
    additionalProperties: false
    required: [title, description, section]
    properties:
      title:
        type: string
        minLength: 1
      description:
        type: string
        minLength: 1
      section:
        enum: [sdk, mcp, editor, reader, writer]
collection:
  display:
    name_field: title
---

# Documentation page

Each record is one page of the documentation on mdbase.dev. The site serves
`sdk/react.md` at `/sdk/react/`, and a folder's `index.md` at the folder's own
address, so `apps/reader/index.md` is `/apps/reader/`.

`title` is the page's heading and `description` the sentence under it.
`section` is the documentation set the page belongs to, which picks its
sidebar.

The body is ordinary Markdown with four additions the site understands:

- A heading can keep a fixed anchor: `## Saved views {#views}`.
- A code block can name its file: ` ```ts title="src/mdbase.ts" `. With
  `file="examples/worklog/src/mdbase.ts"` it shows that file from the site's
  repository instead of its own contents; `pick="scripts"` keeps one key of a
  JSON file.
- An image whose address is a recording in `/videos/` is shown as that
  recording, with its captions and text description.
- A heading marked `{.cards}` shows the list under it as cards, two to a row.
  Each item is a bold title, a sentence or two, and a link, each in its own
  paragraph.
