import { act, render, renderHook, screen, within } from "@testing-library/react";
import App from "../src/App";
import { StatusStrip } from "../src/components/StatusStrip";
import { useReport } from "../src/hooks/useReport";
import { uptime } from "../src/lib/stats";
import { failing, makeReport, ok } from "./fixtures";

describe("uptime", () => {
  it("is the share of recent results that passed", () => {
    expect(uptime([true, true, false, true])).toBe(75);
    expect(uptime([true, false, false])).toBe(33.3);
    expect(uptime([])).toBeNull();
    expect(uptime(undefined)).toBeNull();
  });
});

describe("StatusStrip", () => {
  it("draws one bar per result with a readable label", () => {
    render(<StatusStrip results={[true, false, true]} />);
    const strip = screen.getByRole("img", { name: "Last 3 checks: 2 passed, 1 failed" });
    expect(strip.querySelectorAll(".strip-ok")).toHaveLength(2);
    expect(strip.querySelectorAll(".strip-fail")).toHaveLength(1);
  });

  it("draws nothing without results", () => {
    const { container } = render(<StatusStrip results={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("per-check history", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("keeps the last results for each check and drops removed checks", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(makeReport([ok("a"), ok("gone")]))
      .mockResolvedValueOnce(makeReport([failing("a")]))
      .mockResolvedValue(makeReport([ok("a")]));
    const { result } = renderHook(() => useReport({ fetcher, intervalMs: 1000, paused: false, historySize: 2 }));
    const flush = () => act(async () => {
      await Promise.resolve();
    });
    await flush(); // first load
    expect(result.current.checkHistory).toEqual({ a: [true], gone: [true] });
    for (let i = 0; i < 2; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      await flush();
    }
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(result.current.checkHistory).toEqual({ a: [false, true] });
  });
});

it("shows uptime and recent results in the table", async () => {
  const fetcher = jest.fn().mockResolvedValue(makeReport([ok("Alpha"), failing("Beta")]));
  render(<App fetcher={fetcher} />);
  expect(await screen.findByTestId("uptime-Alpha")).toHaveTextContent("100%");
  expect(screen.getByTestId("uptime-Beta")).toHaveTextContent("0%");
  const row = within(screen.getByRole("table")).getByText("Beta").closest("tr")!;
  expect(within(row).getByRole("img", { name: "Last 1 checks: 0 passed, 1 failed" })).toBeInTheDocument();
});
