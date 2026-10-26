import { expect, it, vi } from "vitest";
import { reviewSavedOutcomes } from "@/lib/ads/outcomes.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
it("stores inconclusive evidence and learnings without inventing success while connectivity is held", async () => {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [{ id: "o", review_after: "2026-10-01", success_metric: "CPA", pre_snapshot: {} }], error: null }) };
  const client = { from: vi.fn().mockReturnValue(query), rpc: vi.fn().mockResolvedValue({ data: true, error: null }) };
  expect(await reviewSavedOutcomes(client as unknown as SupabaseClient<Database>, "ws", "a")).toEqual({ reviewed: 1, automaticSchedule: false });
  expect(query.limit).toHaveBeenCalledWith(3);
  expect(client.rpc).toHaveBeenCalledWith("ads_record_outcome", expect.objectContaining({ p_workspace_id: "ws", p_account_id: "a", p_classification: "inconclusive", p_evaluation: expect.objectContaining({ providerOnHold: true }) }));
});