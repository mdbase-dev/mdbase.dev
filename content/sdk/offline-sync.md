---
title: Pending writes and sync status
description: Writes return at once and confirm later. Show the user where their changes are, and handle the cases where mdbase keeps an edit back instead of overwriting it.
section: sdk
---

## What your app sees {#model}

Each replica applies changes in the order the collection’s log confirms them. Reads return the replica’s **local view**: everything confirmed so far, plus writes that are still pending. Each record says which it is: `record.state.state` is `"confirmed"` or `"pending"`.

## Write receipts {#receipts}

Every write returns a `Write` with a receipt. Its `state` moves from `pending` to one of:

| State | Meaning |
| --- | --- |
| `confirmed` | The log accepted it. `receipt.seq` is its position. |
| `rejected` | It was not applied, and the local view drops it. `receipt.problem` says why. |
| `unknown` | Rare. The replica can’t tell whether it was applied. Read the record again and let the user decide. |

```ts title="save.ts"
import { isMdbaseError } from "@mdbase-dev/sdk";

const write = await db.update(task, { patch: { status: "done" } });
// write.state === "pending": reads and live queries already show the change.

try {
  const receipt = await write.confirmed;
  console.log(`Confirmed at log position ${receipt.seq}`);
} catch (e) {
  if (isMdbaseError(e, "outcome_unknown")) {
    // Rare: the replica can't tell whether this write was applied.
    const current = await db.find(task.id);
    askUserToCheck(current);
  } else if (isMdbaseError(e)) {
    // Rejected: the local view has already dropped the change.
    showProblem(e.code, e.reason);
  } else {
    throw e;
  }
}
```

- Each write has a mutation ID. Submitting the same ID again returns the existing receipt and does nothing else, so retries are safe. Pass your own `mutationId` if you need to keep it across a reload.
- `write.onReceipt(fn)` calls you on every receipt change. `db.pendingWrites()` lists the writes still waiting.
- Pass `wait: "confirmed"` if the call itself should wait for the log. That suits scripts, not interactive screens.

## Offline

There are two kinds of offline, and they behave differently.

- **The replica can’t reach the log.** Writes still succeed as `pending` and confirm when it reconnects. Status shows the backlog. This is not an error.
- **Your app can’t reach the replica.** An app connected through the relay keeps no copy of its own. While the link is down, reads and writes wait for it to come back. Pass a `signal` to give up after a while. A write that never left your app was not saved.

For a Private collection, your app can only reach a replica while one of the user’s devices is online. See [When no device is online](/sdk/routing/#waiting).

## Sync status {#status}

Status is a count, not a guess: “confirmed through position N, plus k changes waiting”. `db.getStatus()` reads it once; `db.onStatus()` pushes changes, at most four times a second. `summarizeStatus()` turns it into a short line of text.

```ts title="status.ts"
import { summarizeStatus } from "@mdbase-dev/sdk";

const stop = db.onStatus((status) => {
  const summary = summarizeStatus(status);
  // summary.kind: "local" | "synced" | "catching_up" | "offline" | "installing"
  statusLine.textContent = summary.text; // e.g. "Offline; synced through 3, 1 change waiting"
  holdsBadge.hidden = summary.holds === 0;
  conflictsBadge.hidden = summary.conflicts === 0;
});
```

Holds and conflicts are counted separately, so an edit that needs the user never looks like sync is stuck.

## Holds

A replica that writes to real files, such as the desktop app, can **hold** an edit instead of overwriting it. The file stays as the user left it, and the change is not synced until they choose what to keep. Reasons are `conflict`, `unknown_provenance`, `deleted_elsewhere`, `read_only`, `editor_busy` and `suspect_write`.

```ts title="holds.ts"
import { describeHold } from "@mdbase-dev/sdk";

db.onHolds((holds) => {
  for (const hold of holds) {
    const view = describeHold(hold, { collectionId });
    // view.title is "mdbase protected your edit"; view.cause and view.detail explain why.
    renderHold(view.path, view.cause, view.actions.map((a) => a.label));
  }
});

// When the user picks an action for one hold:
await db.resolveHold(holdId, "keep_mine");
```

`describeHold()` gives you the cause in plain words and the actions that apply: `keep_mine`, `take_theirs`, `use` (with merged text), `delete` and `keep_both`. Resolving is an ordinary write, so the earlier version stays in the collection’s history.

## Conflicts

When two devices change the same field at the same time, the replica keeps one value and records the other as a conflict. Conflicts sync to every device. Nothing is lost: show them, and let the user choose.

```ts title="conflicts.ts"
import { toPlain } from "@mdbase-dev/sdk";

for (const entry of await db.listConflicts(recordId)) {
  const { kind, field, kept, lost } = entry.conflict;
  // kept and lost are tagged by form; a frontmatter value is { form: "value", value }.
  if (kind === "field" && field && lost.form === "value" && await userPrefers(field, kept, lost)) {
    await db.resolveConflict(entry, field, toPlain(lost.value));
  } else {
    await db.dismissConflict(entry); // keep what the record has now
  }
}
```

To refuse a write instead of merging it, pass `conflictMode: "reject"`, or `ifRevision` to require the exact revision you read.

## Resets

A live query can be reset, for example while a replica reinstalls a snapshot. `live.stale` is true until the next snapshot arrives, and the previous records stay visible meanwhile. The change feed answers an expired cursor with `reset: true` instead of an error: drop what you built from it and read again.
