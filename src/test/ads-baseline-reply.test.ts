import { expect, it, vi } from "vitest";
import { abdullahEvidenceReply } from "@/lib/ads/baseline.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
it("does not invoke generation or create recommendations without accounts", async () => {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
  const client = { from: vi.fn().mockReturnValue(query) };
  await abdullahEvidenceReply(client as unknown as SupabaseClient<Database>, "ws");
  expect(client.from).toHaveBeenCalledTimes(1);
  expect(client.from).toHaveBeenCalledWith("ad_accounts");
});