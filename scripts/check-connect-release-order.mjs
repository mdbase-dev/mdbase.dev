import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { compareSemanticVersions } from "./connect-release-record.mjs";

const baseRevision = process.argv[2];
assert.match(baseRevision, /^[0-9a-f]{40}$/, "a full base revision is required");
const current = JSON.parse(await readFile(new URL("../src/data/connect-release.json", import.meta.url)));
const base = JSON.parse(execFileSync("git", [
  "show",
  `${baseRevision}:src/data/connect-release.json`
], { encoding: "utf8" }));
const comparison = compareSemanticVersions(current.version, base.version);
assert.ok(comparison >= 0, `Connect release ${current.version} would downgrade base release ${base.version}`);
if (comparison === 0) {
  assert.deepEqual(releaseIdentity(current), releaseIdentity(base), "an existing Connect release identity cannot be rewritten");
}
console.log(`Connect release order verified: ${base.version} -> ${current.version}.`);

function releaseIdentity(record) {
  return {
    version: record.version,
    sdkVersion: record.sdkVersion,
    tag: record.tag,
    sourceRevision: record.sourceRevision,
    releaseUrl: record.releaseUrl,
    channelManifestUrl: record.channelManifestUrl,
    artifacts: [...record.desktop, ...record.cli].map(({ file, size }) => ({ file, size }))
  };
}
