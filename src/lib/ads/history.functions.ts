import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifiedWorkspace } from "./settings.functions";
import { aggregateHistory } from "./history";
import { historyTimeline, isAggregateRow, summarizeEntities, type CachedHistoryRow } from "./dashboard";

/** Cached campaign reads only; no platform writes or fabricated/demo rows. */
export const getAdsHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    workspaceId: z.string().uuid(), accountId: z.string().uuid().optional(), days: z.union([z.literal(30), z.literal(90)]).default(90),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const workspaceId = await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: accounts, error: accountError } = await context.supabase.from("ad_accounts")
      .select("id,name,external_id,currency,timezone,platform").eq("workspace_id", workspaceId).order("created_at");
    if (accountError) throw new Error(accountError.message);
    const account = data.accountId ? accounts?.find((row) => row.id === data.accountId) : accounts?.[0];
    if (data.accountId && !account) throw new Error("Forbidden: الحساب غير موجود في مساحتك.");
    if (!account) return { accounts: accounts ?? [], account: null, campaigns: [], entities: [], timeline: [], summary: aggregateHistory([]), jobs: [], truncated: false, dimensionRows: 0, lastFetchedAt: null };
    const { accountCalendarDay, historyWindows } = await import("./history");
    if (!account.timezone) throw new Error("المنطقة الزمنية غير متاحة من الحساب؛ أكمل الربط أولاً.");
    const today = accountCalendarDay(account.timezone);
    const since = new Date(Date.parse(today) - data.days * 86_400_000).toISOString().slice(0, 10);
    const snapshots: CachedHistoryRow[] = [];
    let truncated = false;
    // Sequential bounded pages avoid PostgREST's default 1,000-row truncation.
    for (let offset = 0; offset <= 20_000; offset += 1000) {
      const { data: page, error } = await context.supabase.from("campaign_snapshots")
        .select("external_id,name,day,metrics,data_maturity,fetched_at,level,parent_external_id,breakdowns")
        .eq("workspace_id", workspaceId).eq("ad_account_id", account.id)
        .gte("day", since).lt("day", today).order("day").order("level").order("external_id").order("id")
        .range(offset, offset + 999);
      if (error) throw new Error("تعذّر قراءة التاريخ المحفوظ.");
      if (offset === 20_000 && page?.length) { truncated = true; break; }
      snapshots.push(...(page ?? []));
      if ((page?.length ?? 0) < 1000) break;
    }
    const { data: jobs, error: jobError } = await
      context.supabase.from("ad_jobs").select("id,kind,status,progress,pause_reason,last_error,updated_at")
        .eq("workspace_id", workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(5);
    if (jobError) throw new Error(jobError.message);
    // Never display partial financial totals as complete.
    const rows = truncated ? [] : snapshots;
    const campaignRows = rows.filter((row) => row.level === "campaign" && isAggregateRow(row));
    const entities = summarizeEntities(rows);
    return {
      accounts: accounts ?? [], account, since, until: today, plannedWindows: historyWindows(today).length,
      campaigns: entities.filter((row) => row.level === "campaign"), entities: entities.filter((row) => row.level !== "campaign"),
      timeline: truncated ? [] : historyTimeline(rows, since, today),
      summary: aggregateHistory(campaignRows), jobs: jobs ?? [], truncated,
      dimensionRows: rows.filter((row) => !isAggregateRow(row)).length,
      lastFetchedAt: rows.reduce<string | null>((last, row) => !last || row.fetched_at > last ? row.fetched_at : last, null),
    };
  });