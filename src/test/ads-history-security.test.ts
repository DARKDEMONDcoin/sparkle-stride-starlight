import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn }; return chain;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { getAdsHistory } from "@/lib/ads/history.functions";
type Handler = (args: { data: Record<string, unknown>; context: unknown }) => Promise<unknown>;
function context(owner: boolean, accounts: unknown[]) {
  const query = (result: unknown) => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: result, error: null }), maybeSingle: vi.fn().mockResolvedValue({ data: result, error: null }) });
  const from = vi.fn((table: string) => table === "workspaces" ? query(owner ? { id: "w" } : null) : query(accounts));
  return { supabase: { from }, userId: "user" };
}
describe("campaign dashboard owner isolation", () => {
  it("rejects nonowners before reading ad accounts", async () => {
    const ctx = context(false, []);
    await expect((getAdsHistory as unknown as Handler)({ data: { workspaceId: "w", days: 90 }, context: ctx })).rejects.toThrow("Forbidden");
    expect(ctx.supabase.from).toHaveBeenCalledTimes(1);
  });
  it("rejects accounts outside the verified workspace before reading history", async () => {
    const ctx = context(true, [{ id: "own" }]);
    await expect((getAdsHistory as unknown as Handler)({ data: { workspaceId: "w", accountId: "other", days: 90 }, context: ctx })).rejects.toThrow("Forbidden");
    expect(ctx.supabase.from).not.toHaveBeenCalledWith("campaign_snapshots");
  });
  it("does not invent campaigns or totals when there are no accounts", async () => {
    const ctx = context(true, []);
    const result = await (getAdsHistory as unknown as Handler)({ data: { workspaceId: "w", days: 90 }, context: ctx });
    expect(result).toMatchObject({ account: null, campaigns: [], entities: [], timeline: [], summary: { included: 0, cpa: null } });
    expect(ctx.supabase.from).not.toHaveBeenCalledWith("campaign_snapshots");
  });
});