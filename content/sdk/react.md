---
title: React
description: "Use the SDK from React: the snapshot as a store, a hook for live queries, and where the shared components fit."
section: sdk
---

## What there is {#packages}

The SDK has no React dependency and needs no provider. Two things make it fit React directly:

- The entry from `createMdbase()` is an external store: `subscribe` and `getSnapshot` have the shapes `useSyncExternalStore` expects.
- [`@mdbase-dev/ui`](/sdk/ui/) has the sign-in and collection screens as components. With `CollectionGate` you may not need the first hook on this page at all.

The [Worklog tutorial](/sdk/connect-quickstart/) is a complete React app built this way.

## The snapshot as a store {#snapshot}

```ts title="use-mdbase.ts"
import { useSyncExternalStore } from "react";
import { mdbase } from "./mdbase";

export function useMdbase() {
  return useSyncExternalStore(mdbase.subscribe, mdbase.getSnapshot, mdbase.getSnapshot);
}
```

The snapshot is replaced only when something changes, so components re-render only then. The third argument is the server snapshot: where the SDK cannot run, the phase is `unavailable`, so a server-rendered page gets a defined state.

```tsx title="App.tsx"
import { useEffect } from "react";
import { mdbase } from "./mdbase";
import { useMdbase } from "./use-mdbase";

export function App() {
  const { phase } = useMdbase();

  useEffect(() => {
    void mdbase.start();
  }, []);

  switch (phase.kind) {
    case "ready":
    case "unsynced":
      return <Worklog key={phase.connection.id} db={phase.connection.records} />;
    case "signed_out":
      return <button onClick={() => mdbase.signIn()}>Sign in with mdbase</button>;
    default:
      return <Waiting phase={phase} />;
  }
}
```

Create the entry once, in a module, as the tutorial’s `mdbase.ts` does. Do not create it inside a component.

## A live query hook {#live}

```ts title="use-live-query.ts"
import type { MdbaseClient, Query, RecordView } from "@mdbase-dev/sdk";
import { useEffect, useState } from "react";

export function useLiveQuery(db: MdbaseClient, query: Query) {
  const [state, setState] = useState<{ records: readonly RecordView[]; stale: boolean }>({
    records: [],
    stale: true,
  });
  // A query is plain data, so its JSON is a stable dependency.
  const key = JSON.stringify(query);

  useEffect(() => {
    const live = db.live(JSON.parse(key) as Query);
    const stop = live.subscribe((next) => setState({ records: next.records, stale: next.stale }));
    return () => {
      stop();
      live.close();
    };
  }, [db, key]);

  return state;
}
```

```tsx title="Entries.tsx"
function Entries({ db }: { db: MdbaseClient }) {
  const { records, stale } = useLiveQuery(db, {
    types: ["worklog-entry"],
    order_by: [{ field: "date", direction: "desc" }],
    limit: 100,
  });

  return (
    <ul aria-busy={stale}>
      {records.map((entry) => (
        <li key={entry.id}>{String(entry.frontmatter.get("summary"))}</li>
      ))}
    </ul>
  );
}
```

- The effect’s cleanup both unsubscribes and closes the query. Closing tells the collection to stop sending changes.
- `stale` is true until the first result arrives, and again while a query is reset. The previous records stay in place meanwhile, so the list does not flash empty.
- Give lists a `limit` and leave bodies out. To page, raise the limit; `live.setQuery()` changes a running query without a new subscription.

## Writes

Call the client from event handlers. A write resolves when it is saved on the device, and a live query already shows it, so there is no cache to update and nothing to refetch.

```tsx title="Tasks.tsx"
async function complete(task: RecordView) {
  const write = await db.update(task, { patch: { status: "done" } });
  if (write.state === "rejected") {
    setProblem(describeError(write.receipt.problem)?.message ?? null);
  }
}
```

For a screen where someone types into one record, use a [record session](/sdk/editing/). It keeps the text field and the record in step while other devices edit the same record.

## Sync status {#status}

```tsx title="SyncStatus.tsx"
import { useMdbase } from "./use-mdbase";

export function SyncStatus() {
  const { sync } = useMdbase();
  return sync ? <span>{sync.text}</span> : null;
}
```

`snapshot.sync` is the open collection’s status as a short line of text with counts, and `snapshot.writes` lists writes that are still waiting or were refused. See [Pending writes and sync status](/sdk/offline-sync/).

## Things to get right {#rules}

- **Key your screen on the connection.** `key={connection.id}` resets component state when the user switches collection.
- **Call sign-in from the click.** `onClick={() => mdbase.signIn()}` works. Awaiting something first loses the browser’s permission to open the window.
- **Strict Mode is fine.** `start()` is safe to call twice, and the live query hook above cleans up after the first mount.
- **Server rendering.** The SDK runs in the browser. Creating the entry and reading its snapshot on the server is safe; the phase there is `unavailable`. Call `start()` only in the browser, from an effect: on the server it rejects.
