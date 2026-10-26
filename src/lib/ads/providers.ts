/**
 * اختيار موفّر الربط لكل منصة إعلانية وقدراته. الوكيل والواجهة يقرآن القدرات
 * بدل افتراضها، فيُعطّلان ما لا يدعمه الموفّر مع شرح السبب بلغة مفهومة.
 */
import type { AdPlatform } from "./provider";

export type AdProviderKind = "direct" | "pipeboard" | "windsor";

export type ProviderCapabilities = {
  canCreatePMax: boolean;
  canCreateDemandGen: boolean;
  canCreateAdvantagePlus: boolean;
  canAuditConversions: boolean;
  canEditAssets: boolean;
  canReadChangeHistory: boolean;
  canReadLandingPageMetrics: boolean;
  canReadConversionLag: boolean;
  canWrite: boolean;
};

export const PROVIDER_CAPABILITIES: Record<AdProviderKind, ProviderCapabilities> = {
  pipeboard: {
    canCreatePMax: false,
    canCreateDemandGen: false,
    canCreateAdvantagePlus: false,
    canAuditConversions: false,
    canEditAssets: false,
    canReadChangeHistory: false,
    canReadLandingPageMetrics: false,
    canReadConversionLag: false,
    canWrite: false,
  },
  direct: {
    canCreatePMax: false,
    canCreateDemandGen: false,
    canCreateAdvantagePlus: false,
    canAuditConversions: false,
    canEditAssets: false,
    canReadChangeHistory: false,
    canReadLandingPageMetrics: false,
    canReadConversionLag: false,
    canWrite: false,
  },
  windsor: {
    canCreatePMax: false,
    canCreateDemandGen: false,
    canCreateAdvantagePlus: false,
    canAuditConversions: false,
    canEditAssets: false,
    canReadChangeHistory: false,
    canReadLandingPageMetrics: false,
    canReadConversionLag: false,
    canWrite: false,
  },
};

/** شرح عربي مبسّط لكل قدرة غير متاحة — يظهر في الواجهة وردود عبدالله. */
export const CAPABILITY_EXPLANATIONS: Record<keyof ProviderCapabilities, string> = {
  canCreatePMax: "إنشاء حملات Performance Max لم يُفعّل ويُتحقق منه بعد.",
  canCreateDemandGen: "إنشاء حملات Demand Gen لم يُفعّل ويُتحقق منه بعد.",
  canCreateAdvantagePlus: "إنشاء حملات Advantage+‎ غير متاح عبر هذا الموفّر.",
  canAuditConversions: "تدقيق إعداد التحويلات غير متاح عبر هذا الموفّر.",
  canEditAssets: "تعديل الأصول الإعلانية غير متاح عبر هذا الموفّر.",
  canReadChangeHistory: "سجل التغييرات التاريخي غير متاح عبر هذا الموفّر؛ ستنخفض ثقة خط الأساس.",
  canReadLandingPageMetrics: "مقاييس صفحات الهبوط من المنصة غير متاحة عبر هذا الموفّر.",
  canReadConversionLag: "قياس تأخر التحويلات غير متاح عبر هذا الموفّر.",
  canWrite: "تنفيذ التغييرات غير مفعّل؛ يتطلب ربطاً متحققاً منه وموافقة صريحة.",
};

/** No adapter is operational until its contract and tenant binding are verified. */
export function providerConnectionReadiness(kind: AdProviderKind) {
  const reason = kind === "pipeboard"
    ? "الربط غير مفعّل بعد؛ نحتاج وثائق شريك Pipeboard ومفتاح الشريك والتحقق من عزل الحسابات."
    : kind === "direct"
      ? "الربط المباشر مؤجل إلى مرحلة لاحقة."
      : "ربط Windsor غير مفعّل بعد.";
  return { available: false as const, reason };
}

export function requireProviderConnection(kind: AdProviderKind): void {
  const readiness = providerConnectionReadiness(kind);
  if (!readiness.available) throw new Error(readiness.reason);
}

const VALID_PROVIDERS: readonly AdProviderKind[] = ["direct", "pipeboard", "windsor"];

export function isAdProviderKind(value: string | null | undefined): value is AdProviderKind {
  return VALID_PROVIDERS.includes(value as AdProviderKind);
}

/**
 * يحسم الموفّر الفعلي لمنصة داخل مساحة عمل: تجاوز مساحة العمل المخزّن أولاً،
 * ثم متغيّر البيئة AD_PROVIDER_<PLATFORM>، ثم الافتراضي (Pipeboard).
 */
export function resolveProvider(
  platform: AdPlatform,
  envValue: string | null | undefined,
  workspaceOverride: string | null | undefined,
): AdProviderKind {
  if (isAdProviderKind(workspaceOverride)) return workspaceOverride;
  if (isAdProviderKind(envValue)) return envValue;
  return "pipeboard";
}

export function providerLabel(kind: AdProviderKind): string {
  return kind === "pipeboard" ? "Pipeboard" : kind === "windsor" ? "Windsor" : "الربط المباشر";
}

/** أطراف خارجية تعالج بيانات الإعلانات — تُذكر في إشعار الموافقة داخل تبويب الاتصالات. */
export function thirdPartyNotice(kind: AdProviderKind): string | null {
  if (kind === "pipeboard")
    return "عند الربط ستعالج Pipeboard (شريك ميتا المعتمد) بيانات حساباتك الإعلانية لتمريرها إلينا بأمان.";
  if (kind === "windsor") return "عند الربط ستعالج Windsor بيانات حساباتك الإعلانية للقراءة فقط.";
  return null;
}
