/**
 * وظائف خادمية لتبويب الاتصالات: سرد الحسابات المربوطة، بدء ربط جديد عبر
 * الموفّر المضبوط (Pipeboard افتراضياً)، وفصل الحسابات. كل نداء يتحقق من
 * ملكية مساحة العمل قبل أي قراءة أو كتابة.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifiedWorkspace } from "./settings.functions";
import {
  PROVIDER_CAPABILITIES,
  isAdProviderKind,
  providerLabel,
  providerConnectionReadiness,
  requireProviderConnection,
  resolveProvider,
  thirdPartyNotice,
  type AdProviderKind,
} from "./providers";
import type { AdPlatform } from "./provider";

const workspaceInput = z.object({ workspaceId: z.string().uuid() });
const platformInput = workspaceInput.extend({ platform: z.enum(["google", "meta"]) });

type ConnectionRow = {
  id: string;
  platform: string;
  method: string;
  provider: string | null;
  status: string;
  last_error: string | null;
  provider_error_kind: string | null;
  expires_at: string | null;
  created_at: string;
};

type AccountRow = {
  id: string;
  connection_id: string;
  external_id: string;
  name: string | null;
  currency: string | null;
  timezone: string | null;
  platform: string;
};

/** الموفّر الفعلي لكل منصة داخل المساحة: تجاوز مخزّن ثم متغيّر بيئة ثم Pipeboard. */
async function providerFor(
  client: Parameters<typeof verifiedWorkspace>[0],
  workspaceId: string,
  platform: AdPlatform,
): Promise<AdProviderKind> {
  const { data, error } = await client
    .from("ad_provider_configs")
    .select("provider")
    .eq("workspace_id", workspaceId)
    .eq("platform", platform)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const envValue = process.env[`AD_PROVIDER_${platform.toUpperCase()}`];
  return resolveProvider(platform, envValue, data?.provider ?? null);
}

export const getAdsConnections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => workspaceInput.parse(input))
  .handler(async ({ data, context }) => {
    const workspaceId = await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const [{ data: connections, error }, { data: accounts, error: accountsError }] = await Promise.all([
      context.supabase
        .from("ad_connections")
        .select("id,platform,method,provider,status,last_error,provider_error_kind,expires_at,created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("ad_accounts")
        .select("id,connection_id,external_id,name,currency,timezone,platform")
        .eq("workspace_id", workspaceId),
    ]);
    if (error) throw new Error(error.message);
    if (accountsError) throw new Error(accountsError.message);

    const platforms = await Promise.all(
      (["google", "meta"] as const).map(async (platform) => {
        const provider = await providerFor(context.supabase, workspaceId, platform);
        return {
          platform,
          provider,
          providerLabel: providerLabel(provider),
          capabilities: PROVIDER_CAPABILITIES[provider],
          readiness: providerConnectionReadiness(provider),
          notice: thirdPartyNotice(provider),
        };
      }),
    );

    return {
      platforms,
      connections: ((connections ?? []) as ConnectionRow[]).map((row) => ({
        ...row,
        accounts: ((accounts ?? []) as AccountRow[]).filter((a) => a.connection_id === row.id),
      })),
    };
  });

export const startAdsConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    platformInput.extend({ origin: z.string().url() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const workspaceId = await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const provider = await providerFor(context.supabase, workspaceId, data.platform);
    requireProviderConnection(provider);

    if (provider === "pipeboard") {
      const { pipeboardConfig, provisionUser, startOAuth, missingPipeboardConfigError } = await import(
        "./pipeboard.server"
      );
      const config = await pipeboardConfig();
      if (!config) throw missingPipeboardConfigError();
      const { userId } = await provisionUser(config, workspaceId);
      const { url } = await startOAuth(config, userId, data.platform);
      // سجل الاتصال يُنشأ بحالة «محدود» حتى يعود المالك ويظهر أول حساب فعلي.
      const { error } = await context.supabase.from("ad_connections").insert({
        workspace_id: workspaceId,
        platform: data.platform,
        method: "connector",
        provider: "pipeboard",
        status: "limited",
        scopes: [],
      });
      if (error) throw new Error(error.message);
      return { url, provider };
    }

    if (provider === "windsor") {
      throw new Error("ربط Windsor لم يُفعّل بعد — بدّل الموفّر أو استخدم Pipeboard.");
    }
    // الربط المباشر يحتاج مفاتيح OAuth الخاصة بالمنصة قبل تفعيله.
    const required =
      data.platform === "google"
        ? ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_ADS_DEVELOPER_TOKEN"]
        : ["META_APP_ID", "META_APP_SECRET"];
    const { getSecrets } = await import("../secrets.server");
    const found = await getSecrets(required);
    const missing = required.filter((name) => !found[name]);
    if (missing.length) {
      throw new Error(`الربط المباشر يحتاج مفاتيح غير مضبوطة بعد: ${missing.join(", ")}.`);
    }
    throw new Error("مسار OAuth المباشر قيد الإنشاء — استخدم Pipeboard مؤقتاً.");
  });

export const disconnectAdsConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    workspaceInput.extend({ connectionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const workspaceId = await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const { data: connection, error: readError } = await context.supabase
      .from("ad_connections")
      .select("id,provider,status")
      .eq("id", data.connectionId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!connection) throw new Error("الاتصال غير موجود في مساحتك.");

    // Removing account rows can cascade into history and does not revoke OAuth.
    // Preserve all evidence until provider revocation + non-destructive status exist.
    throw new Error("الفصل غير مفعّل حتى يكتمل إلغاء صلاحية الموفّر بأمان؛ لم تُحذف سجلات الحساب أو تاريخه.");
  });

/** قدرات الموفّر الحالي لمنصة — يقرأها الوكيل قبل اقتراح أي إجراء. */
export const getAdsProviderCapabilities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => platformInput.parse(input))
  .handler(async ({ data, context }) => {
    const workspaceId = await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const provider = await providerFor(context.supabase, workspaceId, data.platform);
    return { provider, capabilities: PROVIDER_CAPABILITIES[provider] };
  });
