/** قواعد فيديوهات الإعلانات — آمنة للمتصفح، بلا أسرار ولا وصول للخادم. */

export type VideoLike = { status: "generating" | "pending" | "approved" | "rejected" | "failed" };

/** حدود التوليد لكل نص إعلاني: فيديو واحد قيد التوليد، وأربعة فيديوهات غير فاشلة كحد أقصى. */
export const VIDEO_LIMITS = { maxPerCreative: 4 } as const;

export function canStartVideo(videos: VideoLike[]): { ok: boolean; reason?: string } {
  if (videos.some((v) => v.status === "generating")) return { ok: false, reason: "يوجد فيديو قيد التوليد لهذا النص؛ انتظر اكتماله." };
  if (videos.filter((v) => v.status !== "failed").length >= VIDEO_LIMITS.maxPerCreative) return { ok: false, reason: "وصلت للحد الأقصى من الفيديوهات لهذا النص." };
  return { ok: true };
}

/** المدد المسموحة بالثواني لفيديو الإعلان القصير. */
export const VIDEO_DURATIONS = [5, 8, 10] as const;
