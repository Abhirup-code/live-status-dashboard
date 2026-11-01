import { useState } from "react";
import { formatLatency, type SortDirection, type SortKey, sortResults, uptime } from "../lib/stats";
import type { CheckHistory, CheckResult } from "../types";
import { StatusStrip } from "./StatusStrip";

interface Props {
  results: CheckResult[];
  checkHistory?: CheckHistory;
}

function formatUptime(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

const COLUMNS: { label: string; key?: SortKey }[] = [
  { label: "Status", key: "status" },
  { label: "Name", key: "name" },
  { label: "URL" },
  { label: "HTTP" },
  { label: "Latency", key: "latency" },
  { label: "Uptime", key: "uptime" },
  { label: "Recent" },
  { label: "Detail" },
];

export function ResultsTable({ results, checkHistory = {} }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: "status", direction: "asc" });

  if (results.length === 0) {
    return <p className="muted">No checks match this filter.</p>;
  }

  const sortBy = (key: SortKey) =>
    setSort((s) => ({ key, direction: s.key === key && s.direction === "asc" ? "desc" : "asc" }));
  const rows = sortResults(results, sort.key, sort.direction, (name) => uptime(checkHistory[name]));

  return (
    <table>
      <thead>
        <tr>
          {COLUMNS.map((c) =>
            c.key ? (
              <th
                key={c.label}
                aria-sort={sort.key === c.key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
              >
                <button type="button" className="sort" onClick={() => sortBy(c.key!)}>
                  {c.label}
                  <span aria-hidden="true">{sort.key === c.key ? (sort.direction === "asc" ? " ▲" : " ▼") : ""}</span>
                </button>
              </th>
            ) : (
              <th key={c.label}>{c.label}</th>
            ),
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
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
