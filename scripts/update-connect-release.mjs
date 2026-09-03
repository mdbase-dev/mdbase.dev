#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, open, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { buildConnectReleaseRecord, releaseUpdateDisposition, validateNpmProvenance, versionFromTag } from "./connect-release-record.mjs";
import { verifyNpmPackageSignatures } from "./verify-npm-release.mjs";

const repository = "mdbase-dev/mdbase-connect";
const tag = process.argv[2];
versionFromTag(tag);
const root = resolve(import.meta.dirname, "..");
const releasePath = join(root, "src", "data", "connect-release.json");
const sourcesPath = join(root, "site-sources.json");
const work = await mkdtemp(join(tmpdir(), "mdbase-connect-release-"));

try {
  const release = ghJson(`repos/${repository}/releases/tags/${encodeURIComponent(tag)}`);
  assert.equal(release.draft, false, "GitHub release is still a draft");
  const sourceRevision = resolveTagCommit(tag);
  const channelPath = join(work, "mdbase-connect-channel-v1.json");
  const bundlePath = `${channelPath}.sigstore.json`;
  await writeFile(channelPath, downloadAsset(release, "mdbase-connect-channel-v1.json"));
  await writeFile(bundlePath, downloadAsset(release, "mdbase-connect-channel-v1.json.sigstore.json"));

  execFileSync("cosign", [
    "verify-blob",
    "--bundle", bundlePath,
    "--certificate-identity", `https://github.com/${repository}/.github/workflows/desktop-release.yml@refs/tags/${tag}`,
    "--certificate-oidc-issuer", "https://token.actions.githubusercontent.com",
    "--certificate-github-workflow-sha", sourceRevision,
    channelPath
  ], { stdio: ["ignore", "ignore", "inherit"] });

  const channel = JSON.parse(await readFile(channelPath, "utf8"));
  const npmVersion = await waitForSdk(versionFromTag(tag), tag, sourceRevision);
  const next = buildConnectReleaseRecord({ tag, sourceRevision, release, channel, npmVersion });
  const current = JSON.parse(await readFile(releasePath, "utf8"));
  const disposition = releaseUpdateDisposition(current, next);

  if (disposition === "stale") {
    console.log(`Ignoring stale Connect release ${tag}; the website already records ${current.tag}.`);
    process.exitCode = 0;
  } else if (disposition === "current") {
    console.log(`The website already records ${tag}.`);
    process.exitCode = 0;
  } else if (disposition === "conflict") {
    throw new Error(`The website already records ${tag} with different release evidence.`);
  } else {
    await verifyDownloadArtifacts(release, next, sourceRevision);
    const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
    assert.equal(sources.connect.repository, repository, "unexpected Connect source repository");
    sources.connect.ref = sourceRevision;
    await writeFile(releasePath, `${JSON.stringify(next, null, 2)}\n`);
    await writeFile(sourcesPath, `${JSON.stringify(sources, null, 2)}\n`);
    console.log(`Updated website release records for ${tag}.`);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}

function ghJson(endpoint) {
  return JSON.parse(execFileSync("gh", ["api", endpoint], { encoding: "utf8" }));
}

function downloadAsset(release, name) {
  const matches = release.assets.filter((asset) => asset.name === name);
  assert.equal(matches.length, 1, `expected exactly one ${name} release asset`);
  return execFileSync("gh", [
    "api", "-H", "Accept: application/octet-stream",
    `repos/${repository}/releases/assets/${matches[0].id}`
  ], { encoding: "buffer", maxBuffer: 20 * 1024 * 1024 });
}

async function verifyDownloadArtifacts(release, record, sourceRevision) {
  for (const artifact of [...record.desktop, ...record.cli]) {
    const artifactPath = join(work, artifact.file);
    const bundlePath = `${artifactPath}.sigstore.json`;
    await downloadAssetTo(release, artifact.file, artifactPath);
    await writeFile(bundlePath, downloadAsset(release, `${artifact.file}.sigstore.json`));
    execFileSync("cosign", [
      "verify-blob",
      "--bundle", bundlePath,
      "--certificate-identity", `https://github.com/${repository}/.github/workflows/desktop-release.yml@refs/tags/${tag}`,
      "--certificate-oidc-issuer", "https://token.actions.githubusercontent.com",
      "--certificate-github-workflow-sha", sourceRevision,
      artifactPath
    ], { stdio: ["ignore", "ignore", "inherit"] });
    await rm(artifactPath, { force: true });
    await rm(bundlePath, { force: true });
  }
}

async function downloadAssetTo(release, name, path) {
  const matches = release.assets.filter((asset) => asset.name === name);
  assert.equal(matches.length, 1, `expected exactly one ${name} release asset`);
  const output = await open(path, "wx");
  try {
    execFileSync("gh", [
      "api", "-H", "Accept: application/octet-stream",
      `repos/${repository}/releases/assets/${matches[0].id}`
    ], { stdio: ["ignore", output.fd, "inherit"] });
  } finally {
    await output.close();
  }
}

function resolveTagCommit(releaseTag) {
  const reference = ghJson(`repos/${repository}/git/ref/tags/${encodeURIComponent(releaseTag)}`);
  const target = reference.object.type === "tag"
    ? ghJson(`repos/${repository}/git/tags/${reference.object.sha}`).object
    : reference.object;
  assert.equal(target.type, "commit", "release tag does not resolve to a commit");
  return target.sha;
}

async function waitForSdk(version, releaseTag, sourceRevision) {
  const attempts = Number(process.env.MDBASE_RELEASE_NPM_ATTEMPTS ?? "1");
  const delayMs = Number(process.env.MDBASE_RELEASE_NPM_DELAY_MS ?? "60000");
  assert.ok(Number.isInteger(attempts) && attempts >= 1 && attempts <= 30, "invalid npm attempt count");
  assert.ok(Number.isInteger(delayMs) && delayMs >= 0 && delayMs <= 300000, "invalid npm retry delay");
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(`https://registry.npmjs.org/@mdbase-dev%2fconnect/${version}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(30000)
    });
    if (response.status === 200) {
      const metadata = await response.json();
      try {
        verifyNpmPackageSignatures(version, work);
        await verifyNpmProvenance(version, releaseTag, sourceRevision, metadata);
        return metadata.version;
      } catch (error) {
        await rm(join(work, "npm-signature-audit"), { recursive: true, force: true });
        if (attempt === attempts) throw error;
        console.warn(`npm provenance is not ready for ${version}; retrying (${attempt}/${attempts}).`);
      }
    } else if (response.status !== 404 || attempt === attempts) {
      throw new Error(`npm returned HTTP ${response.status} for @mdbase-dev/connect@${version}`);
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
  }
  throw new Error("npm publication did not become visible");
}

async function verifyNpmProvenance(version, releaseTag, sourceRevision, metadata) {
  assert.equal(metadata.repository?.url, "git+https://github.com/mdbase-dev/mdbase-connect.git", "npm package has an unexpected source repository");
  assert.ok(metadata.dist?.attestations?.provenance, "npm package has no provenance attestation");
  const response = await fetch(`https://registry.npmjs.org/-/npm/v1/attestations/@mdbase-dev%2fconnect@${version}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(30000)
  });
  assert.equal(response.status, 200, "npm provenance request failed");
  validateNpmProvenance({
    version,
    releaseTag,
    sourceRevision,
    metadata,
    attestations: await response.json()
  });
}
