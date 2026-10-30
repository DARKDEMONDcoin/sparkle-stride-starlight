import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeBrandUrl, sectionSchemas, type BrandSectionKey, type BrandSnapshot } from "./brand-brain";
const scope = z.object({ workspaceId: z.string().uuid() });
export const getBrandBrain = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => scope.parse(v)).handler(async ({ data, context }): Promise<BrandSnapshot> => {
  const { data: brain, error } = await context.supabase.from("brand_brain").select("website,sections,revision,history").eq("workspace_id", data.workspaceId).maybeSingle();
  if (error) throw new Error(error.message);
  const { data: job, error: jobError } = await context.supabase.from("brand_scan_jobs").select("id,workspace_id,website,status,stage,stages,sources,error,error_status,updated_at,lease_until").eq("workspace_id", data.workspaceId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (jobError) throw new Error(jobError.message);
  return { website: brain?.website ?? "", sections: (brain?.sections ?? {}) as BrandSnapshot["sections"], revision: brain?.revision ?? 0, history: (brain?.history ?? []) as unknown[], job: job as unknown as BrandSnapshot["job"] };
});
const change = scope.extend({ operation: z.enum(["enqueue", "save", "undo", "retry"]), website: z.string().max(300).optional(), section: z.enum(["business", "audience", "voice", "identity"]).optional(), replace: z.boolean().optional(), revision: z.number().int().nonnegative().optional(), data: z.unknown().optional(), jobId: z.string().uuid().optional() });
export const changeBrandBrain = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => change.parse(v)).handler(async ({ data, context }) => {
  const { data: owned, error } = await context.supabase.from("workspaces").select("id").eq("id", data.workspaceId).eq("owner_id", context.userId).maybeSingle();
  if (error || !owned) throw new Error("هذا التعديل متاح لمالك مساحة العمل فقط.");
  const payload: Record<string, unknown> = { ...data };
  if (data.operation === "enqueue") { const url = normalizeBrandUrl(data.website ?? ""); if (!url) throw new Error("أدخل رابط موقع عام صالح يبدأ بـ https."); payload.website = url; }
  if (data.operation === "save") { if (!data.section || data.revision === undefined) throw new Error("بيانات الحفظ غير مكتملة."); payload.data = sectionSchemas[data.section as BrandSectionKey].parse(data.data); }
  if (data.operation === "undo" && data.revision === undefined) throw new Error("بيانات التراجع غير مكتملة.");
  if (data.operation === "retry" && !data.jobId) throw new Error("عملية الفحص غير موجودة.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.rpc("brand_owner_call", { _owner: context.userId, _operation: data.operation, _payload: payload as never });
  if (result.error) throw new Error(result.error.message);
  return { result: result.data };
});