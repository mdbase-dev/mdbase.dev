---
title: Sign-in and collections
description: The phases an app moves through between opening and showing a collection, and the call that moves it from each one.
section: sdk
---

`createMdbase()` returns one object for your whole app. It holds a snapshot of where the user is, and the actions that move them on. [`CollectionGate`](/sdk/ui/) draws every screen on this page for you; read on if you draw them yourself, or want to know what the gate is doing.

## The snapshot {#snapshot}

`mdbase.getSnapshot()` returns the current state, and `mdbase.subscribe(listener)` calls you when it changes. The snapshot object is replaced on every change, so it works with [`useSyncExternalStore`](/sdk/react/) and with plain equality checks.

| Field | Meaning |
| --- | --- |
| `phase` | Where the user is. Render from this. |
| `collections` | The collections this app may open, for a picker. |
| `selectedCollectionId` | The open collection, or null. |
| `sync` | Sync state of the open collection, as `summarizeStatus()` returns it. |
| `writes` | Unconfirmed and refused writes of the open collection. See [Pending writes and sync status](/sdk/offline-sync/). |
| `links` | `account` and `manageAccess`: mdbase pages to link to for the account and for who can reach the collection. |
| `unsyncedWork` | Set when work saved before connecting has not been brought in. See [Work before connecting](/sdk/unsynced/). |

## Phases

`snapshot.phase.kind` is always exactly one of these. Switch on it; do not build a ready check from other fields.

```ts title="main.ts"
import { describeError } from "@mdbase-dev/sdk/describe";
import { mdbase } from "./mdbase";

mdbase.subscribe(() => render(mdbase.getSnapshot()));
await mdbase.start();

function render(snapshot) {
  const { phase } = snapshot;
  switch (phase.kind) {
    case "starting":
      return showSplash();
    case "signed_out":
      return showSignIn(phase.notice?.message);
    case "authorizing":
      return showWaiting("Continue in the mdbase window");
    case "choosing":
      return showPicker(snapshot.collections);
    case "opening":
      return showOpening(phase.displayName, { slow: phase.slow });
    case "needs_approval":
      return showApprove(phase.displayName);
    case "needs_setup":
      return showSetup(phase.collection);
    case "ready":
    case "unsynced":
      return showApp(phase.connection);
    case "problem":
    case "unavailable":
      return showProblem(phase.problem);
    case "closed":
      return;
  }
}
```

| Phase | The user is | What moves them on |
| --- | --- | --- |
| `starting` | Waiting for the SDK to restore a signed-in device | Nothing; it settles by itself |
| `signed_out` | Not signed in. `notice` says why when sign-in just ended. | `signIn()` |
| `authorizing` | In the mdbase window. `purpose` is `sign_in`, `add` or `approve`. | The user finishes or closes the window |
| `choosing` | Signed in with nothing open | `select(id)`, `addCollection()` |
| `opening` | Waiting for a collection to open. `slow` turns true after 15 seconds. | Nothing; `chooseAnother()` to leave |
| `needs_approval` | Looking at a collection this app is not approved for, usually from a shared link | `approve()` |
| `needs_setup` | In a collection that lacks something the manifest provides, such as your types | `setup.plan()` then `setup.apply(plan)` |
| `ready` | In an open collection. Use `phase.connection`. |  |
| `unsynced` | Working before connecting. Use `phase.connection` as when ready. | `signIn()` to connect |
| `problem` | Stopped. `phase.problem` has the wording and one action. | The action in `problem.action` |
| `unavailable` | Somewhere the SDK cannot run: server rendering, or an unsupported browser |  |
| `closed` | After `close()` |  |

Once a collection is `ready` it stays ready through re-checks and passing problems; `phase.rechecking` and `phase.problem` report them for a status line. Your app screen is not torn down while the network drops and returns.

`phase.connection` has `records` (the [`MdbaseClient`](/sdk/operations/)), `files`, `people` and, when the manifest asks for them, `timers`.

## Calls that open a window {#gestures}

Sign-in and approval happen on mdbase’s own pages, in a window the SDK opens. Browsers only allow that during a click or key press.

```ts title="main.ts"
// Each of these opens the mdbase window, so call it directly in the
// click handler. After an await, the browser blocks the window.
signInButton.onclick = () => mdbase.signIn();
addButton.onclick = () => mdbase.addCollection();
approveButton.onclick = () => mdbase.approve();
reconnectButton.onclick = () => mdbase.reauthorize();
```

