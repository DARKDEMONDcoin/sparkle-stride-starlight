/** Browser-safe intake, feasibility (Playbook 14.3) and copy-limit rules for Abdullah. No country/language/currency defaults. */
export type Goal = "leads" | "sales" | "traffic" | "awareness";
export type TrackState = "yes" | "no" | "unsure";
export type IntakeAnswers = {
  businessName?: string; website?: string; landingPages?: string[]; industry?: string;
  products?: string; priorities?: string; segments?: string;
  markets?: string[]; audience?: string; b2b?: "b2b" | "b2c" | "both";
  goal?: Goal; aov?: number; margin?: number; ltv?: number; closeRate?: number; salesCycleDays?: number; confirmedCpa?: number;
  monthlyBudget?: number; dailyCap?: number;
  usp?: string; offers?: string; proof?: string; competitors?: string;
  tone?: string; languages?: Record<string, string>;
  assets?: string; customerList?: "yes" | "no";
  tracking?: { googleTag?: TrackState; enhanced?: TrackState; pixel?: TrackState; capi?: TrackState };
  conversionEvent?: string; offlineConversions?: "yes" | "no";
  ecommerce?: boolean; catalog?: "yes" | "no" | "unsure";
  metaPage?: string; instagram?: string;
};
export type IntakeStep = { id: number; title: string; required: (keyof IntakeAnswers)[] };
export const INTAKE_STEPS: IntakeStep[] = [
  { id: 1, title: "النشاط والموقع", required: ["businessName", "website", "landingPages"] },
  { id: 2, title: "المجال", required: ["industry"] },
  { id: 3, title: "المنتجات والأولوية", required: ["products", "priorities"] },
  { id: 4, title: "الأسواق والجمهور", required: ["markets", "audience"] },
  { id: 5, title: "هدف الحملة", required: ["goal"] },
  { id: 6, title: "اقتصاديات الوحدة", required: ["aov", "margin", "confirmedCpa"] },
  { id: 7, title: "الميزانية", required: ["monthlyBudget"] },
  { id: 8, title: "الميزة والعروض والإثبات", required: ["usp"] },
  { id: 9, title: "المنافسون", required: [] },
  { id: 10, title: "النبرة واللغات", required: ["tone", "languages"] },
  { id: 11, title: "الأصول وقوائم العملاء", required: [] },
  { id: 12, title: "تتبّع التحويلات", required: ["tracking", "conversionEvent"] },
  { id: 13, title: "المتجر والكتالوج", required: [] },
  { id: 14, title: "صفحة فيسبوك وإنستغرام", required: [] },
];
const filled = (v: unknown) => v !== undefined && v !== null && !(typeof v === "string" && !v.trim()) && !(Array.isArray(v) && !v.length) && !(typeof v === "object" && !Array.isArray(v) && !Object.values(v as object).some(Boolean)) && !(typeof v === "number" && !(v > 0));

/** Required fields still missing; Meta adds the Page, leads add close rate, e-commerce adds catalog status, each market needs a language. */
export function missingRequired(a: IntakeAnswers, platforms: readonly ("google" | "meta")[]): string[] {
  const missing: string[] = INTAKE_STEPS.flatMap((s) => s.required.filter((k) => !filled(a[k])));
  if (a.goal === "leads" && !filled(a.closeRate)) missing.push("closeRate");
  if (a.ecommerce && !a.catalog) missing.push("catalog");
  if (platforms.includes("meta") && !filled(a.metaPage)) missing.push("metaPage");
  for (const m of a.markets ?? []) if (!a.languages?.[m]?.trim()) missing.push(`languages.${m}`);
  return [...new Set(missing)];
}

/** Allowable CPA from unit economics: sales = AOV×margin; leads = deal×margin×close rate. Owner must confirm. */
export function allowableCpa(a: IntakeAnswers): number | null {
  if (!(a.aov! > 0) || !(a.margin! > 0) || a.margin! > 1) return null;
  const value = (a.ltv && a.ltv > a.aov! ? a.ltv : a.aov!) * a.margin!;
  if (a.goal === "leads") return a.closeRate && a.closeRate > 0 && a.closeRate <= 1 ? round(value * a.closeRate) : null;
  return round(value);
}
const round = (n: number) => Math.round(n * 100) / 100;

