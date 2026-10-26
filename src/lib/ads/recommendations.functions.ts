import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifiedWorkspace } from "./settings.functions";
import { changeSchema } from "./analysis";

const scope = z.object({ workspaceId: z.string().uuid(), accountId: z.string().uuid().optional() });
export const getAdsReview = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => scope.parse(input))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: accounts, error } = await context.supabase.from("ad_accounts").select("id,name,external_id,currency").eq("workspace_id", data.workspaceId).order("created_at");
    if (error) throw new Error("تعذّر قراءة الحسابات.");
    const account = data.accountId ? accounts?.find((a) => a.id === data.accountId) : accounts?.[0];
    if (data.accountId && !account) throw new Error("Forbidden");
    if (!account) return { accounts: accounts ?? [], account: null, recommendations: [], tracking: [], structure: [], reviews: [] };
    const { data: recommendations, error: recError } = await context.supabase.from("recommendations").select("*").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).eq("employee_id", "abdullah").order("created_at", { ascending: false }).limit(100);
    const { data: tracking, error: trackingError } = await context.supabase.from("tracking_audits").select("*").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(1);
    const { data: structure, error: structureError } = await context.supabase.from("structure_audits").select("*").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(1);
    const { data: reviews, error: reviewError } = await context.supabase.from("ads_recommendation_reviews").select("id,decision,created_at,recommendation_id").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(100);
    if (recError || trackingError || structureError || reviewError) throw new Error("تعذّر قراءة المراجعات.");
    return { accounts: accounts ?? [], account, recommendations: recommendations ?? [], tracking: tracking ?? [], structure: structure ?? [], reviews: reviews ?? [] };
  });
export const runAdsAnalysis = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => scope.extend({ accountId: z.string().uuid(), kind: z.enum(["analysis", "tracking", "structure"]) }).parse(input))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: account } = await context.supabase.from("ad_accounts").select("id").eq("id", data.accountId).eq("workspace_id", data.workspaceId).maybeSingle();
    if (!account) throw new Error("Forbidden");
    const { analyzeSavedAccount, auditSavedAccount } = await import("./analysis.server");
    if (data.kind === "analysis") return analyzeSavedAccount(context.supabase, data.workspaceId, data.accountId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await auditSavedAccount(supabaseAdmin, data.workspaceId, data.accountId, data.kind);
    return { status: "reviewed" as const, reason: null, comparison: [], limitations: ["الفحوص غير المتاحة مسجلة بوضوح؛ لا درجة نجاح دون أدلة."] };
  });
export const reviewAdsRecommendation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid(), recommendationId: z.string().uuid(), decision: z.enum(["edit", "approve", "reject"]), expectedCreatedAt: z.string().datetime({ offset: true }), change: changeSchema.optional(), successMetric: z.string().trim().min(1).max(200).optional(), reviewAt: z.string().datetime({ offset: true }).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: rec, error } = await context.supabase.from("recommendations").select("id,status,ad_account_id,created_at").eq("workspace_id", data.workspaceId).eq("id", data.recommendationId).eq("employee_id", "abdullah").maybeSingle();
    if (error || !rec?.ad_account_id || rec.status !== "pending" || rec.created_at !== data.expectedCreatedAt) throw new Error("المقترح تغيّر أو تم اتخاذ قرار بالفعل؛ حدّث الصفحة.");
    if (data.decision === "approve") throw new Error("الاعتماد متوقف: يلزم التقاط حديث موثّق لحالة الحساب والتحقق من الميزانية والتعلّم؛ Pipeboard متوقف. لم يحدث أي تغيير إعلاني.");
    if (data.decision === "edit" && (!data.change || !data.successMetric || !data.reviewAt)) throw new Error("أكمل التغيير ومقياس النجاح وموعد المراجعة.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: saved, error: saveError } = await supabaseAdmin.rpc("ads_review_recommendation", { p_id: rec.id, p_workspace_id: data.workspaceId, p_owner_id: context.userId, p_decision: data.decision, p_expected_created_at: data.expectedCreatedAt, ...(data.change ? { p_new_change: data.change } : {}), ...(data.successMetric ? { p_success_metric: data.successMetric } : {}), ...(data.reviewAt ? { p_review_at: data.reviewAt } : {}) });
    if (saveError || !saved) throw new Error("تعذّر حفظ القرار؛ الأدلة قد تكون قديمة أو غير مكتملة.");
    return { saved: true, applied: false };
  });
export const executeAdsRecommendation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid(), recommendationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: rec } = await context.supabase.from("recommendations").select("id,status").eq("workspace_id", data.workspaceId).eq("id", data.recommendationId).eq("employee_id", "abdullah").maybeSingle();
    if (!rec) throw new Error("Forbidden");
    throw new Error("التنفيذ الإعلاني غير متاح مع توقف Pipeboard؛ الموافقة لا تعني تنفيذ تغيير.");
  });