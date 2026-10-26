import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { verifiedWorkspace } from "./settings.functions";
import { validateCopy } from "./intake";

export type DraftCreative = { id: string; market: string; language: string; concept: string; hypothesis: string; headlines: string[]; descriptions: string[]; primary: string[]; cta: string | null; issues: string[]; status: "pending" | "approved" | "rejected"; aiGenerated: true; images?: CreativeImage[] };
export type CreativeImage = { id: string; ratio: Ratio; path: string; status: "pending" | "approved" | "rejected"; aiGenerated: true; url?: string };
export const RATIOS = { "1:1": { width: 1024, height: 1024 }, "4:5": { width: 896, height: 1120 }, "9:16": { width: 768, height: 1344 }, "16:9": { width: 1344, height: 768 } } as const;
export type Ratio = keyof typeof RATIOS;
const str = z.string().trim().min(1).max(400);
const out = z.object({ creatives: z.array(z.object({ market: str, language: str, concept: str, hypothesis: str, headlines: z.array(str).max(15), descriptions: z.array(str).max(4).default([]), primary: z.array(z.string().max(2000)).max(5).default([]), cta: z.string().max(40).nullable().optional() })).max(15) });

/** Native copy per market language for an owner-approved plan; validated against platform limits, each item approved separately. */
export const generateDraftCopy = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid(), draftId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: draft } = await context.supabase.from("campaign_drafts").select("id,status,platform,spec,ad_account_id,business_profile_id,lessons_from_history,creatives").eq("workspace_id", data.workspaceId).eq("id", data.draftId).eq("employee_id", "abdullah").maybeSingle();
    if (!draft || draft.status !== "approved") throw new Error("اعتمد خطة الحملة أولاً قبل كتابة الإعلانات.");
    const platform = draft.platform === "meta" ? "meta" : "google";
    const [{ data: profile }, { data: guidelines }] = await Promise.all([
      context.supabase.from("business_profiles").select("answers,site_summary").eq("id", draft.business_profile_id ?? "").eq("workspace_id", data.workspaceId).maybeSingle(),
      context.supabase.from("brain_items").select("kind,meta,used_by,title,body").eq("workspace_id", data.workspaceId).eq("kind", "employee_guideline").contains("used_by", ["abdullah"]).limit(100),
    ]);
    if (!profile) throw new Error("ملف النشاط غير موجود.");
    const { buildMediaBuyerPrompt } = await import("./prompts/media-buyer.v1");
    const { mediaBuyerGuidelines } = await import("./guidelines");
    const system = buildMediaBuyerPrompt({ task: "creative", platforms: [platform], writingAds: true, guidelines: mediaBuyerGuidelines(guidelines ?? []), businessProfile: JSON.stringify({ answers: profile.answers, site: profile.site_summary }), accountBaseline: JSON.stringify({ lessons: draft.lessons_from_history }) });
    const limits = platform === "google" ? "Responsive search ads: 8-15 headlines of at most 30 characters, 2-4 descriptions of at most 90 characters, primary=[]." : "Meta: 1-5 primary texts, 1-5 headlines, descriptions up to 1, a CTA such as LEARN_MORE/SIGN_UP/SHOP_NOW.";
    const user = `Plan: ${JSON.stringify(draft.spec)}\nWrite 2-4 genuinely distinct creative concepts PER market, natively in that market's language (not translated). ${limits} No guarantees or unsubstantiated claims; ground every line in the profile's USP/proof. Return JSON {"creatives":[{"market","language","concept","hypothesis","headlines":[],"descriptions":[],"primary":[],"cta"}]}.`;
    const { freeChat, parseJson } = await import("@/lib/nour-research.server");
    const raw = await freeChat("media-buyer-creative", [{ role: "system", content: system }, { role: "user", content: user }], { json: true, maxTokens: 5000, timeoutMs: 45000, budgetMs: 55000, attempts: 2 });
    const parsed = out.safeParse(parseJson(raw));
    if (!parsed.success || !parsed.data.creatives.length) throw new Error("تعذّر توليد نصوص صالحة؛ حاول مرة أخرى.");
    const creatives: DraftCreative[] = parsed.data.creatives.map((c) => ({ ...c, cta: c.cta ?? null, id: crypto.randomUUID(), issues: validateCopy(platform, c), status: "pending", aiGenerated: true }));
    const keep = (Array.isArray(draft.creatives) ? draft.creatives : []).filter((c) => (c as { status?: string }).status === "approved");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("campaign_drafts").update({ creatives: [...keep, ...creatives] as unknown as Json }).eq("id", draft.id).eq("status", "approved");
    if (error) throw new Error("تعذّر حفظ النصوص.");
    return { count: creatives.length };
  });

