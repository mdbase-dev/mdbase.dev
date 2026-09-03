import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function verifyNpmPackageSignatures(version, parentDirectory) {
  const directory = join(parentDirectory, "npm-signature-audit");
  mkdirSync(directory, { recursive: false });
  writeFileSync(join(directory, "package.json"), `${JSON.stringify({
    name: "mdbase-connect-release-verification",
    version: "1.0.0",
    private: true,
    dependencies: { "@mdbase-dev/connect": version }
  }, null, 2)}\n`);
  execFileSync("npm", [
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--save-exact",
    "--registry=https://registry.npmjs.org"
  ], { cwd: directory, stdio: ["ignore", "ignore", "inherit"] });
  execFileSync("npm", ["audit", "signatures"], {
    cwd: directory,
    stdio: ["ignore", "inherit", "inherit"]
  });
}
