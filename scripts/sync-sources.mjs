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

const interopSchemaSource = join(specDir, "schemas", "interop", "v0.1");
const interopSchemaDestination = join(root, "public", "interop", "schemas", "v0.1");
required(interopSchemaSource, "mdbase interoperability schemas");
mkdirSync(interopSchemaDestination, { recursive: true });
cpSync(interopSchemaSource, interopSchemaDestination, { recursive: true, force: true });

const runtimeSchemaSource = join(
  specDir,
  "standard-packs",
  "mdbase-runtime",
  "0.2.0",
  "schemas",
);
const runtimeSchemaDestination = join(root, "public", "runtime", "schemas", "v0.2");
required(runtimeSchemaSource, "mdbase Runtime 0.2 schemas");
mkdirSync(runtimeSchemaDestination, { recursive: true });
cpSync(runtimeSchemaSource, runtimeSchemaDestination, { recursive: true, force: true });

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
  yaml(join(rustDir, "conformance", "v0.4.0-rc.3.yml")),
  yaml(join(typescriptDir, "conformance", "v0.3.0-rc.4.yml"))
];
const runtimeClaim = yaml(
  join(rustDir, "crates", "mdbase-runtime", "conformance", "v0.3.0-rc.1.yml"),
);
const interopClaim = yaml(
  join(specDir, "packages", "interop", "conformance", "v0.1.yml")
);

