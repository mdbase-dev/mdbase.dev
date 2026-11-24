---
title: Collections and access
description: How approvals work, how to add or reconnect collections, and how to take access away.
section: mcp
---

## One approval per collection {#model}

The client does not get general access to your account. Each collection is approved on its own, with its own list of operations. There is no query or write that spans collections, and no collection is used unless you approved it.

## Connection IDs

`list_connections` returns one entry for each approved collection:

| Field | Meaning |
| --- | --- |
| `id` | The connection ID. Every collection tool requires it as `connection_id`. |
| `collection_id` | The collection's ID in Connect. |
| `display_name` | The collection name shown in Connect. |
| `operations` | The operations you approved, such as `read`, `query` or `update`. |
| `authority` | `local` when requests go to one of your devices, `remote` when mdbase serves them. |

Connection IDs are opaque. They are not collection paths and do not reveal where the collection is stored.

## Connect more collections {#more}

Ask the client to connect another collection. It calls `add_connection`, which returns a link for you to open in a browser. The link can be used once and expires after ten minutes.

The link opens the same Connect approval screen as the first setup. Choose the collection and its operations, approve, then ask the client to list collections again.

## Reconnect or broaden access {#broaden}

If a collection's approval expires, or you want to allow operations you previously left out, the client calls `reconnect_collection` with that connection ID. The returned link opens Connect on that collection only. You review and approve its operations, or decline.

## Read and write access {#write}

Two separate approvals control writing. The first is the MCP sign-in scope the client requests: `mdbase:read`, `mdbase:write`, or both. A client that does not ask for a specific scope gets both. The client only sees the write tools when the scope includes `mdbase:write`.

The second is the set of operations you approve for each collection in Connect. This one decides what can actually happen. If you approved a collection for reading only, a write tool fails with `insufficient_collection_access`. It never expands your approval by itself. If you narrow access in Connect, calls may fail with a different code until the MCP server's sign-in next refreshes, within an hour.

## Revoke access {#revoke}

Open the [Applications](https://editor.mdbase.dev/connect/applications) page in the Connect workspace. The MCP server is listed as **mdbase**. You can narrow or revoke its access to each collection there. The next tool call for a revoked collection fails, and other collections keep working.

Removing the server from your MCP client stops that client from using it, but does not remove the approvals held in Connect. Revoke them in Connect as well if you no longer use them.

## Cloud copy and Private {#modes}

Your approval travels with the collection, so every copy checks it before it answers a request. A grant you revoked is refused by your devices and by the cloud copy too.

For a **Cloud copy** collection, requests go to the readable copy mdbase keeps, so tools work while your devices are off.

For a **Private** collection, requests travel from the MCP server through the mdbase relay to one of your devices. They are encrypted end to end between the MCP server and that device, and the relay cannot read them. One of your devices must be online. If none is, tools return `connector_offline`. A new approval for a Private collection takes effect once one of your signed-in devices has recorded it. See [Troubleshooting](/apps/mcp/troubleshooting/).

For a read-only setup in ChatGPT, see [Connect ChatGPT to your Markdown notes](/guides/chatgpt-markdown/).
