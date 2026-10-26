import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { verifiedWorkspace } from "./settings.functions";
import { ownedAccount } from "./drafts.functions";
import type { AssetFile, IntakeAnswers } from "./intake";

/** Owner asset uploads for campaign planning: stored privately under the workspace prefix, metadata kept in the business profile. */
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED: Record<string, AssetFile["kind"]> = {
  "image/png": "image", "image/jpeg": "image", "image/webp": "image",
  "video/mp4": "video", "video/webm": "video", "video/quicktime": "video",
};
const kindSchema = z.enum(["logo", "image", "video", "other"]);
const uploadSchema = z.object({
  workspaceId: z.string().uuid(),
  accountId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  contentType: z.string().trim().max(80),
  kind: kindSchema,
  dataBase64: z.string().max(Math.ceil(MAX_BYTES * 1.4)),
});

async function profileRow(client: Parameters<typeof verifiedWorkspace>[0], workspaceId: string, accountId: string) {
  const { data } = await client.from("business_profiles").select("id,answers").eq("workspace_id", workspaceId).eq("ad_account_id", accountId).limit(1).maybeSingle();
  if (!data) throw new Error("أكمل ملف النشاط واحفظه أولاً.");
  return data;
}

export const uploadAdsAsset = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => uploadSchema.parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const account = await ownedAccount(context.supabase, data.workspaceId, data.accountId);
    const mimeKind = ALLOWED[data.contentType];
    if (!mimeKind) throw new Error("نوع الملف غير مدعوم؛ ارفع صورة (PNG/JPG/WebP) أو فيديو (MP4/WebM/MOV).");
    if (data.kind === "logo" && mimeKind !== "image") throw new Error("الشعار يجب أن يكون صورة.");
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    if (!bytes.length || bytes.length > MAX_BYTES) throw new Error("حجم الملف يتجاوز 10 ميجابايت.");
    const profile = await profileRow(context.supabase, data.workspaceId, account.id);
    const answers = (profile.answers ?? {}) as IntakeAnswers;
    const files = answers.assetFiles ?? [];
    if (files.length >= 30) throw new Error("وصلت للحد الأقصى من الأصول المرفوعة (30).");
    const id = crypto.randomUUID();
    const safeName = data.name.replace(/[^\w.؀-ۿ-]+/g, "-").slice(-60);
    const path = `${data.workspaceId}/ads/assets/${account.id}/${id}-${safeName}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const up = await supabaseAdmin.storage.from("nour-media").upload(path, bytes, { contentType: data.contentType });
    if (up.error) throw new Error("تعذّر رفع الملف.");
    const file: AssetFile = { id, path, name: data.name, contentType: data.contentType, size: bytes.length, kind: data.kind === "other" ? mimeKind : data.kind, uploadedAt: new Date().toISOString() };
    const { error } = await supabaseAdmin.from("business_profiles").update({ answers: { ...answers, assetFiles: [...files, file] } as unknown as Json }).eq("id", profile.id);
    if (error) { await supabaseAdmin.storage.from("nour-media").remove([path]); throw new Error("تعذّر حفظ بيانات الملف."); }
    return { file };
  });

export const deleteAdsAsset = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid(), accountId: z.string().uuid(), assetId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await verifiedWorkspace(context.supabase, context.userId, data.workspaceId);
    const account = await ownedAccount(context.supabase, data.workspaceId, data.accountId);
    const profile = await profileRow(context.supabase, data.workspaceId, account.id);
    const answers = (profile.answers ?? {}) as IntakeAnswers;
    const files = answers.assetFiles ?? [];
    const target = files.find((f) => f.id === data.assetId);
    if (!target) throw new Error("الملف غير موجود.");
    if (!target.path.startsWith(`${data.workspaceId}/ads/assets/${account.id}/`)) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.storage.from("nour-media").remove([target.path]);
    const { error } = await supabaseAdmin.from("business_profiles").update({ answers: { ...answers, assetFiles: files.filter((f) => f.id !== data.assetId) } as unknown as Json }).eq("id", profile.id);
    if (error) throw new Error("تعذّر حذف الملف.");
    return { deleted: true };
  });
