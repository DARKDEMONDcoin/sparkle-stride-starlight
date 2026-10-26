import { parseHTML } from "linkedom";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { z } from "zod";
import { fetchAdPage } from "./landing-fetch.server";
import { compactPageSpeed, contentAuditSchema, checklistKeys, normalizeAdPage } from "./landing-pages";
import { landingAuditPrompt } from "./prompts/landing-audit";
import { mediaBuyerGuidelines } from "./guidelines";
import type { MediaBuyerPlatform } from "./playbook";

type Client = SupabaseClient<Database>;
export function extractPageEvidence(html: string) {
  const { document } = parseHTML(html);
  const googleTag = /googletagmanager\.com|gtag\(/i.test(html), metaPixel = /connect\.facebook\.net|fbq\(/i.test(html);
  const passwordForm = Boolean(document.querySelector('input[type="password"]'));
  const forms = [...document.querySelectorAll("form")].slice(0, 5).map((form) => ({ fields: form.querySelectorAll("input:not([type=hidden]),select,textarea").length, required: form.querySelectorAll("[required]").length, requiredPhone: Boolean(form.querySelector('input[type="tel"][required]')) }));
  document.querySelectorAll("script,style,noscript,iframe,svg").forEach((el) => el.remove());
  const text = (document.body?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 14000);
  return { title: document.title.slice(0, 250), headings: [...document.querySelectorAll("h1,h2")].slice(0, 15).map((el) => (el.textContent ?? "").slice(0, 250)), callsToAction: [...document.querySelectorAll('button,a,[role="button"]')].slice(0, 30).map((el) => (el.textContent ?? "").trim().slice(0, 100)).filter(Boolean), language: document.documentElement.lang || null, direction: document.documentElement.dir || null, forms, googleTag, metaPixel, passwordForm, text };
}
export async function readPageSpeed(url: string, device: "mobile" | "desktop", key: string | null) {
  if (!key) return { available: false, reason: "PageSpeed key not configured" };
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url); endpoint.searchParams.set("strategy", device); endpoint.searchParams.set("key", key); endpoint.searchParams.set("category", "performance");
  try {
    const response = await fetch(endpoint, { redirect: "error", signal: AbortSignal.timeout(18000) });
    if (!response.ok) return { available: false, reason: `PageSpeed unavailable (${response.status})` };
    return { available: true, ...compactPageSpeed(await response.json()) };
  } catch { return { available: false, reason: "PageSpeed timed out or returned invalid data" }; }
}
export async function auditPublicAdPage(client: Client, page: { id: string; workspace_id: string; ad_account_id: string; url_normalized: string }, device: "mobile" | "desktop", key: string | null, generate: boolean) {
  const limitations = ["قراءة HTML ثابتة؛ المحتوى الذي يظهر بالجافاسكربت قد يكون ناقصاً. لا لقطة متصفح أو تحقق بصري.", "وجود الوسوم لا يثبت أن الأحداث تعمل؛ تحقق عبر Tag Assistant أو Test Events في Meta.", "لا تأكيد لسلوك الموافقة أو صفحة الشكر أو متابعة العملاء؛ اختبر النموذج أو الشراء بنفسك على الهاتف.", "أرقام المزود والتتبع وتأخر التحويل غير متحققة مع توقف Pipeboard؛ لا ادعاء تحسن أداء."];
  let content: Record<string, unknown> = {}; let psi: Record<string, unknown> = {}; let tracking: unknown[] = [];
  try {
    const fetched = await fetchAdPage(page.url_normalized); const evidence = extractPageEvidence(fetched.html);
    if (evidence.passwordForm) throw new Error("Login form detected");
    content = { finalUrl: fetched.finalUrl, statuses: fetched.statuses, title: evidence.title, headings: evidence.headings, language: evidence.language, direction: evidence.direction, forms: evidence.forms, checks: checklistKeys.map((category) => ({ category, status: "unknown", evidence: "الفحص يحتاج أدلة إضافية.", steps: [] })) };
    tracking = [{ googleTagObserved: evidence.googleTag, metaPixelObserved: evidence.metaPixel, eventsVerified: false }];
    psi = await readPageSpeed(fetched.finalUrl, device, key);
    if (psi["available"] !== true) limitations.push("تعذّر قياس السرعة: " + String(psi["reason"]));
    else if (!psi["fieldAvailable"]) limitations.push("لا توجد بيانات مستخدمين حقيقية؛ قياس مختبري فقط.");
    if (generate) {
      const { freeChat, parseJson } = await import("@/lib/nour-research.server");
      const [account, guidelines, baseline] = await Promise.all([
        client.from("ad_accounts").select("platform,currency,timezone").eq("workspace_id", page.workspace_id).eq("id", page.ad_account_id).maybeSingle(),
        client.from("brain_items").select("kind,meta,used_by,title,body").eq("workspace_id", page.workspace_id).eq("kind", "employee_guideline").contains("used_by", ["abdullah"]).limit(100),
        client.from("account_baselines").select("id,status,mode,data_quality,limitations").eq("workspace_id", page.workspace_id).eq("ad_account_id", page.ad_account_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (account.error || guidelines.error || baseline.error) throw new Error("Prompt context unavailable");
      const platforms: MediaBuyerPlatform[] = account.data?.platform === "google" || account.data?.platform === "meta" ? [account.data.platform] : [];
      const system = landingAuditPrompt({ platforms, guidelines: mediaBuyerGuidelines(guidelines.data ?? []), accountBaseline: JSON.stringify(baseline.data), businessProfile: JSON.stringify({ currency: account.data?.currency ?? null, timezone: account.data?.timezone ?? null }) });
      const raw = await freeChat("media-buyer-page-audit", [{ role: "system", content: system }, { role: "user", content: JSON.stringify({ page: evidence, adCopy: null, keywords: null, searchTerms: null }) }], { json: true, maxTokens: 2400, timeoutMs: 15000, budgetMs: 18000, attempts: 1 });
      const parsed = contentAuditSchema.parse(parseJson(raw));
      if (new Set(parsed.checks.map((c) => c.category)).size !== 10) throw new Error("Incomplete checklist");
      // Never turn model observations into recommendations or proof that tracking/layout works.
      content["checks"] = parsed.checks; limitations.push(...parsed.limitations);
    } else limitations.push("التوصيات وخطوات الإصلاح متوقفة حتى يتوفر أساس حساب جاهز وحديث وموثّق.");
  } catch { limitations.push("الصفحة أو الفحص غير متاح؛ أرسل HTML أو لقطة شاشة أو وصفاً. لم تُؤكّد صلاحية الصفحة."); }
  content["limitations"] = limitations;
  const { error } = await client.from("landing_page_audits").insert({ workspace_id: page.workspace_id, ad_account_id: page.ad_account_id, landing_page_id: page.id, device, psi: psi as Json, content_analysis: content as Json, tracking_findings: tracking as Json, scores: {}, confidence: "low", limitations });
  if (error) throw new Error("تعذّر حفظ فحص الصفحة.");
  return { saved: true, limitations };
}

const destinations = z.object({ finalUrls: z.array(z.string()).max(50).optional(), expandedFinalUrls: z.array(z.string()).max(50).optional(), destinationUrl: z.string().optional() });
/** Explicit internal metadata only; never regex-mine arbitrary names or metric values for URLs. */
export async function discoverSavedPages(client: Client, workspaceId: string, accountId: string, platform: string, offset: number) {
  const { data: rows, error } = await client.from("campaign_snapshots").select("id,level,breakdowns").eq("workspace_id", workspaceId).eq("ad_account_id", accountId).in("level", ["ad", "asset", "asset_group"]).order("id").range(offset, offset + 99);
  if (error) throw new Error("تعذّر قراءة وجهات الإعلانات.");
  let discovered = 0;
  for (const row of rows ?? []) {
    const metadata = z.object({ destinations }).safeParse(row.breakdowns); if (!metadata.success) continue;
    const input = metadata.data.destinations;
    const urls = [...(input.finalUrls ?? []).map((url) => ({ url, source: row.level === "ad" ? "ad_final_url" : "asset" })), ...(input.expandedFinalUrls ?? []).map((url) => ({ url, source: "expanded_url" })), ...(input.destinationUrl ? [{ url: input.destinationUrl, source: "ad_final_url" }] : [])];
    for (const item of urls) {
      let url: string; try { url = normalizeAdPage(item.url); } catch { continue; }
      const { error: writeError } = await client.from("landing_pages").upsert({ workspace_id: workspaceId, ad_account_id: accountId, url_normalized: url, platforms: [platform], source: item.source, last_seen: new Date().toISOString() }, { onConflict: "ad_account_id,url_normalized" });
      if (writeError) throw new Error("تعذّر حفظ وجهة الإعلان."); discovered++;
    }
  }
  return { discovered, nextOffset: rows?.length === 100 ? offset + 100 : null, liveSync: false };
}