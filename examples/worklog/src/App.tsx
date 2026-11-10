import { CollectionGate, CollectionSwitcher } from "@mdbase-dev/ui/collections";

import { mdbase } from "./mdbase";
import { Worklog } from "./Worklog";

const app = { name: "Worklog" };

export function App() {
  return (
    // The gate shows sign-in, the collection list, approval, setup and
    // problems. It renders its children once a collection is open.
    <CollectionGate mdbase={mdbase} app={app} unsynced>
      {(connection) => (
        <main className="worklog">
          <header>
            <h1>Worklog</h1>
            <CollectionSwitcher mdbase={mdbase} app={app} variant="compact" unsynced />
          </header>
          {/* A new connection means a different collection: start again. */}
          <Worklog key={connection.id} db={connection.records} />
        </main>
      )}
    </CollectionGate>
  );
}
