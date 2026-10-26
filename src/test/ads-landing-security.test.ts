import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => { const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn }; return chain; } }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { getAdsLandingPages, discoverAdsLandingPages, auditAdsLandingPage, createAdsPageFix, markAdsPageFix } from "@/lib/ads/landing-pages.functions";
type Handler = (input: { data: unknown; context: unknown }) => Promise<unknown>;
describe("landing-page ownership", () => {
  it.each([getAdsLandingPages, discoverAdsLandingPages, auditAdsLandingPage, createAdsPageFix, markAdsPageFix])("rejects non-owner before fetching, credential lookup or privileged writes", async (fn) => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }; const client = { from: vi.fn().mockReturnValue(query) };
    await expect((fn as unknown as Handler)({ data: { workspaceId: "w", pageId: "p", accountId: "a", ticketId: "t" }, context: { supabase: client, userId: "u" } })).rejects.toThrow("Forbidden");
    expect(client.from).toHaveBeenCalledTimes(1); expect(query.eq).toHaveBeenCalledWith("owner_id", "u");
  });
  it("honors the workspace-level website switch before reading the page", async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValueOnce({ data: { id: "w" } }).mockResolvedValueOnce({ data: { use_website_context: false } }) }; const client = { from: vi.fn().mockReturnValue(query) };
    await expect((auditAdsLandingPage as unknown as Handler)({ data: { workspaceId: "w", pageId: "p", device: "mobile" }, context: { supabase: client, userId: "u" } })).rejects.toThrow("سياق الموقع");
    expect(client.from).toHaveBeenCalledTimes(2);
  });
});