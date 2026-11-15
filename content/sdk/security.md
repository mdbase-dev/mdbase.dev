---
title: Security model
description: "Who can read what, where your app’s key lives, and what to check before you release."
section: sdk
---

## Who can read content {#payloads}

The collection’s log is encrypted in both sync options. The difference is who holds the keys.

|  | Can read records | Sees |
| --- | --- | --- |
| Your app | Yes, within its grant | What it reads |
| The user’s devices | Yes | Everything the user can see |
| mdbase, Cloud copy | Yes: it keeps a readable copy | Content and metadata |
| mdbase, Private | No | Metadata: which app connects to which device, message sizes and timing, and timer times and counts |

Your app’s session with the replica is end-to-end encrypted with Noise, whether it runs through the relay or straight to mdbase’s hosted replica. Both sides prove their keys. TLS runs underneath on every hop. See [How apps reach a collection](/sdk/routing/).

## Ask for least privilege {#least-privilege}

- Request only the capabilities you use. Mark the rest optional.
- Ask for file access to named folders, not the whole collection.
- Check `db.hello.grant` and hide what the user didn’t approve.

## Your app’s key {#credentials}

Your app’s grant is bound to a key. In a browser, `loadOrCreateClientKey()` keeps it in IndexedDB as a non-extractable key where the browser supports it. Pass `requireNonExtractable: true` to refuse to fall back to a raw key.

Non-extractable means script can’t copy the key out. It does not stop script on your origin from using it. Any code running in your page has your app’s access, so keep third-party scripts out and fix cross-site scripting bugs as access bugs.

## Origins and callbacks {#origins}

- Your homepage, icon and browser callbacks use HTTPS. The one exception is an app on this computer: [a localhost origin](/sdk/local-development/) may use HTTP, and the approval screen then says the app’s identity is unverified.
- Browser callbacks stay on the homepage’s origin.
- Native callback schemes match or extend your application ID.
- The `origin` you give `createMdbase()` is the exact origin you serve from.

## Release checklist {#checklist}

- Validate your manifest with the production parser.
- Test revocation and narrowed grants: your app should ask the user to reconnect, not retry.
- Test a Private collection with no device online.
- Show pending writes, holds and conflicts. Never present a pending write as saved.
- Pass `ifRevision` on overwrites and deletes where losing a concurrent edit matters.
- Show what a rename or delete will touch before doing it.
- Keep record content out of timer IDs and notification text.
- Deduplicate signed webhook deliveries before acting on them.
- Tell your users that in a Cloud copy collection, mdbase can read their content.
