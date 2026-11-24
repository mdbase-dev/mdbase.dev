---
title: Records and operations
description: Read, query, watch, create, update, rename and delete records. Writes are optimistic and merge field by field.
section: sdk
---

All examples use `db`, an `MdbaseClient` from `connect()` or from an app connection’s `records`.

## Records and errors {#outcomes}

A record is a `RecordView`: `id`, `path`, `revision`, `types`, `frontmatter` (a `Map`), and `state`. Ask for more with the `include` argument: `body`, `effective` (values with type defaults applied), `document`, `links` and `diagnostics`.

Failures throw `MdbaseError`. Check them with `isMdbaseError(e, code)`. Each error has a `code`, a `recovery` that says what to do, and often a `reason`. The full list is in the [API reference](/sdk/api/#errors).

## Read and query {#read-query}

```ts title="read.ts"
import { isMdbaseError, toPlain } from "@mdbase-dev/sdk";

// By ID, or by path. get() throws not_found; find() returns null.
const task = await db.get({ path: "tasks/plan.md" }, { body: true });
const maybe = await db.find(taskId);

console.log(task.revision);                   // "sha256:…"
console.log(toPlain(task.frontmatter));       // plain object
console.log(task.state.state);                // "confirmed" or "pending"

// One page of a query. Pass page.cursor to get the next.
const page = await db.query({
  types: ["task"],
  where: 'status != "done"',
  order_by: [{ field: "due", direction: "asc" }],
  limit: 50,
});

// Or every page in turn.
for await (const p of db.pages({ types: ["task"], limit: 200 })) {
  render(p.records);
}
```

Queries use the [mdbase query format](/spec/): `types`, `where`, `order_by`, `select`, `limit` and more. Reads answer from the replica’s local view, including your pending writes.

A cursor can expire. `pages()` then throws `invalid_request` with reason `cursor_expired` or `cursor_stale`. Pass `{ onReset }` as its fourth argument to restart from the first page instead; clear what you collected when it is called.

## Live queries {#live}

A live query keeps its result current. The replica sends a snapshot, then a diff for each change.

```ts title="task-list.ts"
const open = db.live(
  { types: ["task"], where: 'status == "open"', limit: 100 },
  { effective: true },
);

const stop = open.subscribe((state) => {
  // Called now, then after every snapshot, diff or reset.
  renderList(state.records, { stale: state.stale });
});

// Widen the window later without a new subscription.
await open.setQuery({ types: ["task"], where: 'status == "open"', limit: 200 });

// When the screen closes:
stop();
open.close();
```

Keep live lists cheap: use a `limit` window and leave bodies out. `state.stale` is true until the first snapshot and after a reset; the previous records stay visible meanwhile.

## Write

```ts title="write.ts"
const created = await db.create({
  type: "task",
  path: "tasks/review.md",
  frontmatter: { title: "Review the draft", status: "open" },
  body: "Check the numbers.\n",
});
const id = created.records[0].id; // usable straight away

// Pass the record you read. Only the fields you change are sent, each with
// the value you saw, so concurrent edits to other fields merge.
const task = await db.get(id, { body: true });
await db.update(task, {
  patch: { status: "in-progress" },
  add: { tags: ["review"] },
  body: task.body + "Add a summary.\n",
});

await db.rename(task, "tasks/review-q3.md"); // updates links by default
await db.delete(id);
```

Every write returns a `Write` at once, in the `pending` state. Your reads and live queries show it straight away. Await `write.confirmed` if you need to know the log accepted it; see [Pending writes and sync status](/sdk/offline-sync/).

When you pass a `RecordView` to `update()`, the SDK sends the values you saw with the fields you change. A new body is sent as edits against the body you read and merged with other changes. Patch keys whose value didn’t change are dropped, so they can’t cause conflicts.

`replaceDocument(record, source)` replaces the whole Markdown source when you need to. For a screen where people type into a record, use a [record session](/sdk/editing/) instead.

## Preconditions

- `ifRevision: record.revision` applies the write only if the record is still at that revision. Otherwise it is rejected with `conflict` and reason `revision`.
- `conflictMode: "reject"` in the write options rejects the whole write if any part of it conflicts. The default, `"record"`, applies what merges and records the rest as conflicts.

## Watch changes {#watch}

The change feed lists what changed since a cursor. Use it to keep an index or an export up to date.

```ts title="changes.ts"
let cursor = loadCursor();

const watch = db.watchChanges(cursor, (batch) => {
  if (batch.reset) {
    rebuildFromScratch(); // the cursor expired: start again
  } else {
    applyChanges(batch.changes);
  }
  saveCursor(batch.cursor);
});
await watch.ready;

// Later:
watch();
```

An expired cursor gives `reset: true`, not an error. `db.changes(cursor, limit)` reads one batch without watching.

## Check before writing {#preflight}

```ts title="preflight.ts"
const preview = await db.update(task, { patch: { status: "done" } }, { dryRun: true });
console.log(preview.receipt.preflight);

const issues = await db.validate([{ path: "tasks/review.md" }]);
```

`dryRun: true` runs every check without writing. `preflightRename()` and `preflightDelete()` show what a rename or delete would touch, such as links in other records. `validate()` checks records against their types.

## Attachments {#files}

Files that aren’t records, such as images and PDFs, use `db.files`.

```ts title="files.ts"
const upload = await db.files.upload("attachments/plan.pdf", file, {
  onProgress: (p) => showProgress(p),
});
await upload.confirmed; // the bytes are stored

const bytes = await db.files.download({ path: "attachments/plan.pdf" });

for await (const f of db.files.list()) {
  console.log(f.path, f.size, f.state); // state: "materialized", "remote", …
}
```

- Uploads go in 1 MiB chunks. To resume an interrupted upload, call `upload()` again with the same `transferId`. Pass `fileId` to replace an existing file.
- `download()` reads up to 64 MiB into memory. For anything larger, use `downloadStream()`, which also takes a byte `range`.
- `move()` and `delete()` take `ifRevision`, like records.

[Query YAML frontmatter from the command line](/guides/query-frontmatter/) shows the same status filter against two files on disk.
