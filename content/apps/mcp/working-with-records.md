---
title: Working with records
description: How the MCP tools read, query and change records without losing concurrent edits.
section: mcp
---

You do not need to call these tools yourself. Your MCP client chooses them. This page explains what they do, so you can tell the client what you want and understand what it did.

## Start with the collection {#start}

`describe_collection` returns the collection's types, their fields and its contracts. A client that reads it first can use your field names and types instead of guessing them from a few files.

## Query records {#query}

`query_records` uses the mdbase query format from the [specification](/spec/). `where` is an expression over record fields, `types` limits the query to declared types, and `order_by` sorts the results.

```json title="query_records input"
{
  "connection_id": "…",
  "types": ["task"],
  "where": "status != \"done\" && priority >= 3",
  "order_by": [{ "field": "due", "direction": "asc" }],
  "limit": 20
}
```

Record bodies are left out unless `include_body` is `true`. `frontmatter_mode` chooses between the frontmatter stored in the file (`persisted`), the values after type defaults and computed fields are applied (`effective`), or both.

## Large result sets {#pages}

`limit` can be at most 1,000. For large result sets, set `pagination` to `"cursor"`. Pages may be smaller than `limit`. Each page's result includes a cursor for the next page, and every page reads from the same snapshot of the collection.

```json title="query_records input"
{
  "connection_id": "…",
  "types": ["note"],
  "pagination": "cursor",
  "limit": 200
}
```

A cursor that is no longer needed can be released with `release_query_cursor`. Unused cursors expire after a short idle period, from seconds to minutes, so continue promptly. To continue, repeat the same query with the `cursor`.

## Read one record {#read}

`read_record` takes a path relative to the collection root, such as `projects/alpha.md`. The result includes the frontmatter, body, the types the record belongs to, and its current `revision`.

## Create and change records {#change}

These tools are available when the client has write access and you approved the matching operation for the collection.

| Tool | Use |
| --- | --- |
| `create_record` | Create a record from a type, frontmatter and body. The path can be given or left to the collection's path rules. |
| `update_record` | Change fields with `patch` and replace the `body`, or replace the whole Markdown source with `document`. A `document` cannot be combined with the other two. |
| `rename_record` | Move a record. Links to it are updated unless `update_refs` is `false` or the collection turns this off. |
| `delete_record` | Delete a record. With `check_backlinks: true`, the result lists records whose links to it are now broken. |

Changes are validated against every type the record belongs to. At the default validation level, an invalid change is rejected with details and nothing is written. A collection can lower its validation level in its configuration.

## Revisions prevent lost edits {#revisions}

Each record has a revision that changes whenever the file changes. When a client passes the revision it read as `if_revision`, the change is applied only if nobody else has changed the record since. That includes you, in another app or a text editor.

```json title="update_record input"
{
  "connection_id": "…",
  "path": "tasks/renew-passport.md",
  "patch": { "status": "done" },
  "if_revision": "…revision from read_record…"
}
```

If the record changed in the meantime, the change is not applied. The result is marked `valid: false` with a `concurrent_modification` diagnostic. The client should read the record again and decide what to do with the newer content, rather than overwrite it.

## Retrying safely {#retries}

Every change returns a receipt containing a request ID:

```json title="tool result"
{
  "mutation_receipt": {
    "request_id": "5b0d…",
    "retry": "Reuse this request_id as mutation_id when retrying the exact mutation."
  },
  "outcome": { … }
}
```

If a call times out and the client cannot tell whether it happened, it can repeat the same change with that ID as `mutation_id`. The change is applied at most once. Reusing an ID for a different change fails with `mutation_request_conflict`.

## Type definitions {#types}

`read_type` returns a type definition by name or path. `create_type` and `update_type` take the complete type file as `document`. Updating a type always requires its current revision. A type change can affect every record of that type, so the **Manage definitions** permission is approved separately in Connect.
