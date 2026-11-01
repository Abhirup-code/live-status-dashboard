import { render, screen } from "@testing-library/react";
import App from "../src/App";
import { demoFetcher } from "../src/lib/demo";
import { generateReport } from "../src/lib/mockData";

it("makes the next synthetic report on each call", async () => {
  const fetch = demoFetcher();
  expect(await fetch()).toEqual(generateReport(1));
  expect(await fetch()).toEqual(generateReport(2));
});

it("says the data is synthetic in demo mode only", async () => {
  const { unmount } = render(<App fetcher={demoFetcher()} demo />);
  expect(screen.getByRole("note")).toHaveTextContent("synthetic data made in your browser");
  expect(await screen.findByText("Public website")).toBeInTheDocument();
  unmount();
  render(<App fetcher={demoFetcher()} />);
  expect(screen.queryByRole("note")).not.toBeInTheDocument();
});
