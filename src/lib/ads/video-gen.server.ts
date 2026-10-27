/**
 * توليد فيديوهات إعلانية عبر بوابة Lovable AI (نموذج google/gemini-omni-1.1-flash).
 * التوليد مهمة غير متزامنة: إنشاء المهمة ← استطلاع الحالة ← تنزيل MP4 وتخزينه
 * فور اكتماله (رابط التنزيل قصير العمر والمهمة تنتهي خلال ~48 ساعة).
 * المفتاح يبقى في الخادم فقط ولا يصل المتصفح.
 */

const GATEWAY = "https://ai.gateway.lovable.dev";
const MODEL = "google/gemini-omni-1.1-flash";

export type VideoJob = {
  id: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  progress?: number;
  error?: { code: string; message: string };
};

export class VideoGatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiKey(): Promise<string> {
  const { providerKeys } = await import("@/lib/provider-keys.server");
  const { lovable } = await providerKeys();
  if (!lovable) throw new VideoGatewayError(401, "مفتاح بوابة الذكاء الاصطناعي غير مُعدّ.");
  return lovable;
}

async function jobResponse(res: Response): Promise<VideoJob> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new VideoGatewayError(res.status, body?.message ?? `تعذّر طلب الفيديو (${res.status}).`);
  }
  return (await res.json()) as VideoJob;
}

/** إنشاء مهمة فيديو: نص→فيديو، أو صورة→فيديو عند تمرير صورة معتمدة كإطار أول. */
export async function createVideoJob(input: {
  prompt: string;
  aspectRatio: "16:9" | "9:16";
  durationSeconds: number;
  startImage?: { dataBase64: string; mimeType: string };
}): Promise<VideoJob> {
  const key = await apiKey();
  const parts: Record<string, unknown>[] = [{ type: "text", text: input.prompt }];
  if (input.startImage) parts.push({ type: "image", data: input.startImage.dataBase64, mime_type: input.startImage.mimeType });
  return jobResponse(
    await fetch(`${GATEWAY}/v1/videos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        input: input.startImage ? parts : input.prompt,
        response_format: {
          type: "video",
          resolution: "720p",
          duration: `${input.durationSeconds}s`,
          aspect_ratio: input.aspectRatio,
        },
      }),
    }),
  );
}

/** استطلاع حالة مهمة قائمة. */
export async function pollVideoJob(id: string): Promise<VideoJob> {
  const key = await apiKey();
  return jobResponse(
    await fetch(`${GATEWAY}/v1/videos/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${key}` },
    }),
  );
}

/** تنزيل MP4 لمهمة مكتملة — يتبع إعادة التوجيه تلقائياً. يجب التخزين فوراً قبل انتهاء الرابط. */
export async function downloadVideo(id: string): Promise<Uint8Array> {
  const key = await apiKey();
  const res = await fetch(`${GATEWAY}/v1/videos/${encodeURIComponent(id)}/content`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new VideoGatewayError(res.status, `تعذّر تنزيل الفيديو (${res.status}).`);
  return new Uint8Array(await res.arrayBuffer());
}
