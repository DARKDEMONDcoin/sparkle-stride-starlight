/**
 * صناديق البشر على النطاق (abdalla@ / ayman@ / support@): كل رسالة واردة تُعاد توجيهها
 * إلى بريد Gmail الشخصي مع Reply-To للمرسل الأصلي، فالرد من Gmail يصل للعميل مباشرة.
 * عناوين التوجيه قابلة للتغيير عبر الأسرار FORWARD_<NAME> دون تعديل الكود.
 */
import { getSecret } from "./secrets.server";

const DEFAULT_TARGETS: Record<string, string[]> = {
  abdalla: ["abdallamohamed55xx@gmail.com"],
  ayman: ["amnsaad85@gmail.com"],
  support: ["abdallamohamed55xx@gmail.com"],
};
const LABELS: Record<string, string> = { abdalla: "عبدالله", ayman: "أيمن", support: "دعم زياد" };

async function targetsFor(box: string): Promise<string[]> {
  const fromSecret = (await getSecret(`FORWARD_${box.toUpperCase()}`))?.trim();
  let list = fromSecret ? fromSecret.split(/[,\s]+/).filter(Boolean) : [...DEFAULT_TARGETS[box]!];
  if (box === "support" && !fromSecret) {
    const ayman = (await getSecret("FORWARD_AYMAN"))?.trim();
    list.push(...(ayman ? ayman.split(/[,\s]+/).filter(Boolean) : DEFAULT_TARGETS["ayman"]!));
  }
  list = [...new Set(list.map((s) => s.toLowerCase()))].filter((s) => /^[^@\s]+@[^@\s]+$/.test(s));
  return list;
}

export function resolveHumanBox(recipients: string[], domain: string): string | null {
  for (const r of recipients) {
    const m = r.toLowerCase().match(/<?([^<>\s]+)@([^<>\s]+?)>?$/);
    if (!m || m[2] !== domain) continue;
    const local = m[1]!.replace(/\+.*$/, "");
    if (local in DEFAULT_TARGETS) return local;
  }
  return null;
}

type Resend = (path: string, init?: RequestInit) => Promise<Response>;

export async function forwardHumanEmail(opts: {
  box: string;
  domain: string;
  emailId: string;
  from: string;
  subject: string;
  hasAttachments: boolean;
  resend: Resend;
}): Promise<{ ok: boolean; skipped?: string }> {
  const { box, domain, emailId, resend } = opts;
  const to = await targetsFor(box);
  if (!to.length) return { ok: true, skipped: `no-forward-target:${box}` };

  const res = await resend(`/emails/receiving/${encodeURIComponent(emailId)}`);
  if (!res.ok) throw new Error(`تعذّر جلب الرسالة [${res.status}]: ${(await res.text()).slice(0, 300)}`);
  const email = (await res.json()) as { text?: string | null; html?: string | null };

  const attachments: { filename: string; path: string }[] = [];
  if (opts.hasAttachments) {
    const a = await resend(`/emails/receiving/${encodeURIComponent(emailId)}/attachments`);
    if (a.ok) {
      const json = (await a.json()) as { data?: { filename?: string; size?: number; download_url?: string }[] };
      for (const f of (json.data ?? []).slice(0, 10)) {
        if (f.download_url && (f.size ?? 0) <= 20 * 1024 * 1024)
          attachments.push({ filename: f.filename || "attachment", path: f.download_url });
      }
    }
  }

  const banner = `وصلت إلى ${box}@${domain} من ${opts.from}`;
  const send = await resend("/emails", {
    method: "POST",
    headers: { "Idempotency-Key": `fwd-${emailId}` },
    body: JSON.stringify({
      from: `${LABELS[box]} — زياد <${box}@${domain}>`,
      to,
      reply_to: opts.from,
      subject: opts.subject || "(بدون عنوان)",
      text: `${banner}\n\n${email.text ?? ""}`,
      html: email.html
        ? `<p style="color:#555;font-size:12px">${banner.replace(/</g, "&lt;")}</p><hr>${email.html}`
        : undefined,
      ...(attachments.length ? { attachments } : {}),
    }),
  });
  if (!send.ok) throw new Error(`فشل التوجيه [${send.status}]: ${(await send.text()).slice(0, 300)}`);
  return { ok: true };
}
