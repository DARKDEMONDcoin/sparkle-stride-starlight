import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Bounded saved-outcome review. With ingestion held, never declare causal winners from partial data. */
export async function reviewSavedOutcomes(client: SupabaseClient<Database>, workspaceId: string, accountId: string) {
  const { data: due, error } = await client.from("change_outcomes").select("id,review_after,success_metric,pre_snapshot").eq("workspace_id", workspaceId).eq("ad_account_id", accountId).is("evaluated_at", null).lte("review_after", new Date().toISOString()).order("review_after").limit(3);
  if (error) throw new Error("تعذّر قراءة مواعيد تقييم التغييرات.");
  let reviewed = 0;
  for (const outcome of due ?? []) {
    const { data: saved, error: saveError } = await client.rpc("ads_record_outcome", { p_outcome_id: outcome.id, p_workspace_id: workspaceId, p_account_id: accountId, p_classification: "inconclusive", p_learning: "لا يمكن الحكم على نتيجة التغيير دون بيانات موثقة ناضجة وفترات متكافئة؛ لا يُعامل التغيير كنجاح أو فشل.", p_evaluation: { reason: "verified_comparable_history_unavailable", successMetric: outcome.success_metric, providerOnHold: true, reviewAfter: outcome.review_after } });
    if (saveError) throw new Error("تعذّر حفظ نتيجة المراجعة.");
    if (saved) reviewed += 1;
  }
  return { reviewed, automaticSchedule: false };
}