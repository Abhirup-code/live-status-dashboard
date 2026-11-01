import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App, { pageTitle } from "../src/App";
import { failing, makeReport, ok } from "./fixtures";

describe("pageTitle", () => {
  it("shows failures, all passing, errors, and the plain title while loading", () => {
    expect(pageTitle(2, true, false)).toBe("(2 failing) Health Check Dashboard");
    expect(pageTitle(0, true, true)).toBe("All passing · Health Check Dashboard");
    expect(pageTitle(0, false, true)).toBe("Error · Health Check Dashboard");
    expect(pageTitle(0, false, false)).toBe("Health Check Dashboard");
  });
});

it("updates the tab title as checks fail and recover, and resets it on unmount", async () => {
  const fetcher = jest
    .fn()
    .mockResolvedValueOnce(makeReport([failing("a"), failing("b"), ok("c")]))
    .mockResolvedValue(makeReport([ok("a"), ok("b"), ok("c")]));
  const { unmount } = render(<App fetcher={fetcher} />);
  await waitFor(() => expect(document.title).toBe("(2 failing) Health Check Dashboard"));
  await userEvent.click(screen.getByRole("button", { name: "Refresh now" }));
  await waitFor(() => expect(document.title).toBe("All passing · Health Check Dashboard"));
  unmount();
  expect(document.title).toBe("Health Check Dashboard");
});
