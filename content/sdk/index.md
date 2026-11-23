---
title: SDK overview
description: "Build apps whose data lives in the user’s own mdbase collection. @mdbase-dev/sdk is the TypeScript client: local reads, optimistic writes, live queries and sign-in."
section: sdk
---

An mdbase collection is a folder of Markdown files with typed frontmatter, synced across a person’s devices. An app built with the SDK reads and writes the records in a collection its user chooses.

## Where to start {#start .cards}

- **Build an app**

  Build Worklog, a small app that signs a user in and keeps its entries in their collection, from an empty folder to a deployed site. It uses React, and its last section shows the same app without React.

  [Follow the tutorial](/sdk/connect-quickstart/)

- **Try the SDK in memory**

  Run a short script against an in-memory collection. It needs no account or service, and shows reads, writes and live queries.

  [Run the script](/sdk/quickstart/)

- **Develop on localhost**

  Run your app from a development server against real accounts and collections.

  [Set up local development](/sdk/local-development/)

- **The format**

  Build tools that read and write mdbase collections as files, with no SDK.

  [Read the specification](/spec/)

## Why build on mdbase {#why}

- **You run no backend.** The user’s collection is your app’s database. A finished app is a folder of static files: no server, no database to operate and no API key to guard.
- **Sign-in, sync and offline are done.** The SDK signs the user in, keeps a copy of the collection on the device, saves writes there at once and syncs them when it can. Edits made on two devices merge field by field, and a value that loses is kept for review.
- **Users bring their data, and keep it.** Records are Markdown files the user owns. They can open them in mdbase’s [Editor, Reader and Writer](/apps/), in Obsidian, or in a text editor, and they still have them if they stop using your app.
- **Apps can share records.** A [contract](/sdk/contracts/) names a shape of record, such as a task. Two apps that use the same contract work on the same records in one collection, with no integration between them.
- **Access is the user’s decision.** Your app asks for the capabilities in its [manifest](/sdk/manifest/), the user approves them for one collection, and can withdraw them later. See the [security model](/sdk/security/).

## How the SDK works {#model}

Your app talks to a **replica** of the collection: a copy that applies changes in the order the collection’s log confirms them. The SDK gives you that replica’s view, plus your own writes that are still waiting.

- **Reads are local.** `get`, `query` and `live` answer from the replica’s view. They include your pending writes.
- **Writes are intents.** Each write returns at once with a receipt in the `pending` state. It becomes `confirmed` when the log accepts it, or `rejected` with a reason.
- **Nothing is lost silently.** Concurrent edits to the same field are merged, and the losing value is kept as a conflict you can review. A file-backed replica can also put a local edit on hold instead of overwriting it.

[Pending writes and sync status](/sdk/offline-sync/) covers receipts, holds and conflicts.

## Getting a client {#choose-a-surface}

Every client comes from `connect()`, given a **connector** that says how to reach a replica:

| You are building | How you reach the collection |
| --- | --- |
| A web or mobile app | `createMdbase()` signs the user in and hands you a connection. Its client is an ordinary `MdbaseClient`. See [Build an app](/sdk/connect-quickstart/). |
| A script or plugin on a computer running the mdbase desktop app | Connectors from `@mdbase-dev/sdk/node` reach the desktop app’s replica on the same machine. See [How apps reach a collection](/sdk/routing/). |
| Tests and demo modes | `MemoryReplica` from `@mdbase-dev/sdk/testing`. See [Testing](/sdk/testing/). |

## Application shape

Keep domain code on `MdbaseClient`. It then runs unchanged against any connector.

```ts title="tasks.ts"
import type { MdbaseClient } from "@mdbase-dev/sdk";

// Accept the client, not a connector, so the same code runs against
// a real collection and against MemoryReplica in tests.
export async function listOpenTasks(db: MdbaseClient) {
  const page = await db.query({
    types: ["task"],
    where: 'status == "open"',
    order_by: [{ field: "due", direction: "asc" }],
    limit: 50,
  });
  return page.records;
}
```

## Packages {#package-map}

| Package | What it is for |
| --- | --- |
| `@mdbase-dev/sdk` | The client. `createMdbase` for apps, `connect` and `MdbaseClient` for everything that reads and writes records. [API reference](/sdk/api/). |
| `@mdbase-dev/ui` | The sign-in, collection picker, approval and setup screens as React components. [UI components](/sdk/ui/). |
| `@mdbase-dev/connect-dev` | Build-time tools: the manifest checker and the type pack builder. [Developer kit](/sdk/connect-dev/). |

The SDK has several entry points:

| Import | What it gives you |
| --- | --- |
| `@mdbase-dev/sdk` | `createMdbase`, `connect`, `MdbaseClient`, errors and status helpers |
| `@mdbase-dev/sdk/describe` | `describeError`: a title, message and action for any failure |
| `@mdbase-dev/sdk/testing` | `MemoryReplica` and test fixtures |
| `@mdbase-dev/sdk/node` | Connectors to the desktop app over local IPC or localhost |
| `@mdbase-dev/sdk/browser` | The same surface as a browser module. The package also ships a classic-script bundle; see [Browser bundle](/sdk/portable-apps/). |
| `@mdbase-dev/sdk/account` | Encryption password and recovery key set-up for Private collections |

The SDK needs Node 20 or later outside the browser. It is what apps use instead of the `@mdbase-dev/connect` beta.

## Publishing an app {#publish}

There is no review, registration form or API key. The SDK registers your manifest with mdbase the first time your app starts, and each user approves the app for their own collection. To publish, deploy the built files to an HTTPS origin; the [tutorial](/sdk/connect-quickstart/#deploy) ends with that step.

The approval screen shows your app’s name and the site it is served from. mdbase does not verify who publishes an app, and an application ID is a label, so serve your app from an origin your users recognise.

The [apps page](/apps/) lists the apps mdbase makes. There is no directory of other apps yet. If you build one, write to [callum@mdbase.dev](mailto:callum@mdbase.dev).

## Stability {#status}

`@mdbase-dev/sdk`, `@mdbase-dev/ui` and `@mdbase-dev/connect-dev` are in beta on npm.

- The API can change between betas. Pin exact versions in an app you ship, and read the [release notes](https://github.com/mdbase-dev/mdbase-connect/releases) before you upgrade.
- Publishing a new beta does not change an app that is already deployed; it keeps the SDK it was built with. If the service ever needs a newer one, the SDK reports a problem whose action is `update_app`.
- The [collection format](/spec/) is specified separately and does not change with SDK releases. Records your app writes stay readable.

## Getting help {#help}

- Report a bug or ask a question in [GitHub issues](https://github.com/mdbase-dev/mdbase-connect/issues).
- Email [callum@mdbase.dev](mailto:callum@mdbase.dev).
- Report a security problem as the [security page](/security/) describes.
