import type { CheckHistory, CheckResult } from "../types";
import { uptime } from "./stats";

/**
 * One CSV cell. Quotes are doubled and the value is quoted when needed. A value starting with
 * = + - @ or a tab could run as a formula when the file is opened in a spreadsheet, so it gets a
 * leading apostrophe. Error messages come from the checked services, so they are not trusted.
 */
export function csvCell(value: string | number | boolean | null): string {
  if (value === null) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const CSV_HEADER = ["name", "url", "ok", "status_code", "latency_ms", "uptime_pct", "error"];

export function toCsv(results: CheckResult[], checkHistory: CheckHistory = {}): string {
  const lines = [CSV_HEADER.join(",")];
  for (const r of results) {
    const row = [r.name, r.url, r.ok, r.status_code, r.latency_ms, uptime(checkHistory[r.name]), r.error];
    lines.push(row.map(csvCell).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

/** Saves text as a file in the browser, without sending it anywhere. */
export function downloadText(text: string, filename: string, type = "text/csv"): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
