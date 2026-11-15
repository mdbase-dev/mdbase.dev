---
title: Troubleshooting
description: What common mdbase MCP errors mean and how to recover from them.
section: mcp
---

Failed calls return an error with a `code` and a message. Most clients show the message; ask the client for the code if it does not. Some rejections, such as conflicts and validation problems, instead return a result marked `valid: false` with diagnostics that carry the code.

## Error codes {#errors}

| Code | What happened | What to do |
| --- | --- | --- |
| `connector_offline` | No device that can serve this collection is online. Private collections are reached through one of your devices. | Start the desktop app on one of your computers and check it is online, then retry. |
| `connector_busy` | The device serving the collection is handling other work. | Retry after a moment. |
| `connector_upgrade_required` | The desktop app serving the collection is too old for this request. | Install the latest desktop app from [Downloads](/downloads/). |
| `insufficient_collection_access` | You did not approve this operation for the collection. | Ask the client to reconnect the collection, then approve the extra permission. |
| `connection_expired` | The collection's approval is no longer valid. | Ask the client to reconnect the collection. |
| `connection_not_found` | The connection ID does not belong to this client's approvals. | Ask the client to list collections again and use a current ID. |
| `concurrent_modification` | The record changed after the client read it. Reported as a diagnostic. | Let the client read the record again before changing it. |
| `invalid_query` | The query does not follow the mdbase query format. | The message names the problem. The client should correct the query. |
| `encryption_binding_stale` | Access to a collection served by one of your devices changed in Connect. | Retry later, or reconnect the collection. |
| `generation_expired`, `query_cursor_expired` | The query cursor expired. | Run the query again. |
| `mutation_request_conflict` | A `mutation_id` was reused for a different change. | Use a new ID, or repeat exactly the original change. |

## Sign-in does not finish {#sign-in}

If you closed the browser window or declined the approval, start the connection again from your client. Links from `add_connection` and `reconnect_collection` can be used once and expire after ten minutes, so ask the client for a new one if a link no longer works.

## A collection is missing {#missing}

The client only sees collections you approved for it. Ask it to connect another collection, or check the [Applications](https://editor.mdbase.dev/connect/applications) page in Connect to see which collections **mdbase** can use.

## The client cannot write {#no-write}

If the client says it has no tool to create or change records, it signed in with read-only scope. Remove the server from the client and add it again. If the tools exist but fail with `insufficient_collection_access`, reconnect the collection and approve the write permissions. See [Read and write access](/apps/mcp/collections/#write).

## Self-hosted servers {#self-hosted}

Running your own MCP server alongside a self-hosted Connect is covered in the [MCP gateway operator guide](https://github.com/mdbase-dev/mdbase-connect/blob/main/docs/mcp-gateway.md).
