import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { csvCell, toCsv } from "../src/lib/csv";
import { failing, makeReport, ok, timedOut } from "./fixtures";

describe("csvCell", () => {
  it("quotes commas, quotes, and line breaks", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell("two\nlines")).toBe('"two\nlines"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(200)).toBe("200");
    expect(csvCell(false)).toBe("false");
  });

  it("stops values from running as spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"http://x\")")).toBe("\"'=HYPERLINK(\"\"http://x\"\")\"");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });
});

describe("toCsv", () => {
  it("writes a header and one row per check, with uptime", () => {
    const csv = toCsv([ok("Alpha", 120), timedOut("Slow")], { Alpha: [true, false] });
    expect(csv.split("\r\n")).toEqual([
      "name,url,ok,status_code,latency_ms,uptime_pct,error",
      "Alpha,https://alpha.test,true,200,120,50,",
      "Slow,https://slow.test,false,,,,TimeoutError: timed out",
      "",
    ]);
  });
});

it("downloads the rows that are on screen", async () => {
  const created: Blob[] = [];
  URL.createObjectURL = jest.fn((blob: Blob) => {
    created.push(blob);
    return "blob:test";
  });
  URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  render(<App fetcher={() => Promise.resolve(makeReport([ok("Alpha"), failing("Beta")]))} />);
  await screen.findByRole("table");
  await userEvent.click(screen.getByRole("button", { name: "Failing" }));
  await userEvent.click(screen.getByRole("button", { name: "Download CSV" }));
  expect(click).toHaveBeenCalledTimes(1);
  const text = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(created[0]);
  });
  expect(text).toContain("Beta,");
  expect(text).not.toContain("Alpha,");
  click.mockRestore();
});

it("disables the download when nothing is shown", async () => {
  render(<App fetcher={() => Promise.resolve(makeReport([ok("Alpha")]))} />);
  await screen.findByRole("table");
  await userEvent.click(screen.getByRole("button", { name: "Failing" }));
  expect(screen.getByRole("button", { name: "Download CSV" })).toBeDisabled();
});
