import { computeStats, filterResults, formatLatency, sortFailingFirst } from "../src/lib/stats";
import { failing, ok, timedOut } from "./fixtures";

describe("computeStats", () => {
  it("handles an empty list without dividing by zero", () => {
    expect(computeStats([])).toEqual({
      total: 0,
      passed: 0,
      failed: 0,
      passRate: 0,
      avgLatencyMs: null,
      slowest: null,
    });
  });

  it("counts passed and failed checks", () => {
    const s = computeStats([ok("a"), ok("b"), failing("c")]);
    expect([s.total, s.passed, s.failed]).toEqual([3, 2, 1]);
  });

  it("rounds the pass rate to one decimal", () => {
    expect(computeStats([ok("a"), ok("b"), failing("c")]).passRate).toBe(66.7);
    expect(computeStats([ok("a"), ok("b")]).passRate).toBe(100);
  });

  it("averages latency and ignores checks with no response", () => {
    const s = computeStats([ok("a", 100), ok("b", 200), timedOut("c")]);
    expect(s.avgLatencyMs).toBe(150);
  });

  it("returns null average latency when nothing responded", () => {
    expect(computeStats([timedOut("a"), timedOut("b")]).avgLatencyMs).toBeNull();
  });

  it("finds the slowest check", () => {
    const s = computeStats([ok("a", 100), ok("b", 900), ok("c", 300)]);
    expect(s.slowest?.name).toBe("b");
  });
});

describe("filterResults", () => {
  const data = [ok("a"), failing("b"), ok("c")];

  it("returns everything for 'all'", () => {
    expect(filterResults(data, "all")).toHaveLength(3);
  });

  it("returns only failing checks", () => {
    expect(filterResults(data, "failing").map((r) => r.name)).toEqual(["b"]);
  });

  it("returns only passing checks", () => {
    expect(filterResults(data, "passing").map((r) => r.name)).toEqual(["a", "c"]);
  });
});

describe("sortFailingFirst", () => {
  it("puts failing first and sorts by name inside each group", () => {
    const sorted = sortFailingFirst([ok("zeta"), failing("beta"), ok("alpha"), failing("alpha2")]);
    expect(sorted.map((r) => r.name)).toEqual(["alpha2", "beta", "alpha", "zeta"]);
  });

  it("does not change the original array", () => {
    const input = [ok("b"), failing("a")];
    sortFailingFirst(input);
    expect(input[0].name).toBe("b");
  });
});

describe("formatLatency", () => {
  it.each([
    [null, "—"],
    [0, "0 ms"],
    [250, "250 ms"],
    [999, "999 ms"],
    [1000, "1.0 s"],
    [1840, "1.8 s"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatLatency(input)).toBe(expected);
  });
});
