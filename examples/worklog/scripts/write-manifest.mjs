// Writes src/mdbase-app.json, the manifest the app passes to createMdbase().
//
//   node scripts/write-manifest.mjs          the deployed app (WORKLOG_ORIGIN)
//   node scripts/write-manifest.mjs --dev    the app on http://localhost:5173
import { readFile, writeFile } from "node:fs/promises";

import {
  defineTypePack,
  formatValidationIssues,
  validateAppManifest,
} from "@mdbase-dev/connect-dev";

const development = process.argv.includes("--dev");
const origin = development
  ? "http://localhost:5173"
  : (process.env.WORKLOG_ORIGIN ?? "https://worklog.example");

const read = (path) => readFile(new URL(`../mdbase/${path}`, import.meta.url), "utf8");

// The type the app's records use. A collection that lacks it is offered this
// copy during setup; after that the file belongs to the collection.
const types = defineTypePack({
  id: "dev.example.worklog",
  version: "1.0.0",
  name: "Worklog",
  description: "The worklog-entry type.",
  resources: [
    {
      kind: "type",
      mode: "seed",
      source: "types/worklog-entry.md",
      target: "_types/worklog-entry.md",
      document: await read("types/worklog-entry.md"),
    },
  ],
});

const manifest = {
  manifest_version: 1,
  id: "dev.example.worklog",
  // A development build is a separate application to mdbase, so name it as one.
  name: development ? "Worklog (development)" : "Worklog",
  homepage: `${origin}/`,
  redirect_uris: [`${origin}/`],
  requirements: {
    access: "full_collection",
    contracts: [],
    capabilities: {
      contract_version: 2,
      // definitions.manage lets setup add the worklog-entry type to a collection.
      required: [
        "collection.read",
        "records.create",
        "records.edit",
        "records.delete",
        "definitions.manage",
      ],
    },
    files: {
      required: ["list", "read", "add", "replace", "move", "delete"],
      scope: { kind: "collection" },
    },
  },
  provisions: { type_packs: [types] },
};

const result = validateAppManifest(manifest, { allowLocal: development });
if (!result.valid) {
  console.error(formatValidationIssues(result.issues));
  process.exit(1);
}

await writeFile(
  new URL("../src/mdbase-app.json", import.meta.url),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`Wrote src/mdbase-app.json for ${origin}`);
