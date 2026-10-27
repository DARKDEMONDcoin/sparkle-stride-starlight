import { describe, expect, it } from "vitest";
import { emptyGoogleOptions, googleAssetChecklist } from "@/lib/ads/google-campaigns";

const approvedCreative = (market: string, language: string) => ({
  market, language, status: "approved",
  headlines: ["عرض خاص", "اكتشف المزيد", "تسوّق الآن"],
  longHeadlines: ["عنوان طويل صالح"],
  descriptions: ["وصف أول صالح", "وصف ثانٍ صالح"],
  images: [{ ratio: "1:1", status: "approved" }, { ratio: "1.91:1", status: "approved" }],
});
const baseOptions = { ...emptyGoogleOptions(), businessName: "نشاطي" };

describe("Google asset checklist", () => {
  it("requires coverage for every language of a market, not just one", () => {
    const markets = [{ market: "Cairo", languages: ["ar", "en"] }];
    const onlyArabic = googleAssetChecklist("performance_max", { ...baseOptions, logoUrl: "https://example.com/logo.png", videoUrl: "https://example.com/v.mp4" }, [approvedCreative("Cairo", "ar")], markets);
    expect(onlyArabic.complete).toBe(false);
    expect(onlyArabic.issues.some((i) => i.includes("(en)"))).toBe(true);
    const both = googleAssetChecklist("performance_max", { ...baseOptions, logoUrl: "https://example.com/logo.png", videoUrl: "https://example.com/v.mp4" }, [approvedCreative("Cairo", "ar"), approvedCreative("Cairo", "en")], markets);
    expect(both.complete).toBe(true);
  });
  it("accepts the older single-language market shape", () => {
    const markets = [{ market: "Cairo", language: "ar" }];
    const c = googleAssetChecklist("demand_gen", { ...baseOptions, logoUrl: "https://example.com/logo.png", videoUrl: "https://example.com/v.mp4" }, [approvedCreative("Cairo", "ar")], markets);
    expect(c.complete).toBe(true);
  });
  it("lets an uploaded logo and video satisfy the logo/video requirements without URLs", () => {
    const markets = [{ market: "Cairo", languages: ["ar"] }];
    const without = googleAssetChecklist("performance_max", baseOptions, [approvedCreative("Cairo", "ar")], markets);
    expect(without.issues.some((i) => i.includes("شعار"))).toBe(true);
    expect(without.issues.some((i) => i.includes("فيديو"))).toBe(true);
    const withUploads = googleAssetChecklist("performance_max", baseOptions, [approvedCreative("Cairo", "ar")], markets, [{ kind: "logo" }, { kind: "video" }]);
    expect(withUploads.complete).toBe(true);
  });
  it("flags a market with no language at all", () => {
    const c = googleAssetChecklist("demand_gen", { ...baseOptions, logoUrl: "https://example.com/logo.png", videoUrl: "https://example.com/v.mp4" }, [], [{ market: "Cairo", languages: [] }]);
    expect(c.issues.some((i) => i.includes("لغة واحدة على الأقل"))).toBe(true);
  });
});
