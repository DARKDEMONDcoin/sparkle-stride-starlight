import { describe, expect, it } from "vitest";
import { ADS_DEFAULTS, apiLifecycleHealth, validApiVersion } from "@/lib/ads/config";

describe("Media Buyer configuration", () => {
  it("defaults daily audits to off", () => expect(ADS_DEFAULTS.dailyAudit).toBe(false));
  it("sets baseline freshness to seven days", () => expect(ADS_DEFAULTS.baselineFreshnessDays).toBe(7));
  it("sets tunable new-account thresholds to 30 days and conversions", () => {
    expect(ADS_DEFAULTS.newAccountMinDays).toBe(30);
    expect(ADS_DEFAULTS.newAccountMinConversions).toBe(30);
  });
  it("warns at the 90-day sunset boundary", () => {
    const input = { configured: "v26", registered: "v26", sunsetAt: "2027-01-01", sunsetMonth: null, precision: "exact" };
    expect(apiLifecycleHealth(input, new Date("2026-10-03T00:00:00Z")).status).toBe("warning");
    expect(apiLifecycleHealth(input, new Date("2026-10-02T00:00:00Z")).status).toBe("current");
  });
  it("never treats unknown sunsets or unregistered versions as healthy", () => {
    const input = { configured: "v26.0", registered: "v26.0", sunsetAt: null, sunsetMonth: null, precision: "unknown" };
    expect(apiLifecycleHealth(input).status).toBe("unknown");
    expect(apiLifecycleHealth({ ...input, configured: "v27.0" }).status).toBe("unverified");
  });
  it("validates platform-specific version formats", () => {
    expect(validApiVersion("google", "v26")).toBe(true);
    expect(validApiVersion("google", "v26/evil")).toBe(false);
    expect(validApiVersion("meta", "v26.0")).toBe(true);
    expect(validApiVersion("meta", "v26")).toBe(false);
  });
});