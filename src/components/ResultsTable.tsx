import { formatLatency, sortFailingFirst, uptime } from "../lib/stats";
import type { CheckHistory, CheckResult } from "../types";
import { StatusStrip } from "./StatusStrip";

interface Props {
  results: CheckResult[];
  checkHistory?: CheckHistory;
}

function formatUptime(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

export function ResultsTable({ results, checkHistory = {} }: Props) {
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
          <th>Uptime</th>
          <th>Recent</th>
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
            <td data-testid={`uptime-${r.name}`}>{formatUptime(uptime(checkHistory[r.name]))}</td>
            <td>
              <StatusStrip results={checkHistory[r.name] ?? []} />
            </td>
            <td>{r.error ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
