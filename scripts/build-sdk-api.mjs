// Builds src/data/sdk-api.json, the data behind /sdk/api/, from the type
// declarations of the published @mdbase-dev/sdk package that the Worklog
// example installs. Signatures, members and descriptions are read from the
// declarations; this file chooses only which entry points and names are shown
// in full.
//
//   node scripts/build-sdk-api.mjs           write src/data/sdk-api.json
//   node scripts/build-sdk-api.mjs --check   fail if the committed file is stale
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "src", "data", "sdk-api.json");
const packageDir = join(root, "examples", "worklog", "node_modules", "@mdbase-dev", "sdk");

// Entry points an app imports from, in reading order, with the names shown in
// full on the page. Every other export is listed by name in the index.
const ENTRIES = [
  {
    specifier: "@mdbase-dev/sdk",
    title: "Core",
    featured: [
      "createMdbase",
      "Mdbase",
      "MdbaseApplicationDeclaration",
      "MdbaseConnectOptions",
      "MdbaseSnapshot",
      "MdbasePhase",
      "MdbaseApplicationConnection",
      "MdbaseSetupPlan",
      "MdbaseSetupResult",
      "MdbaseAccessRequest",
      "MdbaseAccessResult",
      "MdbaseTransferPlan",
      "connect",
      "ClientOptions",
      "MdbaseClient",
      "Query",
      "CreateInput",
      "UpdateInput",
      "WriteOptions",
      "Write",
      "SaveResult",
      "LiveQuery",
      "RecordView",
      "Receipt",
      "MdbaseError",
      "isMdbaseError",
      "summarizeStatus",
    ],
  },
  {
    specifier: "@mdbase-dev/sdk/describe",
    title: "Problem descriptions",
    featured: ["describeError", "describeDiagnostic", "MdbaseErrorDescription", "MdbaseErrorAction"],
  },
  {
    specifier: "@mdbase-dev/sdk/testing",
    title: "Testing",
    featured: ["MemoryReplica", "createApplicationFixture"],
  },
  { specifier: "@mdbase-dev/sdk/node", title: "Node connectors", featured: [] },
  { specifier: "@mdbase-dev/sdk/manifest", title: "Manifest", featured: [] },
  { specifier: "@mdbase-dev/sdk/notifications", title: "Notifications", featured: [] },
  { specifier: "@mdbase-dev/sdk/account", title: "Account keys", featured: [] },
  { specifier: "@mdbase-dev/sdk/app-grant", title: "App grants", featured: [] },
];

if (!existsSync(join(packageDir, "package.json"))) {
  throw new Error(
    `Missing ${packageDir}. Run npm ci in examples/worklog first: the API reference is read from the SDK it installs.`,
  );
}

const pkg = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
const entryFile = (specifier) => {
  const key = specifier === pkg.name ? "." : `.${specifier.slice(pkg.name.length)}`;
  const types = pkg.exports?.[key]?.types;
  if (!types) throw new Error(`${pkg.name}@${pkg.version} has no entry point ${key}`);
  return join(packageDir, types);
};

const program = ts.createProgram(
  ENTRIES.map((entry) => entryFile(entry.specifier)),
  {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
    skipLibCheck: true,
    noEmit: true,
    types: [],
  },
);
const checker = program.getTypeChecker();

const KINDS = new Map([
  [ts.SyntaxKind.FunctionDeclaration, "function"],
  [ts.SyntaxKind.ClassDeclaration, "class"],
  [ts.SyntaxKind.InterfaceDeclaration, "interface"],
  [ts.SyntaxKind.TypeAliasDeclaration, "type"],
  [ts.SyntaxKind.EnumDeclaration, "enum"],
  [ts.SyntaxKind.VariableDeclaration, "constant"],
  [ts.SyntaxKind.ModuleDeclaration, "namespace"],
]);

const oneLine = (text) => text.replace(/\s+/g, " ").trim();
const docs = (symbol) =>
  ts
    .displayPartsToString(symbol.getDocumentationComment(checker))
    .replace(/\{@link\s+([^}\s]+)[^}]*\}/g, "`$1`")
    .replace(/\r/g, "")
    .trim();
const deprecated = (symbol) => {
  const tag = symbol.getJsDocTags(checker).find((item) => item.name === "deprecated");
  return tag ? oneLine(ts.displayPartsToString(tag.text)) || true : undefined;
};

/** The declaration as written, without the `export declare` prefix or a body's worth of comments. */
function declarationText(node) {
  const statement = ts.isVariableDeclaration(node) ? node.parent.parent : node;
  return statement
    .getText()
    .replace(/^export\s+/, "")
    .replace(/^declare\s+/, "");
}

function hidden(member) {
  const flags = ts.getCombinedModifierFlags(member);
  if (flags & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) return true;
  const name = member.name?.getText() ?? "";
  return name.startsWith("_") || name.startsWith("#");
}

