import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn };
  return chain;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { adsApiHealth, getAdsSettings, saveAdsAuditPreference } from "@/lib/ads/settings.functions";
import { getAdsHistory } from "@/lib/ads/history.functions";

type Handler = (input: { data: { workspaceId: string; enabled?: boolean }; context: unknown }) => Promise<unknown>;
function context(owner: boolean, admin = false) {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: owner ? { id: "verified-workspace", owner_id: "user" } : null, error: null }) };
  return { userId: "user", supabase: { from: vi.fn().mockReturnValue(query), rpc: vi.fn().mockResolvedValue({ data: admin, error: null }) }, query };
}
describe("Media Buyer server authorization", () => {
  it.each([getAdsSettings, saveAdsAuditPreference, adsApiHealth, getAdsHistory])("rejects a browser workspace not owned by the authenticated user", async (fn) => {
    const ctx = context(false);
    await expect((fn as unknown as Handler)({ data: { workspaceId: "other-workspace", enabled: true }, context: ctx })).rejects.toThrow("Forbidden");
    expect(ctx.supabase.from).toHaveBeenCalledTimes(1);
    expect(ctx.query.eq).toHaveBeenCalledWith("owner_id", "user");
  });
  it("rejects API health for an owner without a protected admin role", async () => {
    const ctx = context(true);
    await expect((adsApiHealth as unknown as Handler)({ data: { workspaceId: "verified-workspace" }, context: ctx })).rejects.toThrow("Forbidden");
    expect(ctx.supabase.rpc).toHaveBeenCalledWith("ads_is_admin");
    expect(ctx.supabase.from).not.toHaveBeenCalledWith("ads_api_versions");
  });
});