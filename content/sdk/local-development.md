---
title: Develop on localhost
description: Run your app from a local development server against real mdbase accounts and collections.
section: sdk
---

You develop against the same mdbase service your users use. There is no development mode, sandbox key or allowlist to apply for.

> **SDK version**
>
> Use an `@mdbase-dev/sdk` release after `0.1.0-beta.168`. Earlier releases refuse an `http://localhost` origin and fail to load under `vite dev`.

## What is accepted {#rule}

Your app’s origin may be plain HTTP when it is on this computer:

- `http://localhost:<port>`
- `http://127.0.0.1:<port>`
- `http://[::1]:<port>`

Any port works. Every other app origin must be HTTPS, including a development machine reached by its LAN address or a tunnel hostname.

## A development manifest {#manifest}

A manifest names the origin its app is served from, so keep two: the one you publish, with your HTTPS homepage, and one for development whose `homepage` and `redirect_uris` use the development server’s origin.

```json title="mdbase-app.dev.json"
{
  "manifest_version": 1,
  "id": "dev.example.worklog",
  "name": "Worklog (development)",
  "homepage": "http://localhost:5173/",
  "redirect_uris": ["http://localhost:5173/"],
  "requirements": {
    "access": "full_collection",
    "contracts": [],
    "capabilities": {
      "contract_version": 2,
      "required": ["collection.read", "records.create", "records.edit"]
    }
  }
}
```

Everything else can be the same. You can keep two files, or write both from one script as the [Worklog tutorial](/sdk/connect-quickstart/#manifest) does.

The manifest checker refuses an HTTP homepage by default, so that a development manifest is caught before it ships. Pass `--allow-local` for the development one:

```sh title="Terminal"
npx mdbase-connect-dev validate-manifest mdbase-app.dev.json --allow-local
npx mdbase-connect-dev validate-manifest mdbase-app.json
```

The published [JSON Schema](/connect/schemas/mdbase-app.v1.json) describes the deployed form, so an editor that validates against it marks an HTTP homepage. The checker with `--allow-local` is the authority for a development manifest.

## Declare the app {#entry}

```ts title="mdbase.ts"
import { createMdbase } from "@mdbase-dev/sdk";
import manifest from "./mdbase-app.json"; // the development or the deployed one

export const mdbase = createMdbase({
  id: manifest.id,
  name: manifest.name,
  origin: new URL(manifest.homepage).origin, // "http://localhost:5173"
  environment: "production",
  manifest,
});
```

`environment` stays `"production"`. It names the mdbase service your app talks to, and that is the same one in development. Only `origin` and the manifest change between development and your deployed site.

## A separate application {#separate}

mdbase identifies an app by its manifest and binds what a user approves to the exact origin, port included. Your localhost build is therefore its own application:

- Collections approved on `localhost:5173` are approved for that origin only. Your deployed app asks its users separately.
- Sign-in state and the on-device copy of a collection belong to the origin. Changing the port starts again from signed out.
- Give the development manifest its own `name`, such as “Worklog (development)”, so the two are easy to tell apart on your account page.

The records are real. A development build that opens your own collection reads and writes your own files, so use a collection made for testing.

## What the user sees {#consent}

When a localhost app asks for access, the approval screen calls it “an app running on this computer”, says its identity is unverified, and shows no icon. A page on the internet cannot give itself a localhost origin, so the only program that can be there is one already running on the person’s machine. The screen says that plainly instead of presenting the manifest’s name as a brand.

Account sign-in, the collection choice and the list of capabilities are the same as for a deployed app.

## Redirect URIs {#redirect}

`redirect_uris` must list at least one URL on the app’s origin. A browser app needs no page there. Sign-in happens in a window that the SDK opens, and the SDK learns the result itself; that window never navigates to your redirect URI and no token is delivered to it. Listing the homepage is enough.

The redirect URI is used when you pass your own sign-in opener, as a native shell or browser extension does. mdbase then sends the person’s browser to `returnUrl` when sign-in ends, to bring them back to your app. It carries no credential, so any page or deep link of yours can receive it. See [Sign-in outside a popup](/sdk/lifecycle/#opener).

## Development servers {#server}

The SDK runs its engine in a Web Worker and loads WebAssembly files that ship inside the package. With Vite, `vite dev` and `vite build` both work with the default configuration.

Fix the port, since the manifest names it:

```ts title="vite.config.ts"
import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 5173, strictPort: true },
});
```

With another bundler, the requirement is that the files under the package’s `dist/` are served from your own origin, beside the SDK’s modules. For a page with no bundler, use the [browser bundle](/sdk/portable-apps/).

## Working with no account {#no-account}

Much of an app can be built before you sign in at all:

- `createMdbase(declaration, { unsynced: true })` opens a real collection kept in the browser. See [Work before connecting](/sdk/unsynced/).
- `MemoryReplica` and `createApplicationFixture()` run the same client in tests. See [Testing](/sdk/testing/).

## Common problems {#problems}

| What you see | Cause |
| --- | --- |
| “The app couldn’t load” as soon as the page opens | The SDK release predates localhost support, or the SDK’s files are not served from your origin. |
| The entry refuses to start with an origin error | `origin` differs from the page’s origin, or from the manifest’s `homepage` origin. `localhost` and `127.0.0.1` are different origins. |
| Signed out after restarting the development server | The server picked another port. Set `strictPort`. |
| The checker reports `/homepage` | An HTTP homepage needs `--allow-local`, or `allowLocal: true` when you call `validateAppManifest()`. |
| The sign-in window does not open | `signIn()` was called after an `await`. Call it directly in the click handler. |
