import { describe, expect, it, vi } from "vitest";
import { normalizeAdPage, publicIPv4, vitalStatus, compactPageSpeed, pageOpportunities } from "@/lib/ads/landing-pages";
import { fetchAdPage, PAGE_MAX_REDIRECTS, PAGE_MAX_BYTES } from "@/lib/ads/landing-fetch.server";
describe("ad landing URL protection", () => {
  it("deduplicates tracking without merging product or language variants", () => {
    expect(normalizeAdPage("https://store.com/page?utm_source=ad&lang=ar&product=4#x")).toBe("https://store.com/page?lang=ar&product=4");
    expect(normalizeAdPage("https://store.com/page?lang=en")).not.toBe(normalizeAdPage("https://store.com/page?lang=ar"));
  });
  it.each(["http://127.0.0.1/", "http://2130706433/", "http://[::1]/", "https://localhost/", "https://site.internal/", "https://user:pass@store.com", "file:///etc/passwd", "https://store.com/?access_token=x"])("blocks unsafe destination %s", (url) => expect(() => normalizeAdPage(url)).toThrow());
  it.each(["10.0.0.1", "127.0.0.1", "169.254.169.254", "172.16.0.1", "192.168.1.1", "100.64.0.1", "0.0.0.0", "198.18.0.1", "224.0.0.1"])("rejects non-public resolved address %s", (ip) => expect(publicIPv4(ip)).toBe(false));
  it("allows a public IPv4 address", () => expect(publicIPv4("8.8.8.8")).toBe(true));
  it("rejects private redirect before the next request", async () => {
    const read = vi.fn().mockResolvedValue({ status: 302, location: "http://127.0.0.1/", html: "" });
    await expect(fetchAdPage("https://store.com", { resolve: async () => "8.8.8.8", read })).rejects.toThrow();
    expect(read).toHaveBeenCalledTimes(1);
  });
  it("caps redirects at exactly five", async () => {
    expect(PAGE_MAX_REDIRECTS).toBe(5);
    const read = vi.fn().mockResolvedValue({ status: 302, location: "/next", html: "" });
    await expect(fetchAdPage("https://store.com", { resolve: async () => "8.8.8.8", read })).rejects.toThrow("Too many redirects");
    expect(read).toHaveBeenCalledTimes(6);
  });
  it("uses a bounded response cap", () => expect(PAGE_MAX_BYTES).toBe(512000));
});
describe("p75 Core Web Vitals", () => {
  it.each([["lcp", 2500, "good"], ["lcp", 4000, "needs_improvement"], ["lcp", 4001, "poor"], ["inp", 200, "good"], ["inp", 500, "needs_improvement"], ["inp", 501, "poor"], ["cls", 0.1, "good"], ["cls", 0.25, "needs_improvement"], ["cls", 0.251, "poor"]] as const)("classifies %s at %s", (kind, value, status) => expect(vitalStatus(kind, value)).toBe(status));
  it("does not substitute Lighthouse lab for absent real-user field data", () => {
    const result = compactPageSpeed({ lighthouseResult: { audits: { "largest-contentful-paint": { numericValue: 1000 } } } });
    expect(result.fieldAvailable).toBe(false); expect(result.field.lcpStatus).toBe("unknown"); expect(result.lab.lcp).toBe(1000);
  });
  it("normalizes field CLS hundredths", () => expect(compactPageSpeed({ loadingExperience: { metrics: { CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 10 } } } }).field.cls).toBe(.1));
});
describe("like-for-like page opportunity", () => {
  const row = { landing_page_id: "a", platform: "meta", device: "mobile", date: "2026-10-01", data_maturity: "mature", spend: 100, clicks: 100, conversions: 2, outbound_clicks: 100, landing_page_views: 80 };
  it("uses the account's own same-device benchmark", () => { const result = pageOpportunities([row, { ...row, landing_page_id: "b", conversions: 10 }]); expect(result[0]?.pageId).toBe("a"); expect(result[0]?.opportunity).toBeCloseTo(.02); expect(result[0]?.outboundToView).toBe(.8); });
  it("does not compare different devices", () => expect(pageOpportunities([row, { ...row, landing_page_id: "b", device: "desktop", conversions: 10 }]).every((r) => r.opportunity === null)).toBe(true));
  it("does not rank immature or missing-day evidence", () => { const result = pageOpportunities([row, { ...row, date: "2026-10-03" }, { ...row, landing_page_id: "b", data_maturity: "immature" }]); expect(result.every((r) => r.opportunity === null)).toBe(true); });
});