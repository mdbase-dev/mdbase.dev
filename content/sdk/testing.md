---
title: Testing
description: Test your app against MemoryReplica, an in-memory replica that speaks the real protocol. Keep merge and permission behaviour for tests against a real collection.
section: sdk
---

`MemoryReplica` from `@mdbase-dev/sdk/testing` is an in-memory replica. It speaks the same protocol as a real one: frames, pushes and receipts. Your code connects to it with `connect()` and gets an ordinary `MdbaseClient`.

## Unit tests {#sandbox}

```ts title="tasks.test.ts"
import { describe, expect, it } from "vitest";
import { connect, isMdbaseError } from "@mdbase-dev/sdk";
import { MemoryReplica } from "@mdbase-dev/sdk/testing";
import { completeTask } from "../src/tasks";

async function setup() {
  const replica = new MemoryReplica({ confirmDelayMs: null });
  const { id } = replica.seed({
    path: "tasks/plan.md",
    types: ["task"],
    frontmatter: { title: "Plan", status: "open" },
  });
  const db = await connect({
    connector: replica.connector(),
    app: { name: "dev.example.test", version: "0.0.0" },
  });
  return { replica, db, id };
}

describe("completeTask", () => {
  it("shows the change before it is confirmed", async () => {
    const { replica, db, id } = await setup();
    const write = await completeTask(db, id);
    expect(write.state).toBe("pending");
    expect((await db.get(id)).frontmatter.get("status")).toBe("done");

    replica.confirmAll();
    await expect(write.confirmed).resolves.toMatchObject({ state: "confirmed" });
    db.close();
  });

  it("reports a rejected write", async () => {
    const { replica, db, id } = await setup();
    const write = await completeTask(db, id);
    replica.reject(write.mutationId);
    await expect(write.confirmed).rejects.toSatisfy((e) => isMdbaseError(e));
    db.close();
  });
});
```

## What it covers {#coverage}

- Reads, queries with cursors, live queries and the change feed.
- Creates, updates, renames and deletes, with receipts and `ifRevision`.
- Sync status and pending writes. Holds and conflicts are empty until you add one with `hold(ref)` or `conflict(ref, { field, kept, lost })`.
- Files: upload, download and listing.
- Record sessions from `db.records.open()`.

`where` needs an evaluator you supply. `order_by` sorts on `file.path` and top-level frontmatter fields.

```ts title="where.ts"
const replica = new MemoryReplica({
  // MemoryReplica does not parse expressions. Supply your own evaluator.
  where: (expr, record) =>
    expr === 'status == "open"' && record.frontmatter.get("status") === "open",
});
```

## Controls {#editing}

| Call | Use it to |
| --- | --- |
| `new MemoryReplica({ confirmDelayMs })` | Confirm writes after a delay (0 ms by default), or pass `null` to confirm only when you say so |
| `seed({ path, types, frontmatter, body })` | Add a confirmed record before the test |
| `confirmAll()` | Confirm every pending write |
| `reject(mutationId, problem?)` | Reject one write (by default with `conflict`, reason `revision`) |
| `setOnline(false)` | Act as if the log can’t be reached: status reports offline and writes stay pending |
| `dropConnections()` | Cut the link, to test reconnects |
| `refuse`, `role`, `capabilities` options | Refuse the connection with a problem, or set what `hello` reports |

`createApplicationFixture()` stands in for `MdbaseConnect`, so you can test your app’s sign-in and readiness screens with snapshots you control.

## What it doesn’t cover {#real}

`MemoryReplica` is not the replica. It applies patches blindly, has no query planner and does not merge. Test these against a real collection:

- field and body merges;
- query expressions, type validation and defaults;
- grants and permission errors;
- when real holds and conflicts happen;
- routing to a Private collection.
