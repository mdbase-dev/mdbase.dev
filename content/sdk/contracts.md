---
title: Contracts and adapters
description: Build on shared contracts, so your app works with collections that use their own field names.
section: sdk
---

Every `mdbase.contract` has a stable ID, a semantic version, an exact digest and a JSON Schema. Its `contract_type` says what it describes: a **record** view, an **event**, or an **action**. Browse published ones in the [contract catalog](/contracts/).

Only record contracts are implemented by type files. A type opts in with `implements` and maps contract field names to its own frontmatter fields. One type can implement several contracts, and several apps can read the same contract.

## Implement a contract in the type file {#type-file}

```yaml title="_types/project_item.md"
kind: mdbase.type
name: project_item
version: 1
schema:
  dialect: json-schema-2020-12
  value:
    type: object
    required: [heading, stage]
    properties:
      heading: { type: string, minLength: 1 }
      stage: { type: string }
implements:
  - contract: example.work-item
    version: 1.0.0
    fields:
      title: heading
      status: stage
    binding:
      status:
        completed_values: [done, cancelled]
```

The type’s schema governs what is stored. `fields` maps contract fields to the type’s fields; it does not transform values. The optional `binding` records choices the contract allows, such as which status values count as complete, without changing what is stored. Keep unknown fields and extensions when you edit a type.

## Read the collection’s contracts {#contract}

```ts title="contract.ts"
const description = await db.describe();

const workItem = description.contracts.find(
  (c) => c.id === "example.work-item" && c.version === "1.0.0",
);
if (!workItem) {
  throw new Error("This collection has no example.work-item 1.0.0 contract");
}

for (const type of description.types) {
  for (const impl of type.implements) {
    if (impl.contract === workItem.id && impl.version === workItem.version) {
      console.log(type.name, Object.fromEntries(impl.fields)); // contract field → type field
    }
  }
}
```

`describe()` lists each contract with its `id`, `version`, `digest`, `contractType` and the types that implement it. Each type lists its `implements` entries with the field mapping and binding. Don’t look for meaning in `x-*` extensions.

## Query through a contract {#own-adapter}

```ts title="work-items.ts"
import { toPlain, type MdbaseClient } from "@mdbase-dev/sdk";

export async function listWorkItems(db: MdbaseClient) {
  const result = await db.queryContract(
    { id: "example.work-item", version: "1.0.0" },
    { pageSize: 100 },
  );
  // Each record lists one projection per type that implements the contract.
  return result.records.map((record) => ({
    id: record.id,
    fields: toPlain(record.implementations[0].fields),
  }));
}
```

`queryContract()` returns records under the contract’s field names, across every type that implements it. Each projection carries the type name and any validation `issues`. It returns one page at a time, up to 128 records; pass `cursor` for the next. To write under the contract’s field names, pass `contract: { id, version }` to `create()` or `update()`. The replica maps the fields to the type’s own fields, and refuses fields it can’t map.

## Keep domain behaviour with its app {#ownership}

The SDK is application-neutral. An app owns its contract vocabulary, model and adapter code. That keeps app conventions out of the protocol and lets more than one app read the same collection in its own way.

Event sources and action providers declare their implementations through the [interoperability profile](https://github.com/mdbase-dev/mdbase-spec/blob/main/interop/0.1.md), not through a type file.
