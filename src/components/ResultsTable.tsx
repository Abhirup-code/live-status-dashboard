import { formatLatency, sortFailingFirst } from "../lib/stats";
import type { CheckResult } from "../types";

interface Props {
  results: CheckResult[];
}

export function ResultsTable({ results }: Props) {
  if (results.length === 0) {
    return <p className="muted">No checks match this filter.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Name</th>
          <th>URL</th>
          <th>HTTP</th>
          <th>Latency</th>
          <th>Detail</th>
        </tr>
      </thead>
      <tbody>
        {sortFailingFirst(results).map((r) => (
          <tr key={r.name} className={r.ok ? "row-ok" : "row-fail"}>
            <td>
              <span className={`badge ${r.ok ? "badge-ok" : "badge-fail"}`}>{r.ok ? "PASS" : "FAIL"}</span>
            </td>
            <td>{r.name}</td>
            <td className="mono">{r.url}</td>
            <td>{r.status_code ?? "—"}</td>
            <td>{formatLatency(r.latency_ms)}</td>
            <td>{r.error ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
