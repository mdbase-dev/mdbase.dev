import release from "./connect-release.json";
import mcpTools from "./mcp-tools.json";

export type DocsSectionId = "sdk" | "mcp" | "editor" | "reader" | "writer";

type DocLink = { href: string; label: string; key: string };
type DocsSection = {
  label: string;
  navLabel: string;
  headerCurrent: "sdk" | "apps";
  sourcePath: string;
  meta: { label: string; value: string };
  groups: Array<{ label: string; docs: DocLink[] }>;
};

export const docsSections: Record<DocsSectionId, DocsSection> = {
  sdk: {
    label: "Connect SDK",
    navLabel: "SDK documentation",
    headerCurrent: "sdk",
    sourcePath: "src/pages/sdk",
    meta: { label: "@mdbase-dev/connect", value: release.sdkVersion },
    groups: [
      {
        label: "Start",
        docs: [
          { href: "/sdk/quickstart/", label: "Run the source-built sandbox", key: "quickstart" },
          { href: "/sdk/connect-quickstart/", label: "Connect a browser app", key: "connect-quickstart" },
          { href: "/sdk/", label: "SDK overview", key: "overview" }
        ]
      },
      {
        label: "Build",
        docs: [
          { href: "/sdk/portable-apps/", label: "Portable HTML apps", key: "portable-apps" },
          { href: "/sdk/manifest/", label: "Application manifest", key: "manifest" },
          { href: "/sdk/contracts/", label: "Contracts and adapters", key: "contracts" },
          { href: "/sdk/authorization/", label: "Authorization", key: "authorization" },
          { href: "/sdk/operations/", label: "Records and operations", key: "operations" },
          { href: "/sdk/routing/", label: "Authority routes", key: "routing" },
          { href: "/sdk/testing/", label: "Testing", key: "testing" },
          { href: "/sdk/notifications/", label: "Notifications and timers", key: "notifications" },
          { href: "/sdk/offline-sync/", label: "Offline sync", key: "offline-sync" }
        ]
      },
      {
        label: "Reference",
        docs: [
          { href: "/sdk/security/", label: "Security model", key: "security" },
          { href: "/sdk/api/", label: "API reference", key: "api" }
        ]
      }
    ]
  },
  mcp: {
    label: "mdbase MCP",
    navLabel: "mdbase MCP documentation",
    headerCurrent: "apps",
    sourcePath: "src/pages/apps/mcp",
    meta: { label: "Server", value: mcpTools.server_version },
    groups: [
      {
        label: "Start",
        docs: [
          { href: "/apps/mcp/", label: "Set up mdbase MCP", key: "overview" },
          { href: "/apps/mcp/collections/", label: "Collections and access", key: "collections" }
        ]
      },
      {
        label: "Use",
        docs: [
          { href: "/apps/mcp/working-with-records/", label: "Working with records", key: "records" },
          { href: "/apps/mcp/troubleshooting/", label: "Troubleshooting", key: "troubleshooting" }
        ]
      },
      {
        label: "Reference",
        docs: [
          { href: "/apps/mcp/tools/", label: "Tool reference", key: "tools" },
          { href: "/apps/mcp/data-handling/", label: "Data handling", key: "data" }
        ]
      }
    ]
  },
  editor: {
    label: "mdbase Editor",
    navLabel: "mdbase Editor documentation",
    headerCurrent: "apps",
    sourcePath: "src/pages/apps/editor",
    meta: { label: "Web", value: "editor.mdbase.dev" },
    groups: [
      {
        label: "Start",
        docs: [
          { href: "/apps/editor/", label: "Get started", key: "overview" }
        ]
      },
      {
        label: "Use",
        docs: [
          { href: "/apps/editor/notes/", label: "Writing notes", key: "notes" },
          { href: "/apps/editor/links/", label: "Links, embeds and files", key: "links" },
          { href: "/apps/editor/types/", label: "Types", key: "types" },
          { href: "/apps/editor/sharing/", label: "Sharing a collection", key: "sharing" }
        ]
      },
      {
        label: "Reference",
        docs: [
          { href: "/apps/editor/shortcuts/", label: "Shortcuts and settings", key: "shortcuts" }
        ]
      }
    ]
  },
  reader: {
    label: "mdbase Reader",
    navLabel: "mdbase Reader documentation",
    headerCurrent: "apps",
    sourcePath: "src/pages/apps/reader",
    meta: { label: "Status", value: "Prerelease" },
    groups: [
      { label: "Start", docs: [{ href: "/apps/reader/", label: "Get started", key: "overview" }] },
      {
        label: "Use",
        docs: [
          { href: "/apps/reader/sources/", label: "Adding sources", key: "sources" },
          { href: "/apps/reader/annotating/", label: "Reading and annotating", key: "annotating" },
          { href: "/apps/reader/notes/", label: "Notes and citations", key: "notes" },
          { href: "/apps/reader/library/", label: "Library and views", key: "library" },
          { href: "/apps/reader/import/", label: "Importing a library", key: "import" },
          { href: "/apps/reader/extension/", label: "Browser extension", key: "extension" }
        ]
      },
      {
        label: "Reference",
        docs: [
          { href: "/apps/reader/data/", label: "How Reader stores data", key: "data" },
          { href: "/apps/reader/shortcuts/", label: "Shortcuts and display", key: "shortcuts" }
        ]
      }
    ]
  },
  writer: {
    label: "mdbase writer",
    navLabel: "mdbase writer documentation",
    headerCurrent: "apps",
    sourcePath: "src/pages/apps/writer",
    meta: { label: "Status", value: "Prerelease" },
    groups: [
      { label: "Start", docs: [{ href: "/apps/writer/", label: "Get started", key: "overview" }] },
      {
        label: "Use",
        docs: [
          { href: "/apps/writer/writing/", label: "Writing and reviewing", key: "writing" },
          { href: "/apps/writer/citations/", label: "Sources and citations", key: "citations" },
          { href: "/apps/writer/chapters/", label: "Chapters and embeds", key: "chapters" },
          { href: "/apps/writer/export/", label: "Layouts and export", key: "export" }
        ]
      },
      {
        label: "Reference",
        docs: [{ href: "/apps/writer/data/", label: "Saving and collection data", key: "data" }]
      }
    ]
  }
};
