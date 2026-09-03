import assert from "node:assert/strict";
import test from "node:test";
import { buildConnectReleaseRecord, compareSemanticVersions, releaseUpdateDisposition, validateNpmProvenance, versionFromTag } from "./connect-release-record.mjs";

const tag = "v0.1.0-beta.84";
const version = tag.slice(1);
const names = [
  `mdbase-connect-${version}-macos-arm64.dmg`,
  `mdbase-connect-${version}-macos-x64.dmg`,
  `mdbase-connect-${version}-windows-x64-UNSIGNED-Setup.exe`,
  `mdbase-connect-${version}-linux-x64.deb`,
  `mdbase-connect-${version}-linux-x64.rpm`,
  `mdbase-cli-${version}-macos-arm64.tar.gz`,
  `mdbase-cli-${version}-macos-x64.tar.gz`,
  `mdbase-cli-${version}-windows-x64-UNSIGNED.tar.gz`,
  `mdbase-cli-${version}-linux-x64.tar.gz`
];
const release = {
  tag_name: tag,
  draft: false,
  prerelease: true,
  published_at: "2026-08-23T00:00:00Z",
  assets: names.map((name, index) => ({ name, size: 1000 + index, digest: `sha256:${String(index + 1).padStart(64, "0")}` }))
};
const signedArtifact = (name) => ({
  name,
  size: release.assets.find((asset) => asset.name === name).size,
  sha256: release.assets.find((asset) => asset.name === name).digest.slice("sha256:".length),
  url: `https://github.com/mdbase-dev/mdbase-connect/releases/download/${tag}/${encodeURIComponent(name)}`
});
const channel = {
  schema_version: 1,
  version,
  tag,
  channel: "beta",
  release_url: `https://github.com/mdbase-dev/mdbase-connect/releases/tag/${tag}`,
  targets: {
    "linux-x64": { artifacts: [signedArtifact(names[3]), signedArtifact(names[4])] },
    "win32-x64": { artifacts: [signedArtifact(names[2])] }
  }
};

function build(overrides = {}) {
  return buildConnectReleaseRecord({
    tag,
    sourceRevision: "a".repeat(40),
    release,
    channel,
    npmVersion: version,
    ...overrides
  });
}

test("derives the website record from verified release evidence", () => {
  const record = build();
  assert.equal(record.version, version);
  assert.equal(record.channel, "beta");
  assert.equal(record.desktop.length, 5);
  assert.equal(record.cli.length, 4);
  assert.equal(record.desktop[0].file, names[0]);
  assert.equal(record.cli[3].size, 1008);
  assert.equal(record.cli[3].sha256, String(9).padStart(64, "0"));
  assert.equal(record.channelManifestUrl, `https://github.com/mdbase-dev/mdbase-connect/releases/download/${tag}/mdbase-connect-channel-v1.json`);
});

test("rejects inconsistent release evidence and duplicate artifacts", () => {
  assert.throws(() => build({ npmVersion: "0.1.0-beta.83" }), /SDK version/);
  assert.throws(() => build({ channel: { ...channel, tag: "v0.1.0-beta.83" } }), /manifest tag/);
  const wrongDigest = structuredClone(channel);
  wrongDigest.targets["linux-x64"].artifacts[0].sha256 = "f".repeat(64);
  assert.throws(() => build({ channel: wrongDigest }), /digest differs from the signed channel/);
  assert.throws(() => build({ release: { ...release, assets: [...release.assets, release.assets[0]] } }), /exactly one macOS Apple Silicon/);
});

test("orders semantic versions including prereleases", () => {
  assert.equal(compareSemanticVersions("0.1.0-beta.9", "0.1.0-beta.10"), -1);
  assert.equal(compareSemanticVersions("0.1.0", "0.1.0-beta.99"), 1);
  assert.equal(compareSemanticVersions("1.0.0", "1.0.0"), 0);
  assert.equal(compareSemanticVersions("1.0.0-beta-2", "1.0.0-beta-1"), 1);
  assert.throws(() => versionFromTag("latest"), /invalid release tag/);
  assert.throws(() => versionFromTag("v1.0.0-beta.01"), /invalid release tag/);
});

test("binds npm provenance to the release tag and source commit", () => {
  const sourceRevision = "a".repeat(40);
  const statement = {
    predicate: {
      buildDefinition: {
        externalParameters: {
          workflow: {
            ref: `refs/tags/${tag}`,
            repository: "https://github.com/mdbase-dev/mdbase-connect",
            path: ".github/workflows/publish-npm.yml"
          }
        },
        resolvedDependencies: [{
          uri: `git+https://github.com/mdbase-dev/mdbase-connect@refs/tags/${tag}`,
          digest: { gitCommit: sourceRevision }
        }]
      }
    }
  };
  const evidence = {
    version,
    releaseTag: tag,
    sourceRevision,
    metadata: {
      version,
      repository: { url: "git+https://github.com/mdbase-dev/mdbase-connect.git" },
      dist: { attestations: { provenance: {} } }
    },
    attestations: {
      attestations: [{
        predicateType: "https://slsa.dev/provenance/v1",
        bundle: { dsseEnvelope: { payload: Buffer.from(JSON.stringify(statement)).toString("base64url") } }
      }]
    }
  };
  validateNpmProvenance(evidence);
  assert.throws(
    () => validateNpmProvenance({ ...evidence, sourceRevision: "b".repeat(40) }),
    /not bound to the released source commit/
  );
});

test("classifies idempotent, stale, newer, and conflicting updates", () => {
  const current = build();
  assert.equal(releaseUpdateDisposition(current, structuredClone(current)), "current");
  assert.equal(releaseUpdateDisposition(current, { ...current, version: "0.1.0-beta.83" }), "stale");
  assert.equal(releaseUpdateDisposition(current, { ...current, version: "0.1.0-beta.85" }), "update");
  assert.equal(releaseUpdateDisposition(current, { ...current, publishedAt: "different" }), "conflict");
});
