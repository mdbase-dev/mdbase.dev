---
title: Editing records
description: "Keep one record open while people type: autosave, conflicts, lost responses and deletions handled by one shared session."
section: sdk
---

An app that lets people type into a record should not call `update()` on every keystroke. Open the record as a session instead. The session saves after a pause in typing, never runs two saves for the same record at once, and tells your interface what state the record is in.

## Open a record {#open}

```ts title="editor.ts"
const lease = await db.records.open({ path: "notes/today.md" }, {
  autosave: { idleMs: 1_000 }, // leave out for explicit flush() only
});
const { session } = lease;

const unsubscribe = session.subscribe(() => render(session.getSnapshot()));
editor.onChange((text) => session.setBody(text));
properties.onChange((patch) => session.patchFrontmatter(patch)); // undefined unsets a key
```

`db.records.open()` takes an ID, a `{ path }` or a record you read. It returns a lease: the `session` and a `release()` function for this view. Every view that opens the same record on the same client shares one session, so your app never has two competing writers for it. Views that share a session must use the same autosave setting.

The lease is local to your app. It does not lock the record for anyone else.

## Stay current while it is open {#follow}

An open session follows the collection’s change feed. When the record changes elsewhere, the session reads it again. Without local changes, it shows the newer record. With local changes, it moves to `conflict` and keeps both: your text, and the newer record in `snapshot.remote`.

## States

- `saved`: the text is the record, confirmed by the log.
- `saved_on_device`: the text is kept on this device and syncs when the log can be reached.
- `unsaved`: local changes wait for autosave or `flush()`.
- `saving`: a save is in flight. Typing continues; newer text is saved next.
- `conflict`: the record changed elsewhere while you had unsaved changes, or it is held.
- `recovery`: a save’s outcome is not known yet. The session waits for that save’s own receipt and never sends a replacement.
- `error`: the last save failed. Your text is kept.
- `deleted`: the record no longer exists. Your text is kept.

`snapshot.problem` holds the error behind `error` and `recovery`. `snapshot.dirty` tells you whether there are unsaved changes.

## Conflicts

Each save also checks the revision your text was based on, so a change the session hasn’t seen yet still can’t be overwritten. In `conflict`, let the user choose:

```ts title="conflict.ts"
session.resolve({ keep: "mine" });   // put your changes on top of the newer record
session.resolve({ keep: "theirs" }); // take the newer record
session.resolve({ body: merged });   // save text the user merged
```

A session can’t resolve a [hold](/sdk/offline-sync/#holds). Held records stay protected until the user resolves the hold itself.

## Leave safely {#leave}

```ts title="leave.ts"
const result = await session.flush({ timeoutMs: 8_000 });
if (!result.ok) {
  const snapshot = session.getSnapshot();
  if (snapshot.state === "conflict") {
    showConflict(snapshot.body, snapshot.remote); // your text and the newer record
  } else {
    showProblem(result.problem);
  }
}
unsubscribe();
lease.release();
```

`flush()` resolves once there is nothing left to save and the log has confirmed it, or tells you why it can’t. If the change is kept on this device but not confirmed yet, it resolves with `ok: true` and `saved: "on_device"`. Releasing the last view stops autosave but keeps unsaved text, so opening the record again on the same client picks it up. A client keeps at most 64 sessions with unsaved text; settle some before opening more.

## Survive a reload {#custom}

Unsaved text lives in memory. If a save was sent but its outcome is not yet known when the page reloads, keep the session’s recovery reference and pass it back to `open()`. The session then finishes that same save instead of writing again.

```ts title="recover.ts"
// Keep this with your own saved state, for example in IndexedDB.
const recovery = session.getSnapshot().recovery;
if (recovery) {
  saveRecovery({
    mutationId: recovery.mutationId,
    recordId: recovery.recordId,
    baseRevision: recovery.baseRevision,
  });
}

// After a reload:
const lease = await db.records.open(recordId, { recovery: loadRecovery() });
```
