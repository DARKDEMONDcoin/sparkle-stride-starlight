import { z } from "zod";
import { checkGuardrails } from "./guardrails";
import { aggregateHistory } from "./history";
import { isAggregateRow, type CachedHistoryRow } from "./dashboard";

export const changeSchema = z.object({
  kind: z.enum(["budget", "status", "negative_keyword", "bid_strategy", "conversion_goal", "structure", "tracking"]),
  entity: z.object({ level: z.enum(["campaign", "group", "ad", "keyword", "search_term", "asset_group"]), externalId: z.string().min(1) }).strict(),
  campaignId: z.string().min(1), newDaily: z.number().finite().positive().optional(),
  to: z.enum(["PAUSED", "ENABLED"]).optional(), keyword: z.string().trim().min(1).max(100).optional(),
  summary: z.string().trim().min(1).max(2000),
}).strict().superRefine((change, ctx) => {
  if (change.kind === "budget" && change.newDaily === undefined) ctx.addIssue({ code: "custom", message: "Daily budget required" });
  if (change.kind === "status" && change.to === undefined) ctx.addIssue({ code: "custom", message: "Status required" });
  if (change.kind === "negative_keyword" && change.keyword === undefined) ctx.addIssue({ code: "custom", message: "Keyword required" });
});
export type AdsChange = z.infer<typeof changeSchema>;
export type ApprovalEvidence = {
  currentDaily: number | null; monthlyCommitted: number | null; daysInMonth: number | null;
  trackingHealthy: boolean | null; landingPageHealthy: boolean | null; weakConversion: boolean | null;
  learning: boolean | null; learningEndsAt: string | null; lagDays: number | null;
  mature: boolean; capturedAt: string | null; entityCovered: boolean; parentCovered: boolean;
  activeMajorChange: boolean;
};
export function reviewGuard(change: AdsChange, evidence: ApprovalEvidence, input: { maxIncreasePct: number; monthlyCap: number | null; successMetric: string; reviewAt: string; acknowledgeLearning: boolean; individual: boolean }, now = new Date()) {
  if (!input.successMetric.trim()) return { ok: false, reason: "يجب تحديد مقياس النجاح." };
  const captured = Date.parse(evidence.capturedAt ?? "");
  if (!Number.isFinite(captured) || captured > now.getTime() || now.getTime() - captured > 15 * 60000 || !evidence.entityCovered || !evidence.parentCovered) return { ok: false, reason: "يلزم دليل حديث للعنصر وحملته الأم قبل الاعتماد." };
  const defect = ["tracking", "negative_keyword"].includes(change.kind);
  if (!evidence.mature && !defect) return { ok: false, reason: "بيانات العنصر غير ناضجة؛ لا تعديل أداء الآن." };
  if (evidence.activeMajorChange) return { ok: false, reason: "يوجد تغيير كبير قيد المراجعة على هذه الحملة." };
  if (evidence.learning === null || evidence.lagDays === null || !evidence.learningEndsAt) return { ok: false, reason: "مدة التعلّم وتأخر التحويل غير موثقين." };
  const earliest = Date.parse(evidence.learningEndsAt) + evidence.lagDays * 86400000;
  const review = Date.parse(input.reviewAt);
  if (!Number.isFinite(review) || !Number.isFinite(earliest) || review <= now.getTime() || review < earliest) return { ok: false, reason: "موعد المراجعة يجب أن يأتي بعد التعلّم وتأخر التحويل." };
  if (evidence.learning && ["bid_strategy", "conversion_goal"].includes(change.kind) && !input.acknowledgeLearning) return { ok: false, reason: "يلزم إقرار تحذير إعادة التعلّم قبل تغيير المزايدة أو هدف التحويل." };
  if (change.kind === "budget") {
    if (evidence.currentDaily === null || evidence.currentDaily <= 0 || change.newDaily === undefined) return { ok: false, reason: "ميزانية الحساب الحالية غير موثقة." };
    const increase = change.newDaily > evidence.currentDaily;
    if (increase && !input.individual) return { ok: false, reason: "زيادة الميزانية تحتاج اعتماداً فردياً." };
    if (increase && (evidence.trackingHealthy !== true || evidence.weakConversion === null || evidence.weakConversion && evidence.landingPageHealthy !== true)) return { ok: false, reason: "تحقّق من التتبع وصفحة الوصول قبل زيادة الإنفاق." };
    const result = checkGuardrails({ kind: "budget", entityId: change.entity.externalId, currentDaily: evidence.currentDaily, newDaily: change.newDaily }, { maxBudgetIncreasePct: Math.min(20, input.maxIncreasePct), monthlyCap: null });
    if (!result.ok) return result;
    if (input.monthlyCap !== null) {
      if (evidence.monthlyCommitted === null || evidence.daysInMonth === null) return { ok: false, reason: "الإنفاق الشهري الإجمالي غير موثّق." };
      const projected = evidence.monthlyCommitted + (change.newDaily - evidence.currentDaily) * evidence.daysInMonth;
      if (projected > input.monthlyCap) return { ok: false, reason: "الزيادة تتجاوز سقف الحساب الشهري." };
    }
  }
  return { ok: true, reason: null };
}
export type AuditFinding = { code: string; severity: "high" | "medium" | "info"; title: string; evidence: string; steps: string[] };
const setupSchema = z.object({
  verified: z.literal(true), checkedAt: z.string().datetime({ offset: true }),
  actions: z.array(z.object({ id: z.string(), name: z.string(), primary: z.boolean().nullable(), recentConversions: z.number().nonnegative().nullable(), valueAvailable: z.boolean().nullable() })),
  pixel: z.boolean().nullable(), serverEvents: z.boolean().nullable(), deduplication: z.boolean().nullable(),
});
export function trackingAudit(platform: string, setup: unknown) {
  const parsed = setupSchema.safeParse(setup);
  const findings: AuditFinding[] = [];
  if (!parsed.success) return { score: null, findings: [{ code: "setup_unavailable", severity: "high" as const, title: "إعداد التحويلات غير موثّق", evidence: "لا توجد قراءة موثقة لإعداد التحويلات.", steps: [platform === "google" ? "راجع أهداف التحويل الأساسية والثانوية في Google Ads." : "راجع وصول الأحداث في Events Manager.", "تحقق من حجم الأحداث والقيم وعدم العد المزدوج.", "لا ترفع الميزانية قبل إكمال قياس التحويلات."] }], coverage: { verified: false, evaluated: 0 }, limitations: ["الربط متوقف؛ لا يمكن قراءة إعدادات التحويلات أو صلاحيات القياس مباشرة.", "لا درجة صحة بلا فحوص مكتملة."] };
  const setupData = parsed.data;
  if (!setupData.actions.some((a) => a.primary === true)) findings.push({ code: "no_primary", severity: "high", title: "لا توجد تحويلات أساسية موثقة", evidence: `${setupData.actions.length} إجراء تحويل تمت قراءته.`, steps: ["راجع الهدف التجاري وإجراء التحويل المخصص للمزايدة."] });
  if (setupData.actions.some((a) => a.primary && a.recentConversions === 0)) findings.push({ code: "no_volume", severity: "high", title: "تحويل أساسي بلا حجم حديث", evidence: setupData.actions.filter((a) => a.primary && a.recentConversions === 0).map((a) => a.name).join("، "), steps: ["اختبر التحويل الفعلي وقارنه ببيانات المتجر أو CRM."] });
  if (platform === "meta" && (setupData.pixel === false || setupData.serverEvents === false || setupData.deduplication === false)) findings.push({ code: "meta_events", severity: "high", title: "توجد فجوة في أحداث Meta", evidence: `Pixel: ${setupData.pixel} · CAPI: ${setupData.serverEvents} · Deduplication: ${setupData.deduplication}`, steps: ["راجع الأحداث واختبارها في Events Manager.", "طابق event_id بين Pixel والأحداث الخادمية قبل القياس."] });
  return { score: null, findings, coverage: { verified: true, evaluated: setupData.actions.length, checkedAt: setupData.checkedAt }, limitations: ["فحوص الأهداف المؤهلة، الموافقة، القيم، UTMs وEvent Match Quality ليست مكتملة؛ الدرجة غير متاحة."] };
}
export function performanceComparison(rows: CachedHistoryRow[], since: string, split: string, until: string) {
  const candidates = rows.filter((r) => r.level === "campaign" && isAggregateRow(r) && r.day >= since && r.day < until);
  const keys = [...new Set(candidates.map((r) => r.external_id))];
  return keys.map((externalId) => {
    const entity = candidates.filter((r) => r.external_id === externalId);
    const beforeRows = entity.filter((r) => r.day < split); const afterRows = entity.filter((r) => r.day >= split);
    const before = aggregateHistory(beforeRows); const after = aggregateHistory(afterRows);
    const expectedDays = [(Date.parse(split) - Date.parse(since)) / 86400000, (Date.parse(until) - Date.parse(split)) / 86400000];
    const complete = [beforeRows, afterRows].every((window, index) => new Set(window.map((r) => r.day)).size === expectedDays[index] && window.length === expectedDays[index] && aggregateHistory(window).excluded === 0);
    return { externalId, name: entity[0]?.name ?? externalId, before, after, complete, cpaDelta: complete && before.cpa && after.cpa !== null ? (after.cpa - before.cpa) / before.cpa : null };
  });
}
export function structureAudit(rows: CachedHistoryRow[], since: string, until: string) {
  const periodDays = (Date.parse(until) - Date.parse(since)) / 86400000;
  const campaigns = rows.filter((r) => r.level === "campaign" && isAggregateRow(r) && r.day >= since && r.day < until);
  const ids = [...new Set(campaigns.map((r) => r.external_id))];
  const symptoms: AuditFinding[] = [];
  if (periodDays === 30) for (const id of ids) {
    const entity = campaigns.filter((r) => r.external_id === id); const summary = aggregateHistory(entity);
    const days = new Set(entity.map((r) => r.day)).size;
    if (days === 30 && summary.excluded === 0 && summary.totals.conversions < 30) symptoms.push({ code: "low_campaign_volume", severity: "medium", title: "حجم تحويلات محدود في الحملة", evidence: `${entity[0]?.name ?? id}: ${summary.totals.conversions} تحويل خلال 30 يوماً. حد 30 افتراضي قابل للضبط؛ استراتيجية المزايدة غير موثقة.`, steps: ["تحقق من استراتيجية المزايدة والهدف قبل استنتاج نقص بيانات التعلّم."] });
  }
  return { score: null, symptoms, recommendations: [] as string[], coverage: { campaignsReviewed: ids.length, periodDays }, limitations: ["حالات التعلّم واستراتيجيات المزايدة وهيكل Advantage+ والأصول والكلمات المكررة غير موثقة؛ لا يمكن إثبات سبب هيكلي أو اقتراح دمج الآن.", "لا درجة أو توصيات دمج دون اكتمال فحوص الهيكل."] };
}