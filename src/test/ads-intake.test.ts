import { describe, expect, it } from "vitest";
import { allowableCpa, feasibility, missingRequired, validateCopy, specialAdCategories } from "@/lib/ads/intake";

describe("Abdullah intake and feasibility", () => {
  it("has no preset country, language or currency: empty intake is incomplete", () => {
    const m = missingRequired({}, ["google"]);
    expect(m).toContain("markets"); expect(m).toContain("languages"); expect(m).toContain("monthlyBudget");
  });
  it("requires a language for every market and the Facebook Page for Meta", () => {
    const m = missingRequired({ markets: ["Cairo", "Riyadh"], languages: { Cairo: "ar" } }, ["meta"]);
    expect(m).toContain("languages.Riyadh"); expect(m).toContain("metaPage"); expect(m).not.toContain("languages.Cairo");
  });
  it("derives allowable CPA from unit economics", () => {
    expect(allowableCpa({ goal: "sales", aov: 200, margin: 0.5 })).toBe(100);
    expect(allowableCpa({ goal: "leads", aov: 1000, margin: 0.4, closeRate: 0.1 })).toBe(40);
    expect(allowableCpa({ goal: "leads", aov: 1000, margin: 0.4 })).toBeNull();
  });
  it("applies Google ≈ CPA/day and Meta CPA×50/7 per ad set", () => {
    const f = feasibility({ confirmedCpa: 70, monthlyBudget: 3040, goal: "traffic" }, ["meta"]);
    expect(f.metaMinDailyPerAdSet).toBe(500); expect(f.dailyBudget).toBe(100); expect(f.maxMetaAdSets).toBe(0); expect(f.ok).toBe(false);
    const g = feasibility({ confirmedCpa: 50, monthlyBudget: 3040, goal: "traffic" }, ["google"]);
    expect(g.maxGoogleCampaigns).toBe(2); expect(g.ok).toBe(true);
  });
  it("flags sales goals without tracking", () => {
    expect(feasibility({ confirmedCpa: 10, monthlyBudget: 3040, goal: "sales" }, ["google"]).ok).toBe(false);
  });
  it("enforces RSA 30/90 limits and Meta 5 variations", () => {
    expect(validateCopy("google", { headlines: ["a".repeat(31), "b", "c"], descriptions: ["d", "e"] })).toHaveLength(1);
    expect(validateCopy("meta", { headlines: ["h"], primary: ["1", "2", "3", "4", "5", "6"] })).toHaveLength(1);
    expect(validateCopy("google", { headlines: ["نتائج مضمونة", "b", "c"], descriptions: ["d", "e"] })).toHaveLength(1);
  });
  it("detects Meta special ad categories", () => {
    expect(specialAdCategories({ industry: "تمويل عقاري" })).toEqual(expect.arrayContaining(["financial", "housing"]));
  });
});
