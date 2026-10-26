import { describe, expect, it } from "vitest";
import { accountCalendarDay, aggregateHistory, googleMicros, historyMaturity, historyWindows } from "@/lib/ads/history";

describe("historical ads normalization", () => {
  it("requests exactly 90 closed daily days in bounded resumable windows", () => {
    const daily = historyWindows("2026-10-24").filter((window) => window.granularity === "daily");
    expect(daily[0]?.since).toBe("2026-07-26");
    expect(daily.at(-1)?.until).toBe("2026-10-23");
    expect(daily.reduce((days, window) => days + (Date.parse(window.until) - Date.parse(window.since)) / 86400000 + 1, 0)).toBe(90);
    expect(daily.every((window) => Date.parse(window.until) - Date.parse(window.since) <= 6 * 86400000)).toBe(true);
  });
  it("extends weekly history to 13 calendar months without duplicating daily coverage", () => {
    const weekly = historyWindows("2026-10-24").filter((window) => window.granularity === "weekly");
    expect(weekly[0]?.since).toBe("2025-09-24");
    expect(weekly.at(-1)?.until).toBe("2026-07-25");
  });
  it("clamps month-end lookback to the last real day", () => {
    const weekly = historyWindows("2026-03-31").filter((window) => window.granularity === "weekly");
    expect(weekly[0]?.since).toBe("2025-02-28");
  });
  it("uses the connected account timezone instead of a default country", () => {
    expect(accountCalendarDay("America/Los_Angeles", new Date("2026-10-24T01:00:00Z"))).toBe("2026-10-23");
    expect(() => accountCalendarDay("invalid/timezone")).toThrow();
  });
  it("converts Google micros into the account currency", () => {
    expect(googleMicros(12_500_000)).toBe(12.5);
    expect(() => googleMicros(NaN)).toThrow();
  });
  it("excludes at least seven recent days and longer verified lag", () => {
    expect(historyMaturity("2026-10-18", "2026-10-24", 3)).toBe("immature");
    expect(historyMaturity("2026-10-17", "2026-10-24", 3)).toBe("mature");
    expect(historyMaturity("2026-10-17", "2026-10-24", 14)).toBe("immature");
  });
  it("does not claim maturity when conversion lag is unavailable", () => {
    expect(historyMaturity("2026-09-01", "2026-10-24", null)).toBe("unknown");
  });
  it("excludes unreliable and immature windows from performance totals", () => {
    const metrics = { spend: 100, clicks: 20, impressions: 200, conversions: 4, conversionValue: 300 };
    const result = aggregateHistory(["mature", "immature", "unreliable", "unknown"].map((data_maturity) => ({ metrics, data_maturity })));
    expect(result.totals.spend).toBe(100);
    expect(result.excluded).toBe(3);
    expect(result.cpa).toBe(25);
    expect(result.roas).toBe(3);
  });
  it("never invents zero metrics from missing provider fields", () => {
    expect(aggregateHistory([{ metrics: { spend: 100 }, data_maturity: "mature" }]).included).toBe(0);
    expect(aggregateHistory([]).cpa).toBeNull();
  });
});