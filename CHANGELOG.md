# Changelog

## [1.1.0] - 2026-11-01

### Added
- Live demo on GitHub Pages, built with synthetic data made in the browser.
- Uptime and a strip of recent results for each check.
- A Recent changes log of outages and recoveries.
- Search by name or URL, and sortable Status, Name, Latency, and Uptime columns.
- The failing count in the browser tab title.
- Download the visible rows as CSV, with spreadsheet formula injection neutralized.

### Fixed
- The selected filter button in dark mode had a contrast of 2.5:1, below WCAG AA.
- The page scrolled sideways on phones once the table grew wider.

### Security
- CI runs with a read-only token, no stored checkout credentials, and every action pinned to a commit SHA.

## [1.0.0] - 2026-10-12

### Added
- Summary cards, trend lines, a results table with a status filter, auto refresh with pause, and an error
  banner that keeps the last good data.
