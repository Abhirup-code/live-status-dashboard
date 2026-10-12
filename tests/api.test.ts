import { fetchReport, isReport } from "../src/api";
import { generateReport } from "../src/lib/mockData";

function fakeFetch(body: unknown, init: { ok?: boolean; status?: number } = {}): typeof fetch {
  return (async () =>
    ({
      ok: init.ok ?? true,
      status: init.status ?? 200,
      json: async () => body,
    }) as Response) as typeof fetch;
}

describe("isReport", () => {
  it("accepts a valid report", () => {
    expect(isReport(generateReport(1))).toBe(true);
  });

  it.each([null, undefined, 42, "text", [], {}, { total: 1 }])("rejects %p", (v) => {
    expect(isReport(v)).toBe(false);
  });

  it("rejects results with the wrong shape", () => {
    expect(isReport({ total: 1, passed: 1, failed: 0, results: [{ name: 1, ok: true }] })).toBe(false);
  });
});

describe("fetchReport", () => {
  it("returns the parsed report", async () => {
    const report = generateReport(2);
    await expect(fetchReport("/x", fakeFetch(report))).resolves.toEqual(report);
  });

  it("throws on an HTTP error", async () => {
    await expect(fetchReport("/x", fakeFetch({}, { ok: false, status: 503 }))).rejects.toThrow("status 503");
  });

  it("throws on an unexpected body", async () => {
    await expect(fetchReport("/x", fakeFetch({ nope: true }))).rejects.toThrow("Unexpected report format");
  });
});
