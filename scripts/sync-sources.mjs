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

const introductionSource = join(connectDir, "docs", "mdbase-configurations-v2.html");
required(introductionSource, "Connect introduction prototype");
const introduction = readFileSync(introductionSource, "utf8");
const introductionStyles = extract(introduction, /<style>([\s\S]*?)<\/style>/, "prototype styles");
const introductionScript = extract(
  introduction,
  /<script>([\s\S]*?)<\/script>\s*<\/body>/,
  "prototype murmuration"
);
const themedIntroductionScript = addThemeAwareCanvasPalette(introductionScript);
writeFileSync(
  join(root, "public", "mdbase-introduction.css"),
  `${introductionStyles.trim()}\n`
);
writeFileSync(
  join(root, "public", "mdbase-murmuration.js"),
  `// @ts-nocheck\n${themedIntroductionScript.trim()}\n`
);

const connectThemeSource = join(connectDir, "packages", "ui", "styles.css");
required(connectThemeSource, "Connect theme styles");
const connectTheme = readFileSync(connectThemeSource, "utf8");
const connectThemeBoundary = connectTheme.indexOf("\n*,\n*::before");
if (connectThemeBoundary === -1) {
  throw new Error("Could not extract Connect theme tokens");
}
writeFileSync(
  join(root, "public", "mdbase-theme.css"),
  `${connectTheme.slice(0, connectThemeBoundary).trim()}\n`
);
cpSync(
  join(connectDir, "apps", "portal", "public", "theme-bootstrap.js"),
  join(root, "public", "theme-bootstrap.js"),
  { force: true }
);
cpSync(
  join(root, "src", "styles", "shell.css"),
  join(root, "public", "mdbase-shell.css"),
  { force: true }
);

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
        ? "The current Rust claim records runtime_execution: false. workflow/0.1 will follow shared fixture evidence."
        : "The claim uses the machine-readable v0.3 atomic profiles."
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
console.log(`Copied the homepage design and murmuration from ${introductionSource}`);
console.log(`Copied shared theme values from ${connectThemeSource}`);
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

function extract(source, pattern, label) {
  const match = source.match(pattern);
  if (!match?.[1]) {
    throw new Error(`Could not extract ${label}`);
  }
  return match[1];
}

function addThemeAwareCanvasPalette(source) {
  const palettePattern = /      const palette = \{[\s\S]*?      \};/;
  if (!palettePattern.test(source)) {
    throw new Error("Could not find the prototype canvas palette");
  }
  const withPalette = source.replace(
    palettePattern,
    `      const palette = {
        paper: "rgb(252 252 251)",
        ink: "rgb(25 27 31)",
        muted: "rgb(111 116 124)",
        line: "rgb(204 208 213)",
        lineSoft: "rgb(226 229 232)",
        accent: "rgb(42 104 143)",
        particle: "rgb(25 27 31 / 0.88)",
        replica: "rgb(81 87 95 / 0.62)"
      };

      function syncPalette() {
        const styles = getComputedStyle(document.documentElement);
        const dark = styles.colorScheme === "dark";
        palette.paper = styles.getPropertyValue("--color-surface").trim() || palette.paper;
        palette.ink = styles.getPropertyValue("--color-text").trim() || palette.ink;
        palette.muted = styles.getPropertyValue("--color-text-muted").trim() || palette.muted;
        palette.line = styles.getPropertyValue("--color-border-strong").trim() || palette.line;
        palette.lineSoft = styles.getPropertyValue("--color-border").trim() || palette.lineSoft;
        palette.accent = styles.getPropertyValue("--color-accent").trim() || palette.accent;
        palette.particle = dark
          ? styles.getPropertyValue("--color-text-soft").trim() || palette.ink
          : "rgb(25 27 31 / 0.88)";
        palette.replica = dark
          ? styles.getPropertyValue("--color-text-muted").trim() || palette.muted
          : "rgb(81 87 95 / 0.62)";
      }`
  );
  const withParticles = withPalette
    .replace(
      '          context.strokeStyle = "rgb(81 87 95 / 0.62)";',
      "          context.strokeStyle = palette.replica;"
    )
    .replace(
      '              : "rgb(25 27 31 / 0.88)";',
      "              : palette.particle;"
    );
  if (
    !withParticles.includes("context.strokeStyle = palette.replica;")
    || !withParticles.includes(": palette.particle;")
  ) {
    throw new Error("Could not apply the theme-aware particle colors");
  }
  const initialization = "      resize();\n      updateScrollState();";
  if (!withParticles.includes(initialization)) {
    throw new Error("Could not find the prototype initialization");
  }
  const withInitialization = withParticles.replace(
    initialization,
    "      syncPalette();\n      resize();\n      updateScrollState();"
  );
  const pagehide = '      addEventListener("pagehide", stopAnimation);';
  if (!withInitialization.includes(pagehide)) {
    throw new Error("Could not find the prototype event boundary");
  }
  return withInitialization.replace(
    pagehide,
    `      addEventListener("mdbase:themechange", () => {
        syncPalette();
        buildScene(activeScene);
        if (reduceMotion) draw(0);
      });
      addEventListener("pagehide", stopAnimation);`
  );
}

function copyAlias(source, destination) {
  cpSync(
    join(schemaSource, source),
    join(schemaDestination, destination),
    { force: true }
  );
}
