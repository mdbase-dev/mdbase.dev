---
title: Try the SDK in memory
description: "Run a short script against an in-memory replica, with no account: read, watch, write and see a stale write refused."
section: sdk
---

This script needs no account, no service and no collection. It uses `MemoryReplica`, an in-memory replica from `@mdbase-dev/sdk/testing` that speaks the same protocol as a real one. Your code talks to it through the same `MdbaseClient` it would use with a real collection.

## Prerequisites

- Node 20 or later.
- npm.

## 1. Install the SDK {#build}

```sh title="Terminal"
mkdir mdbase-quickstart && cd mdbase-quickstart
npm init -y
npm install @mdbase-dev/sdk
```

> **The SDK is in beta.**
>
> `npm install @mdbase-dev/sdk` installs the latest beta from [npm](https://www.npmjs.com/package/@mdbase-dev/sdk). A new beta is published as Connect changes, and the API can change between betas, so pin an exact version in an app you ship.

## 2. Run the example {#run}

Save this as `quickstart.mjs` and run `node quickstart.mjs`. It prints its results and exits.

```js title="quickstart.mjs"
import { connect, isMdbaseError, summarizeStatus } from "@mdbase-dev/sdk";
import { MemoryReplica } from "@mdbase-dev/sdk/testing";

// An in-memory stand-in for a replica. Writes stay pending until confirmAll().
const replica = new MemoryReplica({ confirmDelayMs: null });
replica.seed({
  path: "tasks/first.md",
  types: ["task"],
  frontmatter: { title: "Read the collection", status: "open" },
});

const db = await connect({
  connector: replica.connector(),
  app: { name: "dev.example.quickstart", version: "0.1.0" },
});

// A live query: a snapshot first, then a diff for every change.
const tasks = db.live({
  types: ["task"],
  order_by: [{ field: "file.path", direction: "asc" }],
});
await tasks.ready;
console.log(`Tasks: ${tasks.records.map((r) => r.path).join(", ")}`);

// Writes return at once with the optimistic result.
const created = await db.create({
  type: "task",
  path: "tasks/second.md",
  frontmatter: { title: "Update one record", status: "open" },
});
console.log(`Created: ${created.records[0].path} (${created.state})`);
console.log(`Status: ${summarizeStatus(await db.getStatus()).text}`);

// Pass the record you read, so only the fields you change are sent.
const first = await db.get({ path: "tasks/first.md" });
const done = await db.update(first, { patch: { status: "done" } });

replica.confirmAll(); // The log accepts both writes.
const receipt = await done.confirmed;
console.log(`Confirmed at position ${receipt.seq}`);

// A whole-record check fails if the record changed since you read it.
try {
  const stale = await db.update(first, { patch: { status: "open" }, ifRevision: first.revision });
  await stale.confirmed;
} catch (e) {
  if (!isMdbaseError(e, "conflict")) throw e;
  console.log(`Stale revision: ${e.code} (${e.reason})`);
}

console.log(`Status: ${summarizeStatus(await db.getStatus()).text}`);
console.log(`Open tasks: ${tasks.records.filter((r) => r.frontmatter.get("status") === "open").length}`);
tasks.close();
db.close();
```

## 3. Check the result {#result}

```text title="Expected output"
Tasks: tasks/first.md
Created: tasks/second.md (pending)
Status: Synced through 1, 1 change waiting
Confirmed at position 3
Stale revision: conflict (revision)
Status: Synced through 3
Open tasks: 1
```

## 4. What it shows {#read}

- **Writes are optimistic.** `create()` and `update()` return a `Write` straight away, in the `pending` state. Your reads and live queries already show the change. `write.confirmed` resolves when the collection’s log accepts it.
- **Live queries stay current.** `db.live()` keeps `records` up to date as writes land, so the count at the end already includes both changes.
- **Frontmatter is a `Map`.** Read fields with `record.frontmatter.get("status")`, or convert with `toPlain()`.
- **Stale writes are refused.** With `ifRevision`, a write against an old revision fails with the error code `conflict` and reason `revision`.

`MemoryReplica` is not the real replica. It applies patches blindly and has no query planner or merge. Use it for unit tests and demo modes, not to test merge behaviour.

## 5. Next steps {#next}

To sign a user in and work with one of their collections, follow [Build an app](/sdk/connect-quickstart/). The code that reads and writes records stays the same; only the connector changes.

- [Build an app](/sdk/connect-quickstart/)
- [Read and write records](/sdk/operations/)
- [Pending writes and sync status](/sdk/offline-sync/)
- [Test with MemoryReplica](/sdk/testing/)
