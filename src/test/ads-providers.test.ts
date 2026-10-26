import { describe, expect, it } from "vitest";
import {
  CAPABILITY_EXPLANATIONS,
  PROVIDER_CAPABILITIES,
  isAdProviderKind,
  providerLabel,
  resolveProvider,
  thirdPartyNotice,
  providerConnectionReadiness,
  requireProviderConnection,
} from "@/lib/ads/providers";

describe("Media Buyer provider resolution", () => {
  it("defaults to pipeboard when nothing is configured", () => {
    expect(resolveProvider("google", null, null)).toBe("pipeboard");
    expect(resolveProvider("meta", undefined, undefined)).toBe("pipeboard");
  });
  it("prefers the workspace override over the environment", () => {
    expect(resolveProvider("google", "pipeboard", "direct")).toBe("direct");
  });
  it("falls back to the environment when the override is invalid", () => {
    expect(resolveProvider("meta", "windsor", "bogus")).toBe("windsor");
  });
  it("rejects unknown provider names", () => {
    expect(isAdProviderKind("pipeboard")).toBe(true);
    expect(isAdProviderKind("pipedream")).toBe(false);
    expect(isAdProviderKind("")).toBe(false);
  });
});

describe("Media Buyer provider capabilities", () => {
  it("marks windsor as read-only with no creation abilities", () => {
    const caps = PROVIDER_CAPABILITIES.windsor;
    expect(caps.canWrite).toBe(false);
    expect(caps.canCreatePMax).toBe(false);
    expect(caps.canCreateAdvantagePlus).toBe(false);
  });
  it("marks pipeboard as unable to read change history or landing metrics", () => {
    const caps = PROVIDER_CAPABILITIES.pipeboard;
    expect(caps.canWrite).toBe(false);
    expect(caps.canReadChangeHistory).toBe(false);
    expect(caps.canReadLandingPageMetrics).toBe(false);
    expect(caps.canReadConversionLag).toBe(false);
  });
  it.each(["direct", "pipeboard", "windsor"] as const)("keeps unverified %s adapters unavailable for writes and feature claims", (kind) => {
    expect(Object.values(PROVIDER_CAPABILITIES[kind]).every(value => value === false)).toBe(true);
    expect(providerConnectionReadiness(kind).available).toBe(false);
    expect(() => requireProviderConnection(kind)).toThrow();
  });
  it("has a plain-language explanation for every capability flag", () => {
    for (const key of Object.keys(PROVIDER_CAPABILITIES.direct)) {
      expect(CAPABILITY_EXPLANATIONS[key as keyof typeof CAPABILITY_EXPLANATIONS]).toBeTruthy();
    }
  });
  it("names the third party in the consent notice only for third-party providers", () => {
    expect(thirdPartyNotice("pipeboard")).toContain("Pipeboard");
    expect(thirdPartyNotice("windsor")).toContain("Windsor");
    expect(thirdPartyNotice("direct")).toBeNull();
  });
  it("labels providers in plain language", () => {
    expect(providerLabel("pipeboard")).toBe("Pipeboard");
    expect(providerLabel("direct")).toBe("الربط المباشر");
  });
});
