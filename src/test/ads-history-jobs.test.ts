import { describe, expect, it, vi } from "vitest";
import { runHistoryChunk, type HistoryJobDependencies } from "@/lib/ads/history-jobs.server";
function dependencies(available = true): HistoryJobDependencies {
  return { available, now: () => 0, claim: vi.fn().mockResolvedValue({ leaseToken: "token", cursor: { window: 0, page: null } }), checkpoint: vi.fn().mockResolvedValue(true), process: vi.fn().mockResolvedValue({ nextCursor: null }) };
}
describe("resumable history job safety", () => {
  it("persists a held provider pause without processing any unit", async () => {
    const deps = dependencies(false);
    expect((await runHistoryChunk("2026-10-25", deps)).status).toBe("paused");
    expect(deps.process).not.toHaveBeenCalled();
    expect(deps.checkpoint).toHaveBeenCalledWith("token", { window: 0, page: null }, expect.anything(), "paused", "provider_on_hold");
  });
  it("does no work when another worker owns the lease", async () => {
    const deps = dependencies(); deps.claim = vi.fn().mockResolvedValue(null);
    expect((await runHistoryChunk("2026-10-25", deps)).status).toBe("not_claimed");
    expect(deps.process).not.toHaveBeenCalled();
  });
  it("processes a bounded batch and checkpoints the next window", async () => {
    const deps = dependencies();
    expect((await runHistoryChunk("2026-10-25", deps)).processed).toBe(3);
    expect(deps.checkpoint).toHaveBeenCalledWith("token", { window: 3, page: null }, expect.objectContaining({ completed: 3 }), "queued", null);
  });
  it("resumes from the stored window and pagination cursor", async () => {
    const deps = dependencies(); deps.claim = vi.fn().mockResolvedValue({ leaseToken: "token", cursor: { window: 2, page: "page2" } });
    await runHistoryChunk("2026-10-25", deps);
    expect(deps.process).toHaveBeenNthCalledWith(1, expect.objectContaining({ since: "2026-08-10" }), "page2");
  });
  it("stops after the 20-second work budget", async () => {
    const deps = dependencies(); let elapsed = 0; deps.now = () => elapsed;
    deps.process = vi.fn(async () => { elapsed += 20_000; return { nextCursor: null }; });
    expect((await runHistoryChunk("2026-10-25", deps)).processed).toBe(1);
  });
  it("pauses on failure instead of retrying a provider denial", async () => {
    const deps = dependencies(); deps.process = vi.fn().mockRejectedValue(new Error("403 secret details"));
    expect((await runHistoryChunk("2026-10-25", deps)).status).toBe("paused");
    expect(deps.process).toHaveBeenCalledTimes(1);
    expect(deps.checkpoint).toHaveBeenCalledWith("token", expect.anything(), expect.anything(), "paused", "history_processing_failed");
  });
  it("does not report completion when the checkpoint lease is lost", async () => {
    const deps = dependencies(); deps.checkpoint = vi.fn().mockResolvedValue(false);
    expect((await runHistoryChunk("2026-10-25", deps)).status).toBe("lease_lost");
  });
});