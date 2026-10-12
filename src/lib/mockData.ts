import type { CheckResult, Report } from "../types";

/** Small seeded random generator so the same tick always gives the same report. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Target {
  name: string;
  url: string;
  baseLatency: number;
  maxLatency: number;
}

export const TARGETS: Target[] = [
  { name: "Public website", url: "https://www.example.test", baseLatency: 120, maxLatency: 800 },
  { name: "Orders API", url: "https://api.example.test/orders", baseLatency: 180, maxLatency: 1000 },
  { name: "Auth service", url: "https://auth.example.test/health", baseLatency: 90, maxLatency: 500 },
  { name: "Payments API", url: "https://pay.example.test/health", baseLatency: 220, maxLatency: 1200 },
  { name: "Docs site", url: "https://docs.example.test", baseLatency: 150, maxLatency: 900 },
  { name: "Status page", url: "https://status.example.test", baseLatency: 70, maxLatency: 600 },
];

/** Builds one synthetic report. All data is made up; no real services are called. */
export function generateReport(tick: number): Report {
  const results: CheckResult[] = TARGETS.map((t, i) => {
    const rand = mulberry32(tick * 31 + i * 7 + 1);
    const jitter = Math.round(rand() * t.baseLatency * 0.6);
    const base = { name: t.name, url: t.url };

    // Scripted incidents so the dashboard has something to show.
    if (t.name === "Payments API" && tick % 7 === 3) {
      return { ...base, ok: false, status_code: 500, latency_ms: t.baseLatency + jitter, error: "expected status 200, got 500" };
    }
    if (t.name === "Docs site" && tick % 11 === 5) {
      return { ...base, ok: false, status_code: null, latency_ms: null, error: "TimeoutError: timed out" };
    }
    if (t.name === "Auth service" && tick % 5 === 4) {
      const slow = t.maxLatency + 300 + jitter;
      return { ...base, ok: false, status_code: 200, latency_ms: slow, error: `too slow: ${slow} ms (limit ${t.maxLatency} ms)` };
    }
    return { ...base, ok: true, status_code: 200, latency_ms: t.baseLatency + jitter, error: null };
  });

  const passed = results.filter((r) => r.ok).length;
  return { total: results.length, passed, failed: results.length - passed, results };
}
