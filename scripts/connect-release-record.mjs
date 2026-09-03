import assert from "node:assert/strict";

const CONNECT_REPOSITORY = "mdbase-dev/mdbase-connect";
const CHANNEL_NAME = "mdbase-connect-channel-v1.json";

export function buildConnectReleaseRecord({ tag, sourceRevision, release, channel, npmVersion }) {
  const version = versionFromTag(tag);
  assert.equal(release.tag_name, tag, "GitHub release tag differs from requested tag");
  assert.equal(release.draft, false, "GitHub release is still a draft");
  assert.equal(release.prerelease, version.includes("-"), "GitHub release type differs from semantic version");
  assert.equal(channel.schema_version, 1, "unsupported channel manifest schema");
  assert.equal(channel.version, version, "channel manifest version differs from tag");
  assert.equal(channel.tag, tag, "channel manifest tag differs from requested tag");
  assert.equal(channel.channel, version.includes("-") ? "beta" : "stable", "channel differs from semantic version");
  assert.equal(channel.release_url, `https://github.com/${CONNECT_REPOSITORY}/releases/tag/${tag}`, "channel release URL differs from tag");
  assert.equal(npmVersion, version, "published SDK version differs from client release");
  assert.match(sourceRevision, /^[0-9a-f]{40}$/, "release source must be a full commit SHA");
  assert.ok(Number.isFinite(Date.parse(release.published_at)), "GitHub release has no publication time");

  const assets = release.assets ?? [];
  const desktop = [
    websiteArtifact(assets, version, "macOS", "Apple Silicon", /^mdbase-connect-.+-macos-arm64(?:-UNSIGNED)?\.dmg$/, macTrust(channel.channel), "Download for Apple Silicon"),
    websiteArtifact(assets, version, "macOS", "Intel", /^mdbase-connect-.+-macos-x64(?:-UNSIGNED)?\.dmg$/, macTrust(channel.channel), "Download for Intel"),
    websiteArtifact(assets, version, "Windows", "64-bit", /^mdbase-connect-.+-windows-x64(?:-UNSIGNED)?-Setup\.exe$/, "Unsigned beta preview", "Download for Windows"),
    websiteArtifact(assets, version, "Linux", "64-bit Debian or Ubuntu", /^mdbase-connect-.+-linux-x64\.deb$/, "DEB package", "Download DEB"),
    websiteArtifact(assets, version, "Linux", "64-bit Fedora, RHEL, or compatible", /^mdbase-connect-.+-linux-x64\.rpm$/, "RPM package", "Download RPM")
  ];
  const cli = [
    websiteArtifact(assets, version, "macOS", "Apple Silicon", /^mdbase-cli-.+-macos-arm64\.tar\.gz$/, "Beta preview", "Download CLI for Apple Silicon"),
    websiteArtifact(assets, version, "macOS", "Intel", /^mdbase-cli-.+-macos-x64\.tar\.gz$/, "Beta preview", "Download CLI for Intel"),
    websiteArtifact(assets, version, "Windows", "64-bit", /^mdbase-cli-.+-windows-x64(?:-UNSIGNED)?\.tar\.gz$/, "Unsigned beta preview", "Download CLI for Windows"),
    websiteArtifact(assets, version, "Linux", "64-bit", /^mdbase-cli-.+-linux-x64\.tar\.gz$/, "tar.gz", "Download CLI for Linux")
  ];

  const publishedAssets = new Map(assets.map((asset) => [asset.name, asset]));
  assert.equal(publishedAssets.size, assets.length, "GitHub release contains duplicate asset names");
  const signedArtifacts = Object.values(channel.targets ?? {}).flatMap((target) =>
    Array.isArray(target?.artifacts) ? target.artifacts : []
  );
  const channelArtifacts = new Set(signedArtifacts.map((artifact) => artifact?.name));
  assert.ok(channelArtifacts.size > 0, "channel manifest has no client targets");
  assert.equal(channelArtifacts.size, signedArtifacts.length, "channel manifest contains duplicate artifacts");
  for (const artifact of signedArtifacts) {
    const published = publishedAssets.get(artifact.name);
    assert.ok(published, `${artifact.name} from the signed channel is absent from the GitHub release`);
    assert.equal(artifact.size, published.size, `${artifact.name} size differs from the signed channel`);
    assert.equal(`sha256:${artifact.sha256}`, published.digest, `${artifact.name} digest differs from the signed channel`);
    assert.equal(
      artifact.url,
      `https://github.com/${CONNECT_REPOSITORY}/releases/download/${tag}/${encodeURIComponent(artifact.name)}`,
      `${artifact.name} has a non-canonical channel URL`
    );
  }
  for (const artifact of desktop.filter(({ platform }) => platform === "Linux" || platform === "Windows")) {
    assert.ok(channelArtifacts.has(artifact.file), `${artifact.file} is absent from signed channel targets`);
  }

  return {
    schemaVersion: 1,
    channel: channel.channel,
    version,
    sdkVersion: version,
    tag,
    sourceRevision,
    publishedAt: release.published_at,
    releaseUrl: channel.release_url,
    channelManifestUrl: `https://github.com/${CONNECT_REPOSITORY}/releases/download/${tag}/${CHANNEL_NAME}`,
    desktop,
    cli
  };
}

