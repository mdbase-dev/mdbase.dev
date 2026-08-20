import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const developmentDeployment = Object.freeze({
  siteOrigin: "https://mdbase-dev.pages.dev",
  project: "mdbase-dev",
  branch: "main",
  wranglerVersion: "4.120.0",
});

const projectRoot = resolve(import.meta.dirname, "..");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await deployDevelopmentSite(process.env);
}

export function developmentDeploymentEnvironment(environment) {
  return {
    ...environment,
    MDBASE_SITE_ORIGIN: developmentDeployment.siteOrigin,
  };
}

export async function deployDevelopmentSite(
  environment,
  dependencies = {
    run: runCommand,
    prepareBuild: prepareDevelopmentBuild,
    verifyBuild: verifyDevelopmentBuild,
    verifyDeployment: verifyLiveDeployment,
  },
) {
  const deploymentEnvironment = developmentDeploymentEnvironment(environment);

  await dependencies.run(pnpm, ["build"], deploymentEnvironment);
  await dependencies.run(pnpm, ["import:spec"], deploymentEnvironment);
  await dependencies.prepareBuild();
  await dependencies.run(pnpm, ["check:links"], deploymentEnvironment);
  await dependencies.verifyBuild();

  await dependencies.run(
    pnpm,
    [
      "dlx",
      `wrangler@${developmentDeployment.wranglerVersion}`,
      "pages",
      "deploy",
      "dist",
      `--project-name=${developmentDeployment.project}`,
      `--branch=${developmentDeployment.branch}`,
      "--commit-dirty=true",
    ],
    deploymentEnvironment,
  );
  await dependencies.verifyDeployment();

  console.log(
    `Development mdbase.dev deployed: ${developmentDeployment.siteOrigin}/`,
  );
}

export async function prepareDevelopmentBuild() {
  await Promise.all([
    writeFile(
      resolve(projectRoot, "dist", "robots.txt"),
      "User-agent: *\nDisallow: /\n",
    ),
    writeFile(
      resolve(projectRoot, "dist", "_headers"),
      "/*\n  X-Robots-Tag: noindex, nofollow\n",
    ),
  ]);
}

export async function verifyDevelopmentBuild() {
  const [homepage, specification, sitemap, robots, headers] = await Promise.all(
    [
      readFile(resolve(projectRoot, "dist", "index.html"), "utf8"),
      readFile(resolve(projectRoot, "dist", "spec", "index.html"), "utf8"),
      readFile(resolve(projectRoot, "dist", "sitemap-0.xml"), "utf8"),
      readFile(resolve(projectRoot, "dist", "robots.txt"), "utf8"),
      readFile(resolve(projectRoot, "dist", "_headers"), "utf8"),
    ],
  );

  verifyCanonical(homepage, `${developmentDeployment.siteOrigin}/`, "homepage");
  verifyCanonical(
    specification,
    `${developmentDeployment.siteOrigin}/spec/`,
    "specification",
  );
  if (
    !sitemap.includes(`<loc>${developmentDeployment.siteOrigin}/</loc>`) ||
    !sitemap.includes(`<loc>${developmentDeployment.siteOrigin}/spec/</loc>`)
  ) {
    throw new Error("Development sitemap does not declare the staging origin.");
  }
  if (
    !robots.includes("Disallow: /") ||
    !headers.includes("X-Robots-Tag: noindex")
  ) {
    throw new Error("Development deployment is missing its indexing controls.");
  }
}

async function verifyLiveDeployment() {
  let lastError;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const [homepageResponse, specificationResponse, robotsResponse] =
        await Promise.all([
          fetch(`${developmentDeployment.siteOrigin}/?attempt=${attempt}`, {
            cache: "no-store",
          }),
          fetch(
            `${developmentDeployment.siteOrigin}/spec/?attempt=${attempt}`,
            {
              cache: "no-store",
            },
          ),
          fetch(
            `${developmentDeployment.siteOrigin}/robots.txt?attempt=${attempt}`,
            {
              cache: "no-store",
            },
          ),
        ]);
      for (const [label, response] of [
        ["homepage", homepageResponse],
        ["specification", specificationResponse],
        ["robots.txt", robotsResponse],
      ]) {
        if (!response.ok)
          throw new Error(`${label} returned HTTP ${response.status}`);
      }

      verifyCanonical(
        await homepageResponse.text(),
        `${developmentDeployment.siteOrigin}/`,
        "homepage",
      );
      verifyCanonical(
        await specificationResponse.text(),
        `${developmentDeployment.siteOrigin}/spec/`,
        "specification",
      );
      if (!(await robotsResponse.text()).includes("Disallow: /")) {
        throw new Error("robots.txt does not disallow indexing.");
      }
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 12) await delay(5_000);
    }
  }
  throw new Error(
    `mdbase.dev development deployment verification failed: ${String(lastError)}`,
  );
}

function verifyCanonical(document, expected, label) {
  if (!document.includes(`<link rel="canonical" href="${expected}">`)) {
    throw new Error(`Development ${label} does not declare ${expected}.`);
  }
}

async function runCommand(command, arguments_, environment) {
  const child = spawn(command, arguments_, {
    cwd: projectRoot,
    env: environment,
    stdio: "inherit",
  });
  const exitCode = await new Promise((resolveExit, rejectExit) => {
    child.once("error", rejectExit);
    child.once("exit", (code, signal) => {
      if (signal) rejectExit(new Error(`${command} was stopped by ${signal}.`));
      else resolveExit(code);
    });
  });
  if (exitCode !== 0) {
    throw new Error(
      `${command} ${arguments_.join(" ")} exited with code ${exitCode}.`,
    );
  }
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}
