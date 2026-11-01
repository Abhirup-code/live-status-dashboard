import type { StatusChange } from "../types";

interface Props {
  changes: StatusChange[];
}

/** Recent outages and recoveries, newest first. */
export function ChangeLog({ changes }: Props) {
  return (
    <section aria-labelledby="changes-heading" className="changes">
      <h2 id="changes-heading">Recent changes</h2>
      {changes.length === 0 ? (
        <p className="muted">No changes yet. Outages and recoveries will appear here.</p>
      ) : (
        <ol>
          {changes.map((c) => (
            <li key={`${c.time}-${c.name}-${c.kind}`} className={c.kind === "down" ? "change-down" : "change-up"}>
              <time dateTime={new Date(c.time).toISOString()}>{new Date(c.time).toLocaleTimeString()}</time>{" "}
              <strong>{c.name}</strong> {c.kind === "down" ? "went down" : "recovered"}
              {c.detail ? <span className="muted">: {c.detail}</span> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
