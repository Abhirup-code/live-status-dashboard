import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { ChangeLog } from "../src/components/ChangeLog";
import { findChanges } from "../src/hooks/useReport";
import { failing, makeReport, ok } from "./fixtures";

describe("findChanges", () => {
  it("records a check going down and coming back", () => {
    const down = findChanges({ a: true }, makeReport([failing("a", "500")]), 1);
    expect(down).toEqual([{ time: 1, name: "a", kind: "down", detail: "500" }]);
    const up = findChanges({ a: false }, makeReport([ok("a")]), 2);
    expect(up).toEqual([{ time: 2, name: "a", kind: "recovered", detail: null }]);
  });

  it("counts a check that is failing when first seen as down, and ignores steady states", () => {
    expect(findChanges({}, makeReport([failing("new")]), 1)).toHaveLength(1);
    expect(findChanges({}, makeReport([ok("new")]), 1)).toEqual([]);
    expect(findChanges({ a: false }, makeReport([failing("a")]), 1)).toEqual([]);
    expect(findChanges({ a: true }, makeReport([ok("a")]), 1)).toEqual([]);
  });
});

describe("ChangeLog", () => {
  it("explains what will appear when there are no changes", () => {
    render(<ChangeLog changes={[]} />);
    expect(screen.getByText(/No changes yet/)).toBeInTheDocument();
  });
});

it("logs an outage and the recovery, newest first", async () => {
  const fetcher = jest
    .fn()
    .mockResolvedValueOnce(makeReport([ok("Orders")]))
    .mockResolvedValueOnce(makeReport([failing("Orders", "expected status 200, got 500")]))
    .mockResolvedValue(makeReport([ok("Orders")]));
  render(<App fetcher={fetcher} />);
  await screen.findByText("Orders");
  expect(screen.getByText(/No changes yet/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Refresh now" }));
  await screen.findByText(/went down/);
  await userEvent.click(screen.getByRole("button", { name: "Refresh now" }));
  await screen.findByText(/recovered/);
  const items = screen.getAllByRole("listitem");
  expect(items[0]).toHaveTextContent("Orders recovered");
  expect(items[1]).toHaveTextContent("Orders went down: expected status 200, got 500");
});

it("lists every change it is given", () => {
  const many = Array.from({ length: 3 }, (_, i) => ({ time: i, name: `c${i}`, kind: "down" as const, detail: null }));
  render(<ChangeLog changes={many} />);
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
});
