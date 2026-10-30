import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeBrandUrl, sectionSchemas, type BrandSectionKey, type BrandSnapshot } from "./brand-brain";
const scope = z.object({ workspaceId: z.string().uuid() });
export const getBrandBrain = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => scope.parse(v)).handler(async ({ data, context }): Promise<BrandSnapshot> => {
  const { data: owned, error: ownershipError } = await context.supabase.from("workspaces").select("id").eq("id", data.workspaceId).eq("owner_id", context.userId).maybeSingle();
  if (ownershipError || !owned) throw new Error("عقل العلامة متاح لمالك مساحة العمل فقط.");
  const { data: brain, error } = await context.supabase.from("brand_brain").select("website,sections,revision,history").eq("workspace_id", data.workspaceId).maybeSingle();
  if (error) throw new Error(error.message);
  const { data: job, error: jobError } = await context.supabase.from("brand_scan_jobs").select("id,workspace_id,website,status,stage,stages,sources,error,error_status,updated_at,lease_until").eq("workspace_id", data.workspaceId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (jobError) throw new Error(jobError.message);
  const mapped = job as unknown as BrandSnapshot["job"];
  if (mapped && ((mapped.status === "running" && mapped.lease_until && new Date(mapped.lease_until).getTime() < Date.now()) || (mapped.status === "queued" && Date.now() - new Date(mapped.updated_at).getTime() > 120000))) {
    mapped.status = "failed"; mapped.error = "انتهت مهلة تشغيل المرحلة. نتائجك محفوظة؛ أعد المحاولة.";
    mapped.stages = mapped.stages.map((stage, i) => i === mapped.stage ? { ...stage, state: "failed", error: mapped.error ?? "" } : stage);
  }
  return { website: brain?.website ?? "", sections: (brain?.sections ?? {}) as BrandSnapshot["sections"], revision: brain?.revision ?? 0, history: (brain?.history ?? []) as BrandSnapshot["history"], job: mapped };
});
const change = scope.extend({ operation: z.enum(["enqueue", "save", "undo", "retry", "review"]), website: z.string().max(300).optional(), section: z.enum(["business", "audience", "voice", "identity"]).optional(), replace: z.boolean().optional(), revision: z.number().int().nonnegative().optional(), data: z.unknown().optional(), jobId: z.string().uuid().optional(), field: z.string().max(80).optional(), accept: z.boolean().optional() });
export const changeBrandBrain = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => change.parse(v)).handler(async ({ data, context }) => {
  const { data: owned, error } = await context.supabase.from("workspaces").select("id").eq("id", data.workspaceId).eq("owner_id", context.userId).maybeSingle();
  if (error || !owned) throw new Error("هذا التعديل متاح لمالك مساحة العمل فقط.");
  const payload: Record<string, unknown> = { ...data };
  if (data.operation === "enqueue") { const url = normalizeBrandUrl(data.website ?? ""); if (!url) throw new Error("أدخل رابط موقع عام صالح يبدأ بـ https."); payload["website"] = url; }
  if (data.operation === "save") { if (!data.section || data.revision === undefined) throw new Error("بيانات الحفظ غير مكتملة."); payload["data"] = sectionSchemas[data.section as BrandSectionKey].parse(data.data); }
  if (data.operation === "undo" && data.revision === undefined) throw new Error("بيانات التراجع غير مكتملة.");
  if (data.operation === "retry" && !data.jobId) throw new Error("عملية الفحص غير موجودة.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (data.operation === "review") {
    if (!data.section || !data.field || data.accept === undefined || data.revision === undefined) throw new Error("بيانات المراجعة غير مكتملة.");
    if (!(data.field in sectionSchemas[data.section].shape)) throw new Error("الحقل غير صالح.");
    const reviewed = await supabaseAdmin.rpc("brand_review_field", { _owner: context.userId, _workspace: data.workspaceId, _section: data.section, _field: data.field, _accept: data.accept, _revision: data.revision });
    if (reviewed.error) throw new Error(reviewed.error.message); return { result: reviewed.data };
  }
  const result = await supabaseAdmin.rpc("brand_owner_call", { _owner: context.userId, _operation: data.operation, _payload: payload as never });
  if (result.error) throw new Error(result.error.message);
  return { result: result.data };
});