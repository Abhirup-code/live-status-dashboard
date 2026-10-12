# live-status-dashboard

[![CI](https://github.com/Abhirup-code/live-status-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/Abhirup-code/live-status-dashboard/actions/workflows/ci.yml)

<img width="1463" height="828" alt="Screenshot 2026-10-12 at 3 07 35 PM" src="https://github.com/user-attachments/assets/32cc5b37-3a16-4cc0-824b-b76e8f3a73ab" />


 React + TypeScript dashboard that shows URL health check results and refreshes every 5 seconds. It reads the same JSON report format that my [aws-healthcheck-iac](https://github.com/Abhirup-code/aws-healthcheck-iac) Lambda writes to S3.

> ** scope.** All data in the demo is synthetic and made up. The dashboard has not been connected to a real AWS account.
## What it does

- Summary cards: checks, passing, failing, average latency.
- Trend lines for pass rate and average latency over the last 20 updates.
- Results table with failing checks first, and a filter for All, Failing and Passing.
- Auto refresh with Pause and Refresh now buttons.
- If a refresh fails, it shows an error banner and keeps the last good data on screen.

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

## Test it

```
npm test
npm run typecheck
npm run build
```

61 Jest tests use React Testing Library. They cover:

- the stats and formatting helpers, including empty and edge cases
- the report validation and API client errors
- the polling hook, using fake timers: polling, pausing, errors, history limit and cleanup on unmount
- each component
- the full app: loading, error, stale data, filtering, pause and resume

<img width="1463" height="828" alt="Screenshot 2026-10-12 at 3 07 35 PM" src="https://github.com/user-attachments/assets/f9fe35ea-447e-4e02-abd0-b215de9f5fc0" />


## Layout

```
src/lib/        stats.ts (math and filters), mockData.ts (synthetic reports)
src/hooks/      useReport.ts (polling hook)
src/components/ SummaryCards, ResultsTable, FilterBar, Sparkline
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
