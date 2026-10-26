import { describe, expect, it } from "vitest";
import { historyTimeline, summarizeEntities, type CachedHistoryRow } from "@/lib/ads/dashboard";
import { normalizedHistoryKey, normalizedHistoryRowSchema } from "@/lib/ads/history-contracts";
const metrics = { spend: 100, impressions: 1000, clicks: 20, conversions: 4, conversionValue: 200 };
const row: CachedHistoryRow = { external_id: "c1", name: "Campaign", day: "2026-10-01", metrics, data_maturity: "mature", level: "campaign", parent_external_id: null, breakdowns: {}, fetched_at: "2026-10-20T00:00:00Z" };
describe("cached campaign dashboard", () => {
  it("never double counts device breakdowns with campaign aggregate spend", () => {
    expect(summarizeEntities([row, { ...row, breakdowns: { device: "mobile" } }])[0]?.totals.spend).toBe(100);
  });
  it("keeps child entities out of campaign totals", () => {
    const entities = summarizeEntities([row, { ...row, level: "ad", parent_external_id: "c1" }]);
    expect(entities.filter((entity) => entity.level === "campaign")[0]?.totals.spend).toBe(100);
    expect(entities.filter((entity) => entity.level === "ad")).toHaveLength(1);
  });
  it("preserves missing days and excludes immature points instead of inventing zeros", () => {
    const timeline = historyTimeline([row, { ...row, day: "2026-10-02", data_maturity: "immature" }], "2026-10-01", "2026-10-04");
    expect(timeline.map((point) => point.spend)).toEqual([100, null, null]);
    expect(timeline[2]?.missing).toBe(true);
    expect(timeline[1]?.excluded).toBe(1);
  });
});
describe("normalized history contracts", () => {
  const normalized = { externalId: "c1", parentId: null, name: null, level: "campaign" as const, since: "2026-10-01", until: "2026-10-01", granularity: "daily" as const, dimensions: {}, metrics, maturity: "mature" as const };
  it("separates weekly reporting and device dimensions from daily aggregates", () => {
    expect(normalizedHistoryKey(normalized)).not.toBe(normalizedHistoryKey({ ...normalized, dimensions: { device: "mobile" } }));
    expect(normalizedHistoryKey(normalized)).not.toBe(normalizedHistoryKey({ ...normalized, granularity: "weekly", until: "2026-10-07" }));
  });
  it("rejects incomplete money metrics rather than filling in values", () => {
    expect(normalizedHistoryRowSchema.safeParse({ ...normalized, metrics: { spend: 100 } }).success).toBe(false);
  });
});