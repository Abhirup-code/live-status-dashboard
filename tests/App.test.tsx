import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { failing, makeReport, ok } from "./fixtures";

const report = makeReport([ok("Alpha", 100), failing("Beta"), ok("Gamma", 200)]);

describe("App", () => {
  it("shows loading, then the dashboard", async () => {
    render(<App fetcher={() => Promise.resolve(report)} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    expect(screen.getByTestId("card-failing")).toHaveTextContent("1");
  });

  it("shows an error when the first load fails", async () => {
    render(<App fetcher={() => Promise.reject(new Error("offline"))} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load the report: offline");
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("keeps showing old data when a refresh fails", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(report)
      .mockRejectedValueOnce(new Error("later failure"));
    render(<App fetcher={fetcher} />);
    await screen.findByText("Alpha");
    await userEvent.click(screen.getByRole("button", { name: "Refresh now" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Showing the last good data.");
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("filters to failing checks", async () => {
    render(<App fetcher={() => Promise.resolve(report)} />);
    await screen.findByText("Alpha");
    await userEvent.click(screen.getByRole("button", { name: "Failing" }));
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("shows the empty message when the filter matches nothing", async () => {
    render(<App fetcher={() => Promise.resolve(makeReport([ok("Only")]))} />);
    await screen.findByText("Only");
    await userEvent.click(screen.getByRole("button", { name: "Failing" }));
    expect(screen.getByText("No checks match this filter.")).toBeInTheDocument();
  });

  it("pauses and resumes polling", async () => {
    const fetcher = jest.fn().mockResolvedValue(report);
    render(<App fetcher={fetcher} />);
    await screen.findByText("Alpha");
    await userEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByTestId("updated")).toHaveTextContent("(paused)");
    await userEvent.click(screen.getByRole("button", { name: "Resume" }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });

  it("refreshes on demand", async () => {
    const fetcher = jest.fn().mockResolvedValue(report);
    render(<App fetcher={fetcher} />);
    await screen.findByText("Alpha");
    await userEvent.click(screen.getByRole("button", { name: "Refresh now" }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
});
