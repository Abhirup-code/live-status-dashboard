import { useEffect, useMemo, useState } from "react";
import { fetchReport } from "./api";
import { ChangeLog } from "./components/ChangeLog";
import { FilterBar } from "./components/FilterBar";
import { ResultsTable } from "./components/ResultsTable";
import { Sparkline } from "./components/Sparkline";
import { SummaryCards } from "./components/SummaryCards";
import { useReport } from "./hooks/useReport";
import { downloadText, toCsv } from "./lib/csv";
import { computeStats, filterResults, searchResults } from "./lib/stats";
import type { Report, StatusFilter } from "./types";

interface Props {
  reportUrl?: string;
  intervalMs?: number;
  /** Replace the network call, mainly for tests. */
  fetcher?: () => Promise<Report>;
}

const TITLE = "Health Check Dashboard";

/** The tab title, so failures are visible from another tab. */
export function pageTitle(failed: number, hasReport: boolean, hasError: boolean): string {
  if (!hasReport) return hasError ? `Error · ${TITLE}` : TITLE;
  return failed > 0 ? `(${failed} failing) ${TITLE}` : `All passing · ${TITLE}`;
}

export default function App({ reportUrl = "/api/report", intervalMs = 5000, fetcher }: Props) {
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const load = useMemo(() => fetcher ?? (() => fetchReport(reportUrl)), [fetcher, reportUrl]);
  const { report, error, loading, lastUpdated, history, checkHistory, changes, refresh } = useReport({
    fetcher: load,
    intervalMs,
    paused,
  });

  const stats = useMemo(() => computeStats(report?.results ?? []), [report]);
  const visible = useMemo(
    () => searchResults(filterResults(report?.results ?? [], filter), query),
    [report, filter, query],
  );

  useEffect(() => {
    document.title = pageTitle(stats.failed, report !== null, error !== null);
  }, [stats.failed, report, error]);
  useEffect(() => () => void (document.title = TITLE), []);

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>{TITLE}</h1>
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
          <div className="toolbar">
            <FilterBar value={filter} onChange={setFilter} />
            <label className="search">
              <span className="sr-only">Search checks</span>
              <input
                type="search"
                placeholder="Search by name or URL"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={visible.length === 0}
              onClick={() => downloadText(toCsv(visible, checkHistory), "health-checks.csv")}
            >
              Download CSV
            </button>
          </div>
          <ResultsTable results={visible} checkHistory={checkHistory} />
          <ChangeLog changes={changes} />
        </>
      )}
    </main>
  );
}
