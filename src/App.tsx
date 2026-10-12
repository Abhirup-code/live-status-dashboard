import { useMemo, useState } from "react";
import { fetchReport } from "./api";
import { FilterBar } from "./components/FilterBar";
import { ResultsTable } from "./components/ResultsTable";
import { Sparkline } from "./components/Sparkline";
import { SummaryCards } from "./components/SummaryCards";
import { useReport } from "./hooks/useReport";
import { computeStats, filterResults } from "./lib/stats";
import type { Report, StatusFilter } from "./types";

interface Props {
  reportUrl?: string;
  intervalMs?: number;
  /** Replace the network call, mainly for tests. */
  fetcher?: () => Promise<Report>;
}

export default function App({ reportUrl = "/api/report", intervalMs = 5000, fetcher }: Props) {
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const load = useMemo(() => fetcher ?? (() => fetchReport(reportUrl)), [fetcher, reportUrl]);
  const { report, error, loading, lastUpdated, history, refresh } = useReport({
    fetcher: load,
    intervalMs,
    paused,
  });

  const stats = useMemo(() => computeStats(report?.results ?? []), [report]);
  const visible = useMemo(() => filterResults(report?.results ?? [], filter), [report, filter]);

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Health Check Dashboard</h1>
          <p className="muted" data-testid="updated">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for first report"}
            {paused ? " (paused)" : ` (every ${intervalMs / 1000}s)`}
          </p>
        </div>
        <div className="actions">
          <button type="button" onClick={refresh}>
            Refresh now
          </button>
          <button type="button" onClick={() => setPaused((p) => !p)}>
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="banner">
          Could not load the report: {error}
          {report ? " Showing the last good data." : ""}
        </div>
      )}

      {loading && !report && <p>Loading...</p>}

      {report && (
        <>
          <SummaryCards stats={stats} />
          <section aria-label="Trends" className="trends">
            <div>
              <div className="card-label">Pass rate (last {history.length} updates)</div>
              <Sparkline values={history.map((h) => h.passRate)} label="Pass rate trend" />
            </div>
            <div>
              <div className="card-label">Average latency</div>
              <Sparkline
                values={history.flatMap((h) => (h.avgLatencyMs === null ? [] : [h.avgLatencyMs]))}
                label="Average latency trend"
              />
            </div>
          </section>
          <FilterBar value={filter} onChange={setFilter} />
          <ResultsTable results={visible} />
        </>
      )}
    </main>
  );
}
