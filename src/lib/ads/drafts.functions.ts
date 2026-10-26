import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { verifiedWorkspace } from "./settings.functions";
import { contradictions, feasibility, marketLanguages, missingRequired, recommendCampaignType, specialAdCategories, allowableCpa, trackingReady, type AssetFile, type IntakeAnswers } from "./intake";
import { GOOGLE_CAMPAIGN_TYPES, emptyGoogleOptions, googleAssetChecklist, googleCampaignType, googleDraftPlan, type GoogleCampaignOptions } from "./google-campaigns";

const platformSchema = z.enum(["google", "meta"]);
const answersSchema = z.record(z.string(), z.unknown()).refine((v) => JSON.stringify(v).length < 40000, "too large");
const HOLD = "إنشاء الحملات على المنصة متوقف حتى يُفعَّل الربط الموثّق (Pipeboard متوقف). لم يحدث أي تغيير إعلاني.";

export async function ownedAccount(client: Parameters<typeof verifiedWorkspace>[0], workspaceId: string, accountId: string) {
  const { data } = await client.from("ad_accounts").select("id,platform,currency,timezone,name,external_id").eq("id", accountId).eq("workspace_id", workspaceId).maybeSingle();
  if (!data) throw new Error("Forbidden");
  return data;
}

export const getAdsSetup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid(), accountId: z.string().uuid().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: accounts, error } = await context.supabase.from("ad_accounts").select("id,platform,currency,timezone,name,external_id").eq("workspace_id", data.workspaceId).order("created_at");
    if (error) throw new Error("تعذّر قراءة الحسابات.");
    const account = data.accountId ? accounts?.find((a) => a.id === data.accountId) : accounts?.[0];
    if (data.accountId && !account) throw new Error("Forbidden");
    if (!account) return { accounts: accounts ?? [], account: null, profile: null, baseline: null, drafts: [] };
    const [{ data: profile }, { data: baseline }, { data: drafts }] = await Promise.all([
      context.supabase.from("business_profiles").select("id,answers,site_summary,updated_at").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      context.supabase.from("account_baselines").select("id,status,mode,built_at,expires_at").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      context.supabase.from("campaign_drafts").select("id,platform,campaign_type,status,spec,lessons_from_history,creatives,created_at,decided_at").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).eq("employee_id", "abdullah").order("created_at", { ascending: false }).limit(30),
    ]);
    const assetPaths = (((profile?.answers ?? {}) as IntakeAnswers).assetFiles ?? []).map((f) => f.path);
    const paths = [...(drafts ?? []).flatMap((d) => (Array.isArray(d.creatives) ? d.creatives : []).flatMap((c) => ((c as { images?: { path: string }[] }).images ?? []).map((i) => i.path))), ...assetPaths].filter((p) => p.startsWith(`${data.workspaceId}/ads/`));
    const urls: Record<string, string> = {};
    if (paths.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed } = await supabaseAdmin.storage.from("nour-media").createSignedUrls(paths, 3600);
      for (const s of signed ?? []) if (s.path && s.signedUrl) urls[s.path] = s.signedUrl;
    }
    return { accounts: accounts ?? [], account, profile: profile ?? null, baseline: baseline ?? null, drafts: drafts ?? [], imageUrls: urls };
  });

export const saveAdsIntake = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid(), accountId: z.string().uuid(), answers: answersSchema, siteSummary: z.string().max(4000).nullable().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const account = await ownedAccount(context.supabase, data.workspaceId, data.accountId);
    // Currency and timezone come only from the connected account, never from user input or defaults.
    const answers = { ...data.answers, currency: account.currency ?? null, timezone: account.timezone ?? null } as Json;
    const { data: existing } = await context.supabase.from("business_profiles").select("id").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).limit(1).maybeSingle();
    const row = { answers, ...(data.siteSummary !== undefined ? { site_summary: data.siteSummary } : {}) };
    const res = existing ? await context.supabase.from("business_profiles").update(row).eq("id", existing.id) : await context.supabase.from("business_profiles").insert({ ...row, workspace_id: data.workspaceId, ad_account_id: account.id });
    if (res.error) throw new Error("تعذّر حفظ ملف النشاط.");
    return { saved: true };
  });