export function compareSemanticVersions(left, right) {
  const a = parseSemanticVersion(left);
  const b = parseSemanticVersion(right);
  for (const key of ["major", "minor", "patch"]) {
    if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1;
  }
  if (a.pre.length === 0 || b.pre.length === 0) {
    return a.pre.length === b.pre.length ? 0 : a.pre.length === 0 ? 1 : -1;
  }
  const length = Math.max(a.pre.length, b.pre.length);
  for (let index = 0; index < length; index += 1) {
    const x = a.pre[index];
    const y = b.pre[index];
    if (x === undefined || y === undefined) return x === y ? 0 : x === undefined ? -1 : 1;
    if (x === y) continue;
    const xNumber = /^\d+$/.test(x);
    const yNumber = /^\d+$/.test(y);
    if (xNumber && yNumber) return Number(x) < Number(y) ? -1 : 1;
    if (xNumber !== yNumber) return xNumber ? -1 : 1;
    return x < y ? -1 : 1;
  }
  return 0;
}

export function validateNpmProvenance({ version, releaseTag, sourceRevision, metadata, attestations }) {
  assert.equal(metadata.version, version, "npm registry returned a different SDK version");
  assert.equal(metadata.repository?.url, "git+https://github.com/mdbase-dev/mdbase-connect.git", "npm package has an unexpected source repository");
  assert.ok(metadata.dist?.attestations?.provenance, "npm package has no provenance attestation");
  const statements = (attestations.attestations ?? [])
    .filter((entry) => entry.predicateType === "https://slsa.dev/provenance/v1")
    .map((entry) => JSON.parse(Buffer.from(entry.bundle.dsseEnvelope.payload, "base64url").toString("utf8")));
  assert.equal(statements.length, 1, "npm package must have exactly one SLSA provenance statement");
  const definition = statements[0].predicate?.buildDefinition;
  assert.deepEqual(definition?.externalParameters?.workflow, {
    ref: `refs/tags/${releaseTag}`,
    repository: "https://github.com/mdbase-dev/mdbase-connect",
    path: ".github/workflows/publish-npm.yml"
  }, "npm provenance has an unexpected publishing workflow");
  assert.ok(
    definition?.resolvedDependencies?.some((dependency) =>
      dependency.uri === `git+https://github.com/mdbase-dev/mdbase-connect@refs/tags/${releaseTag}` &&
      dependency.digest?.gitCommit === sourceRevision
    ),
    "npm provenance is not bound to the released source commit"
  );
}

export function releaseUpdateDisposition(current, next) {
  const comparison = compareSemanticVersions(next.version, current.version);
  if (comparison < 0) return "stale";
  if (comparison > 0) return "update";
  return JSON.stringify(current) === JSON.stringify(next) ? "current" : "conflict";
}

export function versionFromTag(tag) {
  const match = typeof tag === "string" && /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(tag);
  assert.ok(match, "invalid release tag");
  assert.ok(
    !match[4]?.split(".").some((part) => /^\d+$/.test(part) && !/^(0|[1-9]\d*)$/.test(part)),
    "invalid release tag"
  );
  return tag.slice(1);
}

function parseSemanticVersion(version) {
  versionFromTag(`v${version}`);
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(version);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    pre: match[4] ? match[4].split(".") : []
  };
}

function websiteArtifact(assets, version, platform, detail, pattern, trust, label) {
  const matches = assets.filter((asset) => pattern.test(asset.name) && asset.name.includes(version));
  assert.equal(matches.length, 1, `expected exactly one ${platform} ${detail} release artifact`);
  const [{ name: file, size, digest }] = matches;
  assert.ok(Number.isSafeInteger(size) && size > 0, `${file} has an invalid size`);
  assert.match(digest, /^sha256:[0-9a-f]{64}$/, `${file} has no bounded GitHub digest`);
  return {
    platform,
    detail,
    trust: typeof trust === "function" ? trust(file) : trust,
    file,
    size,
    sha256: digest.slice("sha256:".length),
    label
  };
}

function macTrust(channel) {
  return channel === "stable" ? "Signed and notarized" : "Beta preview · not notarized";
}
