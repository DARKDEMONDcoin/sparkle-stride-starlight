import { describe, expect, it } from "vitest";
import { mediaBuyerSectionNames, mediaBuyerPlaybook } from "@/lib/ads/playbook";
import { buildMediaBuyerPrompt } from "@/lib/ads/prompts/media-buyer.v1";
import { landingAuditPrompt } from "@/lib/ads/prompts/landing-audit";
describe("Media Buyer selective instruction scope", () => {
  it("always includes core with unknown account/task", () => expect(mediaBuyerSectionNames()).toEqual(["core"]));
  it("loads Google only for a Google account", () => expect(mediaBuyerSectionNames({ task: "baseline", platforms: ["google"] })).toEqual(["core", "google"]));
  it("loads Meta only for a Meta account", () => expect(mediaBuyerSectionNames({ task: "baseline", platforms: ["meta"] })).toEqual(["core", "meta"]));
  it("deduplicates platforms in stable order", () => expect(mediaBuyerSectionNames({ platforms: ["meta", "google", "meta"] })).toEqual(["core", "google", "meta"]));
  it.each(["analysis", "tracking", "structure", "landing_page", "outcome_review", "daily_audit"] as const)("includes diagnostics for %s", (task) => expect(mediaBuyerSectionNames({ task })).toContain("diagnostics"));
  it("includes page guidance for weak conversion without enabling creatives", () => expect(mediaBuyerSectionNames({ task: "analysis", platforms: ["meta"], weakConversion: true })).toEqual(["core", "meta", "landing-pages", "diagnostics"]));
  it("includes page guidance for explicit page work", () => expect(mediaBuyerSectionNames({ task: "campaign_draft", pageWork: true })).toEqual(["core", "landing-pages"]));
  it("loads creative guidance only while writing ads", () => {
    expect(mediaBuyerSectionNames({ task: "creative" })).toEqual(["core", "creative"]);
    expect(mediaBuyerSectionNames({ task: "campaign_draft", writingAds: true })).toEqual(["core", "creative"]);
    expect(mediaBuyerSectionNames({ task: "campaign_draft" })).not.toContain("creative");
  });
  it("composes requested section content without full-book injection", () => {
    expect(buildMediaBuyerPrompt({ task: "analysis", platforms: ["google"] })).toContain(mediaBuyerPlaybook({ task: "analysis", platforms: ["google"] }));
    expect(buildMediaBuyerPrompt({ task: "analysis", platforms: ["google"] }).length).toBeLessThan(buildMediaBuyerPrompt({ task: "analysis", platforms: ["google", "meta"], writingAds: true, pageWork: true }).length);
  });
  it("keeps page output constraints after the general system instructions", () => {
    const output = landingAuditPrompt({ platforms: ["meta"] });
    expect(output.lastIndexOf("Audit output contract")).toBeGreaterThan(output.indexOf("You are Media Buyer"));
  });
});