export type Feasibility = { ok: boolean; googleMinDaily: number | null; metaMinDailyPerAdSet: number | null; dailyBudget: number | null; maxGoogleCampaigns: number; maxMetaAdSets: number; requiredCvr: number | null; issues: string[] };
/** Playbook 14.3 learning math (tunable defaults): Google ≈ 1 conversion/day → daily ≥ CPA; Meta 50 events/7 days → CPA×50/7 per ad set. */
export function feasibility(a: IntakeAnswers, platforms: readonly ("google" | "meta")[], opts: { expectedCpc?: number | null; historicalCvr?: number | null } = {}): Feasibility {
  const cpa = a.confirmedCpa && a.confirmedCpa > 0 ? a.confirmedCpa : null;
  const daily = a.monthlyBudget && a.monthlyBudget > 0 ? round(Math.min(a.monthlyBudget / 30.4, a.dailyCap && a.dailyCap > 0 ? a.dailyCap : Infinity)) : null;
  const issues: string[] = [];
  const g = cpa ? cpa : null, m = cpa ? round((cpa * 50) / 7) : null;
  const split = platforms.length || 1;
  const per = daily ? daily / split : null;
  const maxG = per && g ? Math.floor(per / g) : 0, maxM = per && m ? Math.floor(per / m) : 0;
  if (!cpa) issues.push("الحد المسموح لتكلفة التحويل غير مؤكد؛ أكّده من اقتصاديات الوحدة.");
  if (!daily) issues.push("الميزانية الشهرية مطلوبة.");
  if (platforms.includes("google") && per && g && maxG < 1) issues.push(`ميزانية Google اليومية (${round(per)}) أقل من تكلفة التحويل المستهدفة (${g}) — القاعدة الافتراضية: نحو تحويل يومي لكل حملة. اقترح حدثاً أبكر أو ميزانية أكبر أو حملة واحدة مبسطة.`);
  if (platforms.includes("meta") && per && m && maxM < 1) issues.push(`ميزانية Meta اليومية (${round(per)}) أقل من الحد الأدنى للخروج من التعلم لكل مجموعة (${m} = التكلفة×50÷7). اقترح التحسين لحدث أبكر أو مجموعة واحدة.`);
  const requiredCvr = opts.expectedCpc && cpa ? round(opts.expectedCpc / cpa) : null;
  if (requiredCvr !== null && opts.historicalCvr != null && requiredCvr > opts.historicalCvr * 1.5) issues.push(`معدل التحويل المطلوب (${(requiredCvr * 100).toFixed(1)}%) أعلى بكثير من تاريخ الحساب (${(opts.historicalCvr * 100).toFixed(1)}%).`);
  if ((a.goal === "sales" || a.goal === "leads") && !trackingReady(a, platforms)) issues.push("هدف المبيعات/العملاء المحتملين بلا تتبع تحويلات مؤكد؛ الخطة تبدأ بإصلاح التتبع.");
  if (daily && (a.markets?.length ?? 0) > 3 && daily < (cpa ?? 0) * (a.markets?.length ?? 0)) issues.push("ميزانية صغيرة لعدد كبير من الأسواق؛ ابدأ بسوق أو اثنين.");
  return { ok: issues.length === 0, googleMinDaily: g, metaMinDailyPerAdSet: m, dailyBudget: daily, maxGoogleCampaigns: maxG, maxMetaAdSets: maxM, requiredCvr, issues };
}
export function trackingReady(a: IntakeAnswers, platforms: readonly ("google" | "meta")[]) {
  return (!platforms.includes("google") || a.tracking?.googleTag === "yes") && (!platforms.includes("meta") || a.tracking?.pixel === "yes" || a.tracking?.capi === "yes");
}

