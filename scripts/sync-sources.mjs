import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const connectDir = resolve(process.env.MDBASE_CONNECT_DIR ?? join(root, "..", "mdbase-connect"));
const specDir = resolve(process.env.MDBASE_SPEC_DIR ?? join(root, "..", "mdbase-spec"));
const rustDir = resolve(process.env.MDBASE_RS_DIR ?? join(root, "..", "mdbase-rs"));
const typescriptDir = resolve(process.env.MDBASE_TS_DIR ?? join(root, "..", "mdbase"));

const schemaSource = join(connectDir, "packages", "protocol", "schemas");
const schemaDestination = join(root, "public", "connect", "schemas");
required(schemaSource, "Connect protocol schemas");
mkdirSync(schemaDestination, { recursive: true });
cpSync(schemaSource, schemaDestination, { recursive: true, force: true });
copyAlias("mdbase-app.schema.json", "mdbase-app.v1.json");

const manifest = yaml(join(specDir, "tests", "v0.3", "manifest.yaml"));
const claims = [
  yaml(join(rustDir, "conformance", "v0.3.0-rc.1.yml")),
  yaml(join(typescriptDir, "conformance", "v0.3.0-rc.1.yml"))
];

const conformance = {
  generated_at: new Date().toISOString().slice(0, 10),
  spec_version: manifest.spec_version,
  implementations: claims.map((claim) => {
    const verifiedAt = claim.evidence
      .map((entry) => entry.verified_at)
      .filter(Boolean)
      .sort()
      .at(-1);
    const isRust = claim.implementation.id === "mdbase-rs";
    return {
      name: claim.implementation.id === "mdbase-ts" ? "mdbase" : claim.implementation.id,
      language: claim.implementation.language,
      version: claim.implementation.version,
      repository: claim.implementation.url,
      evidence_date: verifiedAt ? String(verifiedAt).slice(0, 10) : null,
      profiles: claim.profiles ?? [],
      optional_features: claim.optional_features ?? [],
      workflow_execution: claim.limits?.runtime_execution === true,
      note: isRust
        ? "The Rust workflow engine exists, but workflow/0.1 is not advertised until shared fixture evidence is published."
        : "Claims reflect the machine-readable implementation evidence, not legacy conformance levels."
    };
  }),
  coverage: {
    coverage_complete: manifest.claim_profiles
      .filter((profile) => profile.status === "coverage_complete")
      .map((profile) => profile.id),
    draft: manifest.claim_profiles
      .filter((profile) => profile.status !== "coverage_complete")
      .map((profile) => profile.id)
  }
};

writeFileSync(
  join(root, "src", "data", "conformance.json"),
  `${JSON.stringify(conformance, null, 2)}\n`
);

console.log(`Copied Connect schemas from ${schemaSource}`);
console.log(`Generated conformance data from ${claims.length} implementation claims`);

function yaml(path) {
  required(path, "YAML source");
  return parse(readFileSync(path, "utf8"));
}

function required(path, label) {
  if (!existsSync(path)) {
    throw new Error(`${label} is missing: ${path}`);
  }
}

function copyAlias(source, destination) {
  cpSync(
    join(schemaSource, source),
    join(schemaDestination, destination),
    { force: true }
  );
}
