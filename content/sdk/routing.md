---
title: How apps reach a collection
description: "Your app always talks to a replica. Which replica depends on the collection’s sync option: mdbase’s copy for Cloud copy, one of your devices for Private."
section: sdk
---

## Apps talk to a replica {#automatic}

Every client connects to one **replica**: a full copy of the collection that checks your app’s grant and answers its requests. Your code is the same whichever replica it reaches. The collection’s sync option decides which one that is. You don’t choose a route.

| Sync option | Your app reaches | Works while the user’s devices are off |
| --- | --- | --- |
| Cloud copy (the default) | mdbase’s hosted replica | Yes |
| Private | One of the user’s own devices, through the relay | No |

The log is encrypted in both options. What differs is who holds the keys.

## Cloud copy

mdbase keeps a readable copy of the collection and runs a replica for it. Your app connects to that replica over an encrypted session. It works at any time, including when every one of the user’s devices is off. mdbase can read the content of a Cloud copy collection.

## Private

Only the user’s devices hold the keys, so only they can run a replica. Your app connects to whichever of the user’s devices is online, through mdbase’s relay. mdbase cannot read the content. If no device is online, your app cannot reach the collection.

The user approves your app once, in mdbase. A signed-in device applies that grant automatically; there is no second approval on the device.

## The relay {#relay}

The relay is a pipe, not storage. It pairs your app’s connection with the device’s and forwards encrypted messages. It sees which app connects to which device, and the sizes and timing of messages. It never sees content.

The session inside is end-to-end between your app and the replica. It uses the Noise protocol (`Noise_IK_25519_ChaChaPoly_SHA256`), and both sides prove their keys:

- your app’s key is the one registered with its grant when the user approved it;
- the replica’s key is the one enrolled for that device.

The session is bound to one collection, grant and device. It ends after 24 hours and the SDK reconnects with a new handshake. Revoking the grant closes it at once.

In a browser, `loadOrCreateClientKey()` keeps your app’s key in IndexedDB as a non-extractable key where the browser allows it. Otherwise the key is stored in your origin’s storage. Either way, script running on your origin can use it, so a cross-site scripting bug in your app is a bug in your app’s access.

## When no device is online {#waiting}

When a Private collection has no device online, connecting fails with `unavailable` and reason `no_device_online`. Pass `waitForDevice: true` to keep retrying instead, and tell the user what to do.

```ts title="connect.ts"
const db = await connect({
  connector,
  app: { name: "dev.example.worklog", version: "1.4.0" },
  // Private collections: keep retrying until one of the user's devices is online.
  waitForDevice: true,
  onWaiting: () => showBanner("Open mdbase on one of your devices to continue."),
});

db.onLink((state, why) => {
  // "open", "reconnecting" or "closed"
  renderConnection(state, why?.reason);
});
```

The SDK reconnects by itself when the link drops. `db.link` and `onLink()` report the link to the replica, not the sync state; for that, use [sync status](/sdk/offline-sync/).

## On the same computer {#local}

A script or plugin on a computer running the mdbase desktop app can talk to the desktop app’s replica directly, without the relay. `@mdbase-dev/sdk/node` has two connectors:

| Connector | How it connects |
| --- | --- |
| `connectDaemonLocalhost({ collection })` | A localhost WebSocket. The user links your key to the collection on screen in the desktop app, once per collection and key. |
| `ipcConnector({ collection, grant, staticKey })` | A local socket or named pipe, with your app’s grant and key. |

```ts title="export.mjs"
import { connect } from "@mdbase-dev/sdk";
import { connectDaemonLocalhost } from "@mdbase-dev/sdk/node";

const db = await connect({
  connector: connectDaemonLocalhost({ collection: collectionId }),
  app: { name: "dev.example.export-script", version: "0.1.0" },
});
```

Both read the desktop app’s identity from its state directory and pin its key, so another process listening on the same port fails the handshake.

`connectDaemonLocalhost` uses a new key each time, so the user is asked to link it on every run. To be asked once, use `localLinkConnector({ link: () => readLocalLink(), collection, staticKey })` with a key you keep. Outside a browser, `loadOrCreateClientKey()` keeps keys in memory only, unless you pass your own `storage`.

## mdbase’s own apps {#first-party}

mdbase’s own web apps can keep a replica of their own in the browser, so they open and edit while offline. Other apps reach a replica as described above. Running your own replica in the browser is not open to other apps at launch.
