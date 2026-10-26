import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { verifiedWorkspace } from "./settings.functions";
import { canTransition, judgeExperiment, testBudgetAllowed, type ExperimentStatus, type SuccessCriteria } from "./experiments";

const ids = { workspaceId: z.string().uuid() };
const criteria = z.object({ metric: z.enum(["cpa", "roas", "ctr", "cvr"]), direction: z.enum(["lower", "higher"]), minLiftPct: z.number().min(1).max(100), minConversions: z.number().int().min(10).max(10000) });

export const listExperiments = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ ...ids, accountId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const [{ data: rows, error }, { data: concepts }, { data: s }] = await Promise.all([
      context.supabase.from("experiments").select("id,hypothesis,variable_tested,success_criteria,planned_sample_or_duration,start_date,end_date,status,result_summary,created_at").eq("workspace_id", data.workspaceId).eq("ad_account_id", data.accountId).order("created_at", { ascending: false }).limit(50),
      context.supabase.from("creative_concepts").select("id,persona,angle,offer,hook,hypothesis,status").eq("workspace_id", data.workspaceId).eq("ad_account_id", data.accountId).order("created_at", { ascending: false }).limit(60),
      context.supabase.from("employee_learning_settings").select("experiment_percent").eq("workspace_id", data.workspaceId).maybeSingle(),
    ]);
    if (error) throw new Error("تعذّر تحميل التجارب.");
    return { experiments: rows ?? [], concepts: concepts ?? [], experimentPercent: s?.experiment_percent ?? 15 };
  });

export const planExperiment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ ...ids, accountId: z.string().uuid(), hypothesis: z.string().trim().min(10).max(500), variable: z.string().trim().min(2).max(120), criteria, days: z.number().int().min(7).max(60), testDaily: z.number().positive(), accountDaily: z.number().positive() }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: s } = await context.supabase.from("employee_learning_settings").select("experiment_percent").eq("workspace_id", data.workspaceId).maybeSingle();
    const pct = s?.experiment_percent ?? 15;
    if (!testBudgetAllowed(data.testDaily, data.accountDaily, pct)) throw new Error(`ميزانية التجربة تتجاوز ${pct}% من الميزانية اليومية المسموح بها للتجارب.`);
    const { error } = await context.supabase.from("experiments").insert({ workspace_id: data.workspaceId, ad_account_id: data.accountId, hypothesis: data.hypothesis, variable_tested: data.variable, success_criteria: data.criteria as unknown as Json, planned_sample_or_duration: { days: data.days, testDaily: data.testDaily, accountDaily: data.accountDaily, experimentPercent: pct } });
    if (error) throw new Error("تعذّر حفظ التجربة.");
    return { saved: true };
  });

export const moveExperiment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ ...ids, experimentId: z.string().uuid(), to: z.enum(["running", "completed", "cancelled"]), result: z.object({ control: z.object({ value: z.number().nonnegative(), conversions: z.number().int().nonnegative() }), variant: z.object({ value: z.number().nonnegative(), conversions: z.number().int().nonnegative() }) }).optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: exp } = await context.supabase.from("experiments").select("id,status,success_criteria").eq("workspace_id", data.workspaceId).eq("id", data.experimentId).maybeSingle();
    if (!exp || !canTransition(exp.status as ExperimentStatus, data.to)) throw new Error("لا يمكن نقل التجربة لهذه الحالة.");
    const today = new Date().toISOString().slice(0, 10);
    const patch: Record<string, unknown> = { status: data.to };
    if (data.to === "running") patch["start_date"] = today;
    if (data.to !== "running") patch["end_date"] = today;
    if (data.to === "completed") {
      if (!data.result) throw new Error("أدخل نتائج المجموعتين لإنهاء التجربة.");
      const outcome = judgeExperiment(exp.success_criteria as unknown as SuccessCriteria, data.result.control, data.result.variant);
      patch["result_summary"] = { ...data.result, outcome, judgedAt: new Date().toISOString(), source: "owner_entered" };
    }
    const { error } = await context.supabase.from("experiments").update(patch as never).eq("id", exp.id).eq("status", exp.status);
    if (error) throw new Error("تعذّر تحديث التجربة.");
    return { saved: true };
  });
