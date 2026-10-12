import { TARGETS, generateReport, mulberry32 } from "../src/lib/mockData";

describe("mulberry32", () => {
  it("gives the same sequence for the same seed", () => {
    const a = mulberry32(5);
    const b = mulberry32(5);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("stays between 0 and 1", () => {
    const r = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("generateReport", () => {
  it("is deterministic for a given tick", () => {
    expect(generateReport(10)).toEqual(generateReport(10));
  });

  it("has one result per target and consistent totals", () => {
    const r = generateReport(1);
    expect(r.results).toHaveLength(TARGETS.length);
    expect(r.passed + r.failed).toBe(r.total);
  });

  it("scripts a Payments API failure on tick 3", () => {
    const r = generateReport(3).results.find((x) => x.name === "Payments API");
    expect(r?.ok).toBe(false);
    expect(r?.status_code).toBe(500);
  });

  it("scripts a Docs site timeout on tick 5", () => {
    const r = generateReport(5).results.find((x) => x.name === "Docs site");
    expect(r?.ok).toBe(false);
    expect(r?.status_code).toBeNull();
    expect(r?.latency_ms).toBeNull();
  });

  it("scripts a slow Auth service on tick 4", () => {
    const r = generateReport(4).results.find((x) => x.name === "Auth service");
    expect(r?.ok).toBe(false);
    expect(r?.error).toMatch(/too slow/);
  });

  it("is all green on a quiet tick", () => {
    expect(generateReport(1).failed).toBe(0);
  });

  it("failed results always carry an error message", () => {
    for (let t = 1; t <= 60; t++) {
      for (const r of generateReport(t).results) {
        if (!r.ok) expect(r.error).toBeTruthy();
      }
    }
  });
});
