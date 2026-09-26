import { createSandbox } from "@mdbase-dev/connect-dev";

const { client, transport } = createSandbox({
  records: [{
    path: "tasks/first.md",
    types: ["task"],
    frontmatter: {
      type: "task",
      title: "Read the collection",
      completed: false
    }
  }]
});

// Every operation returns a ConnectOutcome: check ok, then use value or problem.
function required(outcome) {
  if (!outcome.ok) throw new Error(`${outcome.problem.code}: ${outcome.problem.message}`);
  return outcome.value;
}

const first = required(await client.read({ path: "tasks/first.md" }));

const created = required(await client.create({
  type: "task",
  path: "tasks/second.md",
  frontmatter: {
    type: "task",
    title: "Update one record",
    completed: false
  }
}));

const updated = required(await client.update({
  path: created.path,
  patch: { completed: true },
  ifRevision: created.revision
}));

// Reusing the old revision is refused instead of overwriting the update.
const stale = await client.update({
  path: created.path,
  patch: { completed: false },
  ifRevision: created.revision
});

const tasks = required(await client.query({
  types: ["task"],
  limit: 20
}));

console.log(`Read: ${first.frontmatter.title}`);
console.log(`Updated: ${updated.path} (completed: ${updated.frontmatter.completed})`);
console.log(`Stale revision: ${stale.ok ? "accepted" : stale.problem.code}`);
console.log(`Task records: ${tasks.results.length}`);
console.log(`Markdown paths: ${transport.snapshot().map((record) => record.path).join(", ")}`);
