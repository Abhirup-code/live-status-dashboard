# live-status-dashboard

[![CI](https://github.com/Abhirup-code/live-status-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/Abhirup-code/live-status-dashboard/actions/workflows/ci.yml)

<img width="1463" height="828" alt="Screenshot 2026-10-12 at 3 07 35 PM" src="https://github.com/user-attachments/assets/32cc5b37-3a16-4cc0-824b-b76e8f3a73ab" />


**[Live demo](https://abhirup-code.github.io/live-status-dashboard/)** (synthetic data made in your browser)

React + TypeScript dashboard that shows URL health check results and refreshes every 5 seconds. It reads the same JSON report format that my [aws-healthcheck-iac](https://github.com/Abhirup-code/aws-healthcheck-iac) Lambda writes to S3.

> **Scope.** All data in the demo is synthetic and made up. The dashboard has not been connected to a real AWS account.
## What it does

- Summary cards: checks, passing, failing, average latency.
- Trend lines for pass rate and average latency over the last 20 updates.
- Results table with failing checks first, a filter for All, Failing and Passing, and a search by name or URL.
- Sortable columns (status, name, latency, uptime), announced to screen readers with `aria-sort`.
- Uptime for each check over the last 20 updates, with a strip of small bars that shows flapping at a glance.
- A Recent changes log of outages and recoveries, with the time and the error.
- The browser tab title shows the number of failing checks, so an outage is visible from another tab.
- Download the visible rows as CSV. Values that could run as spreadsheet formulas are neutralized.
- Auto refresh with Pause and Refresh now buttons.
- If a refresh fails, it shows an error banner and keeps the last good data on screen.
- Works on phones and in dark mode, with no WCAG 2.1 AA issues found by axe-core.

## Run it

Needs Node 20 or newer.

```
npm install
npm run dev
```

Open the address Vite prints. The dev server includes a mock API at `/api/report` that returns a new synthetic report on every request. It scripts a few incidents (a 500 error, a timeout and a slow response) so the dashboard has something to show.

To point it at a real report instead, set `VITE_REPORT_URL` to a URL that returns the report JSON. That server must allow CORS for the dashboard's origin.

```
VITE_REPORT_URL=https://example.com/report.json npm run dev
```

## Live demo on GitHub Pages

`.github/workflows/pages.yml` builds a static version with `VITE_DEMO=true`, which makes its synthetic reports in the browser instead of calling an API, and deploys it on every push to `main`. To turn it on once: **Settings → Pages → Source: GitHub Actions**.

To build the same demo locally:

```
VITE_DEMO=true npm run build && npm run preview
```

## Test it

```
npm test
npm run typecheck
npm run build
```

87 Jest tests use React Testing Library. They cover:

- the stats and formatting helpers, including empty and edge cases
- the report validation and API client errors
- the polling hook, using fake timers: polling, pausing, errors, history limit and cleanup on unmount
- each component
- the full app: loading, error, stale data, filtering, search, sorting, pause and resume
- uptime and the per-check history, the change log, the tab title, CSV export (including formula injection), and demo mode

<img width="806" height="533" alt="Screenshot 2026-10-12 at 3 02 23 PM" src="https://github.com/user-attachments/assets/7e316c59-ee95-4e95-a980-ffecdba9d947" />


## Layout

```
src/lib/        stats.ts (math and filters), mockData.ts (synthetic reports)
src/hooks/      useReport.ts (polling hook)
src/lib/        csv.ts (CSV export), demo.ts (in-browser data for the live demo)
src/components/ SummaryCards, ResultsTable, FilterBar, Sparkline, StatusStrip, ChangeLog
src/api.ts      fetch and validate a report
vite.config.ts  mock API for dev and preview
tests/          Jest + React Testing Library
```
## Report format

```json
{
  "total": 2, "passed": 1, "failed": 1,
  "results": [
    {"name": "Orders API", "url": "https://...", "ok": false,
     "status_code": 500, "latency_ms": 310, "error": "expected status 200, got 500"}
  ]
}
```
