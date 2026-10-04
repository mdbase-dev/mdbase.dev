import { existsSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// The MCP tool reference is read from the gateway's own tool registrations
// through an in-memory MCP client, so the published names, descriptions,
// annotations and input schemas are exactly what an MCP host receives.

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const connectDir = resolve(process.env.MDBASE_CONNECT_DIR ?? join(root, "..", "mdbase-connect"));
const mcpDir = join(connectDir, "services", "mcp");
const built = join(mcpDir, "dist", "mcp.js");
const source = join(mcpDir, "src", "mcp.ts");

if (!existsSync(built)) {
  throw new Error(`Missing ${built}. Run pnpm --filter @mdbase/connect-mcp build in mdbase-connect.`);
}
if (statSync(source).mtimeMs > statSync(built).mtimeMs) {
  throw new Error(`${built} is older than ${source}. Rebuild @mdbase/connect-mcp first.`);
}

const sdk = join(mcpDir, "node_modules", "@modelcontextprotocol", "sdk", "dist", "esm");
const { createMcpServer } = await import(pathToFileURL(built).href);
const { Client } = await import(pathToFileURL(join(sdk, "client", "index.js")).href);
const { InMemoryTransport } = await import(pathToFileURL(join(sdk, "inMemory.js")).href);

async function listTools(scopes) {
  // Listing tools never calls the gateway or OAuth service.
  const server = createMcpServer({ connectionSetId: "reference", scopes }, {}, {});
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "mdbase.dev-reference", version: "0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const { tools } = await client.listTools();
  const version = client.getServerVersion()?.version;
  await client.close();
  return { tools, version };
}

const read = await listTools(["mdbase:read"]);
const all = await listTools(["mdbase:read", "mdbase:write"]);
const readNames = new Set(read.tools.map((tool) => tool.name));

const tools = all.tools.map((tool) => ({
  name: tool.name,
  title: tool.title ?? tool.name,
  description: tool.description ?? "",
  access: readNames.has(tool.name) ? "read" : "write",
  annotations: tool.annotations ?? {},
  inputs: Object.entries(tool.inputSchema?.properties ?? {}).map(([name, schema]) => ({
    name,
    required: (tool.inputSchema.required ?? []).includes(name),
    type: describeType(schema),
    description: schema.description ?? ""
  }))
}));

const output = {
  generated_from: "mdbase-connect/services/mcp/src/mcp.ts",
  server_version: all.version,
  tools
};
writeFileSync(join(root, "src", "data", "mcp-tools.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${tools.length} MCP tools from mdbase MCP ${all.version}`);

function describeType(schema) {
  if (!schema || Object.keys(schema).length === 0) return "any";
  if (schema.const !== undefined) return JSON.stringify(schema.const);
  if (schema.enum) return schema.enum.map((value) => JSON.stringify(value)).join(" | ");
  if (schema.format === "uuid") return "UUID";
  if (schema.type === "array") return `${describeType(schema.items)}[]`;
  if (schema.type === "integer") {
    const bounds = [
      schema.minimum !== undefined ? `≥ ${schema.minimum}` : undefined,
      schema.maximum !== undefined && schema.maximum < Number.MAX_SAFE_INTEGER
        ? `≤ ${schema.maximum}`
        : undefined
    ].filter(Boolean);
    return bounds.length > 0 ? `integer (${bounds.join(", ")})` : "integer";
  }
  if (schema.type === "object") return "object";
  return schema.type ?? "any";
}
