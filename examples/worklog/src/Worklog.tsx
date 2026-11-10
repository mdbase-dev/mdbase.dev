import { describeError } from "@mdbase-dev/sdk/describe";
import type { MdbaseClient, RecordView } from "@mdbase-dev/sdk";
import { type SyntheticEvent, useEffect, useState } from "react";

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

// The SDK's plain-language account of a failed call, or null when there is
// nothing to show (the person cancelled, say).
const explain = (error: unknown) => describeError(error)?.message ?? null;

export function Worklog({ db }: { db: MdbaseClient }) {
  const [entries, setEntries] = useState<readonly RecordView[]>([]);
  const [problem, setProblem] = useState<string | null>(null);

  // A live query: the current entries first, then every change, including
  // ones made in another app or on another device.
  useEffect(() => {
    const query = db.live({
      types: ["worklog-entry"],
      order_by: [{ field: "date", direction: "desc" }],
      limit: 100,
    });
    const stop = query.subscribe((state) => setEntries(state.records));
    return () => {
      stop();
      query.close();
    };
  }, [db]);

  async function add(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const date = String(fields.get("date"));
    const minutes = Number(fields.get("minutes"));
    try {
      // A record is a Markdown file, so it needs a path. The write returns as
      // soon as it is saved on this device; the live query above already shows
      // it, and syncing continues in the background.
      const write = await db.create({
        type: "worklog-entry",
        path: `worklog/${date}-${crypto.randomUUID().slice(0, 8)}.md`,
        frontmatter: {
          date,
          summary: String(fields.get("summary")),
          ...(minutes > 0 ? { minutes } : {}),
        },
      });
      // An entry the type does not allow is refused here, before it is saved.
      if (write.state === "rejected") {
        setProblem(explain(write.receipt.problem));
        return;
      }
      form.reset();
      setProblem(null);
    } catch (error) {
      setProblem(explain(error));
    }
  }

  async function remove(entry: RecordView) {
    try {
      const write = await db.delete(entry);
      setProblem(write.state === "rejected" ? explain(write.receipt.problem) : null);
    } catch (error) {
      setProblem(explain(error));
    }
  }

  return (
    <>
      <form onSubmit={add}>
        <input name="date" type="date" defaultValue={today()} required aria-label="Date" />
        <input name="summary" placeholder="What did you do?" required aria-label="Summary" />
        <input name="minutes" type="number" min="0" placeholder="Minutes" aria-label="Minutes" />
        <button type="submit">Add</button>
      </form>
      {problem ? <p role="alert">{problem}</p> : null}
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            <time>{String(entry.frontmatter.get("date"))}</time>
            <span>{String(entry.frontmatter.get("summary"))}</span>
            <button type="button" onClick={() => remove(entry)} aria-label="Delete entry">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
