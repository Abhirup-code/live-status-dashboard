import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { demoFetcher } from "./lib/demo";
import "./styles.css";

// VITE_DEMO=true builds a static demo that makes synthetic data in the browser (used for GitHub Pages).
// Otherwise, point VITE_REPORT_URL at a real report endpoint, or use the dev server's mock at /api/report.
const demo = import.meta.env.VITE_DEMO === "true";
const reportUrl = import.meta.env.VITE_REPORT_URL ?? "/api/report";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {demo ? <App fetcher={demoFetcher()} demo /> : <App reportUrl={reportUrl} />}
  </StrictMode>,
);
