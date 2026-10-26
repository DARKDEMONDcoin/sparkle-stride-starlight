import { expect, it } from "vitest";
import { mediaBuyerGuidelines } from "@/lib/ads/guidelines";

it("injects active Abdullah rules and excludes disabled and other employee rules", () => {
  const base = { kind: "employee_guideline", body: "Never promise results", title: "Rule" };
  const block = mediaBuyerGuidelines([
    { ...base, meta: "abdullah:brand", used_by: ["abdullah"] },
    { ...base, body: "Disabled rule", meta: "abdullah:targets", used_by: [] },
    { ...base, body: "Adam only", meta: "adam:analysis", used_by: ["abdullah", "adam"] },
  ]);
  expect(block).toContain("Never promise results");
  expect(block).not.toContain("Disabled rule");
  expect(block).not.toContain("Adam only");
});