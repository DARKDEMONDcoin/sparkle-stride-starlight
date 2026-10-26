import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => { const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn }; return chain; } }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { getAdsReview, runAdsAnalysis, reviewAdsRecommendation, executeAdsRecommendation } from "@/lib/ads/recommendations.functions";
type Handler = (input: { data: unknown; context: unknown }) => Promise<unknown>;
describe("Media Buyer review ownership", () => {
  it.each([getAdsReview, runAdsAnalysis, reviewAdsRecommendation, executeAdsRecommendation])("rejects non-owner workspaces before any evidence or provider access", async (fn) => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    const client = { from: vi.fn().mockReturnValue(query) };
    await expect((fn as unknown as Handler)({ data: { workspaceId: "other", accountId: "a", recommendationId: "r" }, context: { supabase: client, userId: "u" } })).rejects.toThrow("Forbidden");
    expect(client.from).toHaveBeenCalledTimes(1);
    expect(query.eq).toHaveBeenCalledWith("owner_id", "u");
  });
  it("holds approval even when a pending recommendation exists", async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValueOnce({ data: { id: "ws" }, error: null }).mockResolvedValueOnce({ data: { id: "r", status: "pending", ad_account_id: "a", created_at: "version" }, error: null }) };
    await expect((reviewAdsRecommendation as unknown as Handler)({ data: { workspaceId: "ws", recommendationId: "r", decision: "approve", expectedCreatedAt: "version" }, context: { supabase: { from: () => query }, userId: "u" } })).rejects.toThrow("Pipeboard");
  });
});