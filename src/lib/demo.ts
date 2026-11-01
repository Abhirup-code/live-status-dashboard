import type { Report } from "../types";
import { generateReport } from "./mockData";

/**
 * A fetcher that makes synthetic reports in the browser, for the static demo on GitHub Pages where
 * there is no server. Each call is the next tick, like the dev server's mock API.
 */
export function demoFetcher(start = 0): () => Promise<Report> {
  let tick = start;
  return () => {
    tick += 1;
    return Promise.resolve(generateReport(tick));
  };
}