export const summarizeAdsWebsite = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid(), url: z.string().url().max(2000) }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { fetchAdPage } = await import("./landing-fetch.server");
    const { extractPageEvidence } = await import("./landing-pages.server");
    const page = await fetchAdPage(data.url).catch(() => { throw new Error("تعذّر قراءة الموقع بأمان؛ اكتب الملخص يدوياً."); });
    const e = extractPageEvidence(page.html);
    if (e.passwordForm) throw new Error("الصفحة تتطلب تسجيل دخول؛ لا نقرأها.");
    const summary = [e.title && `العنوان: ${e.title}`, e.headings.length && `أبرز العناوين: ${e.headings.filter(Boolean).slice(0, 8).join(" · ")}`, e.callsToAction.length && `الدعوات للإجراء: ${[...new Set(e.callsToAction)].slice(0, 8).join(" · ")}`, e.language && `لغة الصفحة: ${e.language}`, `وسوم التتبع المرئية: Google ${e.googleTag ? "نعم" : "غير ظاهر"} · Meta Pixel ${e.metaPixel ? "نعم" : "غير ظاهر"}`, e.text && `مقتطف: ${e.text.slice(0, 600)}`].filter(Boolean).join("\n");
    return { summary, finalUrl: page.finalUrl };
  });

const shortList = z.array(z.string().trim().min(1).max(80)).max(25).default([]);
const googleOptionsSchema = z.object({ businessName: z.string().trim().max(25).default(""), logoUrl: z.string().trim().max(2000).default(""), videoUrl: z.string().trim().max(2000).default(""), merchantCenterId: z.string().trim().max(40).default(""), audienceSignals: shortList, searchThemes: shortList, brandExclusions: shortList });

export const createAdsDraft = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid(), accountId: z.string().uuid(), platform: platformSchema, googleType: z.enum(GOOGLE_CAMPAIGN_TYPES).optional(), googleOptions: googleOptionsSchema.optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const account = await ownedAccount(context.supabase, data.workspaceId, data.accountId);
    if (account.platform !== data.platform) throw new Error("منصة الحساب لا تطابق المسودة.");
    const { data: profile } = await context.supabase.from("business_profiles").select("id,answers").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).limit(1).maybeSingle();
    const answers = (profile?.answers ?? {}) as IntakeAnswers;
    const missing = missingRequired(answers, [data.platform]);
    if (!profile || missing.length) return { created: false as const, missing, questions: [] as string[], feasibility: null };
    const questions = contradictions(answers);
    if (questions.length) return { created: false as const, missing: [], questions, feasibility: null };
    const { data: baseline } = await context.supabase.from("account_baselines").select("id,mode,status,data_quality").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).eq("status", "ready").order("built_at", { ascending: false }).limit(1).maybeSingle();
    if (!baseline) return { created: false as const, missing: [], questions: ["ما زلت أتعلم الحساب: لا يوجد أساس جاهز وموثّق بعد، فلا أقترح خطة حملة الآن."], feasibility: null };
    const { data: learnings } = await context.supabase.from("account_learnings").select("learning,outcome,confidence").eq("workspace_id", data.workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(10);
    const lessons = learnings?.length ? learnings.map((l) => ({ learning: l.learning, outcome: l.outcome, confidence: l.confidence })) : [{ learning: "لا توجد دروس مسجلة لهذا الحساب بعد؛ الخطة تُعامل كاختبار وتُراجع بعد نضج البيانات.", outcome: "none_recorded", confidence: "low" }];
    const feas = feasibility(answers, [data.platform]);
    const choice = recommendCampaignType(answers, data.platform, data.platform === "google" ? data.googleType : undefined);
    const gType = googleCampaignType(choice.type);
    const tracking = trackingReady(answers, [data.platform]);
    if (data.platform === "google" && gType === "performance_max" && !tracking) return { created: false as const, missing: [], questions: ["Performance Max يحتاج تتبع تحويلات جاهزاً (وسم Google والتحويلات المحسّنة). أصلح التتبع أولاً أو اختر البحث."], feasibility: null };
    const isNew = baseline.mode === "new_account";
    const markets = (answers.markets ?? []).map((m) => ({ market: m, languages: marketLanguages(answers, m) }));
    const googleOptions = { ...emptyGoogleOptions(), ...(data.googleOptions ?? {}) };
    const spec = {
      mode: isNew ? "new_account" : "history", objective: answers.goal, campaignType: choice.type, why: choice.why,
      budget: { monthly: answers.monthlyBudget, dailyCap: answers.dailyCap ?? null, currency: account.currency, derivedDaily: feas.dailyBudget, calculatedCpa: allowableCpa(answers), confirmedCpa: answers.confirmedCpa, learning: feas },
      markets,
      audience: answers.audience, specialAdCategories: data.platform === "meta" ? specialAdCategories(answers) : [],
      structure: data.platform === "meta" ? { campaigns: 1, adSets: Math.max(1, Math.min(feas.maxMetaAdSets, 2)), concepts: "8–15 مفهوماً مميزاً", advantage: ["campaign_budget", "audience", "placements"] } : gType === "search" ? { campaigns: Math.max(1, Math.min(feas.maxGoogleCampaigns, 2)), adGroups: "مجموعات قليلة متقاربة المعنى، صفحة ورسالة لكل مجموعة", aiMax: false } : { campaigns: 1, assetGroups: gType === "performance_max" ? "1–3 حسب الرسالة أو المنتج" : null, adGroups: gType === "demand_gen" ? "1–2 بجمهور واسع" : null },
      ...(data.platform === "google" && gType !== "search" ? { google: googleDraftPlan(gType, googleOptions) } : {}),
      trackingReadiness: tracking ? "ready" : "fix_first", landingPages: answers.landingPages ?? [],
      assumptions: ["الحدود مرجعية قابلة للضبط من دليل العمل.", "النصوص والصور تُنشأ في الخطوة التالية بعد اعتماد الخطة."],
      createPaused: true,
    };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("campaign_drafts").insert({ workspace_id: data.workspaceId, ad_account_id: account.id, business_profile_id: profile.id, baseline_id: baseline.id, platform: data.platform, campaign_type: choice.type, status: "awaiting_approval", employee_id: "abdullah", lessons_from_history: lessons as Json, spec: spec as Json }).select("id").single();
    if (error) throw new Error(/baseline/i.test(error.message) ? "الأساس غير جاهز أو قديم أو تغيّر الحساب بعده؛ أعد بناءه أولاً." : "تعذّر حفظ المسودة.");
    return { created: true as const, id: row.id, missing: [], questions: [], feasibility: feas };
  });