/** Contradictions Abdullah raises before drafting. */
export function contradictions(a: IntakeAnswers): string[] {
  const out: string[] = [];
  const calc = allowableCpa(a);
  if (calc && a.confirmedCpa && a.confirmedCpa > calc * 1.25) out.push(`التكلفة المؤكدة (${a.confirmedCpa}) أعلى من المسموح بحسب الهامش (${calc}).`);
  if (a.dailyCap && a.monthlyBudget && a.dailyCap * 30.4 < a.monthlyBudget * 0.5) out.push("الحد اليومي لا يسمح بإنفاق نصف الميزانية الشهرية.");
  if (a.priorities && /^(grow|نمو|زيادة|كبر)$/i.test(a.priorities.trim())) out.push("الأولوية غامضة: حدّد ماذا تريد أن ينمو ولمن.");
  return out;
}

export const SPECIAL_CATEGORIES: Record<string, RegExp> = {
  financial: /loan|credit|insurance|invest|mortgage|bank|تمويل|قرض|تأمين|استثمار|بنك|ائتمان/i,
  housing: /real estate|rent|apartment|housing|عقار|إيجار|شقق|سكن/i,
  employment: /job|hiring|recruit|career|وظائف|توظيف|وظيفة/i,
  social_issues: /politic|election|campaign for|سياسي|انتخاب/i,
};
export function specialAdCategories(a: IntakeAnswers): string[] {
  const text = `${a.industry ?? ""} ${a.products ?? ""}`;
  return Object.entries(SPECIAL_CATEGORIES).filter(([, re]) => re.test(text)).map(([k]) => k);
}
const RISKY = /guarante|100%|cure|best in the world|مضمون|ضمان|نتائج مؤكدة|يشفي|الأفضل في العالم/i;
export const COPY_LIMITS = { google: { headline: 30, headlines: 15, description: 90, descriptions: 4 }, meta: { variations: 5 } } as const;
/** Validates RSA (≤15×30, ≤4×90, ≥3 headlines, ≥2 descriptions) and Meta (≤5 primary, ≤5 headlines) and flags risky claims. */
export function validateCopy(platform: "google" | "meta", copy: { headlines: string[]; descriptions?: string[]; primary?: string[] }): string[] {
  const issues: string[] = [];
  const len = (s: string) => [...s].length;
  if (platform === "google") {
    if (copy.headlines.length < 3 || copy.headlines.length > 15) issues.push("العناوين بين 3 و15.");
    copy.headlines.forEach((h, i) => len(h) > 30 && issues.push(`العنوان ${i + 1} يتجاوز 30 حرفاً.`));
    const d = copy.descriptions ?? [];
    if (d.length < 2 || d.length > 4) issues.push("الأوصاف بين 2 و4.");
    d.forEach((x, i) => len(x) > 90 && issues.push(`الوصف ${i + 1} يتجاوز 90 حرفاً.`));
  } else {
    if (!copy.primary?.length || copy.primary.length > 5) issues.push("النص الأساسي من 1 إلى 5 صيغ.");
    if (!copy.headlines.length || copy.headlines.length > 5) issues.push("العناوين من 1 إلى 5.");
  }
  if ([...copy.headlines, ...(copy.descriptions ?? []), ...(copy.primary ?? [])].some((t) => RISKY.test(t))) issues.push("صياغة عالية المخاطر سياسياً (ضمانات/ادعاءات مطلقة).");
  return issues;
}
/** Explained type choice; never a blind default. */
export function recommendCampaignType(a: IntakeAnswers, platform: "google" | "meta"): { type: string; why: string } {
  if (platform === "meta") return { type: "advantage_plus", why: "هيكل Advantage+ الموحد: ميزانية وجمهور ومواضع Advantage+، حملة لكل هدف/عرض ومجموعة إعلانية واسعة بمفاهيم إبداعية متنوعة." };
  if (a.goal === "awareness") return { type: "search", why: "الوعي غير مدعوم في هذه المرحلة على Google؛ نبدأ بالبحث لالتقاط الطلب الموجود، وDemand Gen لاحقاً." };
  return { type: "search", why: "البحث يلتقط نية الشراء العالية ويناسب البدء قبل تراكم بيانات تحويل كافية لـ Performance Max." };
}
