import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { ADS_DEFAULTS, apiLifecycleHealth, validApiVersion } from "./config";

export async function verifiedWorkspace(client: SupabaseClient<Database>, userId: string, id: string) {
  const { data, error } = await client.from("workspaces").select("id,owner_id").eq("id", id).eq("owner_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: لا تملك مساحة العمل هذه.");
  return data.id;
}

export const getAdsSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const workspaceId = await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: settings, error } = await context.supabase.from("ad_guardrails").select("daily_audit,baseline_freshness_days,new_account_min_days,new_account_min_conversions").eq("workspace_id", workspaceId).maybeSingle();
    if (error) throw new Error(error.message);
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("ads_is_admin");
    if (roleError) throw new Error(roleError.message);
    return { dailyAudit: settings?.daily_audit ?? ADS_DEFAULTS.dailyAudit, isAdmin: isAdmin === true };
  });

export const saveAdsAuditPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid(), enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const workspaceId = await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { error } = await context.supabase.from("ad_guardrails").upsert({ workspace_id: workspaceId, daily_audit: data.enabled }, { onConflict: "workspace_id" });
    if (error) throw new Error(error.message);
    return { dailyAudit: data.enabled };
  });

export const adsApiHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("ads_is_admin");
    if (roleError) throw new Error(roleError.message);
    if (isAdmin !== true) throw new Error("Forbidden: فحص الإصدارات متاح لمسؤول المنصة فقط.");
    const { data: rows, error } = await context.supabase.from("ads_api_versions").select("*");
    if (error) throw new Error(error.message);
    return (rows ?? []).map((row) => {
      const platform = row.platform === "google" ? "google" : "meta";
      const configured = (platform === "google" ? process.env["GOOGLE_ADS_API_VERSION"] : process.env["META_MARKETING_API_VERSION"]) ?? row.version;
      return { platform, configured, valid: validApiVersion(platform, configured), releasedAt: row.released_at, sunsetAt: row.sunset_at, sunsetMonth: row.sunset_month, precision: row.sunset_precision, source: row.source_url, verifiedAt: row.verified_at, notes: row.notes, ...apiLifecycleHealth({ configured, registered: row.version, sunsetAt: row.sunset_at, sunsetMonth: row.sunset_month, precision: row.sunset_precision }) };
    });
  });