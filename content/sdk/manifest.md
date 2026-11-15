---
title: Application manifest
description: One JSON file says who your app is, which collections suit it, and what it may do.
section: sdk
---

Ship the manifest with your app and pass it to `createMdbase()`. The SDK validates it with the same parser mdbase uses. Schema: [`mdbase-app.v1.json`](/connect/schemas/mdbase-app.v1.json). The whole file may be at most 512 KiB.

```json title="mdbase-app.json"
{
  "manifest_version": 1,
  "id": "dev.example.worklog",
  "name": "Worklog",
  "homepage": "https://worklog.example",
  "icon": "https://worklog.example/icon.png",
  "redirect_uris": [
    "https://worklog.example/auth/mdbase/callback",
    "dev.example.worklog://auth/mdbase/callback"
  ],
  "requirements": {
    "access": "full_collection",
    "contracts": [
      {
        "id": "example.work-item",
        "version": "1.0.0",
        "digest": "sha256:9cd7f8e4b23ba20aaeaec3f7e209c6ba8de3fa5cd224204f2baef4e14dd69936"
      }
    ],
    "capabilities": {
      "contract_version": 2,
      "required": ["collection.read", "records.create", "records.edit"],
      "optional": ["records.delete"]
    }
  }
}
```

## Identity

| Field | Rule |
| --- | --- |
| `manifest_version` | `1` |
| `id` | Lowercase reverse-domain name with at least three parts, such as `dev.example.worklog`. It is a label, not proof of who publishes the app. |
| `name` | Shown to the user when they approve your app; up to 100 characters |
| `icon` | Optional HTTPS URL |

## Web apps {#web}

A web app declares an HTTPS `homepage` and between one and ten `redirect_uris` on the homepage’s origin. `distribution` may be left out; it defaults to `"web"`.

For development, the homepage and redirect URIs may instead be on `http://localhost`, `http://127.0.0.1` or `http://[::1]`, with any port. That manifest is a separate application from your published one; see [Develop on localhost](/sdk/local-development/).

A browser app that signs in through the SDK’s own window can list its homepage as its one redirect URI. See [Redirect URIs](/sdk/local-development/#redirect).

You do not have to write the manifest by hand. [`@mdbase-dev/connect-dev`](/sdk/connect-dev/) checks it and builds its type packs.

## Requirements

| Field | Meaning |
| --- | --- |
| `access` | Required. Always `"full_collection"`. |
| `contracts` | Required, may be empty. Each entry names a contract by `id`, `version` and exact `digest`. A collection suits your app when its types implement them. See [Contracts and adapters](/sdk/contracts/). |
| `capabilities` | What your app may do. See [Authorization](/sdk/authorization/). Without it, your app gets read-only access. |
| `files` | File actions and the folders they apply to |
| `people` | `identity` (who the user is) and `members` (the collection’s members), as `required` or `optional`, with `"version": 1` |
| `configuration` | Values the collection’s settings must contain, each with an `id`, a `path`, the predicate `"contains"` and a `value` |

## Provisioning

If a collection lacks the contract you need, your manifest can carry a type pack that adds it. Every resource is pinned by digest. The pack is checked as a whole and written all at once or not at all. A pack may only provide contracts listed in `requirements.contracts`. A target file that already exists with different bytes is a conflict. If your app didn’t put it there and the resource is `managed`, the user can choose to replace it with your app’s version. Otherwise it is left alone.

```json title="Manifest fragment (digests shortened)"
"provisions": {
  "type_packs": [
    {
      "provides": [
        {
          "id": "example.work-item",
          "version": "1.0.0",
          "digest": "sha256:9cd7f8e4…"
        }
      ],
      "manifest": {
        "kind": "mdbase.type-pack",
        "id": "example.work-items",
        "version": "1.0.0",
        "name": "Work items",
        "resources": [
          {
            "kind": "contract",
            "mode": "managed",
            "source": "contracts/example.work-item.md",
            "target": "_contracts/example.work-item.md",
            "digest": "sha256:9cd7f8e4…"
          },
          {
            "kind": "type",
            "mode": "managed",
            "source": "types/work-item.md",
            "target": "_types/work-item.md",
            "digest": "sha256:2be7d8a5…"
          }
        ]
      },
      "resources": [
        { "source": "contracts/example.work-item.md", "document": "---\nkind: mdbase.contract\n…" },
        { "source": "types/work-item.md", "document": "---\nkind: mdbase.type\n…" }
      ]
    }
  ]
}
```

`provisions.configuration` can likewise add a value to the collection’s settings, with the operation `"set_add"`, to meet a `configuration` requirement.

## Notifications {#portable}

`notifications.criteria` declares the notifications your app may send, with fixed titles and text. See [Notifications and timers](/sdk/notifications/).

## Native apps {#native}

A native app can list a private-use URI scheme in `redirect_uris`. The scheme must match or extend the application ID, as in `dev.example.worklog://auth/mdbase/callback`.

The `origin` you give `createMdbase()` is normally the manifest’s `homepage` origin. A Capacitor shell ( `capacitor://`) or Chrome extension ( `chrome-extension://`) origin must also be listed under the manifest’s `installation_origins`. Firefox extension origins are not accepted. These apps sign in through an opener; see [Sign-in outside a popup](/sdk/lifecycle/#opener).

## Changing the manifest {#changes}

A changed manifest never widens an existing grant on its own. If your new version needs more, such as a new capability or contract, the user approves it again.
