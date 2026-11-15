---
title: Build an app
description: "Build Worklog, a small React app that keeps its entries in the user’s mdbase collection, from an empty folder to a deployed site."
section: sdk
---

## What you build {#result}

Worklog is a one-screen app: a form that adds an entry, and a list of entries that stays current. Each entry is a Markdown file in the user’s collection, so the user can also open it in the [mdbase apps](/apps/), in Obsidian, or in any text editor.

The finished app is about 150 lines. mdbase supplies sign-in, the collection picker, storage, sync and conflict handling. The complete project is in [`examples/worklog`](https://github.com/mdbase-dev/mdbase.dev/tree/main/examples/worklog); every listing on this page is a file from it.

> **What you need**
>
> Node 20 or later. You need no account to start: the app first runs in a collection kept in your browser. Signing in to an mdbase account comes at step 7. Developing on `http://localhost` needs an `@mdbase-dev/sdk` release after `0.1.0-beta.168`.

## 1. Create the project {#project}

```sh title="Terminal"
npm create vite@latest worklog -- --template react-ts
cd worklog

npm install --save-exact @mdbase-dev/sdk @mdbase-dev/ui @mdbase-dev/i18n \
  @lingui/core@6.9.0 @lingui/react@6.9.0
npm install --save-dev --save-exact @mdbase-dev/connect-dev
```

`@mdbase-dev/sdk` is the client. `@mdbase-dev/ui` has the sign-in and collection screens; `@mdbase-dev/i18n` and the two Lingui packages are its peer dependencies. `@mdbase-dev/connect-dev` checks the manifest at build time. The packages are in beta, so the versions are pinned exactly.

Delete the template’s `src/App.tsx`, `src/App.css` and `src/index.css`; the steps below replace them. Then fix the development port, because the manifest names the exact origin the app is served from:

```ts title="vite.config.ts" file="examples/worklog/vite.config.ts"
```

## 2. Describe your records {#type}

Every record in a collection has a type, and a type is itself a Markdown file in the collection’s `_types/` folder. Worklog needs one. Write the copy your app will offer to a collection that lacks it:

```md title="mdbase/types/worklog-entry.md" file="examples/worklog/mdbase/types/worklog-entry.md"
```

The schema is JSON Schema. mdbase checks every write against it, so an entry with no `summary` is refused before it is saved. `additionalProperties: true` lets the user and other apps keep fields of their own on the same records.

## 3. Write the manifest {#manifest}

The manifest tells mdbase who your app is and what it needs. It names the origin the app is served from, so development and the deployed site each need their own. A short script writes either one:

```js title="scripts/write-manifest.mjs" file="examples/worklog/scripts/write-manifest.mjs"
```

- **`id`** is a lowercase reverse-domain name with at least three parts. Use a domain you control.
- **`homepage` and `redirect_uris`** are on the app’s origin. A browser app can list its homepage as the one redirect URI.
- **`capabilities` and `files`** are what the user is asked to approve. Ask for what you use; [Authorization](/sdk/authorization/) lists them. `definitions.manage` is there so the app can add its type to a collection the user already has.
- **`provisions.type_packs`** carries the type document from step 2. See [Provisioning](/sdk/manifest/#provisioning).

Run the script before the development server and before a build:

```json title="package.json" file="examples/worklog/package.json" pick="scripts"
```

Add `src/mdbase-app.json` to `.gitignore`: it is generated.

## 4. Declare the app {#entry}

```ts title="src/mdbase.ts" file="examples/worklog/src/mdbase.ts"
```

Create one entry for the whole app. Creating it does no work; the SDK starts on the first call. It registers the manifest with mdbase when the app starts, so there is no application ID to request first.

- `origin` must be the exact origin the page is served from. Reading it from the manifest keeps the two in step.
- `environment` is `"production"` on localhost too. Your development build talks to the same mdbase service your users do.
- `unsynced: true` lets people use the app before they sign in. Their work is kept in the browser until they connect a collection. See [Work before connecting](/sdk/unsynced/).

## 5. Sign-in and collections {#gate}

Between opening the app and seeing their entries, a user may need to sign in, pick or create a collection, approve your app’s access, and let it add its type. `CollectionGate` from `@mdbase-dev/ui` shows each of those screens and renders your app once a collection is open.

```tsx title="src/App.tsx" file="examples/worklog/src/App.tsx"
```

The gate hands your app a `connection`. Its `records` property is an `MdbaseClient` for the open collection. `CollectionSwitcher` is the control for changing collection, adding one and signing out. Keying the screen on `connection.id` resets it when the user switches.

The entry point loads the gate’s stylesheet:

```tsx title="src/main.tsx" file="examples/worklog/src/main.tsx"
```

[UI components](/sdk/ui/) covers restyling and the other components. To draw these screens yourself, see [Sign-in and collections](/sdk/lifecycle/).

## 6. Read and write records {#records}

```tsx title="src/Worklog.tsx" file="examples/worklog/src/Worklog.tsx"
```

- **The list is a live query.** `db.live()` sends the current entries and then every change, including ones made in another app or on another device. Nothing in this file refetches.
- **Writes return at once.** `db.create()` resolves when the entry is saved on this device, and the live query already shows it. Sync continues in the background, online or offline.
- **A record needs a path.** Records are files. Pass `path`, or give the type a path pattern.
- **A refused write does not throw.** When the collection refuses a write, such as an entry the type does not allow, the returned `Write` has `state: "rejected"` and `receipt.problem` says why. `describeError()` turns that, or a thrown error, into a sentence you can show.

[Records and operations](/sdk/operations/) has the rest: queries, updates, renames, attachments.

## 7. Run it on localhost {#run}

```sh title="Terminal"
npm run dev
```

Open `http://localhost:5173`. The app opens straight away in its unsynced collection. Add an entry: a line appears saying the work is saved only in this browser. Reload, and the entry is still there.

Choose **Connect to sync your work** to sign in. mdbase opens in a window and asks you to approve the app. Because the app is on `localhost`, that screen calls it “an app running on this computer” and says its identity is unverified. Then:

- A collection you create during sign-in gets the `worklog-entry` type automatically.
- A collection you already had shows a short review first: “Set up (collection) for Worklog”, listing the type file to be added. Nothing changes until you accept it.
- The entries you made before signing in are offered to the collection you opened. Bringing them in keeps their IDs, and running it twice creates nothing twice.

Open the same collection in the [Editor](https://editor.mdbase.dev/): your entries are files under `worklog/`. Change one there and the list in your app updates.

[Develop on localhost](/sdk/local-development/) explains what is different about a development build.

## 8. Deploy {#deploy}

```sh title="Terminal"
WORKLOG_ORIGIN=https://worklog.example.com npm run build
# Upload dist/ to the static host that serves https://worklog.example.com
```

The build is a folder of static files. Host it anywhere that serves HTTPS at the origin you built for. There is no server component, no API key and no secret: the app holds nothing until a user signs in and approves it.

- The manifest’s `homepage` origin and the site’s origin must match exactly, including `www` and any port.
- The deployed app is a separate application from your localhost build. Users approve it on its own, and its storage is its own.
- Before you ship, change `id` from `dev.example.worklog` to a name under your own domain.

## Other frameworks

Only `App.tsx` and the hooks in `Worklog.tsx` are React. The entry is a plain object with a snapshot you subscribe to, and a `phase` that says where the user is:

```ts title="main.ts"
import { mdbase } from "./mdbase";

mdbase.subscribe(() => render(mdbase.getSnapshot()));
await mdbase.start();

// Call signIn() straight from the click, so the browser allows its window.
signInButton.onclick = () => mdbase.signIn();

function render(snapshot) {
  const { phase } = snapshot;
  if (phase.kind === "ready" || phase.kind === "unsynced") {
    showWorklog(phase.connection.records);
  } else if (phase.kind === "choosing") {
    showPicker(snapshot.collections, (id) => mdbase.select(id));
  } else {
    showScreen(phase.kind); // "signed_out", "authorizing", "needs_setup", …
  }
}
```

You can draw each phase yourself, or mount the shared screens into an element with `mountCollectionUi()`; see [UI components](/sdk/ui/#mount).

## Next steps {#next}

- [Records and operations](/sdk/operations/): queries, updates, renames and attachments.
- [Editing records](/sdk/editing/): a screen where people type into one record.
- [Pending writes and sync status](/sdk/offline-sync/): show what is saved and what is waiting.
- [Contracts and adapters](/sdk/contracts/): work with records other apps also use.
- [Testing](/sdk/testing/): run the same code against an in-memory collection.
