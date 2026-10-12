/** Matches the JSON report written to S3 by the aws-healthcheck-iac Lambda. */
export interface CheckResult {
  name: string;
  url: string;
  ok: boolean;
  status_code: number | null;
  latency_ms: number | null;
  error: string | null;
}

export interface Report {
  total: number;
  passed: number;
  failed: number;
  results: CheckResult[];
}

export type StatusFilter = "all" | "failing" | "passing";

export interface HistoryPoint {
  time: number;
  passRate: number;
  avgLatencyMs: number | null;
}
