import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { z } from "zod";
import { accountCalendarDay } from "./history";
import { baselineReport, baselineSourceSchema, CONTEXT_QUESTIONS } from "./baseline";

type Client = SupabaseClient<Database>;
const cursorSchema = z.object({ baselineId: z.string().uuid(), today: z.string().date(), since: z.string().date(), scanComplete: z.boolean().optional() });
export async function runBaselineReview(client: Client, workspaceId: string, accountId: string, jobId: string) {
  const { data, error } = await client.rpc("ads_claim_job", { p_job_id: jobId, p_workspace_id: workspaceId, p_account_id: accountId });
  if (error) throw new Error("تعذّر استئناف مراجعة البيانات.");
  const job = data?.[0];
  if (!job?.lease_token) return { status: "not_claimed" };
  const cursor = cursorSchema.parse(job.cursor);
  if (!cursor.scanComplete) {
    const { error: pageError } = await client.rpc("ads_baseline_page", { p_job_id: jobId, p_token: job.lease_token, p_baseline_id: cursor.baselineId, p_today: cursor.today, p_since: cursor.since });
    if (pageError) throw new Error("تعذّر حفظ جزء المراجعة؛ يمكن استئناف المهمة لاحقاً.");
    return { status: "queued" };
  }
  const sources: { payload: Json }[] = [];
  for (let offset = 0; offset < 3000; offset += 1000) {
    const { data: page, error: sourceError } = await client.from("ads_baseline_sources").select("payload").eq("baseline_id", cursor.baselineId).eq("workspace_id", workspaceId).eq("ad_account_id", accountId).order("id").range(offset, offset + 999);
    if (sourceError) throw new Error("تعذّر قراءة أدلة المراجعة.");
    sources.push(...(page ?? []));
    if ((page?.length ?? 0) < 1000) break;
  }
  const parsed = sources.map((source) => baselineSourceSchema.safeParse(source.payload));
  const rows = parsed.flatMap((row) => row.success ? [{ ...row.data, metrics: row.data.metrics ?? null, breakdowns: row.data.breakdowns ?? null }] : []);
  // Provider verification cannot be supplied by the browser or invented from cached metrics.
  const report = baselineReport({ rows, today: cursor.today, since: cursor.since, complete: parsed.every((row) => row.success) && sources.length < 3000, provenance: null });
  const { data: settings } = await client.from("ad_guardrails").select("new_account_min_days,new_account_min_conversions").eq("workspace_id", workspaceId).maybeSingle();
  const finalReport = settings ? baselineReport({ rows, today: cursor.today, since: cursor.since, complete: false, provenance: null, minDays: settings.new_account_min_days, minConversions: settings.new_account_min_conversions }) : report;
  const overlays: Json[] = [];
  for (const table of ["change_events", "user_context_notes", "account_learnings", "landing_pages", "landing_page_audits"] as const) {
    const { data: rows, error: readError } = await client.from(table).select("*").eq("workspace_id", workspaceId).eq("ad_account_id", accountId).limit(200);
    if (readError) throw new Error("تعذّر قراءة سياق الحساب.");
    overlays.push({ source: table, rows: rows ?? [], truncated: (rows?.length ?? 0) === 200 } as unknown as Json);
  }
  const { error: saveError } = await client.from("account_baselines").update({ ...finalReport, change_overlay: overlays, built_at: null, expires_at: null } as Database["public"]["Tables"]["account_baselines"]["Update"]).eq("id", cursor.baselineId).eq("workspace_id", workspaceId).eq("ad_account_id", accountId).eq("status", "building");
  if (saveError) throw new Error("تعذّر حفظ تقرير الحساب.");
  const { data: saved, error: checkpointError } = await client.rpc("ads_checkpoint_job", { p_job_id: jobId, p_lease_token: job.lease_token, p_cursor: job.cursor, p_progress: { completed: sources?.length ?? 0, total: sources?.length ?? 0 }, p_status: "paused", p_pause_reason: "verified_ingestion_required" });
  if (checkpointError || !saved) throw new Error("تعذّر تأكيد حفظ تقدم المراجعة.");
  return { status: "paused" };
}
export async function createBaselineReview(client: Client, workspaceId: string, accountId: string, timezone: string) {
  const today = accountCalendarDay(timezone);
  const since = new Date(Date.parse(today) - 90 * 86400000).toISOString().slice(0, 10);
  const { data: baseline, error } = await client.from("account_baselines").insert({ workspace_id: workspaceId, ad_account_id: accountId, context_questions: [...CONTEXT_QUESTIONS], limitations: ["الربط متوقف؛ مراجعة البيانات المحفوظة فقط."] }).select("id").single();
  if (error || !baseline) throw new Error("تعذّر بدء مراجعة الحساب.");
  const { data: job, error: jobError } = await client.from("ad_jobs").insert({ workspace_id: workspaceId, ad_account_id: accountId, kind: "baseline", dedupe_key: `baseline:${baseline.id}`, cursor: { baselineId: baseline.id, today, since }, progress: { completed: 0, total: 3000 } }).select("id").single();
  if (jobError || !job) throw new Error("تعذّر حفظ مهمة المراجعة.");
  return { baselineId: baseline.id, jobId: job.id };
}
/** Until step 5 adds structured evidence-grounded generation, return only deterministic reviewed evidence. */
export async function abdullahEvidenceReply(client: Client, workspaceId: string): Promise<string> {
  const { data: accounts, error } = await client.from("ad_accounts").select("id,name,external_id").eq("workspace_id", workspaceId).limit(2);
  if (error) throw new Error("تعذّر التحقق من بيانات الحساب؛ لن أقدّم توصيات دون أدلة.");
  if (!accounts?.length) return "لا يوجد حساب إعلاني محفوظ في هذه المساحة، وربط Pipeboard متوقف. لن أقدّم توصيات أو مسودات حملات بلا بيانات موثقة. هل لديك تقارير سابقة أو بيانات متجر أو CRM يمكن مراجعتها؟";
  if (accounts.length > 1) return "توجد عدة حسابات إعلانية. حدّد الحساب الذي تريد مراجعته في صفحة أساس الحساب؛ لن أختار حساباً أو أقدّم توصيات تلقائياً.";
  const account = accounts[0];
  if (!account) throw new Error("الحساب غير متاح.");
  const { data: baseline, error: baselineError } = await client.from("account_baselines").select("status,limitations,context_questions,data_quality").eq("workspace_id", workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (baselineError) throw new Error("تعذّر التحقق من أساس الحساب.");
  const strings = (value: unknown) => z.array(z.string()).safeParse(value);
  const limitations = strings(baseline?.limitations);
  const questions = strings(baseline?.context_questions);
  const { data: recommendations, error: recError } = await client.from("recommendations").select("title,rationale,status,success_metric,review_after_date").eq("workspace_id", workspaceId).eq("ad_account_id", account.id).eq("employee_id", "abdullah").order("created_at", { ascending: false }).limit(3);
  if (recError) throw new Error("تعذّر قراءة التوصيات المحفوظة.");
  const saved = (recommendations ?? []).map((rec) => `مقترح محفوظ — ${rec.title}\n${rec.rationale}\nالحالة: ${rec.status} · مقياس النجاح: ${rec.success_metric ?? "غير محدد"} · المراجعة: ${rec.review_after_date ?? "غير محددة"}\nهذا عرض لسجل سابق، وليس توصية جديدة أو تأكيداً لصلاحية تنفيذه.`);
  return [`جارٍ تعلّم حسابك: ${account.name ?? account.external_id}.`, "مراجعة البيانات المحفوظة لا تعني اكتمال الأدلة؛ لن أقدّم توصيات أو تغييرات أو مسودات حملات حتى تكتمل المراجعة الموثقة.", ...(limitations.success ? limitations.data.slice(0, 4) : ["ابدأ مراجعة البيانات المحفوظة في صفحة أساس الحساب."]), ...saved, ...(questions.success ? questions.data.slice(0, 5) : [...CONTEXT_QUESTIONS])].join("\n\n");
}