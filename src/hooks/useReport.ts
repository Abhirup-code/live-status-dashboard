import { useCallback, useEffect, useRef, useState } from "react";
import { computeStats } from "../lib/stats";
import type { HistoryPoint, Report } from "../types";

interface Options {
  fetcher: () => Promise<Report>;
  intervalMs: number;
  paused: boolean;
  historySize?: number;
}

export interface ReportState {
  report: Report | null;
  error: string | null;
  loading: boolean;
  lastUpdated: Date | null;
  history: HistoryPoint[];
  refresh: () => void;
}

/** Loads a report now and then every intervalMs, unless paused. Keeps the last good report on errors. */
export function useReport({ fetcher, intervalMs, paused, historySize = 20 }: Options): ReportState {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);

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
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [historySize]);

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

  return { report, error, loading, lastUpdated, history, refresh };
}
