/**
 * مصدر واحد لحقيقة الأسعار — تستخدمه صفحة /pricing وقسم الأسعار في الصفحة الرئيسية
 * حتى لا تختلف الأرقام أو أسماء الباقات بين مكانين.
 */
import {
  PRICES,
  YEARLY_DISCOUNT,
  CURRENCY_OPTIONS,
  type CurrencyCode,
} from "@/data/pricing.config";

export type Plan = {
  id: "start" | "growth" | "scale";
  name: string;
  /** باقة «حسب الطلب» بلا سعر منشور. */
  custom?: boolean;
  tag: string;
  desc: string;
  highlight: boolean;
  cta: string;
  perks: string[];
};

/** خصم الاشتراك السنوي. */
export const yearlyDiscount = YEARLY_DISCOUNT;

export const plans: Plan[] = [
  {
    id: "start",
    name: "البداية",
    tag: "لصاحب مشروع يبدأ وحده",
    desc: "موظف رقمي واحد تختاره ويبدأ العمل اليوم.",
    highlight: false,
    cta: "ابدأ 14 يومًا مجانًا",
    perks: [
      "موظف رقمي واحد تختاره",
      "3 حسابات مرتبطة",
      "60 مهمة شهريًا",
      "توليد صور بنص عربي",
      "تقرير أسبوعي",
      "دعم بالبريد خلال 24 ساعة",
    ],
  },
  {
    id: "growth",
    name: "النمو",
    tag: "الأكثر اختيارًا",
    desc: "الفريق الكامل بموظفيه الستة بمسارات عمل تلقائية بينهم.",
    highlight: true,
    cta: "ابدأ 14 يومًا مجانًا",
    perks: [
      "الفريق الكامل بموظفيه الستة",
      "حسابات غير محدودة",
      "1,000 مهمة شهريًا",
      "مسارات عمل تلقائية بين الموظفين",
      "صندوق موحّد للعملاء",
      "ذاكرة علامة تجارية متقدمة",
      "دعم أولوية خلال 3 ساعات",
    ],
  },
  {
    id: "scale",
    name: "المؤسسات",
    custom: true,
    tag: "لفرق متعددة الفروع والعلامات",
    desc: "علامات وفروع متعددة بصلاحيات ومدير حساب.",
    highlight: false,
    cta: "تحدّث مع المبيعات",
    perks: [
      "علامات وفروع متعددة",
      "صلاحيات وأدوار للفريق",
      "مهام غير محدودة",
      "سجل تدقيق كامل واتفاقية مستوى خدمة",
      "مدير حساب مخصص",
      "تدريب الفريق وإعداد أولي",
    ],
  },
];

export type PriceResult =
  | { kind: "custom" }
  | { kind: "soon" }
  | { kind: "amount"; value: number; text: string };

export function currencySymbol(code: CurrencyCode): string {
  return CURRENCY_OPTIONS.find((c) => c.code === code)?.symbol ?? code;
}

/** السعر المعروض حسب الباقة ودورة الفوترة والعملة، مقروءًا من pricing.config.ts. */
export function priceOf(plan: Plan, yearly: boolean, currency: CurrencyCode): PriceResult {
  if (plan.custom || plan.id === "scale") return { kind: "custom" };
  const cell = PRICES[plan.id][currency];
  const value = yearly ? cell.yearly : cell.monthly;
  if (value === null) return { kind: "soon" };
  return { kind: "amount", value, text: value.toLocaleString("en-US") };
}
