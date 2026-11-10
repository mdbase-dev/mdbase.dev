import { createMdbase } from "@mdbase-dev/sdk";

import manifest from "./mdbase-app.json";

// One front door for the whole app. `origin` is the origin the app is served
// from, which the manifest's homepage already names.
export const mdbase = createMdbase(
  {
    id: manifest.id,
    name: manifest.name,
    origin: new URL(manifest.homepage).origin,
    environment: "production",
    manifest,
  },
  // Let people try the app before they sign in. Their entries stay in this
  // browser until they bring them into a collection.
  { unsynced: true },
);
