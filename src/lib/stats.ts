import type { CheckResult, StatusFilter } from "../types";

export interface Stats {
  total: number;
  passed: number;
  failed: number;
  /** Percent of checks passing, one decimal place. 0 when there are no checks. */
  passRate: number;
  /** Average latency of checks that returned a response, or null if none did. */
  avgLatencyMs: number | null;
  slowest: CheckResult | null;
}

export function computeStats(results: CheckResult[]): Stats {
  const total = results.length;
  const passed = results.filter((r) => r.ok).length;
  const withLatency = results.filter(
    (r): r is CheckResult & { latency_ms: number } => r.latency_ms !== null,
  );

  const avgLatencyMs =
    withLatency.length === 0
      ? null
      : Math.round(withLatency.reduce((sum, r) => sum + r.latency_ms, 0) / withLatency.length);

  const slowest = withLatency.reduce<CheckResult | null>(
    (worst, r) => (worst === null || r.latency_ms > (worst.latency_ms ?? -1) ? r : worst),
    null,
  );

  return {
    total,
    passed,
    failed: total - passed,
    passRate: total === 0 ? 0 : Math.round((passed / total) * 1000) / 10,
    avgLatencyMs,
    slowest,
  };
}

export function filterResults(results: CheckResult[], filter: StatusFilter): CheckResult[] {
  if (filter === "failing") return results.filter((r) => !r.ok);
  if (filter === "passing") return results.filter((r) => r.ok);
  return results;
}

/** Failing checks first, then alphabetical by name. Does not change the input. */
export function sortFailingFirst(results: CheckResult[]): CheckResult[] {
  return [...results].sort((a, b) => {
    if (a.ok !== b.ok) return a.ok ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}

export function formatLatency(ms: number | null): string {
  if (ms === null) return "—";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${ms} ms`;
}

/** Percent of recent results that passed, one decimal place, or null with no results yet. */
export function uptime(results: boolean[] | undefined): number | null {
  if (!results || results.length === 0) return null;
  const passed = results.filter(Boolean).length;
  return Math.round((passed / results.length) * 1000) / 10;
}

/** Checks whose name or URL contains the query, ignoring case and surrounding spaces. */
export function searchResults(results: CheckResult[], query: string): CheckResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return results;
  return results.filter((r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
}

export type SortKey = "status" | "name" | "latency" | "uptime";
export type SortDirection = "asc" | "desc";

/**
 * Sorts a copy of the results. "status" is failing first, then by name. Missing latency or uptime
 * always goes last, whichever way the sort runs, and ties fall back to the name.
 */
export function sortResults(
  results: CheckResult[],
  key: SortKey,
  direction: SortDirection,
  uptimeOf: (name: string) => number | null = () => null,
): CheckResult[] {
  if (key === "status") {
    const sorted = sortFailingFirst(results);
    return direction === "asc" ? sorted : sorted.reverse();
  }
  const sign = direction === "asc" ? 1 : -1;
  const value = (r: CheckResult): number | string | null =>
    key === "name" ? r.name.toLowerCase() : key === "latency" ? r.latency_ms : uptimeOf(r.name);
  return [...results].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (va === null && vb === null) return a.name.localeCompare(b.name);
    if (va === null) return 1;
    if (vb === null) return -1;
    if (va < vb) return -sign;
    if (va > vb) return sign;
    return a.name.localeCompare(b.name);
  });
}
