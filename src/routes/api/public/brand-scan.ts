import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { secretsMatch } from "@/lib/timing-safe";
export const Route = createFileRoute("/api/public/brand-scan")({ server: { handlers: { POST: async ({ request }) => {
  const provided = request.headers.get("x-cron-secret"); if (!provided) return new Response("unauthorized", { status: 401 });
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!secretsMatch(provided, process.env["LOVABLE_CRON_SECRET"])) { const { data } = await supabaseAdmin.rpc("verify_cron_token", { _name: "brand-scan", _token: provided }); if (data !== true) return new Response("unauthorized", { status: 401 }); }
  const body = z.object({ jobId: z.string().uuid() }).safeParse(await request.json().catch(() => null)); if (!body.success) return new Response("invalid job", { status: 400 });
  const { runBrandScan } = await import("@/lib/brand-scan.server");
  const report = await runBrandScan(supabaseAdmin, body.data.jobId); return Response.json(report);
} } } });