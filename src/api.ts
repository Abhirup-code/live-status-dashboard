import type { Report } from "./types";

export function isReport(value: unknown): value is Report {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.total === "number" &&
    typeof v.passed === "number" &&
    typeof v.failed === "number" &&
    Array.isArray(v.results) &&
    v.results.every(
      (r) =>
        typeof r === "object" &&
        r !== null &&
        typeof (r as Record<string, unknown>).name === "string" &&
        typeof (r as Record<string, unknown>).ok === "boolean",
    )
  );
}

export async function fetchReport(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Report> {
  const response = await fetchImpl(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const data: unknown = await response.json();
  if (!isReport(data)) {
    throw new Error("Unexpected report format");
  }
  return data;
}
