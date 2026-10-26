import { describe, expect, it } from "vitest";
import { baselineReport, CONTEXT_QUESTIONS, evidenceGate, evaluateOutcome, type Baseline, type OutcomeWindow } from "@/lib/ads/baseline";
const now = new Date("2026-10-25T12:00:00Z");
const baseline: Baseline = { id: "b", workspace_id: "ws", ad_account_id: "a", status: "ready", mode: "historical", built_at: "2026-10-24T12:00:00Z", expires_at: "2026-10-31T12:00:00Z", covered_entities: [{ level: "campaign", externalId: "c" }], data_quality: { verified_source: true } };
const scope = { workspaceId: "ws", accountId: "a", entity: { level: "campaign", externalId: "c" } };
describe("Abdullah mandatory evidence", () => {
  it("accepts ready fresh covered verified evidence", () => expect(evidenceGate(baseline, scope, now).ok).toBe(true));
  it("rejects a building baseline", () => expect(evidenceGate({ ...baseline, status: "building" }, scope, now).ok).toBe(false));
  it("rejects evidence older than seven days", () => expect(evidenceGate({ ...baseline, built_at: "2026-10-18T11:59:59Z" }, scope, now).ok).toBe(false));
  it("honors configurable freshness", () => expect(evidenceGate(baseline, { ...scope, freshnessDays: .5 }, now).ok).toBe(false));
  it("rejects another account", () => expect(evidenceGate(baseline, { ...scope, accountId: "other" }, now).ok).toBe(false));
  it("rejects uncovered entities", () => expect(evidenceGate(baseline, { ...scope, entity: { level: "ad", externalId: "c" } }, now).ok).toBe(false));
  it("rejects a major change after the baseline", () => expect(evidenceGate(baseline, { ...scope, majorChangeAt: "2026-10-24T13:00:00Z" }, now).ok).toBe(false));
  it("cannot infer verified ingestion from metrics", () => expect(evidenceGate({ ...baseline, data_quality: {} }, scope, now).ok).toBe(false));
  it("asks no more than five context questions", () => expect(CONTEXT_QUESTIONS.length).toBe(5));
});
function report(days: number, conversions: number, proof = true) {
  return baselineReport({ rows: Array.from({ length: days }, (_, index) => ({ external_id: "c", name: "campaign", day: new Date(Date.parse("2026-07-27") + index * 86400000).toISOString().slice(0, 10), metrics: { spend: 10, clicks: 20, impressions: 100, conversions: conversions / days, conversionValue: 50 }, data_maturity: "mature", level: "campaign", parent_external_id: null, breakdowns: {}, fetched_at: "2026-10-24T12:00:00Z" })), today: "2026-10-25", since: "2026-07-27", complete: true, provenance: proof ? { verified: true, dailySince: "2026-07-27", dailyUntil: "2026-10-24", trackingVerified: true, lagDays: 7, attributionWindow: null, source: "verified_import" } : null });
}
describe("saved-data baseline discipline", () => {
  it("less than 30 days uses new account mode", () => expect(report(29, 100).mode).toBe("new_account"));
  it("fewer than 30 conversions uses new account mode", () => expect(report(40, 29).mode).toBe("new_account"));
  it("30 days and 30 conversions clear small account thresholds", () => expect(report(30, 30).mode).toBe("historical"));
  it("missing provenance never creates a ready baseline", () => expect(report(90, 100, false).status).toBe("building"));
  it("unknown lag suppresses mature financial totals", () => expect(report(30, 30, false).funnel.included).toBe(0));
  it("excludes the last seven days from mature data", () => expect(report(90, 90).data_quality.matureDays).toBe(84));
});
const before: OutcomeWindow = { since: "2026-09-01", until: "2026-09-14", mature: true, complete: true, value: 100, samples: 50 };
const after: OutcomeWindow = { ...before, since: "2026-10-01", until: "2026-10-14", value: 120 };
const evaluation = { before, after, reviewAt: "2026-10-24", learningEndsAt: "2026-10-15", lagDays: 7, minimumSamples: 30, direction: "increase" as const, targetDelta: .15, noiseBand: .1, confounders: [] };
describe("outcome discipline", () => {
  it("waits for learning plus conversion lag", () => expect(evaluateOutcome(evaluation, new Date("2026-10-20")).classification).toBe("inconclusive"));
  it("requires whole matching weeks", () => expect(evaluateOutcome({ ...evaluation, after: { ...after, until: "2026-10-13" } }, now).classification).toBe("inconclusive"));
  it("small samples are inconclusive", () => expect(evaluateOutcome({ ...evaluation, after: { ...after, samples: 29 } }, now).classification).toBe("inconclusive"));
  it("external events are confounded", () => expect(evaluateOutcome({ ...evaluation, confounders: ["stockout"] }, now).classification).toBe("confounded"));
  it("mature improvement beyond the target and noise is worked", () => expect(evaluateOutcome(evaluation, now).classification).toBe("worked"));
  it("mature deterioration beyond noise is failed", () => expect(evaluateOutcome({ ...evaluation, after: { ...after, value: 80 } }, now).classification).toBe("failed"));
});