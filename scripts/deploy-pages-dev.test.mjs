import assert from "node:assert/strict";
import test from "node:test";

import {
  deployDevelopmentSite,
  developmentDeployment,
  developmentDeploymentEnvironment,
} from "./deploy-pages-dev.mjs";

test("uses the permanent development Pages origin", () => {
  assert.deepEqual(developmentDeploymentEnvironment({ EXISTING: "kept" }), {
    EXISTING: "kept",
    MDBASE_SITE_ORIGIN: "https://mdbase-dev.pages.dev",
  });
});

test("builds, checks, and deploys only the Pages production branch", async () => {
  const calls = [];
  let prepared = false;
  let buildVerified = false;
  let deploymentVerified = false;

  await deployDevelopmentSite(
    {},
    {
      run: async (command, arguments_, environment) => {
        calls.push({ command, arguments_, environment });
      },
      prepareBuild: async () => {
        prepared = true;
      },
      verifyBuild: async () => {
        buildVerified = true;
      },
      verifyDeployment: async () => {
        deploymentVerified = true;
      },
    },
  );

  assert.equal(prepared, true);
  assert.equal(buildVerified, true);
  assert.equal(deploymentVerified, true);
  assert.deepEqual(
    calls.slice(0, 3).map(({ arguments_ }) => arguments_),
    [["build"], ["import:spec"], ["check:links"]],
  );
  assert.ok(
    calls[3].arguments_.includes(
      `wrangler@${developmentDeployment.wranglerVersion}`,
    ),
  );
  assert.ok(calls[3].arguments_.includes("--project-name=mdbase-dev"));
  assert.ok(calls[3].arguments_.includes("--branch=main"));
  assert.equal(
    calls.every(
      ({ environment }) =>
        environment.MDBASE_SITE_ORIGIN === developmentDeployment.siteOrigin,
    ),
    true,
  );
});
