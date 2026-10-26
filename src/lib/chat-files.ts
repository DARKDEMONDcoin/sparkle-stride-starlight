/** قواعد مستندات المحادثة المشتركة بين المتصفح والخادم. */
export const CHAT_FILE_MAX_BYTES = 20 * 1024 * 1024;
export const CHAT_FILE_MAX_PER_MESSAGE = 5;
export const CHAT_FILE_DAILY_LIMIT = 60;
export const CHAT_FILE_ACCEPT = ".pdf,.docx,.doc,.xlsx,.xls,.csv";
export const CHAT_FILE_BUCKET = "chat-attachments";

export type ChatFileKind = "pdf" | "word" | "excel";
export type ChatFileStatus = "uploading" | "processing" | "ready" | "failed";

const EXT_KIND: Record<string, ChatFileKind> = {
  pdf: "pdf",
  docx: "word",
  doc: "word",
  xlsx: "excel",
  xls: "excel",
  csv: "excel",
};

export const chatFileExt = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
export const chatFileKind = (name: string): ChatFileKind | null => EXT_KIND[chatFileExt(name)] ?? null;

/** يعيد رسالة خطأ عربية واضحة، أو null إن كان الملف مقبولاً. */
export function chatFileError(file: { name: string; size: number }): string | null {
  if (!chatFileKind(file.name)) return `«${file.name}»: الصيغ المدعومة PDF وWord وExcel وCSV فقط.`;
  if (!file.size) return `«${file.name}»: الملف فارغ.`;
  if (file.size > CHAT_FILE_MAX_BYTES) return `«${file.name}»: الحجم يتجاوز 20 م.ب.`;
  if (/[\u0000-\u001f]/.test(file.name) || file.name.length > 200) return "اسم الملف غير صالح.";
  return null;
}

/** اسم آمن للتخزين يحافظ على الامتداد (الاسم العربي الأصلي يُحفظ في الجدول). */
export function chatFileStorageName(name: string) {
  const ext = chatFileExt(name);
  return `${crypto.randomUUID()}.${ext}`;
}

export const humanFileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`
    : `${Math.max(1, Math.round(bytes / 1024))} ك.ب`;