export const decideDraftCreative = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid(), draftId: z.string().uuid(), creativeId: z.string().uuid(), decision: z.enum(["approve", "reject"]) }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: draft } = await context.supabase.from("campaign_drafts").select("id,status,creatives").eq("workspace_id", data.workspaceId).eq("id", data.draftId).eq("employee_id", "abdullah").maybeSingle();
    if (!draft || draft.status !== "approved") throw new Error("المسودة غير قابلة للتعديل.");
    const list = (Array.isArray(draft.creatives) ? draft.creatives : []) as unknown as DraftCreative[];
    const item = list.find((c) => c.id === data.creativeId);
    if (!item || item.status !== "pending") throw new Error("تم اتخاذ قرار بالفعل.");
    if (data.decision === "approve" && item.issues.length) throw new Error("لا يمكن اعتماد نص يخالف حدود المنصة أو يحمل صياغة عالية المخاطر.");
    item.status = data.decision === "approve" ? "approved" : "rejected";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("campaign_drafts").update({ creatives: list as unknown as Json }).eq("id", draft.id).eq("status", "approved");
    if (error) throw new Error("تعذّر حفظ القرار.");
    return { saved: true };
  });

const ratioSchema = z.enum(["1:1", "4:5", "9:16", "16:9"]);
async function approvedDraft(client: Parameters<typeof verifiedWorkspace>[0], workspaceId: string, draftId: string) {
  const { data: draft } = await client.from("campaign_drafts").select("id,status,creatives,spec").eq("workspace_id", workspaceId).eq("id", draftId).eq("employee_id", "abdullah").maybeSingle();
  if (!draft || draft.status !== "approved") throw new Error("المسودة غير قابلة للتعديل.");
  return { draft, list: (Array.isArray(draft.creatives) ? draft.creatives : []) as unknown as DraftCreative[] };
}

/** Image for an approved text, using the shared image tool; stored privately and approved separately. */
export const generateCreativeImage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid(), draftId: z.string().uuid(), creativeId: z.string().uuid(), ratio: ratioSchema }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { draft, list } = await approvedDraft(context.supabase, data.workspaceId, data.draftId);
    const item = list.find((c) => c.id === data.creativeId);
    if (!item || item.status !== "approved") throw new Error("اعتمد النص أولاً قبل تصميم صورته.");
    if ((item.images ?? []).length >= 12) throw new Error("وصلت للحد الأقصى من الصور لهذا النص.");
    const prompt = `Advertising photo for: ${item.concept}. Idea: ${item.hypothesis}. Realistic, on-brand, clean composition with clear focal subject and empty safe margins. No text, no letters, no logos, no third-party brands, no real identifiable people.`;
    const { generateImageBytes } = await import("@/lib/image-gen.server");
    const img = await generateImageBytes(prompt, { ...RATIOS[data.ratio], timeoutMs: 60000 });
    if (!img) throw new Error("تعذّر إنشاء الصورة الآن؛ حاول لاحقاً.");
    const id = crypto.randomUUID(); const path = `${data.workspaceId}/ads/${draft.id}/${id}.jpg`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const up = await supabaseAdmin.storage.from("nour-media").upload(path, img.bytes, { contentType: img.contentType });
    if (up.error) throw new Error("تعذّر حفظ الصورة.");
    item.images = [...(item.images ?? []), { id, ratio: data.ratio, path, status: "pending", aiGenerated: true }];
    const { error } = await supabaseAdmin.from("campaign_drafts").update({ creatives: list as unknown as Json }).eq("id", draft.id).eq("status", "approved");
    if (error) throw new Error("تعذّر حفظ الصورة.");
    return { id };
  });

export const decideCreativeImage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid(), draftId: z.string().uuid(), creativeId: z.string().uuid(), imageId: z.string().uuid(), decision: z.enum(["approve", "reject"]) }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { draft, list } = await approvedDraft(context.supabase, data.workspaceId, data.draftId);
    const image = list.find((c) => c.id === data.creativeId)?.images?.find((x) => x.id === data.imageId);
    if (!image || image.status !== "pending") throw new Error("تم اتخاذ قرار بالفعل.");
    image.status = data.decision === "approve" ? "approved" : "rejected";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("campaign_drafts").update({ creatives: list as unknown as Json }).eq("id", draft.id).eq("status", "approved");
    if (error) throw new Error("تعذّر حفظ القرار.");
    return { saved: true };
  });
