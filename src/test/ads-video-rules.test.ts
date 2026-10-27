import { describe, expect, it } from "vitest";
import { canStartVideo, VIDEO_LIMITS, type VideoLike } from "@/lib/ads/video-rules";

const v = (status: VideoLike["status"]): VideoLike => ({ status });

describe("canStartVideo", () => {
  it("allows the first video", () => {
    expect(canStartVideo([]).ok).toBe(true);
  });

  it("blocks while another video is still generating", () => {
    const r = canStartVideo([v("generating")]);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/قيد التوليد/);
  });

  it("blocks at the per-creative maximum, ignoring failed attempts", () => {
    const full = Array.from({ length: VIDEO_LIMITS.maxPerCreative }, () => v("approved"));
    expect(canStartVideo(full).ok).toBe(false);
    expect(canStartVideo([...full, v("failed"), v("failed")]).ok).toBe(false);
  });

  it("allows a new video when earlier ones failed or were rejected", () => {
    expect(canStartVideo([v("failed"), v("rejected"), v("approved")]).ok).toBe(true);
  });
});
