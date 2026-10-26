/** Browser-safe Google planning rules. Provider validation is separate and remains unavailable. */
export const GOOGLE_CAMPAIGN_TYPES = ["search", "performance_max", "demand_gen"] as const;
export type GoogleCampaignType = typeof GOOGLE_CAMPAIGN_TYPES[number];
export const GOOGLE_CAMPAIGN_LABELS: Record<GoogleCampaignType, string> = { search: "Google Search", performance_max: "Performance Max", demand_gen: "Demand Gen" };
export type GoogleCampaignOptions = {
  businessName: string;
  logoUrl: string;
  videoUrl: string;
  merchantCenterId: string;
  audienceSignals: string[];
  searchThemes: string[];
  brandExclusions: string[];
};
export const emptyGoogleOptions = (): GoogleCampaignOptions => ({ businessName: "", logoUrl: "", videoUrl: "", merchantCenterId: "", audienceSignals: [], searchThemes: [], brandExclusions: [] });
export function googleCampaignType(value: unknown): GoogleCampaignType {
  return GOOGLE_CAMPAIGN_TYPES.find((t) => t === value) ?? "search";
}
export const GOOGLE_ASSET_SOURCES = [
  "https://support.google.com/google-ads/answer/17091269?hl=en",
  "https://support.google.com/google-ads/answer/17091672?hl=en",
];
export function publicAssetReference(value: string): boolean {
  try {
    const u = new URL(value);
    // References are never fetched here. Private addresses/credentials are not valid references.
    return u.protocol === "https:" && !u.username && !u.password && !u.port && u.hostname.includes(".") &&
      !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname) && !/\.(local|internal)$/i.test(u.hostname);
  } catch { return false; }
}
export type GoogleCopy = { headlines: string[]; longHeadlines?: string[]; descriptions?: string[]; primary?: string[] };
const chars = (s: string) => [...s].length;
export function validateGoogleVisualCopy(type: Exclude<GoogleCampaignType, "search">, copy: GoogleCopy): string[] {
  const issues: string[] = [];
  const pmax = type === "performance_max";
  const headlineMax = pmax ? 30 : 40;
  if (copy.headlines.length < (pmax ? 3 : 1) || copy.headlines.length > (pmax ? 15 : 5)) issues.push(pmax ? "عناوين Performance Max بين 3 و15." : "عناوين Demand Gen بين 1 و5.");
  if (copy.headlines.some((s) => !s.trim() || chars(s) > headlineMax)) issues.push(`كل عنوان غير فارغ وبحد أقصى ${headlineMax} حرفاً.`);
  if (pmax && !copy.headlines.some((s) => s.trim() && chars(s) <= 15)) issues.push("Performance Max يحتاج عنواناً واحداً على الأقل لا يتجاوز 15 حرفاً.");
  const descriptions = copy.descriptions ?? [];
  if (descriptions.length < (pmax ? 2 : 1) || descriptions.length > 5) issues.push(pmax ? "أوصاف Performance Max بين 2 و5." : "أوصاف Demand Gen بين 1 و5.");
  if (descriptions.some((s) => !s.trim() || chars(s) > 90)) issues.push("كل وصف غير فارغ وبحد أقصى 90 حرفاً.");
  const long = copy.longHeadlines ?? [];
  if (pmax && (long.length < 1 || long.length > 5 || long.some((s) => !s.trim() || chars(s) > 90))) issues.push("Performance Max يحتاج 1–5 عناوين طويلة، حتى 90 حرفاً لكل عنوان.");
  if (!pmax && long.length) issues.push("العناوين الطويلة ليست ضمن نص إعلان Demand Gen المصوّر.");
  if ((copy.primary ?? []).length) issues.push("النص الأساسي الخاص بـ Meta لا يُستخدم في هذه الحملة.");
  if ([...copy.headlines, ...long, ...descriptions].some((s) => /guarante|100%|cure|best in the world|مضمون|ضمان|نتائج مؤكدة|يشفي|الأفضل في العالم/i.test(s))) issues.push("صياغة عالية المخاطر (ضمانات/ادعاءات مطلقة).");
  return issues;
}
export function googleCopyInstructions(type: GoogleCampaignType): string {
  if (type === "performance_max") return "Performance Max: 3-15 distinct headlines <=30 characters, at least one <=15; 1-5 longHeadlines <=90; 2-5 descriptions <=90; primary=[].";
  if (type === "demand_gen") return "Demand Gen image ad: 1-5 distinct headlines <=40 characters, include one <=30 for Display eligibility; 1-5 descriptions <=90; longHeadlines=[]; primary=[].";
  return "Responsive search ads: 8-15 headlines <=30 characters, 2-4 descriptions <=90, longHeadlines=[], primary=[].";
}
type PlanningCreative = GoogleCopy & { market: string; language: string; status: string; images?: { ratio: string; status: string }[] };
export function googleAssetChecklist(type: GoogleCampaignType, options: Partial<GoogleCampaignOptions>, creatives: PlanningCreative[], markets: { market: string; language: string | null }[]) {
  if (type === "search") return { complete: true, issues: [] as string[], warnings: [] as string[], platformVerified: false as const };
  const issues: string[] = [], warnings: string[] = ["الروابط ونسب الصور مراجع تخطيط فقط؛ لم نتحقق من ملكية الأصول أو أبعادها وملفاتها أو قبول Google لها."];
  if (!options.businessName?.trim() || chars(options.businessName) > 25) issues.push("اسم النشاط مطلوب وبحد أقصى 25 حرفاً.");
  if (!publicAssetReference(options.logoUrl ?? "")) issues.push("أضف رابط HTTPS لشعار النشاط المربع.");
  // The owner's playbook deliberately requires supplied video, even when Google can auto-generate it or accept an image ad.
  if (!publicAssetReference(options.videoUrl ?? "")) issues.push("أضف رابط فيديو تملكه؛ دليل العمل يشترط الفيديو ولا يعتمد على إنشاء Google التلقائي.");
  if (!markets.length) issues.push("الأسواق واللغات غير محددة.");
  for (const m of markets) {
    const approved = creatives.filter((c) => c.status === "approved" && c.market === m.market && c.language === m.language && !validateGoogleVisualCopy(type, c).length);
    const covered = approved.some((c) => ["1:1", "1.91:1"].every((ratio) => c.images?.some((i) => i.status === "approved" && i.ratio === ratio)));
    if (!covered) issues.push(`${m.market}: يحتاج مفهوماً معتمداً بنص صالح وصور معتمدة مربعة 1:1 وأفقية 1.91:1 في المفهوم نفسه.`);
  }
  if (type === "performance_max") warnings.push("إشارات الجمهور وموضوعات البحث ليست قيود استهداف؛ حدود البلد واللغة من الخطة. التوسع في الرابط النهائي مغلق في المسودة.");
  if (type === "demand_gen") warnings.push("Demand Gen مكمل للبحث/Shopping وليس بديلاً مثبتاً؛ الصور الرأسية 4:5 والفيديوهات الرأسية توسع تغطية المواضع.");
  if (options.merchantCenterId) warnings.push("معرّف Merchant Center مرجع غير متحقق؛ لا يثبت الربط أو صحة المنتجات ولا يُعفي المسودة من متطلبات الأصول.");
  return { complete: issues.length === 0, issues, warnings, platformVerified: false as const };
}
export function googleDraftPlan(type: GoogleCampaignType, options: GoogleCampaignOptions) {
  return {
    options,
    assetGroupPolicy: type === "performance_max" ? "مجموعات قليلة بحسب الرسالة أو المنتج؛ لا نكرر الأصول مع تغيير إشارات الجمهور فقط." : null,
    finalUrlExpansion: false,
    bidding: "maximise_conversions_without_target",
    providerVerified: false,
    assetsVerified: false,
    sources: GOOGLE_ASSET_SOURCES,
  };
}