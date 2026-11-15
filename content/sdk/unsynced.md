---
title: Work before connecting
description: Let people use your app before they sign in. Their work is kept in the browser and brought into a collection when they connect one.
section: sdk
---

## What it is {#what}

With the `unsynced` option, a signed-out visitor gets a working app straight away. The SDK opens an **unsynced collection**: a real collection, with your types installed, stored in this browser and nowhere else. Your code reads and writes it through the same `MdbaseClient` as a synced one.

When the person later signs in and opens a collection, the work they did can be brought into it.

The [shared UI](/sdk/ui/) handles all of this when you pass `unsynced` to `CollectionGate` and `CollectionSwitcher`. The rest of this page is for apps that draw it themselves.

## Turn it on {#enable}

```ts title="mdbase.ts"
import { createMdbase } from "@mdbase-dev/sdk";
import manifest from "./mdbase-app.json";

export const mdbase = createMdbase(
  { id: manifest.id, name: manifest.name, origin: location.origin, environment: "production", manifest },
  { unsynced: true },
);
```

With the option set, `start()` opens the unsynced collection whenever the person is signed out and the URL names no collection. The phase is `unsynced`. The types in your manifest’s [provisions](/sdk/manifest/#provisioning) are installed in it automatically.

## Show it {#render}

```ts title="main.ts"
function render(snapshot) {
  const { phase } = snapshot;
  if (phase.kind === "ready" || phase.kind === "unsynced") {
    showApp(phase.connection.records);
    savedOnlyHere.hidden = phase.kind !== "unsynced" || !snapshot.unsyncedWork;
  }
}

// "Connect to sync your work"
connectButton.onclick = () => mdbase.signIn();

// On a sign-in screen: "Continue without connecting"
continueButton.onclick = () => mdbase.unsynced.open();
```

- Treat `unsynced` like `ready`: `phase.connection` is the same kind of connection.
- Tell the person where their work is. Once something has been saved, `snapshot.unsyncedWork` is set; show a line such as “Saved only in this browser” with a way to connect.
- The unsynced collection is never listed in `snapshot.collections`.
- A signed-in person with no collection open is in the `choosing` phase as usual. `mdbase.unsynced.open()` opens the unsynced collection from there, or from a sign-in screen that offers “Continue without connecting”.

## Bring the work in {#transfer}

After the person connects, `snapshot.unsyncedWork` stays set while the collection they opened does not have the work yet. Plan the transfer, show what it would do when there is something to decide, then run it.

```ts title="bring-in.ts"
// A collection is open (phase "ready") and snapshot.unsyncedWork is set.
const plan = await mdbase.unsynced.planTransfer();

// plan.counts: { create, present, skipped, renamed, changed }
// plan.missingTypes: types the records use that this collection lacks
if (plan.missingTypes.length > 0 && (await userAgreesToAddTypes(plan.missingTypes))) {
  return bringIn(await mdbase.unsynced.planTransfer({ addTypes: true }));
}
await bringIn(plan);

async function bringIn(plan) {
  const result = await mdbase.unsynced.transfer(plan, {
    onProgress: ({ done, total }) => showProgress(done, total),
  });
  if (result.failed.length > 0) {
    // Plan and transfer again to retry. Nothing already done repeats.
  }
}
```

| Item outcome | Meaning |
| --- | --- |
| `create` | The record will be created, with the same ID. |
| `present` | An earlier transfer already brought it in. |
| `skipped` | Your `map` left it out. |
| `changed` | It was brought in earlier and has changed here since. The newer version is created beside the first as a copy. |

- Planning writes nothing. A plan is safe to throw away.
- A transfer can be interrupted by a reload or a lost connection. Plan and transfer again: only what is missing is created.
- When a path is already taken in the destination, the record goes to a free path beside it; the item’s `renamedFrom` has the path you asked for.
- The destination’s own types and settings are never replaced. With `addTypes`, types it lacks are added from the unsynced collection.
- When everything is in the destination, `result.retired` is true and the unsynced collection starts again empty.

## Reshape records {#map}

By default each record keeps its path and its whole Markdown source. Pass `map` to change where records go, or to leave some out:

```ts title="bring-in.ts"
const plan = await mdbase.unsynced.planTransfer({
  map: (record) => {
    if (!record.types.includes("worklog-entry")) return null; // leave it out
    // Each record arrives with its body and complete source.
    return { path: `journal/${record.path}`, document: record.document };
  },
});
```

The function returns a `CreateInput`, or `null` to leave the record out. A record always keeps its ID; returning a different `id` is refused.

## Discard

```ts title="discard.ts"
if (await confirm("Delete the work saved in this browser? This cannot be undone.")) {
  await mdbase.unsynced.discard();
}
```

Discarding erases the unsynced collection from this browser. Ask first.

## Limits

- The work is in browser storage. Clearing site data, or a browser that evicts storage under pressure, removes it. Say so in your interface, and offer connecting early.
- It is per browser and per origin. It is not on the person’s other devices, and a development build on another port has its own.
- There is one unsynced collection per app in a browser.
