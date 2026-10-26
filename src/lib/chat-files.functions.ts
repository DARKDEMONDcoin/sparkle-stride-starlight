import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CHAT_FILE_BUCKET, CHAT_FILE_DAILY_LIMIT, CHAT_FILE_MAX_BYTES, chatFileError } from "./chat-files";

/** يتحقق من الملف على الخادم ويستخرج نصه ويحدّث حالته. */
export const processChatAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("attachments")
      .select("id, user_id, file_name, size, storage_path, status")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error("المرفق غير موجود.");
    if (row.user_id !== userId || !row.storage_path.startsWith(`${userId}/`)) throw new Error("غير مسموح.");

    const fail = async (message: string) => {
      await supabase.from("attachments").update({ status: "failed", error: message }).eq("id", row.id);
      return { status: "failed" as const, error: message, summary: null };
    };

    const invalid = chatFileError({ name: row.file_name, size: row.size });
    if (invalid) {
      await supabase.storage.from(CHAT_FILE_BUCKET).remove([row.storage_path]);
      return fail(invalid);
    }

    if (row.status === "uploading") {
      const { data: hits } = await supabase.rpc("bump_rate_limit", {
        _bucket: "chat-file",
        _identifier: userId,
        _window_seconds: 86_400,
      });
      if (typeof hits === "number" && hits > CHAT_FILE_DAILY_LIMIT)
        return fail(`وصلت للحد اليومي (${CHAT_FILE_DAILY_LIMIT} ملفاً). حاول غداً.`);
    }

    await supabase.from("attachments").update({ status: "processing", error: null }).eq("id", row.id);
    const { data: blob, error: dlError } = await supabase.storage.from(CHAT_FILE_BUCKET).download(row.storage_path);
    if (dlError || !blob) return fail("لم يكتمل رفع الملف. أعد المحاولة.");
    if (blob.size > CHAT_FILE_MAX_BYTES) {
      await supabase.storage.from(CHAT_FILE_BUCKET).remove([row.storage_path]);
      return fail("الحجم يتجاوز 20 م.ب.");
    }

    const { extractChatFile, FileReadError } = await import("./chat-files.server");
    try {
      const out = await extractChatFile(row.file_name, new Uint8Array(await blob.arrayBuffer()));
      await supabase
        .from("attachments")
        .update({ status: "ready", extracted_text: out.text, summary: out.summary, error: null })
        .eq("id", row.id);
      return { status: "ready" as const, error: null, summary: out.summary };
    } catch (e) {
      console.warn("[chat-files] extract failed", e);
      return fail(e instanceof FileReadError ? e.message : "تعذّرت قراءة الملف. جرّب نسخة أخرى.");
    }
  });

/** رابط موقّع قصير العمر لفتح الملف أو تنزيله — لا روابط عامة أبداً. */
export const signChatAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), download: z.boolean().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("attachments")
      .select("storage_path, file_name")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("المرفق غير موجود.");
    const { data: signed, error } = await context.supabase.storage
      .from(CHAT_FILE_BUCKET)
      .createSignedUrl(row.storage_path, 300, data.download ? { download: row.file_name } : undefined);
    if (error || !signed) throw new Error("تعذّر فتح الملف.");
    return { url: signed.signedUrl };
  });

/** حذف مرفق لم يُرسل بعد (زر الإزالة). */
export const deleteChatAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("attachments")
      .select("storage_path, message_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!row || row.message_id) return { ok: false };
    await context.supabase.storage.from(CHAT_FILE_BUCKET).remove([row.storage_path]);
    await context.supabase.from("attachments").delete().eq("id", data.id);
    return { ok: true };
  });