| Call | What the user does in the window |
| --- | --- |
| `signIn()` | Signs in, then picks or creates a collection and approves your app for it |
| `addCollection()` | Picks another collection or creates one. Nothing is preselected. |
| `approve(id?)` | Approves one named collection; by default, the one the URL asks for |
| `reauthorize()` | Approves the open collection again, after access was lost or the app’s manifest asks for more |
| `requestAccess()` | Allows an optional file action. See [below](#access). |

Each call resolves with the new snapshot when the window closes. In the `choosing` phase, `phase.lastApproval.outcome` says how the last one ended: `added`, `unchanged`, `declined` or `closed`.

## Collections

```ts title="picker.ts"
const { collections, selectedCollectionId } = mdbase.getSnapshot();

for (const item of collections) {
  // item.collectionId, item.displayName, item.role: "owner" | "editor" | "viewer"
  addRow(item.displayName, () => mdbase.select(item.collectionId));
}

// Back to the list; the browser's Back button returns to the collection.
switchButton.onclick = () => mdbase.chooseAnother();

// Hide one on this device. It stays approved and nothing is deleted.
await mdbase.forget(collectionId);
```

- The list is re-read when the page regains focus. Call `refreshCollectionList()` to re-read it at another moment, such as when a menu opens.
- `deleteCollection(id, { confirmName })` deletes a collection for everyone, on every device. Only its owner can, and `confirmName` must be the collection’s name as the user typed it.
- A collection kept on the user’s own computers has `kind: "private"`. It opens the same way; see [Private collections](/sdk/authorization/#private).

## The URL {#url}

The SDK keeps the open collection in the page URL as `?collection=<id>` and follows Back and Forward. A link with that parameter opens that collection for anyone the app is approved for, and takes others to `needs_approval`. The rest of the URL, path and hash included, is yours.

## Setup

A collection is in `needs_setup` when it lacks something your manifest’s [provisions](/sdk/manifest/#provisioning) supply. Setup shows the user what would be added and applies it only when they accept.

```ts title="setup.ts"
const plan = await mdbase.setup.plan();

if (plan.status === "current") {
  // Nothing to do.
} else if (plan.canApply) {
  showReview(plan.summary, plan.changes.map((change) => change.message));
  // When the user accepts:
  const result = await mdbase.setup.apply(plan);
  if (result.outcome === "changed") {
    // The collection changed while the user was reading. Plan again.
  }
} else {
  showBlocked(plan.refusal?.message, plan.conflicts.map((c) => c.message));
}
```

- `plan.summary` and each `change.message` are written to be shown as they are. `plan.staged` has the documents themselves, for a details view.
- Setup needs the `definitions.manage` capability. An app that lacks it gets a plan with `refusal.code` `"setup_forbidden"`.
- When a file already in the collection differs from yours, the plan has `status: "conflict"`. Conflicts listed in `plan.adoptable` can be resolved by taking your version: pass them back as `setup.plan({ adopt })`.
- `setup.plan({ records })` adds starter records, such as a welcome note, written with the setup when their path is free.
- `configure()` plans and applies in one call, for an app with nothing to review.

A collection the user creates while signing in to your app is set up during sign-in, so new users do not see this screen.

## Asking for more access {#access}

File actions listed as `optional` in the manifest are asked for at the moment the user first needs them.

```ts title="attach.ts"
// The manifest lists "add" under files.optional.
attachButton.onclick = async () => {
  const result = await mdbase.requestAccess(
    { files: ["add"] },
    { reason: "Attach images to your entries" },
  );
  if (result.status === "granted") await attachImage();
};
```

The result is `granted`, `declined` or `cancelled`. An action that is already allowed resolves `granted` at once and opens nothing. The reason is one line of at most 140 characters, shown to the user. The collection stays open throughout.

## Lost access {#lost}

A user can remove your app’s access on their account page at any time. The collection then stops with a problem whose action is `approve`; offer a button that calls `reauthorize()`. Link to `snapshot.links.manageAccess` wherever your app says who can reach the collection; that page is where access is managed.

## Signing out {#sign-out}

```ts title="account.ts"
import { isMdbaseError } from "@mdbase-dev/sdk";

try {
  await mdbase.signOut();
} catch (error) {
  if (isMdbaseError(error) && error.reason === "sign_out_pending_writes") {
    // Changes on this device have not reached mdbase yet.
    if (await confirmDiscard()) await mdbase.signOut({ discard: true });
  } else {
    throw error;
  }
}
```

Signing out ends the session and removes this browser’s copy of the account’s collections and keys. It is refused while changes are still waiting to sync, so that work is not thrown away by accident.

## Problems

```ts title="problem.ts"
import { describeError } from "@mdbase-dev/sdk/describe";

function showProblem(problem) {
  // problem.title, problem.message, and one action to offer.
  title.textContent = problem.title;
  body.textContent = problem.message;
}

// The same for anything a call throws:
try {
  await mdbase.select(id);
} catch (error) {
  const described = describeError(error);
  if (described) showProblem(described);
}
```

`describeError()` accepts a thrown error, a refused write’s `receipt.problem`, or a phase’s problem, and returns a title, a message and one action. It returns `null` when there is nothing to show, such as a request your own code aborted.

| `action` | What to offer |
| --- | --- |
| `sign_in` | A button that calls `signIn()` |
| `approve` | A button that calls `approve()` or `reauthorize()` |
| `choose_collection` | `chooseAnother()` |
| `set_up` | Your [setup](#setup) review |
| `retry` | `start()`, or the call that failed |
| `wait` | Nothing to press; `retryAfterMs` may say how long |
| `reload` | Reload the page |
| `update_app` | A link to `updateUrl` |
| `free_space`, `check_connection`, `resolve_outcome`, `contact_support`, `none` | The message says what to do; there is nothing to call |

`actionLabel` is the button’s wording, and `transient` is true for problems the SDK clears by itself, which can be shown quietly.

## Sign-in outside a popup {#opener}

A native shell or a browser extension cannot open a popup. Pass a `signIn` opener and the SDK gives it the URL to show:

```ts title="mdbase.ts"
import { Browser } from "@capacitor/browser";

export const mdbase = createMdbase(declaration, {
  signIn: {
    open: (url) => Browser.open({ url }),
    close: () => Browser.close(),
    returnUrl: "dev.example.worklog://auth/mdbase/callback",
  },
});
```

`returnUrl` must be one of the manifest’s `redirect_uris`. mdbase sends the browser there when sign-in ends. It carries no credential; the SDK learns the result itself.
