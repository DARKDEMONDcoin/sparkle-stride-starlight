import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn };
  return chain;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { disconnectAdsConnection, getAdsConnections, getAdsProviderCapabilities, startAdsConnection } from "@/lib/ads/connections.functions";

type Handler = (args: { data: Record<string, unknown>; context: unknown }) => Promise<unknown>;
function makeContext(owner: boolean, connection: boolean = true) {
  const write = vi.fn();
  const query = (data: unknown) => ({
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    delete: write, insert: write, update: write,
  });
  const workspace = query(owner ? { id: "workspace", owner_id: "user" } : null);
  const connectionQuery = query(connection ? { id: "connection", provider: "pipeboard", status: "limited" } : null);
  const from = vi.fn((table: string) => table === "workspaces" ? workspace : table === "ad_provider_configs" ? query(null) : connectionQuery);
  return { userId: "user", supabase: { from }, write, connectionQuery };
}
const data = { workspaceId: "workspace", connectionId: "connection", platform: "google", origin: "https://example.com" };

describe("Media Buyer connection safety", () => {
  it.each([getAdsConnections, getAdsProviderCapabilities, startAdsConnection, disconnectAdsConnection])("rejects non-owner access before any provider or account operation", async (fn) => {
    const context = makeContext(false);
    await expect((fn as unknown as Handler)({ data, context })).rejects.toThrow("Forbidden");
    expect(context.supabase.from).toHaveBeenCalledTimes(1);
    expect(context.write).not.toHaveBeenCalled();
  });
  it("does not start unverified onboarding even for the owner", async () => {
    const context = makeContext(true);
    await expect((startAdsConnection as unknown as Handler)({ data, context })).rejects.toThrow("غير مفعّل");
    expect(context.supabase.from).not.toHaveBeenCalledWith("ad_connections");
    expect(context.write).not.toHaveBeenCalled();
  });
  it("preserves account and history records when provider revocation is unavailable", async () => {
    const context = makeContext(true);
    await expect((disconnectAdsConnection as unknown as Handler)({ data, context })).rejects.toThrow("لم تُحذف");
    expect(context.write).not.toHaveBeenCalled();
    expect(context.supabase.from).not.toHaveBeenCalledWith("ad_accounts");
    expect(context.connectionQuery.eq).toHaveBeenCalledWith("workspace_id", "workspace");
  });
  it("rejects a connection outside the verified workspace", async () => {
    const context = makeContext(true, false);
    await expect((disconnectAdsConnection as unknown as Handler)({ data, context })).rejects.toThrow("غير موجود");
    expect(context.write).not.toHaveBeenCalled();
  });
});