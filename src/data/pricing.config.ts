/**
 * ملف الأسعار الوحيد. كل رقم يظهر في الموقع يُقرأ من هنا.
 *
 * - `monthly`: السعر الشهري عند الدفع شهريًا.
 * - `yearly`: السعر الشهري المكافئ عند الدفع سنويًا (بعد خصم 20%).
 * - القيمة `null` تعني أن السعر لم يُعتمد بعد، فيعرض الموقع «قريبًا».
 * أضف أرقام الريال السعودي والدرهم الإماراتي هنا فقط، دون أي تعديل في المكونات.
 */
export type PlanId = "start" | "growth" | "scale";
export type CurrencyCode = "EGP" | "SAR" | "AED";

export type CurrencyOption = {
  code: CurrencyCode;
  /** الاسم الكامل في القائمة. */
  name: string;
  /** الرمز المختصر بجوار السعر. */
  symbol: string;
};

export const CURRENCY_OPTIONS: readonly CurrencyOption[] = [
  { code: "EGP", name: "جنيه مصري", symbol: "ج.م" },
  { code: "SAR", name: "ريال سعودي", symbol: "ر.س" },
  { code: "AED", name: "درهم إماراتي", symbol: "درهم" },
];

/** العملة الافتراضية عندما لا تتوفر منطقة مطابقة. */
export const DEFAULT_CURRENCY: CurrencyCode = "EGP";

/** رمز الدولة (ISO) ← عملة العرض الافتراضية. */
export const REGION_CURRENCY: Record<string, CurrencyCode> = {
  SA: "SAR",
  AE: "AED",
};

/** نسبة خصم الاشتراك السنوي. */
export const YEARLY_DISCOUNT = 0.2;

export type PriceCell = { monthly: number | null; yearly: number | null };

/** باقة المؤسسات «حسب الطلب» ولا تظهر هنا. */
export const PRICES: Record<Exclude<PlanId, "scale">, Record<CurrencyCode, PriceCell>> = {
  start: {
    EGP: { monthly: 1980, yearly: 1590 },
    SAR: { monthly: null, yearly: null },
    AED: { monthly: null, yearly: null },
  },
  growth: {
    EGP: { monthly: 5310, yearly: 4250 },
    SAR: { monthly: null, yearly: null },
    AED: { monthly: null, yearly: null },
  },
};
