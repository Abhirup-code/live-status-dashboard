import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { ResultsTable } from "../src/components/ResultsTable";
import { searchResults, sortResults } from "../src/lib/stats";
import { failing, makeReport, ok, timedOut } from "./fixtures";

const names = (rows: { name: string }[]) => rows.map((r) => r.name);
const rows = [ok("Bravo", 300), failing("Alpha"), ok("Charlie", 100), timedOut("Delta")];

describe("searchResults", () => {
  it("matches the name or URL, ignoring case and spaces", () => {
    expect(names(searchResults(rows, "  ALPHA "))).toEqual(["Alpha"]);
    expect(names(searchResults(rows, "slow.test"))).toEqual(["Delta"]);
    expect(searchResults(rows, "")).toHaveLength(4);
  });
});

describe("sortResults", () => {
  it("sorts by status, failing first, and can reverse it", () => {
    expect(names(sortResults(rows, "status", "asc"))).toEqual(["Alpha", "Delta", "Bravo", "Charlie"]);
    expect(names(sortResults(rows, "status", "desc"))).toEqual(["Charlie", "Bravo", "Delta", "Alpha"]);
  });

  it("sorts by name and latency, with missing latency always last", () => {
    expect(names(sortResults(rows, "name", "desc"))).toEqual(["Delta", "Charlie", "Bravo", "Alpha"]);
    expect(names(sortResults(rows, "latency", "asc"))).toEqual(["Charlie", "Alpha", "Bravo", "Delta"]); // 300 ms tie: by name
    expect(names(sortResults(rows, "latency", "desc"))).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]);
  });

  it("sorts by uptime, ties by name, and does not change the input", () => {
    const up: Record<string, number | null> = { Alpha: 50, Bravo: 100, Charlie: 50, Delta: null };
    const copy = [...rows];
    expect(names(sortResults(rows, "uptime", "asc", (n) => up[n]))).toEqual(["Alpha", "Charlie", "Bravo", "Delta"]);
    expect(rows).toEqual(copy);
  });
});

describe("ResultsTable sorting", () => {
  it("sorts when a header is clicked and says so to screen readers", async () => {
    render(<ResultsTable results={rows} />);
    const header = screen.getByRole("columnheader", { name: /Latency/ });
    expect(header).toHaveAttribute("aria-sort", "none");
    await userEvent.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "ascending");
    const firstCells = () => screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[1].textContent);
    expect(firstCells()).toEqual(["Charlie", "Alpha", "Bravo", "Delta"]);
    await userEvent.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "descending");
    expect(screen.getByRole("columnheader", { name: /Status/ })).toHaveAttribute("aria-sort", "none");
  });
});

it("searches from the toolbar together with the status filter", async () => {
  render(<App fetcher={() => Promise.resolve(makeReport(rows))} />);
  await screen.findByRole("table");
  await userEvent.type(screen.getByRole("searchbox", { name: "Search checks" }), "a");
  await userEvent.click(screen.getByRole("button", { name: "Passing" }));
  const table = screen.getByRole("table");
  expect(within(table).getByText("Bravo")).toBeInTheDocument();
  expect(within(table).queryByText("Alpha")).not.toBeInTheDocument();
  await userEvent.type(screen.getByRole("searchbox"), "zzz");
  expect(screen.getByText("No checks match this filter.")).toBeInTheDocument();
});
