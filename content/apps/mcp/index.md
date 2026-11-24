---
title: Set up mdbase MCP
description: Connect an AI client to the mdbase collections you approve, through one remote MCP endpoint.
section: mcp
---

## What it does {#what}

mdbase MCP is a remote Model Context Protocol server. An MCP client, such as Claude, uses it to read and change records in mdbase collections you have approved. It works the same way with Cloud copy and Private collections.

The client never receives your Connect account. You approve one collection at a time, with the exact operations you want to allow, and you can revoke that approval from Connect at any time.

## Before you start {#before}

- An mdbase Connect account. [Sign up](https://connect.mdbase.dev/signup) if you do not have one.
- At least one collection. A Cloud copy collection works immediately. A Private collection is reached through one of your devices, so one must be online whenever the client uses it, such as a computer running the [desktop app](/downloads/).
- An MCP client that supports remote servers over Streamable HTTP with OAuth sign-in, including dynamic client registration and PKCE.

## Add the server to your client {#add}

Every client uses the same endpoint:

```text title="MCP endpoint"
https://mcp.mdbase.dev/mcp
```

In Claude on the web, desktop or mobile, open [mdbase in the Claude connectors directory](https://claude.ai/directory/connectors/mdbase) and connect it from there. You can also add the endpoint yourself as a custom connector. In Claude Code, add it from a terminal:

```sh title="terminal"
claude mcp add --transport http mdbase https://mcp.mdbase.dev/mcp
```

Other clients have their own screens for adding a remote MCP server. Give them the endpoint above. There is no API key to paste in. The client discovers the sign-in flow from the server.

## Approve a collection {#approve}

When the client first connects, it opens a browser window for sign-in.

1. Sign in to mdbase Connect.
2. Choose one collection.
3. Review the permissions. **Read this collection** is required. **Create records**, **Edit records**, **Delete records** and **Manage definitions** are optional, and you can leave any of them out. They appear when the client asked for write access, which it does by default.
4. Approve. The browser returns you to your client.

Each approval covers one collection. To use more than one, ask the client to connect another collection after setup. See [Connect more collections](/apps/mcp/collections/#more).

## Check the connection {#check}

Ask your client something that needs the collection:

```text title="prompt"
List my mdbase collections, then describe the first one.
```

The client should call `list_connections` and then `describe_collection`. `list_connections` shows each collection's approved operations; `describe_collection` returns its types, fields and contracts.

## Next steps {#next}

- [Collections and access](/apps/mcp/collections/) explains how approvals, reconnecting and revocation work.
- [Working with records](/apps/mcp/working-with-records/) covers queries, edits and safe retries.
- [Tool reference](/apps/mcp/tools/) lists every tool and its inputs.
- [Data handling](/apps/mcp/data-handling/) describes what the MCP server stores and what it can see.
- [Connect Claude to your Obsidian vault](/guides/claude-obsidian/) walks through read-only access and checks the result against a note on disk.
