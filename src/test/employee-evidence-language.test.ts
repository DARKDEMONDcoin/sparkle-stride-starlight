import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { abdullahEvidenceReply } from "@/lib/ads/baseline.server";

describe("Abdullah evidence language", () => {
  const client = {
    from: () => ({ select: () => ({ eq: () => ({ limit: async () => ({ data: [], error: null }) }) }) }),
  } as unknown as SupabaseClient<Database>;
  it("returns English while retaining the no-evidence restriction", async () => {
    const reply = await abdullahEvidenceReply(client, "workspace", "en");
    expect(reply).toContain("cannot provide recommendations or campaign drafts without verified data");
    expect(reply).not.toMatch(/\p{Script=Arabic}/u);
  });
  it("retains Arabic when requested", async () => {
    expect(await abdullahEvidenceReply(client, "workspace", "ar")).toContain("بلا بيانات موثقة");
  });
});