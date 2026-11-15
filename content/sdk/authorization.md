---
title: Authorization
description: "Your app gets a grant: access to one collection with the capabilities the user approved. Ask for what you use, and check what you got."
section: sdk
---

## Grants {#flows}

When a user connects your app to a collection, mdbase records a **grant**: your app, one collection, the capabilities the user approved, and your app’s session key. The replica checks the grant on every session.

A grant never exceeds the user’s own role in the collection. A viewer can’t give your app write access. When the grant or the role doesn’t allow a request, it fails with `forbidden`; `details` names the capability.

## Capabilities

Declare capabilities in your manifest. The user can’t turn off a `required` one without declining your app. Each `optional` one gets its own switch.

```json title="Manifest fragment"
"requirements": {
  "access": "full_collection",
  "contracts": [],
  "capabilities": {
    "contract_version": 2,
    "required": ["collection.read", "records.edit"],
    "optional": ["records.create"]
  },
  "files": {
    "required": ["list", "read", "replace", "move"],
    "optional": ["add"],
    "scope": { "kind": "selected_folders", "folders": ["attachments"] }
  }
}
```

| Capability | Allows |
| --- | --- |
| `collection.read` | Describe the collection; read, query and watch records; list and run saved views; read types; validate |
| `records.create` | Create records |
| `records.edit` | Update and rename records |
| `records.delete` | Delete records |
| `views.manage` | Create, update and delete saved views |
| `definitions.manage` | Create and update types; check and apply type packs |
| `background.schedule` | Timers; see [Notifications and timers](/sdk/notifications/) |
| `offline.replica` | Keep a replica of the collection in the app. Only mdbase’s own apps can hold it. |

A manifest without `capabilities` asks for read-only access.

## Files

Files that aren’t records, such as images and PDFs, are requested under `requirements.files`. Each file action pairs with a record capability. A file action works only when your app also holds that capability:

| Capability | File actions |
| --- | --- |
| `collection.read` | `list`, `read` |
| `records.create` | `add` |
| `records.edit` | `replace`, `move` |
| `records.delete` | `delete` |

The scope is the whole collection (`{ "kind": "collection" }`) or named folders. Ask for folders when you can.

## Check what you got {#step-up}

The user may approve less than you asked for. Read the grant from `db.hello` and hide what your app can’t do.

```ts title="grant.ts"
const { capabilities, role, fileFolders } = db.hello.grant;

newEntryButton.hidden = !capabilities.includes("records.create");

try {
  await db.create({ type: "task", frontmatter: { title } });
} catch (e) {
  if (isMdbaseError(e, "forbidden") || isMdbaseError(e, "unauthenticated")) {
    showReconnectPrompt(); // recovery: "reauthorize"
  } else {
    throw e;
  }
}
```

## Private collections {#private}

In a Private collection, mdbase can’t read the content. Your app reaches it through one of the user’s devices. Approving your app in mdbase is the only consent: a signed-in device applies the same grant automatically, with nothing more to approve. While none of their devices is online, your app can’t reach the collection.

## Revocation {#disconnect}

The user can revoke your app’s access at any time. Open sessions close straight away, and requests fail with `unauthenticated`. Treat both `unauthenticated` and `forbidden` as a reason to ask the user to reconnect, never to retry in a loop.
