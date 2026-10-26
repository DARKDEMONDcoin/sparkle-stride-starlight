import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { checklistKeys } from "@/lib/ads/landing-pages";
import { MEDIA_BUYER_SECTIONS } from "@/lib/ads/playbook";
const chat = vi.hoisted(() => vi.fn());
vi.mock("@/lib/nour-research.server", () => ({ freeChat: chat, parseJson: (raw: string) => JSON.parse(raw) }));
vi.mock("@/lib/ads/landing-fetch.server", () => ({ fetchAdPage: async () => ({ html: "<html><head><title>Real offer</title></head><body><h1>Real offer</h1><p>Verified page text</p></body></html>", finalUrl: "https://store.com/offer", statuses: [200] }) }));
import { auditPublicAdPage } from "@/lib/ads/landing-pages.server";
it("uses the selective composer and owner guidelines in the gated page model call", async () => {
  chat.mockResolvedValue(JSON.stringify({ checks: checklistKeys.map((category) => ({ category, status: "unknown", evidence: "Not verified", steps: [] })), limitations: [] }));
  const insert = vi.fn().mockResolvedValue({ error: null });
  const client = { from: (table: string) => {
    if (table === "landing_page_audits") return { insert };
    const data = table === "ad_accounts" ? { platform: "meta", currency: "EUR", timezone: "Europe/Paris" } : table === "brain_items" ? [{ kind: "employee_guideline", meta: "abdullah:voice", used_by: ["abdullah"], title: "Owner rule", body: "Do not claim guaranteed results" }] : { id: "b", status: "ready" };
    const query = { select: () => query, eq: () => query, contains: () => query, order: () => query, limit: () => table === "brain_items" ? Promise.resolve({ data, error: null }) : query, maybeSingle: () => Promise.resolve({ data, error: null }) };
    return query;
  } };
  await auditPublicAdPage(client as unknown as SupabaseClient<Database>, { id: "p", workspace_id: "w", ad_account_id: "a", url_normalized: "https://store.com/offer" }, "mobile", null, true);
  expect(chat).toHaveBeenCalledTimes(1);
  const system = chat.mock.calls[0]?.[1]?.[0]?.content;
  expect(system).toContain(MEDIA_BUYER_SECTIONS.meta);
  expect(system).toContain(MEDIA_BUYER_SECTIONS["landing-pages"]);
  expect(system).toContain(MEDIA_BUYER_SECTIONS.diagnostics);
  expect(system).not.toContain(MEDIA_BUYER_SECTIONS.google);
  expect(system).not.toContain(MEDIA_BUYER_SECTIONS.creative);
  expect(system).toContain("Do not claim guaranteed results");
  expect(insert).toHaveBeenCalledTimes(1);
});
it("never invokes the model when page generation is gated off", async () => {
  chat.mockClear(); const insert = vi.fn().mockResolvedValue({ error: null });
  const client = { from: () => ({ insert }) };
  await auditPublicAdPage(client as unknown as SupabaseClient<Database>, { id: "p", workspace_id: "w", ad_account_id: "a", url_normalized: "https://store.com" }, "desktop", null, false);
  expect(chat).not.toHaveBeenCalled(); expect(insert).toHaveBeenCalledTimes(1);
});