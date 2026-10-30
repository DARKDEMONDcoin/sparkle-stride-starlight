import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn };
  return chain;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
const mocks = vi.hoisted(() => ({ gsc: vi.fn(), ga4: vi.fn() }));
vi.mock("@/lib/gsc.functions", () => ({ gscSnapshotDetailed: mocks.gsc }));
vi.mock("@/lib/ga4.functions", () => ({ ga4SnapshotDetailed: mocks.ga4 }));
import { buildReport, type ReportPayload } from "@/lib/reports.functions";

type Handler = (input: { data: { workspaceId: string; days: number }; context: unknown }) => Promise<ReportPayload>;
function context(owner = true) {
  const from = vi.fn((table: string) => {
    const result = table === "workspaces" ? { data: { name: "Business", industry: "Retail" }, error: null }
      : table === "integrations" ? { data: [{ provider: "hubspot", status: "connected", account: "CRM" }], error: null }
      : { data: [], error: null, count: 120 };
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue(result), then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve) };
    return query;
  });
  return { supabase: { from, rpc: vi.fn().mockResolvedValue({ data: owner, error: null }) } };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.gsc.mockResolvedValue({ status: { state: "ok", message: "GSC" }, snapshot: { site: "https://business.example", totals: { clicks: 1000, impressions: 20000, ctr: 0.05, position: 4.2 }, queries: [{ key: "top", clicks: 10, impressions: 100, ctr: 0.1, position: 12 }], pages: [] } });
  mocks.ga4.mockResolvedValue({ status: { state: "not_connected", message: "Not connected" }, snapshot: null });
});
describe("Adam reporting evidence", () => {
  it("uses provider aggregate totals rather than top-query sums", async () => {
    const report = await (buildReport as unknown as Handler)({ data: { workspaceId: "workspace", days: 28 }, context: context() });
    expect(report.search?.totals).toEqual({ clicks: 1000, impressions: 20000, ctr: 0.05, position: 4.2 });
  });
  it("passes the same explicit range to GA4 and Search Console", async () => {
    const report = await (buildReport as unknown as Handler)({ data: { workspaceId: "workspace", days: 7 }, context: context() });
    expect(mocks.gsc).toHaveBeenCalledWith("workspace", 7, report.range);
    expect(mocks.ga4).toHaveBeenCalledWith("workspace", 7, report.range);
  });
  it("uses exact task counts, not the capped recent-task list", async () => {
    const report = await (buildReport as unknown as Handler)({ data: { workspaceId: "workspace", days: 28 }, context: context() });
    expect(report.work.published).toBe(120);
    expect(report.work.recent).toEqual([]);
  });
  it("blocks non-owner reads before private provider access", async () => {
    await expect((buildReport as unknown as Handler)({ data: { workspaceId: "other", days: 28 }, context: context(false) })).rejects.toThrow("Forbidden");
    expect(mocks.gsc).not.toHaveBeenCalled();
    expect(mocks.ga4).not.toHaveBeenCalled();
  });
});