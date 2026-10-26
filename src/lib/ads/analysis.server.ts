import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { evidenceGate } from "./baseline";
import { baselineSourceSchema } from "./baseline";
import { performanceComparison, structureAudit, trackingAudit } from "./analysis";
import type { CachedHistoryRow } from "./dashboard";
import { accountCalendarDay } from "./history";

type Client = SupabaseClient<Database>;
export async function analyzeSavedAccount(client: Client, workspaceId: string, accountId: string) {
  const { data: baseline, error } = await client.from("account_baselines").select("*").eq("workspace_id", workspaceId).eq("ad_account_id", accountId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("تعذّر قراءة أساس الحساب.");
  const { data: settings, error: settingsError } = await client.from("ad_guardrails").select("baseline_freshness_days").eq("workspace_id", workspaceId).maybeSingle();
  if (settingsError) throw new Error("تعذّر التحقق من حدود الأدلة.");
  const { data: changes, error: changeError } = await client.from("change_events").select("occurred_at,event_type").eq("workspace_id", workspaceId).eq("ad_account_id", accountId).order("occurred_at", { ascending: false }).limit(200);
  if (changeError) throw new Error("تعذّر التحقق من تغييرات الحساب.");
  const major = changes?.find((change) => ["budget", "bid_strategy", "targeting", "structure", "creative_launch", "tracking", "major_change"].includes(change.event_type));
  const gate = evidenceGate(baseline, { workspaceId, accountId, freshnessDays: settings?.baseline_freshness_days ?? 7, majorChangeAt: major?.occurred_at ?? null });
  if (!gate.ok || !baseline) return { status: "blocked" as const, reason: gate.reason, comparison: [], limitations: ["يلزم أساس حساب جاهز وحديث ومثبت المصدر قبل تحليل الأداء أو إنشاء توصيات."] };
  const periods = z.array(z.object({ since: z.string().date(), until: z.string().date(), complete: z.literal(true) })).safeParse(baseline.covered_periods);
  const period = periods.success ? periods.data[0] : null;
  if (!period) return { status: "blocked" as const, reason: "incomplete_periods", comparison: [], limitations: ["الفترات المقارنة غير مكتملة."] };
  const rows: CachedHistoryRow[] = [];
  for (let offset = 0; offset <= 3000; offset += 1000) {
    const { data: sources, error: readError } = await client.from("ads_baseline_sources").select("payload").eq("workspace_id", workspaceId).eq("ad_account_id", accountId).eq("baseline_id", baseline.id).order("id").range(offset, offset + 999);
    if (readError) throw new Error("تعذّر قراءة الأدلة المحفوظة.");
    if (offset === 3000 && sources?.length) return { status: "blocked" as const, reason: "read_limit", comparison: [], limitations: ["حجم الأدلة يتجاوز حد المراجعة؛ لا تحليل جزئي."] };
    for (const source of sources ?? []) {
      const parsed = baselineSourceSchema.safeParse(source.payload);
      if (!parsed.success) return { status: "blocked" as const, reason: "invalid_evidence", comparison: [], limitations: ["يوجد سجل أدلة غير صالح."] };
      rows.push({ ...parsed.data, metrics: parsed.data.metrics ?? null, breakdowns: parsed.data.breakdowns ?? null });
    }
    if ((sources?.length ?? 0) < 1000) break;
  }
  const split = new Date(Date.parse(period.until) - 30 * 86400000).toISOString().slice(0, 10);
  const since = new Date(Date.parse(split) - 30 * 86400000).toISOString().slice(0, 10);
  return { status: "reviewed" as const, reason: null, comparison: performanceComparison(rows, since, split, period.until), limitations: ["مقارنة وصفية من الأدلة المحفوظة فقط؛ لا مزامنة جديدة أو تنفيذ.", "نتائج غير ناضجة أو فترات ناقصة لا تُستخدم لاستنتاج التحسن أو التدهور."] };
}
export async function auditSavedAccount(client: Client, workspaceId: string, accountId: string, kind: "tracking" | "structure") {
  const { data: account, error } = await client.from("ad_accounts").select("platform,timezone").eq("workspace_id", workspaceId).eq("id", accountId).maybeSingle();
  if (error || !account) throw new Error("Forbidden");
  if (kind === "tracking") {
    // No verified conversion-setup ingestion exists while Pipeboard is held.
    const report = trackingAudit(account.platform, null);
    const { error: saveError } = await client.from("tracking_audits").insert({ workspace_id: workspaceId, ad_account_id: accountId, platform: account.platform, ...report });
    if (saveError) throw new Error("تعذّر حفظ تدقيق التتبع.");
    return report;
  }
  if (!account.timezone) throw new Error("المنطقة الزمنية للحساب غير متاحة.");
  const today = accountCalendarDay(account.timezone);
  const until = new Date(Date.parse(today) - 7 * 86400000).toISOString().slice(0, 10);
  const since = new Date(Date.parse(until) - 30 * 86400000).toISOString().slice(0, 10);
  const { data: rows, error: readError } = await client.from("campaign_snapshots").select("external_id,name,day,metrics,data_maturity,fetched_at,level,parent_external_id,breakdowns").eq("workspace_id", workspaceId).eq("ad_account_id", accountId).gte("day", since).lt("day", until).eq("level", "campaign").order("id").limit(1001);
  if (readError) throw new Error("تعذّر قراءة أدلة الهيكل.");
  const report = structureAudit((rows?.length ?? 0) > 1000 ? [] : rows ?? [], since, until);
  report.limitations.push("الفحص وصفي للبيانات المحفوظة؛ التتبع وتأخر التحويل غير متحققين مباشرة.");
  if ((rows?.length ?? 0) > 1000) report.limitations.push("السجلات تتجاوز حد الفحص؛ لم تُستنتج أعراض من قراءة جزئية.");
  const { error: saveError } = await client.from("structure_audits").insert({ workspace_id: workspaceId, ad_account_id: accountId, platform: account.platform, ...report });
  if (saveError) throw new Error("تعذّر حفظ تدقيق الهيكل.");
  return report;
}