import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => { const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn }; return chain; } }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { getAdsBaseline, startAdsBaseline, resumeAdsBaseline, saveAdsContextNote, reviewAdsOutcomes } from "@/lib/ads/baseline.functions";
type Handler = (input: { data: unknown; context: unknown }) => Promise<unknown>;
describe("baseline endpoint ownership", () => {
  it.each([getAdsBaseline, startAdsBaseline, resumeAdsBaseline, saveAdsContextNote, reviewAdsOutcomes])("rejects a workspace the user does not own", async (fn) => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    const client = { from: vi.fn().mockReturnValue(query) };
    await expect((fn as unknown as Handler)({ data: { workspaceId: "other", accountId: "account", jobId: "job", note: "note" }, context: { supabase: client, userId: "user" } })).rejects.toThrow("Forbidden");
    expect(client.from).toHaveBeenCalledTimes(1);
    expect(query.eq).toHaveBeenCalledWith("owner_id", "user");
  });
});