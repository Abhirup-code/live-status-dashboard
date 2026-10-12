import type { CheckResult, Report } from "../src/types";

export const ok = (name: string, latency = 100): CheckResult => ({
  name,
  url: `https://${name.toLowerCase().replace(/\s/g, "")}.test`,
  ok: true,
  status_code: 200,
  latency_ms: latency,
  error: null,
});

export const failing = (name: string, error = "expected status 200, got 500"): CheckResult => ({
  name,
  url: `https://${name.toLowerCase().replace(/\s/g, "")}.test`,
  ok: false,
  status_code: 500,
  latency_ms: 300,
  error,
});

export const timedOut = (name: string): CheckResult => ({
  name,
  url: "https://slow.test",
  ok: false,
  status_code: null,
  latency_ms: null,
  error: "TimeoutError: timed out",
});

export const makeReport = (results: CheckResult[]): Report => {
  const passed = results.filter((r) => r.ok).length;
  return { total: results.length, passed, failed: results.length - passed, results };
};