function memberList(node) {
  const members = [];
  for (const member of node.members ?? []) {
    if (hidden(member)) continue;
    const symbol = member.name ? checker.getSymbolAtLocation(member.name) : undefined;
    const name = ts.isConstructorDeclaration(member) ? "constructor" : (member.name?.getText() ?? "");
    if (!name) continue;
    const item = {
      name,
      signature: oneLine(member.getText().replace(/;$/, "")),
      description: symbol ? docs(symbol) : "",
    };
    const marked = symbol ? deprecated(symbol) : undefined;
    if (marked) item.deprecated = marked;
    members.push(item);
  }
  return members;
}

function describeExport(exported, featured) {
  const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
  const declarations = symbol.declarations ?? [];
  // A name that is both a value and a type (a class, or a const beside an
  // interface) is described by its richest declaration.
  const node =
    declarations.find((item) => ts.isClassDeclaration(item)) ??
    declarations.find((item) => ts.isFunctionDeclaration(item)) ??
    declarations.find((item) => ts.isInterfaceDeclaration(item)) ??
    declarations[0];
  if (!node) return null;
  const item = {
    name: exported.name,
    kind: KINDS.get(node.kind) ?? "value",
    description: docs(symbol),
  };
  const marked = deprecated(symbol);
  if (marked) item.deprecated = marked;
  if (!featured) return item;

  if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
    const heritage = (node.heritageClauses ?? []).map((clause) => oneLine(clause.getText())).join(" ");
    const parameters = node.typeParameters?.length
      ? `<${node.typeParameters.map((parameter) => parameter.getText()).join(", ")}>`
      : "";
    item.signature = oneLine(`${item.kind} ${exported.name}${parameters} ${heritage}`);
    item.members = memberList(node);
  } else if (ts.isFunctionDeclaration(node)) {
    // Overloads are separate declarations of the same symbol.
    item.signature = declarations
      .filter((declaration) => ts.isFunctionDeclaration(declaration))
      .map(declarationText)
      .join("\n");
  } else {
    item.signature = declarationText(node);
  }
  return item;
}

const entries = ENTRIES.map((entry) => {
  const source = program.getSourceFile(entryFile(entry.specifier));
  const module = source && checker.getSymbolAtLocation(source);
  if (!module) throw new Error(`Cannot read the exports of ${entry.specifier}`);
  const exported = new Map(checker.getExportsOfModule(module).map((symbol) => [symbol.name, symbol]));
  const missing = entry.featured.filter((name) => !exported.has(name));
  if (missing.length) {
    throw new Error(`${entry.specifier} no longer exports ${missing.join(", ")}; update ENTRIES in ${import.meta.url}`);
  }
  const featured = entry.featured.map((name) => describeExport(exported.get(name), true));
  const featuredNames = new Set(entry.featured);
  const index = [...exported.values()]
    .filter((symbol) => !featuredNames.has(symbol.name))
    .map((symbol) => describeExport(symbol, false))
    .filter(Boolean)
    .map((item) => ({ ...item, description: firstSentence(item.description) }))
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
  return { specifier: entry.specifier, title: entry.title, featured, index };
});

// Error codes with the recovery each one names, read from the type of the
// exported ERROR_CODES constant.
function errorCodes() {
  const source = program.getSourceFile(entryFile(pkg.name));
  const symbol = checker.getExportsOfModule(checker.getSymbolAtLocation(source)).find((item) => item.name === "ERROR_CODES");
  if (!symbol) throw new Error(`${pkg.name} no longer exports ERROR_CODES`);
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const type = checker.getTypeOfSymbolAtLocation(target, target.valueDeclaration);
  return type.getProperties().map((property) => {
    const recovery = checker.getTypeOfSymbolAtLocation(property, target.valueDeclaration);
    if (!recovery.isStringLiteral()) throw new Error(`ERROR_CODES.${property.name} is not a literal recovery`);
    return { code: property.name, recovery: recovery.value };
  });
}

function firstSentence(text) {
  const paragraph = oneLine(text.split(/\n\s*\n/)[0] ?? "");
  const end = paragraph.search(/[.:;](\s|$)/);
  return end === -1 ? paragraph : paragraph.slice(0, end + 1).replace(/[:;]$/, ".");
}

const data = `${JSON.stringify({ package: pkg.name, version: pkg.version, entries, errors: errorCodes() }, null, 2)}\n`;

if (process.argv.includes("--check")) {
  if (!existsSync(output) || readFileSync(output, "utf8") !== data) {
    console.error(
      "src/data/sdk-api.json does not match the SDK in examples/worklog. Run node scripts/build-sdk-api.mjs and commit the result.",
    );
    process.exit(1);
  }
  console.log(`sdk-api.json matches ${pkg.name}@${pkg.version}`);
} else {
  writeFileSync(output, data);
  const count = entries.reduce((total, entry) => total + entry.featured.length + entry.index.length, 0);
  console.log(`Wrote ${count} exports of ${pkg.name}@${pkg.version} to src/data/sdk-api.json`);
}
