import react from "@vitejs/plugin-react";
import type { Connect, Plugin } from "vite";
import { defineConfig } from "vite";
import { generateReport } from "./src/lib/mockData";

/** Serves a synthetic report at /api/report. A new tick on every request makes the data change. */
function mockApi(): Plugin {
  let tick = 0;
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/report")) return next();
    tick += 1;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(generateReport(tick)));
  };
  return {
    name: "mock-report-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), mockApi()],
});
