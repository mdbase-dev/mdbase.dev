---
title: UI components
description: "@mdbase-dev/ui has the sign-in, collection picker, approval and setup screens that mdbase’s own apps use, as React components."
section: sdk
---

Every app built on mdbase needs the same screens before its own: sign in, pick a collection, approve access, review setup, and explain a problem. This package has them, so users meet the same flow in every app and you write none of it.

## Install

```sh title="Terminal"
npm install --save-exact @mdbase-dev/ui @mdbase-dev/i18n \
  @lingui/core@6.9.0 @lingui/react@6.9.0
```

The components need React 19.2 or later. `@mdbase-dev/i18n` and the two Lingui packages are peer dependencies. Import the stylesheet once, anywhere in your app:

```ts title="main.tsx"
import "@mdbase-dev/ui/collections.css";
```

## CollectionGate {#gate}

The gate takes your [`createMdbase()`](/sdk/lifecycle/) entry and shows the right screen for each phase. It renders its children once a collection is open, and starts the SDK itself.

```tsx title="App.tsx" file="examples/worklog/src/App.tsx"
```

| Prop | Meaning |
| --- | --- |
| `mdbase` | The entry from `createMdbase()`. |
| `app` | `name`, and optionally `mark`: an element shown as your app’s icon. |
| `children` | A function of the open connection. Called in the `ready` and `unsynced` phases. |
| `layout` | `"page"` (default) fills the viewport. `"panel"` sits inside your own shell or dialog. |
| `unsynced` | Show the [work before connecting](/sdk/unsynced/) screens. Pass `true`, or `{ storage, map }`. |
| `extraActions` | Your own links or buttons on the gate’s screens, such as “Try a sample”. |
| `onBeforeLeave` | Called before anything that leaves the open collection. Return `false`, or a promise of it, to stay. |
| `autoStart` | Call `mdbase.start()` on mount. Default true. |
| `copy` | Replacement wording. See [below](#wording). |

```tsx title="App.tsx"
<CollectionGate
  mdbase={mdbase}
  app={{ name: "Worklog", mark: <WorklogIcon /> }}
  layout="panel"
  extraActions={<a href="/about">What is Worklog?</a>}
  onBeforeLeave={(intent) => (hasUnsavedDraft() ? confirmLeave(intent) : true)}
  unsynced
>
  {(connection) => <Worklog db={connection.records} />}
</CollectionGate>
```

While a collection is open, the gate shows a banner above your app for a live problem, such as access that was removed.

## CollectionSwitcher {#switcher}

The control inside your app for the open collection. It lists the approved collections, and has “Add a collection”, “Manage access” and the account with sign-out. It takes the same `mdbase`, `app`, `unsynced` and `onBeforeLeave` props as the gate.

```tsx title="Header.tsx"
// In a header: the collection's name, opening the list.
<CollectionSwitcher mdbase={mdbase} app={app} variant="compact" />

// In a toolbar: a button with an icon only.
<CollectionSwitcher mdbase={mdbase} app={app} variant="icon" />

// Opened from an item in your own menu.
const [open, setOpen] = useState(false);
const menuButton = useRef<HTMLButtonElement>(null);

<CollectionSwitcher
  mdbase={mdbase}
  app={app}
  variant="none"
  open={open}
  onOpenChange={setOpen}
  anchorRef={menuButton}
/>
```

## Smaller parts {#parts}

| Export | Use |
| --- | --- |
| `CollectionPanel` | The gate’s screens and the switcher’s list in one panel, for a settings dialog or an app that opens on its own screen first. |
| `CollectionProblem` | One problem with its fix, as a block or a banner. |
| `CollectionSetupReview` | The setup review on its own. |
| `CollectionUnsyncedLine`, `CollectionBringIn` | The “saved only in this browser” line and the offer to bring that work in. |
| `CollectionSaveWarning` | A warning when unsaved changes sit in storage the browser may clear. |
| `useCollectionUi()` | The state and actions behind the components, for a layout of your own. |

```tsx title="Problem.tsx"
import { CollectionProblem } from "@mdbase-dev/ui/collections";

// The current phase's problem, as a banner above your content:
<CollectionProblem mdbase={mdbase} app={app} variant="banner" />

// An error from one of your own calls:
<CollectionProblem mdbase={mdbase} app={app} problem={error} />
```

All of them are exported from `@mdbase-dev/ui/collections`.

## Restyle {#style}

The stylesheet is self-contained. It follows the system’s light or dark setting; put `data-theme="light"` or `data-theme="dark"` on the root element to fix one. Set `--mdbase-collections-*` custom properties on any ancestor to match your app:

```css title="worklog.css"
.worklog {
  --mdbase-collections-accent: #0f766e;
  --mdbase-collections-on-accent: #ffffff;
  --mdbase-collections-font: "Inter", system-ui, sans-serif;
  --mdbase-collections-radius: 6px;
}
```

| Properties | Control |
| --- | --- |
| `-accent`, `-on-accent` | Primary buttons and focus |
| `-canvas`, `-surface`, `-border`, `-current-bg` | Backgrounds and lines |
| `-text`, `-text-soft`, `-danger`, `-warning` | Text and status colours |
| `-font`, `-font-size`, `-font-size-caption`, `-font-size-section`, `-font-size-heading`, `-font-weight-strong` | Type |
| `-radius-sm`, `-radius`, `-radius-lg`, `-control-height` | Shape and size |
| `-elevation-low`, `-elevation-high`, `-scrim` | Shadows and the dialog backdrop |

## Wording and language {#wording}

The components are in English by default and need no provider. Pass `copy` to replace individual strings; `defaultCollectionCopy` lists every key.

The package also ships its strings in French, German, Spanish, Italian, Portuguese, Russian, Japanese, Korean and Chinese. `@mdbase-dev/ui/i18n` exports them as `uiCatalogues`, for an app that sets up `@mdbase-dev/i18n` with its own Lingui catalogue.

## Apps that do not use React {#mount}

`mountCollectionUi()` renders a component into an element you give it. Your app needs no React code of its own, though the `react` and `react-dom` packages must be installed.

```ts title="main.ts"
import { mountCollectionUi } from "@mdbase-dev/ui/collections";
import "@mdbase-dev/ui/collections.css";
import { mdbase } from "./mdbase";

const app = { name: "Worklog" };

// Sign-in, choosing and the list, inside your own dialog or page.
const panel = mountCollectionUi(document.querySelector("#collections"), {
  part: "panel",
  mdbase,
  app,
});

// The header control.
mountCollectionUi(document.querySelector("#switcher"), {
  part: "switcher",
  variant: "compact",
  mdbase,
  app,
});

mdbase.subscribe(() => {
  const { phase } = mdbase.getSnapshot();
  const open = phase.kind === "ready" || phase.kind === "unsynced";
  document.querySelector("#collections").hidden = open;
  if (open) showWorklog(phase.connection.records);
});

// Later: panel.update({ ... }) to change options, panel.unmount() to remove it.
```

`part` is `"panel"`, `"switcher"` or `"problem"`. To draw everything yourself and keep only the logic, `collectionView()` turns a snapshot into the screen to show:

```ts title="view.ts"
import { collectionView } from "@mdbase-dev/ui/collections";

const view = collectionView(mdbase.getSnapshot(), { appName: "Worklog" });
// view.kind names the screen to draw, with that screen's wording and controls.
```

## Links to the mdbase apps {#apps}

A collection your app uses can also be opened in mdbase’s [Editor, Reader and Writer](/apps/). `mdbaseAppHref()` builds a link to one of them that opens the collection named in the current page’s URL:

```ts title="links.ts"
import { mdbaseAppHref } from "@mdbase-dev/ui/apps";

// The collection open in this page, opened in the Editor.
editorLink.href = mdbaseAppHref("https://editor.mdbase.dev/", location.href);
```

The `AppSwitcher` component in the same package is the menu mdbase’s own apps show under their name. It lists only those three apps, so it is not a place to add yours.
