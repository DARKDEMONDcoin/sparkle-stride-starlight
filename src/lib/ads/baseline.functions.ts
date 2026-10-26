import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifiedWorkspace } from "./settings.functions";

const scopeSchema = z.object({ workspaceId: z.string().uuid(), accountId: z.string().uuid() });
export const getAdsBaseline = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid(), accountId: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const workspaceId = await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: accounts, error } = await context.supabase.from("ad_accounts").select("id,name,external_id,timezone,currency").eq("workspace_id", workspaceId).order("created_at");
    if (error) throw new Error("تعذّر قراءة الحسابات.");
    const account = data.accountId ? accounts?.find((a) => a.id === data.accountId) : accounts?.[0];
    if (data.accountId && !account) throw new Error("Forbidden");
    if (!account) return { accounts: accounts ?? [], account: null, baseline: null, jobs: [], notes: [], learnings: [] };
    const { data: baseline, error: baselineError } = await context.supabase.from("account_baselines").select("*").eq("workspace_id", workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const { data: jobs, error: jobError } = await context.supabase.from("ad_jobs").select("id,status,progress,pause_reason,cursor").eq("workspace_id", workspaceId).eq("ad_account_id", account.id).eq("kind", "baseline").order("created_at", { ascending: false }).limit(1);
    const { data: notes, error: noteError } = await context.supabase.from("user_context_notes").select("id,note,period_start,period_end").eq("workspace_id", workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(50);
    const { data: learnings, error: learningError } = await context.supabase.from("account_learnings").select("id,learning,outcome,confidence").eq("workspace_id", workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(50);
    if (baselineError || jobError || noteError || learningError) throw new Error("تعذّر قراءة تقرير الحساب.");
    return { accounts: accounts ?? [], account, baseline, jobs: jobs ?? [], notes: notes ?? [], learnings: learnings ?? [] };
  });
export const startAdsBaseline = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => scopeSchema.parse(input))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: account, error } = await context.supabase.from("ad_accounts").select("id,timezone").eq("id", data.accountId).eq("workspace_id", data.workspaceId).maybeSingle();
    if (error || !account) throw new Error("Forbidden");
    if (!account.timezone) throw new Error("المنطقة الزمنية للحساب غير متاحة.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createBaselineReview } = await import("./baseline.server");
    return createBaselineReview(supabaseAdmin, data.workspaceId, account.id, account.timezone);
  });
export const resumeAdsBaseline = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => scopeSchema.extend({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: job, error } = await context.supabase.from("ad_jobs").select("id").eq("id", data.jobId).eq("workspace_id", data.workspaceId).eq("ad_account_id", data.accountId).eq("kind", "baseline").maybeSingle();
    if (error || !job) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runBaselineReview } = await import("./baseline.server");
    return runBaselineReview(supabaseAdmin, data.workspaceId, data.accountId, job.id);
  });
export const saveAdsContextNote = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => scopeSchema.extend({ note: z.string().trim().min(1).max(2000), since: z.string().date().optional(), until: z.string().date().optional() }).refine((d) => !d.since || !d.until || d.since <= d.until).parse(input))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: account } = await context.supabase.from("ad_accounts").select("id").eq("id", data.accountId).eq("workspace_id", data.workspaceId).maybeSingle();
    if (!account) throw new Error("Forbidden");
    const { error } = await context.supabase.from("user_context_notes").insert({ workspace_id: data.workspaceId, ad_account_id: data.accountId, note: data.note, period_start: data.since ?? null, period_end: data.until ?? null });
    if (error) throw new Error("تعذّر حفظ الملاحظة.");
    return { saved: true };
  });

export const reviewAdsOutcomes = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => scopeSchema.parse(input))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: account } = await context.supabase.from("ad_accounts").select("id").eq("id", data.accountId).eq("workspace_id", data.workspaceId).maybeSingle();
    if (!account) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { reviewSavedOutcomes } = await import("./outcomes.server");
    return reviewSavedOutcomes(supabaseAdmin, data.workspaceId, data.accountId);
  });