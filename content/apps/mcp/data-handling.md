---
title: Data handling
description: What the mdbase MCP server stores, what it can see while it works, and what stays with Connect.
section: mcp
---

## Why it is a separate service {#boundary}

The Connect control plane, which handles accounts and approvals, does not see collection content. Requests to a Private collection are encrypted before they reach the mdbase relay, and only your device decrypts them. A Cloud copy collection is answered by the readable copy mdbase keeps, held by a separate service that can read it to perform operations.

An AI client cannot perform that encryption itself, so the MCP server does it on the client's behalf. That means the MCP server sees operation inputs and results in memory while it handles a tool call, for Cloud copy and Private collections alike. It runs as its own service, with its own database, so that this access stays outside the control plane. It is not a zero-knowledge service.

## What is stored {#stored}

- Client registrations (name and redirect URLs), hashes of access and refresh tokens, and short-lived sign-in state.
- For each approved collection: its ID, display name, approved operations and contract scope.
- The credentials the MCP server uses to reach Connect, encrypted.
- A key pair for each connection, with the private key encrypted, and a plain message counter for each key.

Expired sign-in records are not currently deleted automatically. The server does not log individual requests. Unexpected errors are logged for diagnosis.

## What is not stored {#not-stored}

The MCP server's database does not hold:

- Record contents, including frontmatter and bodies.
- Tool call results.
- Record paths within a collection.
- Filesystem paths on your computer. These are never sent to the MCP server or to Connect.

## Your MCP client {#client}

Whatever a tool returns goes to your MCP client and, through it, to the AI model you are using. That client's own data policies apply to it. Approve only the collections and permissions you are comfortable sharing with that client.

## Your controls {#controls}

- Each collection is approved separately, with its own permissions.
- Revoking a collection on the [Applications](https://editor.mdbase.dev/connect/applications) page stops the next tool call. Every copy of the collection, on your devices or in the cloud copy, also refuses a revoked approval on its own.
- See the [privacy notice](/privacy/) and [security page](/security/) for how mdbase handles account data in general.
