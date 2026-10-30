import { describe, expect, test } from "bun:test";
import { connectedReportSources, reportRange } from "../../src/lib/report-rules";

describe("Adam reporting", () => {
  test("all connected workspace sources are included, regardless of employee", () => {
    expect(connectedReportSources([
      { provider: "analytics", status: "connected", account: "GA4" },
      { provider: "hubspot", status: "connected", account: "CRM" },
      { provider: "gmail", status: "disconnected", account: null },
      { provider: "analytics", status: "connected", account: "GA4" },
    ]).map(s => s.provider)).toEqual(["analytics", "hubspot"]);
  });
  test("a connected CRM is not misrepresented as a reporting feed", () => {
    expect(connectedReportSources([{ provider: "hubspot", status: "connected", account: "CRM" }])[0]?.reportSupported).toBe(false);
  });
  test("28 inclusive days share exact dates across both sources", () => {
    expect(reportRange(28, new Date("2026-10-30T01:06:00Z"))).toEqual({ start: "2026-09-30", end: "2026-10-27" });
  });
  test("7-day window handles month boundaries", () => {
    expect(reportRange(7, new Date("2026-03-03T00:00:00Z"))).toEqual({ start: "2026-02-22", end: "2026-02-28" });
  });
});