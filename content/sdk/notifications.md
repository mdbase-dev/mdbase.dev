---
title: Notifications and timers
description: Schedule reminders that fire even when every device is off. mdbase learns when they fire, never what they are about.
section: sdk
---

Timers live with mdbase, not in the collection. They fire whether or not any of the user’s devices are on, for Cloud copy and Private collections alike. When a timer fires, mdbase sends a notification with the fixed text from your manifest.

> **Timer access comes from the app connection.**
>
> `connection.timers` is on the connection you get from `createMdbase()` once a collection is ready. See [Sign-in and collections](/sdk/lifecycle/).

## Declare notifications in the manifest {#criteria}

```json title="Manifest fragment"
{
  "notifications": {
    "criteria": [{
      "id": "task.reminder",
      "event": {
        "id": "mdbase.runtime.timer.fired",
        "version": "1.0.0",
        "digest": "sha256:41105be7a7abf33b31ced47e1e1965242236e40ccaea286b959b0a8c591f5642"
      },
      "presentation": {
        "title": "Task reminder",
        "body": "Open Worklog to see what’s due.",
        "tag": "task-reminder"
      }
    }]
  }
}
```

Timer notifications use the event `mdbase.runtime.timer.fired` at version `1.0.0`. The title (up to 80 characters) and body (up to 160) are fixed in the manifest, so no record content can reach a notification. You also need the `background.schedule` capability.

## Schedule timers {#timers}

```ts title="reminders.ts"
const timers = connection.timers;
if (!timers) throw new Error("This connection has no timer access");

// Replace this app’s whole set of reminders in one call.
const result = await timers.reconcile({
  namespace: "task-reminders",
  criterionId: "task.reminder",
  timers: reminders.map((r) => ({
    id: r.timerId,          // opaque: don’t put record IDs or titles here
    fireAt: r.at.toISOString(),
  })),
});
console.log(result.cancelledIds);
```

- `reconcile()` replaces the active timers in a namespace in one step. Unchanged timers are kept. Changed ones are rescheduled. Ones you leave out are cancelled and returned in `cancelledIds`. An empty list cancels the namespace.
- `put()`, `cancel()` and `list()` handle one timer at a time.
- Times are UTC instants. There is no recurrence: work out local times on the device and reconcile again when they change.
- A timer that is due while mdbase is catching up fires once, late.
- Namespaces are 1–64 characters, IDs 1–128, and one reconcile holds at most 10,000 timers.

## Register browser push from a user action {#browser}

```ts title="enable-notifications.ts"
const worker = await navigator.serviceWorker.register("/service-worker.js");

await connection.timers?.registerWebPush({
  serviceWorker: worker,
  criteria: ["task.reminder"],
});
```

Native apps use `registerFcm({ token })`. `unregisterWebPush()` and `unregisterFcm()` stop delivery when the user opts out.

## Signed webhooks {#webhooks}

If your app sends its own pushes, declare an HTTPS webhook as `notifications.native_delivery` with `"mode": "webhook"`. Verify each delivery against the exact raw body before parsing it.

```ts title="notification-webhook.ts"
import { verifyNotificationWebhook } from "@mdbase-dev/connect-webhooks";

const event = verifyNotificationWebhook({
  body: rawRequestBody,          // the exact bytes, before JSON parsing
  headers: request.headers,
  keys: cachedSigningKeys,
});

if (await deliveries.claim(event.delivery_id)) {
  await sendPush(event.connection_id, event.notification);
}
```

Cache the signing keys from `/v1/notifications/webhook-signing-keys`. Deliveries older than five minutes are refused. Store `delivery_id` before doing any work: mdbase retries until your endpoint succeeds.

## What mdbase sees {#privacy}

mdbase stores each timer’s namespace, ID, criterion and time, under your app’s grant. It learns when reminders are due and how many there are. It never sees record content or record IDs, unless you put them in timer IDs. Use opaque IDs, such as a hash.

In a Private collection, timers work once a signed-in device has applied your app’s grant, which it does automatically. Opening the app from a notification still needs one of their devices to be online.
