import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const release = JSON.parse(await readFile(new URL("../src/data/connect-release.json", import.meta.url)));
const sources = JSON.parse(await readFile(new URL("../site-sources.json", import.meta.url)));

assert.equal(release.tag, `v${release.version}`, "release tag must match version");
assert.equal(release.sdkVersion, release.version, "public SDK and Connect release versions must match");
assert.equal(sources.connect.ref, release.sourceRevision, "published docs must use the released Connect source");
assert.match(release.releaseUrl, new RegExp(`/releases/tag/${release.tag}$`));
assert.match(release.channelManifestUrl, new RegExp(`/releases/download/${release.tag}/mdbase-connect-channel-v1\\.json$`));

const artifacts = [...release.desktop, ...release.cli];
assert.equal(new Set(artifacts.map(({ file }) => file)).size, artifacts.length, "artifact names must be unique");
for (const artifact of artifacts) {
  assert.ok(artifact.file.includes(release.version), `${artifact.file} must contain the selected version`);
  assert.ok(Number.isSafeInteger(artifact.size) && artifact.size > 0, `${artifact.file} must have a bounded size`);
}
assert.deepEqual(
  release.desktop.map(({ platform, detail }) => `${platform}:${detail}`),
  [
    "macOS:Apple Silicon",
    "macOS:Intel",
    "Windows:64-bit",
    "Linux:64-bit Debian or Ubuntu",
    "Linux:64-bit Fedora, RHEL, or compatible"
  ],
  "desktop platform matrix changed without updating the release record"
);

const github = JSON.parse(execFileSync("gh", [
  "api",
  `repos/mdbase-dev/mdbase-connect/releases?per_page=100`,
  "--jq",
  `.[] | select(.tag_name == "${release.tag}")`
], { encoding: "utf8" }));
assert.ok(github, "selected GitHub release must exist");
assert.equal(github.draft, false, "selected GitHub release must be published");
const channelAsset = github.assets.find((asset) => asset.name === "mdbase-connect-channel-v1.json");
assert.ok(channelAsset, "selected signed channel manifest must exist");
const channel = JSON.parse(execFileSync("gh", [
  "api",
  "-H",
  "Accept: application/octet-stream",
  `repos/mdbase-dev/mdbase-connect/releases/assets/${channelAsset.id}`
], { encoding: "utf8" }));
const sdkResponse = await fetch(`https://registry.npmjs.org/@mdbase-dev%2fconnect/${release.sdkVersion}`, {
  headers: { accept: "application/json" }
});
assert.equal(sdkResponse.status, 200, "selected SDK package must exist");
assert.equal(channel.version, release.version, "channel manifest version differs from website");
assert.equal(channel.tag, release.tag, "channel manifest tag differs from website");
assert.equal(channel.release_url, release.releaseUrl, "channel manifest release link differs from website");

const publishedAssets = new Map(github.assets.map((asset) => [asset.name, asset.size]));
for (const artifact of artifacts) {
  assert.equal(publishedAssets.get(artifact.file), artifact.size, `${artifact.file} differs from the published release`);
}

const sdk = await sdkResponse.json();
assert.equal(sdk.version, release.sdkVersion, "registry returned a different SDK version");
const tagRef = JSON.parse(execFileSync("gh", [
  "api",
  `repos/mdbase-dev/mdbase-connect/git/ref/tags/${release.tag}`
], { encoding: "utf8" }));
const tagTarget = tagRef.object.type === "tag"
  ? JSON.parse(execFileSync("gh", [
      "api",
      `repos/mdbase-dev/mdbase-connect/git/tags/${tagRef.object.sha}`
    ], { encoding: "utf8" })).object
  : tagRef.object;
assert.equal(tagTarget.type, "commit", "release tag must resolve to a commit");
assert.equal(tagTarget.sha, release.sourceRevision, "released documentation source differs from the tag");
console.log(`Connect release record verified: ${release.version}, ${artifacts.length} artifacts, SDK ${release.sdkVersion}.`);
