import { z } from "zod";
import { ADS_DEFAULTS } from "./config";
import { aggregateHistory, historyMetricsSchema, historyMaturity } from "./history";
import { isAggregateRow, summarizeEntities, type CachedHistoryRow } from "./dashboard";

export const baselineSourceSchema = z.object({
  external_id: z.string(), name: z.string().nullable(), day: z.string().date(), metrics: z.unknown(),
  data_maturity: z.string(), level: z.string(), parent_external_id: z.string().nullable(),
  breakdowns: z.unknown(), fetched_at: z.string().datetime({ offset: true }),
});
export const provenanceSchema = z.object({
  verified: z.literal(true), dailySince: z.string().date(), dailyUntil: z.string().date(),
  trackingVerified: z.literal(true), lagDays: z.number().int().nonnegative(),
  attributionWindow: z.string().nullable(), source: z.string().min(1),
});
export const CONTEXT_QUESTIONS = [
  "هل كانت هناك عروض أو تغييرات في الأسعار خلال الفترة؟",
  "هل حدث نفاد مخزون أو انقطاع في الموقع أو التتبع؟",
  "هل تغيّرت أهداف التحويل أو طريقة احتسابها؟",
  "هل أثّرت مواسم أو أنشطة تسويق خارج الإنترنت على النتائج؟",
  "هل لديك تقارير وكالة سابقة أو بيانات CRM أو متجر لإكمال التاريخ؟",
] as const;
export type Baseline = {
  id: string; workspace_id: string; ad_account_id: string; status: string; mode: string;
  built_at: string | null; expires_at: string | null; covered_entities: unknown; data_quality: unknown;
};
export function evidenceGate(b: Baseline | null, scope: { workspaceId: string; accountId: string; entity?: { level: string; externalId: string }; freshnessDays?: number; majorChangeAt?: string | null }, now = new Date()) {
  if (!b || b.workspace_id !== scope.workspaceId || b.ad_account_id !== scope.accountId) return { ok: false, reason: "missing_baseline" };
  const built = Date.parse(b.built_at ?? "");
  const expires = Date.parse(b.expires_at ?? "");
  if (b.status !== "ready") return { ok: false, reason: b.status === "building" ? "building" : "stale" };
  if (!Number.isFinite(built) || !Number.isFinite(expires) || built > now.getTime() || now.getTime() - built > (scope.freshnessDays ?? ADS_DEFAULTS.baselineFreshnessDays) * 86400000 || expires <= now.getTime()) return { ok: false, reason: "stale" };
  const quality = z.object({ verified_source: z.literal(true) }).safeParse(b.data_quality);
  if (!quality.success) return { ok: false, reason: "unverified_source" };
  if (scope.majorChangeAt && Date.parse(scope.majorChangeAt) > built) return { ok: false, reason: "major_change" };
  const covered = z.array(z.object({ level: z.string(), externalId: z.string() })).safeParse(b.covered_entities);
  if (scope.entity && (!covered.success || !covered.data.some((e) => e.level === scope.entity?.level && e.externalId === scope.entity.externalId))) return { ok: false, reason: "entity_not_covered" };
  return { ok: true, reason: null };
}
function quantile(values: number[], fraction: number) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * fraction;
  const low = sorted[Math.floor(index)]; const high = sorted[Math.ceil(index)];
  return low === undefined || high === undefined ? null : low + (high - low) * (index - Math.floor(index));
}
export function baselineReport(input: { rows: CachedHistoryRow[]; today: string; since: string; provenance: unknown; complete: boolean; minDays?: number; minConversions?: number }) {
  const proof = provenanceSchema.safeParse(input.provenance);
  const lagDays = proof.success ? proof.data.lagDays : null;
  const rows = input.rows.map((row) => ({ ...row, data_maturity: row.data_maturity === "mature" ? historyMaturity(row.day, input.today, lagDays) : row.data_maturity }));
  const campaignRows = rows.filter((row) => row.level === "campaign" && isAggregateRow(row));
  const eligible = campaignRows.filter((row) => row.data_maturity === "mature" && historyMetricsSchema.safeParse(row.metrics).success);
  const summary = aggregateHistory(campaignRows);
  const days = new Set(eligible.map((row) => row.day)).size;
  const mode = days < (input.minDays ?? 30) || summary.totals.conversions < (input.minConversions ?? 30) ? "new_account" as const : "historical" as const;
  const verified = input.complete && proof.success && proof.data.dailySince <= input.since && proof.data.dailyUntil >= new Date(Date.parse(input.today) - 86400000).toISOString().slice(0, 10);
  const benchmarks = Object.fromEntries((["ctr", "cpc", "cvr", "cpa", "roas"] as const).map((metric) => {
    const values = eligible.map((row) => aggregateHistory([row])[metric]).filter((value): value is number => value !== null);
    return [metric, { q25: quantile(values, .25), median: quantile(values, .5), q75: quantile(values, .75), samples: values.length }];
  }));
  const weekday = Array.from({ length: 7 }, (_, day) => ({ day, ...aggregateHistory(eligible.filter((row) => new Date(row.day).getUTCDay() === day)) }));
  const entities = summarizeEntities(rows).filter((entity) => entity.included > 0);
  const limitations = [
    ...(!verified ? ["لا يوجد سجل مزامنة مكتمل يثبت تغطية الفترة وصحة التتبع وتأخر التحويل؛ التوصيات محظورة."] : []),
    "البيانات الأسبوعية وقياس العام السابق غير متاحين في مخزن اللقطات الحالي.",
    "نوع الحملة والسوق واستراتيجية المزايدة ومدة التعلّم غير موثقة؛ لا تُستنتج من الاسم.",
    "الربط متوقف؛ لا يمكن التحقق من أحدث حالة للحساب أو إعداد التحويلات مباشرة.",
    "الأرقام أدناه وصف للبيانات المحفوظة، ولا تثبت السببية أو نجاح تغيير.",
    ...(mode === "new_account" ? ["أقل من حد أيام البيانات أو التحويلات؛ وضع حساب صغير بثقة منخفضة ودون ادعاءات أداء."] : []),
  ];
  return {
    status: verified ? "ready" as const : "building" as const, mode,
    covered_periods: [{ since: input.since, until: input.today, granularity: "daily", complete: verified }],
    covered_entities: entities.map((entity) => ({ level: entity.level, externalId: entity.id })),
    data_quality: { verified_source: verified, reviewedRows: rows.length, matureDays: days, excluded: summary.excluded, confidence: "low" },
    immature_window: { days: Math.max(7, lagDays ?? 7), unknownLag: lagDays === null },
    conversion_lag: proof.success ? { days: lagDays, verified: true, attributionWindow: proof.data.attributionWindow } : { days: null, verified: false },
    benchmarks: { account_daily: benchmarks, by_weekday: weekday },
    seasonality: { yearOverYear: null, limitation: "تاريخ أسبوعي غير متاح" },
    spend_concentration: entities.filter((entity) => entity.level === "campaign").map((entity) => ({ externalId: entity.id, spend: entity.totals.spend, share: summary.totals.spend ? entity.totals.spend / summary.totals.spend : null })),
    funnel: { ...summary, outboundClicks: null, landingPageViews: null },
    hypotheses: [] as { question: string; evidenceFor: unknown; evidenceAgainst: unknown; required: string }[],
    context_questions: [...CONTEXT_QUESTIONS], limitations,
  };
}
export type OutcomeWindow = { since: string; until: string; mature: boolean; complete: boolean; value: number | null; samples: number };
export function evaluateOutcome(input: { before: OutcomeWindow; after: OutcomeWindow; reviewAt: string; learningEndsAt: string; lagDays: number; minimumSamples: number; direction: "increase" | "decrease"; targetDelta: number; noiseBand: number | null; confounders: string[] }, now = new Date()) {
  const earliest = Date.parse(input.learningEndsAt) + input.lagDays * 86400000;
  if (!Number.isFinite(earliest) || now.getTime() < earliest || now.getTime() < Date.parse(input.reviewAt)) return { classification: "inconclusive" as const, reason: "not_due", delta: null };
  if (input.confounders.length) return { classification: "confounded" as const, reason: "external_events", delta: null };
  const durations = [input.before, input.after].map((w) => (Date.parse(w.until) - Date.parse(w.since)) / 86400000 + 1);
  if (durations[0] !== durations[1] || !durations[0] || durations[0] % 7 !== 0 || input.before.until >= input.after.since || [input.before, input.after].some((w) => !w.complete || !w.mature || w.value === null || !Number.isFinite(w.value) || w.samples < input.minimumSamples)) return { classification: "inconclusive" as const, reason: "insufficient_comparable_data", delta: null };
  const before = input.before.value; const after = input.after.value;
  if (before === null || after === null || before <= 0 || input.noiseBand === null || input.noiseBand < 0 || input.targetDelta <= 0) return { classification: "inconclusive" as const, reason: "unknown_noise_or_target", delta: null };
  const delta = (after - before) / before * (input.direction === "increase" ? 1 : -1);
  return { classification: delta >= Math.max(input.targetDelta, input.noiseBand) ? "worked" as const : delta < -input.noiseBand ? "failed" as const : "inconclusive" as const, reason: "lag_adjusted_whole_weeks", delta };
}