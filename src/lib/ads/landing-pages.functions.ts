import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifiedWorkspace } from "./settings.functions";
import { auditScope, pageScope, pageOpportunities, contentAuditSchema } from "./landing-pages";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

async function pageOwner(client: SupabaseClient<Database>, userId: string, workspaceId: string, pageId: string) {
  await verifiedWorkspace(client, userId, workspaceId);
  const { data: workspace, error: workspaceError } = await client.from("workspaces").select("use_website_context").eq("id", workspaceId).maybeSingle();
  if (workspaceError || !workspace?.use_website_context) throw new Error("فعّل سياق الموقع في مساحة العمل قبل فحص الصفحات.");
  const { data: page, error } = await client.from("landing_pages").select("*").eq("workspace_id", workspaceId).eq("id", pageId).maybeSingle();
  if (error || !page) throw new Error("Forbidden");
  return page;
}
export const getAdsLandingPages = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => pageScope.parse(input)).handler(async ({ data, context }) => {
  await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
  const { data: accounts, error } = await context.supabase.from("ad_accounts").select("id,name,external_id,currency,platform").eq("workspace_id", data.workspaceId).order("created_at");
  if (error) throw new Error("تعذّر قراءة الحسابات.");
  const account = data.accountId ? accounts?.find((a) => a.id === data.accountId) : accounts?.[0];
  if (data.accountId && !account) throw new Error("Forbidden");
  if (!account) return { accounts: accounts ?? [], account: null, pages: [], audits: [], tickets: [], opportunities: [], truncated: false };
  const [pages, audits, tickets, metrics] = await Promise.all([
    context.supabase.from("landing_pages").select("*").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).order("last_seen", { ascending: false }).limit(101),
    context.supabase.from("landing_page_audits").select("*").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(201),
    context.supabase.from("ads_page_fix_tickets").select("*").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(101),
    context.supabase.from("landing_page_metrics_daily").select("*").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).order("date", { ascending: false }).limit(1001),
  ]);
  if (pages.error || audits.error || tickets.error || metrics.error) throw new Error("تعذّر قراءة صفحات الوصول.");
  // Saved metrics lack verified provider ingestion while on hold. Do not rank from them.
  return { accounts: accounts ?? [], account, pages: pages.data?.slice(0, 100) ?? [], audits: audits.data?.slice(0, 200) ?? [], tickets: tickets.data?.slice(0, 100) ?? [], opportunities: pageOpportunities([]), truncated: (pages.data?.length ?? 0) > 100 || (audits.data?.length ?? 0) > 200 || (tickets.data?.length ?? 0) > 100 || (metrics.data?.length ?? 0) > 1000 };
});
export const discoverAdsLandingPages = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => pageScope.extend({ accountId: z.string().uuid(), offset: z.number().int().min(0).max(100000).default(0) }).parse(input)).handler(async ({ data, context }) => {
  await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
  const { data: account, error } = await context.supabase.from("ad_accounts").select("id,platform").eq("workspace_id", data.workspaceId).eq("id", data.accountId).maybeSingle();
  if (error || !account) throw new Error("Forbidden");
  const { data: workspace } = await context.supabase.from("workspaces").select("use_website_context").eq("id", data.workspaceId).maybeSingle();
  if (!workspace?.use_website_context) throw new Error("سياق الموقع متوقف.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { discoverSavedPages } = await import("./landing-pages.server");
  return discoverSavedPages(supabaseAdmin, data.workspaceId, account.id, account.platform, data.offset);
});
export const auditAdsLandingPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => auditScope.parse(input)).handler(async ({ data, context }) => {
  const page = await pageOwner(context.supabase, context.userId, data.workspaceId, data.pageId);
  if (data.accountId && data.accountId !== page.ad_account_id) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: claimed, error } = await supabaseAdmin.rpc("ads_claim_page_audit", { p_page_id: page.id, p_workspace_id: data.workspaceId, p_account_id: page.ad_account_id });
  if (error || !claimed) throw new Error("هذا الفحص يعمل بالفعل أو أُجري حديثاً؛ انتظر خمس دقائق.");
  const { analyzeSavedAccount } = await import("./analysis.server");
  const gate = await analyzeSavedAccount(context.supabase, data.workspaceId, page.ad_account_id);
  const { getSecret } = await import("@/lib/secrets.server"); const key = await getSecret("PAGESPEED_API_KEY");
  const { auditPublicAdPage } = await import("./landing-pages.server");
  return auditPublicAdPage(supabaseAdmin, page, data.device, key, gate.status === "reviewed");
});
export const createAdsPageFix = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => pageScope.extend({ pageId: z.string().uuid(), auditId: z.string().uuid(), category: z.string().max(100), successMetric: z.string().trim().min(1).max(200), reviewAt: z.string().datetime({ offset: true }) }).parse(input)).handler(async ({ data, context }) => {
  const page = await pageOwner(context.supabase, context.userId, data.workspaceId, data.pageId);
  const { analyzeSavedAccount } = await import("./analysis.server");
  const gate = await analyzeSavedAccount(context.supabase, data.workspaceId, page.ad_account_id);
  if (gate.status !== "reviewed") throw new Error("يلزم أساس حساب جاهز وحديث وموثّق قبل إنشاء تعليمات إصلاح.");
  const { data: audit, error } = await context.supabase.from("landing_page_audits").select("content_analysis").eq("id", data.auditId).eq("workspace_id", data.workspaceId).eq("landing_page_id", page.id).eq("ad_account_id", page.ad_account_id).maybeSingle();
  const parsed = contentAuditSchema.safeParse(audit?.content_analysis);
  const check = parsed.success ? parsed.data.checks.find((c) => c.category === data.category && c.status === "issue" && c.steps.length) : null;
  if (error || !check || Date.parse(data.reviewAt) <= Date.now()) throw new Error("اختر مشكلة موثّقة وموعد مراجعة مستقبلي.");
  const { data: baseline } = await context.supabase.from("account_baselines").select("id").eq("workspace_id", data.workspaceId).eq("ad_account_id", page.ad_account_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!baseline) throw new Error("أساس الحساب غير متاح.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error: saveError } = await supabaseAdmin.from("ads_page_fix_tickets").insert({ workspace_id: data.workspaceId, ad_account_id: page.ad_account_id, landing_page_id: page.id, audit_id: data.auditId, baseline_id: baseline.id, category: check.category, steps: check.steps, success_metric: data.successMetric, review_at: data.reviewAt });
  if (saveError) throw new Error("تعذّر حفظ الإصلاح؛ راجع صلاحية الأدلة."); return { saved: true, applied: false };
});
export const markAdsPageFix = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => pageScope.extend({ ticketId: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
  const { data: ticket } = await context.supabase.from("ads_page_fix_tickets").select("id,landing_page_id").eq("id", data.ticketId).eq("workspace_id", data.workspaceId).maybeSingle();
  if (!ticket) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: saved, error } = await supabaseAdmin.rpc("ads_mark_page_fix", { p_ticket_id: ticket.id, p_workspace_id: data.workspaceId, p_owner_id: context.userId });
  if (error || !saved) throw new Error("تعذّر حفظ تأكيد التنفيذ.");
  return { saved: true, pageId: ticket.landing_page_id, websiteChanged: false, outcome: "unverified" };
});