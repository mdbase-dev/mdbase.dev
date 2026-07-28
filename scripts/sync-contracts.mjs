import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractsDir = resolve(
  process.env.MDBASE_CONTRACTS_DIR ?? join(root, "..", "mdbase-contracts"),
);
const source = join(contractsDir, "dist");
const catalogPath = join(source, "catalog.json");
const destination = join(root, "public", "contracts");
const dataDestination = join(root, "src", "data", "contracts.json");

required(source, "Built contract catalog");
required(catalogPath, "Contract catalog index");

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
if (catalog.catalog_version !== 1 || !Array.isArray(catalog.contracts) || !Array.isArray(catalog.packs)) {
  throw new Error("The contract catalog has an unsupported shape.");
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true, force: true });
writeFileSync(dataDestination, `${JSON.stringify(catalog, null, 2)}\n`);

console.log(
  `Copied ${catalog.contracts.length} contract and ${catalog.packs.length} pack from ${source}`,
);

function required(path, label) {
  if (!existsSync(path)) throw new Error(`${label} is missing: ${path}`);
}

