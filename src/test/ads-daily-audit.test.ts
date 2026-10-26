import { describe, expect, it } from "vitest";
import { auditSummary, pagesDueForWeeklyCheck } from "@/lib/ads/daily-audit";
const now = new Date("2026-10-26T12:00:00Z");
describe("daily audit weekly page check", () => {
  it("page never checked is due", () => expect(pagesDueForWeeklyCheck([{ id: "a" }], [], now).map((p) => p.id)).toEqual(["a"]));
  it("page checked 3 days ago is not due", () => expect(pagesDueForWeeklyCheck([{ id: "a" }], [{ landing_page_id: "a", created_at: "2026-10-23T12:00:00Z" }], now)).toEqual([]));
  it("page checked 8 days ago is due", () => expect(pagesDueForWeeklyCheck([{ id: "a" }], [{ landing_page_id: "a", created_at: "2026-10-18T12:00:00Z" }], now)).toHaveLength(1));
  it("summary always states no campaign changes", () => expect(auditSummary({ dueReviews: 0, pagesChecked: 0, pagesFailed: 0, pagesSkippedWebsiteOff: false, metricsHeld: true })).toContain("لم يُطبَّق أي تغيير"));
});
