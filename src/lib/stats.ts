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
