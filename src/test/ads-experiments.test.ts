import { describe, expect, it } from "vitest";
import { canTransition, conceptCountRule, judgeExperiment, testBudgetAllowed } from "@/lib/ads/experiments";

const cpa = { metric: "cpa" as const, direction: "lower" as const, minLiftPct: 10, minConversions: 30 };

describe("experiments", () => {
  it("Meta plans require 8-15 concepts", () => expect(conceptCountRule("meta", 1)).toEqual({ min: 8, max: 15 }));
  it("Google requires 2-4 concepts per market", () => expect(conceptCountRule("google", 2)).toEqual({ min: 4, max: 8 }));
  it("test budget is capped by the experiment share", () => { expect(testBudgetAllowed(15, 100, 15)).toBe(true); expect(testBudgetAllowed(16, 100, 15)).toBe(false); });
  it("completed tests cannot restart", () => { expect(canTransition("completed", "running")).toBe(false); expect(canTransition("planned", "running")).toBe(true); expect(canTransition("planned", "completed")).toBe(false); });
  it("small samples are inconclusive", () => expect(judgeExperiment(cpa, { value: 50, conversions: 29 }, { value: 30, conversions: 40 })).toBe("inconclusive"));
  it("10% lower CPA wins, 10% higher loses", () => { expect(judgeExperiment(cpa, { value: 50, conversions: 30 }, { value: 45, conversions: 30 })).toBe("winner"); expect(judgeExperiment(cpa, { value: 50, conversions: 30 }, { value: 55, conversions: 30 })).toBe("loser"); });
});
