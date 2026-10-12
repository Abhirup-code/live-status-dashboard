import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterBar } from "../src/components/FilterBar";
import { ResultsTable } from "../src/components/ResultsTable";
import { Sparkline } from "../src/components/Sparkline";
import { SummaryCards } from "../src/components/SummaryCards";
import { computeStats } from "../src/lib/stats";
import { failing, ok, timedOut } from "./fixtures";

describe("SummaryCards", () => {
  it("shows the counts and latency", () => {
    render(<SummaryCards stats={computeStats([ok("a", 100), ok("b", 300), failing("c")])} />);
    expect(screen.getByTestId("card-checks")).toHaveTextContent("3");
    expect(screen.getByTestId("card-passing")).toHaveTextContent("2");
    expect(screen.getByTestId("card-failing")).toHaveTextContent("1");
    expect(screen.getByTestId("card-avg-latency")).toHaveTextContent("233 ms");
  });

  it("shows a dash when no latency is known", () => {
    render(<SummaryCards stats={computeStats([timedOut("a")])} />);
    expect(screen.getByTestId("card-avg-latency")).toHaveTextContent("—");
  });
});

describe("ResultsTable", () => {
  it("shows an empty message", () => {
    render(<ResultsTable results={[]} />);
    expect(screen.getByText("No checks match this filter.")).toBeInTheDocument();
  });

  it("lists failing rows first with PASS and FAIL badges", () => {
    render(<ResultsTable results={[ok("Alpha"), failing("Beta")]} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("FAIL")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Beta")).toBeInTheDocument();
    expect(within(rows[1]).getByText("PASS")).toBeInTheDocument();
  });

  it("shows the error text and a dash for a timeout", () => {
    render(<ResultsTable results={[timedOut("Slow")]} />);
    expect(screen.getByText("TimeoutError: timed out")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});

describe("FilterBar", () => {
  it("marks the active filter and reports changes", async () => {
    const onChange = jest.fn();
    render(<FilterBar value="all" onChange={onChange} />);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Failing" }));
    expect(onChange).toHaveBeenCalledWith("failing");
  });
});

describe("Sparkline", () => {
  it("asks for more data with fewer than two points", () => {
    render(<Sparkline values={[1]} label="trend" />);
    expect(screen.getByText("Collecting data...")).toBeInTheDocument();
  });

  it("draws a line for two or more points", () => {
    render(<Sparkline values={[1, 5, 3]} label="trend" />);
    expect(screen.getByRole("img", { name: "trend" })).toBeInTheDocument();
  });

  it("handles a flat series without NaN", () => {
    const { container } = render(<Sparkline values={[4, 4, 4]} label="flat" />);
    expect(container.querySelector("polyline")?.getAttribute("points")).not.toMatch(/NaN/);
  });
});