export const decideAdsDraft = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid(), draftId: z.string().uuid(), decision: z.enum(["approve", "reject"]) }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: draft } = await context.supabase.from("campaign_drafts").select("id,status").eq("workspace_id", data.workspaceId).eq("id", data.draftId).eq("employee_id", "abdullah").maybeSingle();
    if (!draft || draft.status !== "awaiting_approval") throw new Error("المسودة تغيّرت أو تم اتخاذ قرار بالفعل.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("campaign_drafts").update({ status: data.decision === "approve" ? "approved" : "rejected", decided_by: context.userId, decided_at: new Date().toISOString() }).eq("id", draft.id).eq("status", "awaiting_approval");
    if (error) throw new Error("تعذّر حفظ القرار؛ قد يكون الأساس قديماً.");
    return { saved: true, applied: false };
  });

/** Paused creation and final Launch stay closed until a verified provider exists; DB triggers enforce the order regardless. */
export const createAdsDraftPaused = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid(), draftId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: draft } = await context.supabase.from("campaign_drafts").select("status,platform,campaign_type,spec,creatives,ad_account_id").eq("workspace_id", data.workspaceId).eq("id", data.draftId).maybeSingle();
    if (draft?.status !== "approved") throw new Error("اعتمد الخطة أولاً.");
    if (draft.platform === "google") {
      const spec = (draft.spec ?? {}) as { google?: { options?: Partial<GoogleCampaignOptions> }; markets?: { market: string; languages?: string[]; language?: string | null }[] };
      const { data: profile } = await context.supabase.from("business_profiles").select("answers").eq("workspace_id", data.workspaceId).eq("ad_account_id", draft.ad_account_id ?? "").limit(1).maybeSingle();
      const uploaded = (((profile?.answers ?? {}) as IntakeAnswers).assetFiles ?? []) as AssetFile[];
      const check = googleAssetChecklist(googleCampaignType(draft.campaign_type), spec.google?.options ?? {}, (Array.isArray(draft.creatives) ? draft.creatives : []) as never, spec.markets ?? [], uploaded);
      if (!check.complete) throw new Error(`الأصول غير مكتملة: ${check.issues.join(" ")}`);
    }
    throw new Error(HOLD);
  });
export const launchAdsDraft = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid(), draftId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: draft } = await context.supabase.from("campaign_drafts").select("status").eq("workspace_id", data.workspaceId).eq("id", data.draftId).maybeSingle();
    if (draft?.status !== "paused_created") throw new Error("الإطلاق يتطلب حملة منشأة متوقفة أولاً.");
    throw new Error(HOLD);
  });