const conformance = {
  generated_at: new Date().toISOString().slice(0, 10),
  spec_version: manifest.spec_version,
  implementations: [
    ...claims.map((claim) => {
      return {
        name: claim.implementation.id === "mdbase-ts" ? "mdbase" : claim.implementation.id,
        language: claim.implementation.language,
        version: claim.implementation.version,
        repository: claim.implementation.url,
        evidence_date: latestEvidenceDate(claim),
        profiles: claim.profiles ?? [],
        optional_features: claim.optional_features ?? [],
        workflow_execution: claim.limits?.runtime_execution === true,
        note: "The claim uses the machine-readable v0.3 atomic profiles."
      };
    }),
    {
      name: runtimeClaim.implementation.id,
      language: runtimeClaim.implementation.language,
      version: runtimeClaim.implementation.version,
      repository: runtimeClaim.implementation.url,
      evidence_date: latestEvidenceDate(runtimeClaim),
      profiles: runtimeClaim.profiles ?? [],
      optional_features: [],
      workflow_execution: true,
      note: `Durable Runtime ${runtimeClaim.runtime_profile_version}; interoperability ${runtimeClaim.interop_profile_version}.`,
    },
    {
      name: interopClaim.implementation.application,
      language: "TypeScript",
      version: interopClaim.implementation.version,
      repository: "https://github.com/mdbase-dev/mdbase-spec",
      evidence_date: null,
      profiles: ["event_action_interop/0.1"],
      optional_features: [],
      workflow_execution: false,
      note: `Reference ${interopClaim.transport.delivery.join(", ")} bridge; roles: ${interopClaim.roles.join(", ")}.`
    }
  ],
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
console.log(`Copied interoperability schemas from ${interopSchemaSource}`);
console.log(`Copied Runtime 0.2 schemas from ${runtimeSchemaSource}`);
console.log(`Copied the homepage design and murmuration from ${introductionSource}`);
console.log(`Copied shared theme values from ${connectThemeSource}`);
console.log(`Generated conformance data from ${claims.length + 1} implementation claims`);

function yaml(path) {
  required(path, "YAML source");
  return parse(readFileSync(path, "utf8"));
}

function latestEvidenceDate(claim) {
  const verifiedAt = claim.evidence
    .map((entry) => entry.verified_at)
    .filter(Boolean)
    .sort()
    .at(-1);
  return verifiedAt ? String(verifiedAt).slice(0, 10) : null;
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
        surface: "rgb(252 252 251)",
        surfaceSubtle: "rgb(247 248 249)",
        ink: "rgb(25 27 31)",
        soft: "rgb(68 73 80)",
        muted: "rgb(111 116 124)",
        line: "rgb(204 208 213)",
        lineSoft: "rgb(226 229 232)",
        accent: "rgb(42 104 143)",
        particle: "rgb(25 27 31 / 0.88)",
        particleIntro: "rgb(25 27 31 / 0.88)",
        replica: "rgb(81 87 95 / 0.62)"
      };

      function syncPalette() {
        const styles = getComputedStyle(document.documentElement);
        const dark = styles.colorScheme === "dark";
        palette.paper = styles.getPropertyValue("--color-surface").trim() || palette.paper;
        palette.surface = styles.getPropertyValue("--color-surface").trim() || palette.surface;
        palette.surfaceSubtle =
          styles.getPropertyValue("--color-surface-subtle").trim() || palette.surfaceSubtle;
        palette.ink = styles.getPropertyValue("--color-text").trim() || palette.ink;
        palette.soft = styles.getPropertyValue("--color-text-soft").trim() || palette.soft;
        palette.muted = styles.getPropertyValue("--color-text-muted").trim() || palette.muted;
        palette.line = dark
          ? styles.getPropertyValue("--color-text-faint").trim() || palette.muted
          : styles.getPropertyValue("--color-text-muted").trim() || palette.muted;
        palette.lineSoft = styles.getPropertyValue("--color-border").trim() || palette.lineSoft;
        palette.accent = styles.getPropertyValue("--color-accent").trim() || palette.accent;
        palette.particle = dark
          ? styles.getPropertyValue("--color-text-muted").trim() || palette.muted
          : styles.getPropertyValue("--color-text").trim() || palette.ink;
        palette.particleIntro = dark
          ? styles.getPropertyValue("--color-text-soft").trim() || palette.soft
          : styles.getPropertyValue("--color-text").trim() || palette.ink;
        palette.replica =
          styles.getPropertyValue("--color-text-muted").trim() || palette.muted;
      }`
  );
  const withEdges = replaceCanvasFunction(
    withPalette,
    /      function drawEdge\(edge, compact\) \{[\s\S]*?\n      \}\n\n      function drawEdgeLabel/,
    `      function drawEdge(edge, compact) {
        const points = edge.from;
        if (!points || points.length < 2) return;

        context.save();
        context.strokeStyle = palette.muted;
        context.globalAlpha = 0.88;
        context.lineWidth = 1;
        context.setLineDash(edge.dashed ? [4, 5] : []);
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
        context.stroke();
        context.setLineDash([]);

        const finalPoint = points[points.length - 1];
        const previousPoint = points[points.length - 2];
        const angle = Math.atan2(finalPoint.y - previousPoint.y, finalPoint.x - previousPoint.x);
        context.fillStyle = palette.muted;
        context.globalAlpha = 0.95;
        context.beginPath();
        context.moveTo(finalPoint.x, finalPoint.y);
        context.lineTo(
          finalPoint.x - Math.cos(angle - 0.48) * 6,
          finalPoint.y - Math.sin(angle - 0.48) * 6
        );
        context.lineTo(
          finalPoint.x - Math.cos(angle + 0.48) * 6,
          finalPoint.y - Math.sin(angle + 0.48) * 6
        );
        context.closePath();
        context.fill();
        context.restore();
      }

      function drawEdgeLabel`
  );
  const withEdgeLabels = replaceCanvasFunction(
    withEdges,
    /      function drawEdgeLabel\(edge, compact\) \{[\s\S]*?\n      \}\n\n      function drawNodeSurface/,
    `      function drawEdgeLabel(edge, compact) {
        const points = edge.from;
        if (!edge.label || !points || points.length < 2) return;

        const midpoint = points[Math.floor((points.length - 1) / 2)];
        const next = points[Math.floor((points.length - 1) / 2) + 1];
        const x = (midpoint.x + next.x) / 2;
        const y = (midpoint.y + next.y) / 2 - 8;
        context.save();
        context.font =
          \`\${compact ? 8 : 9}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace\`;
        const metrics = context.measureText(edge.label);
        context.fillStyle = palette.surface;
        context.fillRect(x - metrics.width / 2 - 4, y - 7, metrics.width + 8, 12);
        context.fillStyle = palette.muted;
        context.textAlign = "center";
        context.fillText(edge.label, x, y + 2);
        context.restore();
      }

      function drawNodeSurface`
  );
  const withNodeSurfaces = replaceCanvasFunction(
    withEdgeLabels,
    /      function drawNodeSurface\(node, compact\) \{[\s\S]*?\n      \}\n\n      function drawNodeLabel/,
    `      function drawNodeSurface(node, compact) {
        const { x, y, w, h } = node.box;
        context.save();

        if (node.kind === "boundary") {
          context.fillStyle = palette.surface;
          context.strokeStyle = palette.line;
          context.setLineDash([5, 5]);
        } else if (node.kind === "authority") {
          context.fillStyle = palette.surfaceSubtle;
          context.strokeStyle = palette.accent;
          context.setLineDash([]);
        } else {
          context.fillStyle =
            node.kind === "service" ? palette.surfaceSubtle : palette.surface;
          context.strokeStyle =
            node.kind === "replica" ? palette.muted : palette.line;
          context.setLineDash(node.kind === "replica" ? [4, 4] : []);
        }

        context.lineWidth = node.kind === "authority" ? 1.25 : 1;
        context.beginPath();
        context.roundRect(x, y, w, h, compact ? 3 : 5);
        context.fill();
        context.stroke();
        context.setLineDash([]);
        context.restore();
      }

      function drawNodeLabel`
  );
  const withParticles = replaceCanvasFunction(
    withNodeSurfaces,
    /      function drawParticle\(particle, compact\) \{[\s\S]*?\n      \}\n\n      function draw\(now\)/,
    `      function particleFill(particle) {
        if (particle.role === "packet" || particle.role === "metadata") {
          return palette.accent;
        }
        if (activeScene === "intro") {
          return particle.index % 17 === 0
            ? palette.accent
            : palette.particleIntro;
        }
        if (activeScene === "modes" && particle.index >= 181) {
          return palette.accent;
        }
        if (
          activeScene === "access"
          && particle.index >= 151
          && particle.index < 301
        ) {
          return palette.accent;
        }
        return palette.particle;
      }

      function drawParticle(particle, compact) {
        const baseSize = compact ? 2.5 : 3.25;
        const size =
          particle.role === "packet"
            ? baseSize * 1.5
            : baseSize * particle.scale;
        const x = Math.round(particle.x - size / 2);
        const y = Math.round(particle.y - size / 2);

        if (particle.role === "replica") {
          context.strokeStyle = palette.replica;
          context.lineWidth = 0.9;
          context.strokeRect(x, y, Math.max(1.75, size), Math.max(1.75, size));
        } else {
          context.fillStyle = particleFill(particle);
          context.fillRect(x, y, Math.max(1.75, size), Math.max(1.75, size));
        }
      }

      function draw(now)`
  );
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

function replaceCanvasFunction(source, pattern, replacement) {
  if (!pattern.test(source)) {
    throw new Error("Could not replace a prototype canvas drawing function");
  }
  return source.replace(pattern, replacement);
}

function copyAlias(source, destination) {
  cpSync(
    join(schemaSource, source),
    join(schemaDestination, destination),
    { force: true }
  );
}
