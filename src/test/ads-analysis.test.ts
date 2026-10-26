import { describe, expect, it } from "vitest";
import { changeSchema, reviewGuard, trackingAudit, structureAudit, performanceComparison, type ApprovalEvidence } from "@/lib/ads/analysis";
const change = changeSchema.parse({ kind: "budget", entity: { level: "campaign", externalId: "c" }, campaignId: "c", newDaily: 120, summary: "Increase budget" });
const evidence: ApprovalEvidence = { currentDaily: 100, monthlyCommitted: 3000, daysInMonth: 30, trackingHealthy: true, landingPageHealthy: true, weakConversion: false, learning: false, learningEndsAt: "2026-10-15", lagDays: 7, mature: true, capturedAt: "2026-10-25T12:00:00Z", entityCovered: true, parentCovered: true, activeMajorChange: false };
const options = { maxIncreasePct: 20, monthlyCap: 4000, successMetric: "CPA", reviewAt: "2026-11-01T12:00:00Z", acknowledgeLearning: false, individual: true };
const now = new Date("2026-10-25T12:01:00Z");
describe("Media Buyer approval rules", () => {
  it("allows exactly 20 percent with complete evidence", () => expect(reviewGuard(change, evidence, options, now).ok).toBe(true));
  it("rejects more than 20 percent even with wider configured limit", () => expect(reviewGuard({ ...change, newDaily: 121 }, evidence, { ...options, maxIncreasePct: 50 }, now).ok).toBe(false));
  it("rejects budget increases in batch", () => expect(reviewGuard(change, evidence, { ...options, individual: false }, now).ok).toBe(false));
  it("uses total account monthly commitment", () => expect(reviewGuard(change, { ...evidence, monthlyCommitted: 3500 }, options, now).ok).toBe(false));
  it("requires verified tracking before increasing spend", () => expect(reviewGuard(change, { ...evidence, trackingHealthy: null }, options, now).ok).toBe(false));
  it("requires healthy landing page for weak conversion", () => expect(reviewGuard(change, { ...evidence, weakConversion: true, landingPageHealthy: false }, options, now).ok).toBe(false));
  it("does not stack major changes", () => expect(reviewGuard(change, { ...evidence, activeMajorChange: true }, options, now).ok).toBe(false));
  it("rejects immature performance changes", () => expect(reviewGuard(change, { ...evidence, mature: false }, options, now).ok).toBe(false));
  it("requires entity and parent evidence", () => expect(reviewGuard(change, { ...evidence, parentCovered: false }, options, now).ok).toBe(false));
  it("requires fresh pre-change capture", () => expect(reviewGuard(change, { ...evidence, capturedAt: "2026-10-25T11:00:00Z" }, options, now).ok).toBe(false));
  it("requires review after learning plus lag", () => expect(reviewGuard(change, { ...evidence, learningEndsAt: "2026-11-01" }, options, now).ok).toBe(false));
  it("requires learning warning for bidding changes", () => expect(reviewGuard({ ...change, kind: "bid_strategy" }, { ...evidence, learning: true }, options, now).ok).toBe(false));
});
describe("honest audit coverage", () => {
  it("missing comparison days never produce performance deltas", () => {
    const rows = ["2026-09-01", "2026-10-01"].map((day) => ({ external_id: "c", name: "c", day, metrics: { spend: 10, impressions: 100, clicks: 10, conversions: 2, conversionValue: 20 }, data_maturity: "mature", level: "campaign", parent_external_id: null, breakdowns: {}, fetched_at: "2026-10-25T12:00:00Z" }));
    expect(performanceComparison(rows, "2026-09-01", "2026-10-01", "2026-10-31")[0]?.cpaDelta).toBeNull();
    expect(performanceComparison(rows, "2026-09-01", "2026-10-01", "2026-10-31")[0]?.complete).toBe(false);
  });
  it("missing conversion setup has no health score", () => { const report = trackingAudit("meta", null); expect(report.score).toBeNull(); expect(report.coverage.verified).toBe(false); expect(report.findings[0]?.code).toBe("setup_unavailable"); });
  it("missing structure evidence has no symptoms or consolidation claims", () => { const report = structureAudit([], "2026-09-01", "2026-10-01"); expect(report.symptoms).toEqual([]); expect(report.score).toBeNull(); expect(report.recommendations).toEqual([]); });
});