import { useCallback, useEffect, useRef, useState } from "react";
import { computeStats } from "../lib/stats";
import type { CheckHistory, HistoryPoint, Report, StatusChange } from "../types";

interface Options {
  fetcher: () => Promise<Report>;
  intervalMs: number;
  paused: boolean;
  historySize?: number;
  changeLogSize?: number;
}

export interface ReportState {
  report: Report | null;
  error: string | null;
  loading: boolean;
  lastUpdated: Date | null;
  history: HistoryPoint[];
  /** The last historySize results for each check in the latest report. */
  checkHistory: CheckHistory;
  /** The most recent state changes, newest first. */
  changes: StatusChange[];
  refresh: () => void;
}

/** Loads a report now and then every intervalMs, unless paused. Keeps the last good report on errors. */
/** What changed between two reports. A check that is failing the first time it is seen counts as down. */
export function findChanges(previous: Record<string, boolean>, report: Report, time: number): StatusChange[] {
  const changes: StatusChange[] = [];
  for (const r of report.results) {
    const before = previous[r.name];
    if (!r.ok && before !== false) changes.push({ time, name: r.name, kind: "down", detail: r.error });
    if (r.ok && before === false) changes.push({ time, name: r.name, kind: "recovered", detail: null });
  }
  return changes;
}

export function useReport({ fetcher, intervalMs, paused, historySize = 20, changeLogSize = 10 }: Options): ReportState {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [checkHistory, setCheckHistory] = useState<CheckHistory>({});
  const [changes, setChanges] = useState<StatusChange[]>([]);
  const lastStatus = useRef<Record<string, boolean>>({});

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const next = await fetcherRef.current();
      if (!mounted.current) return;
      const stats = computeStats(next.results);
      const now = new Date();
      setReport(next);
      setError(null);
      setLastUpdated(now);
      setHistory((prev) =>
        [...prev, { time: now.getTime(), passRate: stats.passRate, avgLatencyMs: stats.avgLatencyMs }].slice(-historySize),
      );
      const found = findChanges(lastStatus.current, next, now.getTime());
      lastStatus.current = Object.fromEntries(next.results.map((r) => [r.name, r.ok]));
      if (found.length > 0) setChanges((prev) => [...found.reverse(), ...prev].slice(0, changeLogSize));
      // Checks that are no longer in the report are dropped, so the history cannot grow without limit.
      setCheckHistory((prev) => {
        const nextHistory: CheckHistory = {};
        for (const r of next.results) {
          nextHistory[r.name] = [...(prev[r.name] ?? []), r.ok].slice(-historySize);
        }
        return nextHistory;
      });
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [historySize, changeLogSize]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    void load();
    const id = setInterval(() => void load(), intervalMs);
    return () => clearInterval(id);
  }, [paused, intervalMs, load]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  return { report, error, loading, lastUpdated, history, checkHistory, changes, refresh };
}
