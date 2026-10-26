import { createFileRoute } from "@tanstack/react-router";

/**
 * ويبهوك Resend للبريد الوارد (email.received). الأمان: توقيع Svix إلزامي قبل أي قراءة أو تنفيذ.
 * الرد دائمًا 200 بعد التحقق حتى لا يعيد Resend الإرسال، والتكرار محمي بجدول inbound_emails.
 */
export const Route = createFileRoute("/api/public/resend/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { getSecret } = await import("@/lib/secrets.server");
        const secret = await getSecret("RESEND_WEBHOOK_SECRET");
        if (!secret) return new Response("webhook secret not configured", { status: 503 });

        const { verifySvix, handleInboundEmail } = await import("@/lib/employee-email.server");
        let valid = false;
        try {
          valid = await verifySvix(raw, request.headers, secret);
        } catch {
          valid = false;
        }
        if (!valid) return new Response("invalid signature", { status: 401 });

        let event: Parameters<typeof handleInboundEmail>[0];
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("bad json", { status: 400 });
        }

        try {
          const result = await handleInboundEmail(event);
          return Response.json(result);
        } catch (e) {
          console.error("[employee-email] failed", e instanceof Error ? e.message : "unknown");
          return Response.json({ ok: false }, { status: 200 });
        }
      },
    },
  },
});
