import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Point VITE_REPORT_URL at a real report endpoint, or use the built-in mock at /api/report.
const reportUrl = import.meta.env.VITE_REPORT_URL ?? "/api/report";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App reportUrl={reportUrl} />
  </StrictMode>,
);
