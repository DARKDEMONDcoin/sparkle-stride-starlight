import { describe, expect, it } from "vitest";
import { team } from "@/data/team";
import { buildOnboarding, employeeSetups, generalObjectives, objectivesPrompt } from "@/lib/onboarding-objectives";
import { purposeMembers } from "@/lib/welcome-purpose";

describe("onboarding objectives", () => {
  it("covers all seven employees with objectives and short default-answered questions", () => {
    expect(team.length).toBe(7);
    for (const m of team) {
      const s = employeeSetups[m.id];
      expect(s, m.id).toBeDefined();
      expect(s!.objectives.length).toBeGreaterThan(0);
      for (const q of s!.questions) {
        expect(q.options).toContain(q.default);
        expect(q.options.length).toBeLessThanOrEqual(4);
      }
    }
    expect(generalObjectives.length).toBeGreaterThan(0);
  });
  it("welcome tour has copy for all seven employees", () => {
    for (const p of ["business", "job", "personal"] as const) for (const m of team) expect(purposeMembers[p][m.id], `${p}/${m.id}`).toBeDefined();
  });
  it("invalid answers fall back to defaults and unknown employees are dropped", () => {
    const r = buildOnboarding({ general: { traffic: { target: "", horizon: "3m" } }, employees: ["nour", "ghost"], employeeObjectives: { nour: ["rank"] }, answers: { nour: { articles: "999" } } });
    expect(r.employees).toEqual(["nour"]);
    expect(r.answers["nour"]!["articles"]).toBe("4");
    expect(r.objectives.find((o) => o.id === "traffic")!.target).toBe("10000");
  });
  it("employee prompt shows general goals and only that employee's goals", () => {
    const r = buildOnboarding({ general: { leads: { target: "50", horizon: "1m" } }, employees: ["nour", "abdullah"], employeeObjectives: { nour: ["rank"], abdullah: ["roas"] }, answers: {} });
    const p = objectivesPrompt(r, "nour");
    expect(p).toContain("زيادة العملاء المحتملين");
    expect(p).toContain("تحسين الترتيب");
    expect(p).not.toContain("عائد الإعلانات");
  });
});
