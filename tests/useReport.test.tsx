import { act, renderHook } from "@testing-library/react";
import { useReport } from "../src/hooks/useReport";
import { failing, makeReport, ok } from "./fixtures";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe("useReport", () => {
  it("loads a report on mount", async () => {
    const fetcher = jest.fn().mockResolvedValue(makeReport([ok("a")]));
    const { result } = renderHook(() => useReport({ fetcher, intervalMs: 1000, paused: false }));
    expect(result.current.loading).toBe(true);
    await flush();
    expect(result.current.loading).toBe(false);
    expect(result.current.report?.total).toBe(1);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it("polls on the interval and records history", async () => {
    const fetcher = jest.fn().mockResolvedValue(makeReport([ok("a")]));
    const { result } = renderHook(() => useReport({ fetcher, intervalMs: 1000, paused: false }));
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(result.current.history).toHaveLength(3);
  });

  it("does not fetch while paused", async () => {
    const fetcher = jest.fn().mockResolvedValue(makeReport([ok("a")]));
    renderHook(() => useReport({ fetcher, intervalMs: 1000, paused: true }));
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("keeps the last good report when a later fetch fails", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(makeReport([ok("a")]))
      .mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useReport({ fetcher, intervalMs: 1000, paused: false }));
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await flush();
    expect(result.current.error).toBe("boom");
    expect(result.current.report?.total).toBe(1);
  });

  it("clears the error after a good fetch", async () => {
    const fetcher = jest
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(makeReport([failing("a")]));
    const { result } = renderHook(() => useReport({ fetcher, intervalMs: 1000, paused: false }));
    await flush();
    expect(result.current.error).toBe("boom");
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await flush();
    expect(result.current.error).toBeNull();
  });

  it("limits history to historySize", async () => {
    const fetcher = jest.fn().mockResolvedValue(makeReport([ok("a")]));
    const { result } = renderHook(() => useReport({ fetcher, intervalMs: 100, paused: false, historySize: 3 }));
    await flush();
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
      await flush();
    }
    expect(result.current.history).toHaveLength(3);
  });

  it("stops polling after unmount", async () => {
    const fetcher = jest.fn().mockResolvedValue(makeReport([ok("a")]));
    const { unmount } = renderHook(() => useReport({ fetcher, intervalMs: 1000, paused: false }));
    await flush();
    unmount();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
