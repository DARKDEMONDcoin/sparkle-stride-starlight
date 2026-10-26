import { afterEach, describe, expect, it, vi } from "vitest";
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
afterEach(() => vi.unstubAllEnvs());

function settingsContext(admin = false) {
  const workspace = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: "verified-workspace", owner_id: "user" }, error: null }) };
  let saved: { workspace_id: string; daily_audit: boolean } | null = null;
  const guardrails = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: saved, error: null })),
    upsert: vi.fn(async (row: { workspace_id: string; daily_audit: boolean }) => { saved = row; return { error: null }; }),
  };
  const registry = { select: vi.fn().mockResolvedValue({ data: [
    { platform: "google", version: "v26", sunset_at: null, sunset_month: null, sunset_precision: "unknown" },
    { platform: "meta", version: "v26.0", sunset_at: null, sunset_month: null, sunset_precision: "unknown" },
  ], error: null }) };
  const supabase = { from: vi.fn((table: string) => {
    if (table === "workspaces") return workspace;
    if (table === "ad_guardrails") return guardrails;
    if (table === "ads_api_versions") return registry;
    throw new Error(`Unexpected table: ${table}`);
  }), rpc: vi.fn().mockResolvedValue({ data: admin, error: null }) };
  return { userId: "user", supabase, workspace, guardrails, registry };
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
  it("returns audit off when the owner has no saved preference", async () => {
    const ctx = settingsContext();
    const result = await (getAdsSettings as unknown as Handler)({ data: { workspaceId: "verified-workspace" }, context: ctx });
    expect(result).toEqual({ dailyAudit: false, isAdmin: false });
    expect(ctx.guardrails.upsert).not.toHaveBeenCalled();
  });
  it("saves and reads the owner's audit preference without writing jobs", async () => {
    const ctx = settingsContext();
    for (const enabled of [true, false]) {
      const result = await (saveAdsAuditPreference as unknown as Handler)({ data: { workspaceId: "verified-workspace", enabled }, context: ctx });
      expect(result).toEqual({ dailyAudit: enabled });
      expect(ctx.guardrails.upsert).toHaveBeenLastCalledWith({ workspace_id: "verified-workspace", daily_audit: enabled }, { onConflict: "workspace_id" });
      expect(await (getAdsSettings as unknown as Handler)({ data: { workspaceId: "verified-workspace" }, context: ctx })).toEqual({ dailyAudit: enabled, isAdmin: false });
    }
    expect(ctx.supabase.from.mock.calls.every(([table]) => ["workspaces", "ad_guardrails"].includes(table))).toBe(true);
  });
  it("does not report a successful save when persistence fails", async () => {
    const ctx = settingsContext();
    ctx.guardrails.upsert.mockRejectedValueOnce(new Error("Save unavailable"));
    await expect((saveAdsAuditPreference as unknown as Handler)({ data: { workspaceId: "verified-workspace", enabled: true }, context: ctx })).rejects.toThrow("Save unavailable");
  });
  it("allows a verified admin to read registry versions and preserves unknown sunsets", async () => {
    vi.stubEnv("GOOGLE_ADS_API_VERSION", undefined);
    vi.stubEnv("META_MARKETING_API_VERSION", undefined);
    const ctx = settingsContext(true);
    const result = await (adsApiHealth as unknown as Handler)({ data: { workspaceId: "verified-workspace" }, context: ctx });
    expect(result).toEqual([
      expect.objectContaining({ platform: "google", configured: "v26", valid: true, status: "unknown", daysRemaining: null }),
      expect.objectContaining({ platform: "meta", configured: "v26.0", valid: true, status: "unknown", daysRemaining: null }),
    ]);
    expect(ctx.supabase.rpc).toHaveBeenCalledWith("ads_is_admin");
  });
  it("marks an unregistered server override unverified instead of healthy", async () => {
    vi.stubEnv("GOOGLE_ADS_API_VERSION", "v27");
    const ctx = settingsContext(true);
    const result = await (adsApiHealth as unknown as Handler)({ data: { workspaceId: "verified-workspace" }, context: ctx });
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ platform: "google", configured: "v27", status: "unverified", daysRemaining: null })]));
  });
  it("fails closed when the protected admin-role lookup fails", async () => {
    const ctx = settingsContext(true);
    ctx.supabase.rpc.mockResolvedValueOnce({ data: false, error: { message: "Role verification unavailable" } });
    await expect((adsApiHealth as unknown as Handler)({ data: { workspaceId: "verified-workspace" }, context: ctx })).rejects.toThrow("Role verification unavailable");
    expect(ctx.supabase.from).not.toHaveBeenCalledWith("ads_api_versions");
  });
});