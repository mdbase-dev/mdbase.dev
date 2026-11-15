---
title: Developer kit
description: "@mdbase-dev/connect-dev checks a manifest before you ship it and builds the type packs a manifest carries."
section: sdk
---

A build-time package. Nothing from it runs in your app; install it as a development dependency.

## Install

```sh title="Terminal"
npm install --save-dev --save-exact @mdbase-dev/connect-dev
```

## Check a manifest {#cli}

```sh title="Terminal"
npx mdbase-connect-dev validate-manifest mdbase-app.json
npx mdbase-connect-dev validate-manifest mdbase-app.dev.json --allow-local
npx mdbase-connect-dev validate-contract contracts/example.work-item.json
```

`validate-manifest` runs the parser mdbase uses when your app registers. It exits non-zero with a list of problems, each with the path of the field at fault.

An HTTP homepage is refused unless you pass `--allow-local`. Use the flag for a [development manifest](/sdk/local-development/) and leave it off for the one you publish, so a localhost address cannot reach production by mistake.

## Check it in a build {#build}

```js title="scripts/write-manifest.mjs"
import { formatValidationIssues, validateAppManifest } from "@mdbase-dev/connect-dev";

const result = validateAppManifest(manifest, { allowLocal: false });
if (!result.valid) {
  // Each issue has a JSON pointer, such as /requirements/capabilities/required/2.
  console.error(formatValidationIssues(result.issues));
  process.exit(1);
}
```

The SDK also validates the manifest when the app starts. Checking in the build moves the failure from your users’ browsers to your own terminal.

## Build a type pack {#type-packs}

A [type pack](/sdk/manifest/#provisioning) carries the type and contract files your app adds to a collection. Inside a manifest every file is pinned by a SHA-256 digest. `defineTypePack()` reads the documents, computes the digests and returns the object to place under `provisions.type_packs`:

```js title="scripts/write-manifest.mjs"
import { defineTypePack } from "@mdbase-dev/connect-dev";

const types = defineTypePack({
  id: "dev.example.worklog",
  version: "1.0.0",
  name: "Worklog",
  resources: [
    {
      kind: "type",
      mode: "seed",
      source: "types/worklog-entry.md",
      target: "_types/worklog-entry.md",
      document: await readFile("mdbase/types/worklog-entry.md", "utf8"),
    },
  ],
});

// In the manifest:
//   "provisions": { "type_packs": [types] }
```

| Resource field | Meaning |
| --- | --- |
| `kind` | `"type"`, `"contract"` or `"schema"` |
| `mode` | `"seed"` or `"managed"`; see below |
| `source` | The file’s name inside the pack |
| `target` | Where it goes in the collection, such as `_types/worklog-entry.md`. Defaults to `source`. |
| `document` | The file’s exact text |
| `upgradeFrom` | Seed types only: earlier versions you shipped, oldest first, that a collection may be upgraded from |

Keep the documents as real files in your repository and read them in the script. They are then reviewable in a pull request, and the manifest is a build output.

## Seed and managed {#modes}

| Mode | Who owns the file after setup | Use it for |
| --- | --- | --- |
| `seed` | The user. Your app writes it once; later edits by the user stay. | A type people may want to extend with fields of their own |
| `managed` | Your app. A new version of your pack updates it. | A contract, or a type whose exact shape your app depends on |

Adding files to a collection needs the `definitions.manage` capability in your manifest, and the user sees and accepts the change first. See [Setup](/sdk/lifecycle/#setup).

## Contracts

`defineDataContract()` validates a [contract](/sdk/contracts/) document as you write it, and `dataContractDigest()` computes the digest a manifest names it by.

```js title="contracts.mjs"
import { dataContractDigest, defineDataContract } from "@mdbase-dev/connect-dev";

const workItem = defineDataContract({
  // the contract document; see Contracts and adapters
});

// The digest to put in requirements.contracts and in a type pack's provides.
const digest = dataContractDigest(workItem);
```

`validate-contract` on the command line checks a contract file the same way.

## A whole manifest script {#script}

The Worklog example writes its development and deployed manifests from one script, validating each:

```js title="scripts/write-manifest.mjs" file="examples/worklog/scripts/write-manifest.mjs"
```

## The sandbox {#sandbox}

The package also exports `createSandbox()`. It is for the older `@mdbase-dev/connect` client. With `@mdbase-dev/sdk`, test against `MemoryReplica` and `createApplicationFixture()`; see [Testing](/sdk/testing/).
