import { createFileRoute } from "@tanstack/react-router";
import { secretsMatch } from "@/lib/timing-safe";

/** Daily audit callback. Not scheduled yet (owner decision); requires the cron secret. Never changes campaigns. */
export const Route = createFileRoute("/api/public/ads-daily-audit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-cron-secret") ?? "";
        if (!provided || !secretsMatch(provided, process.env["LOVABLE_CRON_SECRET"])) return new Response("unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { runScheduledAudits } = await import("@/lib/ads/daily-audit.server");
        try { return Response.json({ runs: await runScheduledAudits(supabaseAdmin) }); }
        catch { return new Response("audit failed", { status: 500 }); }
      },
    },
  },
});
