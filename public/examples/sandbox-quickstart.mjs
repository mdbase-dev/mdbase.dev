import { unwrapOperation } from "@mdbase/connect";
import { createSandbox } from "@mdbase/connect-dev";

const { client, transport } = createSandbox({
  records: [
    {
      path: "tasks/first.md",
      types: ["task"],
      frontmatter: {
        type: "task",
        title: "Read the collection",
        completed: false
      }
    }
  ]
});

const first = unwrapOperation(await client.read({ path: "tasks/first.md" }));

const created = unwrapOperation(
  await client.create({
    type: "task",
    path: "tasks/second.md",
    frontmatter: {
      type: "task",
      title: "Update one record",
      completed: false
    }
  })
);

const updated = unwrapOperation(
  await client.update({
    path: created.path,
    patch: { completed: true },
    if_revision: created.revision
  })
);

const tasks = unwrapOperation(
  await client.query({
    types: ["task"],
    limit: 20
  })
);

console.log(`Read: ${first.frontmatter.title}`);
console.log(`Updated: ${updated.path} (completed: ${updated.frontmatter.completed})`);
console.log(`Task records: ${tasks.results.length}`);
console.log(`Markdown paths: ${transport.snapshot().map((record) => record.path).join(", ")}`);
