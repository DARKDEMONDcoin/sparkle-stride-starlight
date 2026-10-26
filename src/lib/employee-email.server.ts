/**
 * بريد الموظفين: كل موظف له عنوانه (siraj@getziad.com …). يرسل المالك مهمة بالبريد،
 * فيعمل الموظف بنفس عقل محادثة الموقع ويرد على الرسالة نفسها داخل سلسلة البريد.
 * الأمان: توقيع Svix على الويبهوك + تحقق DKIM/DMARC من المرسل + حدّ معدّل + منع الحلقات.
 */
import { getSecret } from "./secrets.server";

type Admin = Awaited<ReturnType<typeof getAdmin>>;
async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** عنوان البريد ← المعرّف الدائم للموظف (لا يتغير في قاعدة البيانات). */
const ADDRESS_TO_EMPLOYEE: Record<string, string> = {
  siraj: "sonny",
  sonny: "sonny",
  amal: "eva",
  eva: "eva",
  salem: "sam",
  sam: "sam",
  nour: "nour",
  dana: "dana",
  adam: "adam",
  abdullah: "abdullah",
};

const EMPLOYEE_IDENTITY: Record<string, { name: string; local: string; role: string }> = {
  sonny: { name: "سراج", local: "siraj", role: "مدير السوشيال ميديا" },
  eva: { name: "أمل", local: "amal", role: "المساعدة الإدارية" },
  sam: { name: "سالم", local: "salem", role: "مدير المبيعات" },
  nour: { name: "نور", local: "nour", role: "كاتبة المحتوى وخبيرة الظهور" },
  dana: { name: "دانة", local: "dana", role: "المصممة" },
  adam: { name: "آدم", local: "adam", role: "محلل البيانات" },
  abdullah: { name: "عبدالله", local: "abdullah", role: "مدير الإعلانات المموّلة" },
};

export const EMAIL_RATE_LIMIT_PER_HOUR = 20;

export type ReceivedEvent = {
  type?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string[];
    cc?: string[];
    subject?: string;
    message_id?: string;
    attachments?: { id: string; filename?: string; content_type?: string; size?: number }[];
  };
};

type ReceivedEmail = {
  text?: string | null;
  html?: string | null;
  headers?: Record<string, string | string[]> | null;
};

export async function emailDomain(): Promise<string> {
  return ((await getSecret("EMAIL_DOMAIN")) || "getziad.com").toLowerCase();
}

export function bareAddress(value: string): string {
  const m = value.match(/<([^>]+)>/);
  return (m?.[1] ?? value).trim().toLowerCase();
}

/** يحدد الموظف من عناوين المستلمين التي تنتمي لنطاقنا. */
export function resolveEmployee(recipients: string[], domain: string): string | null {
  for (const r of recipients) {
    const addr = bareAddress(r);
    const [local, host] = addr.split("@");
    if (host !== domain || !local) continue;
    const id = ADDRESS_TO_EMPLOYEE[local.replace(/\+.*$/, "")];
    if (id) return id;
  }
  return null;
}

// ───────────── توقيع Svix (ويبهوك Resend) ─────────────
export async function verifySvix(raw: string, headers: Headers, secret: string): Promise<boolean> {
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !ts || !sigHeader) return false;
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 5 * 60) return false;
  const keyBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${raw}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  const { secretsMatch } = await import("./timing-safe");
  return sigHeader
    .split(" ")
    .map((part) => part.split(",")[1] ?? "")
    .some((sig) => secretsMatch(sig, expected));
}

// ───────────── Resend API ─────────────
async function resendFetch(path: string, init?: RequestInit): Promise<Response> {
  const key = await getSecret("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY غير مضبوط");
  return fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

async function fetchReceived(emailId: string): Promise<ReceivedEmail> {
  const res = await resendFetch(`/emails/receiving/${encodeURIComponent(emailId)}`);
  if (!res.ok) throw new Error(`تعذّر جلب الرسالة [${res.status}]: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as ReceivedEmail;
}

function header(h: ReceivedEmail["headers"], name: string): string {
  if (!h) return "";
  for (const [k, v] of Object.entries(h)) {
    if (k.toLowerCase() === name) return Array.isArray(v) ? v.join(" ") : String(v);
  }
  return "";
}

/** المرسل موثّق فقط لو نجح DKIM أو DMARC — لا نثق بعنوان From وحده. */
export function senderAuthenticated(h: ReceivedEmail["headers"]): boolean {
  const auth = header(h, "authentication-results").toLowerCase();
  return /\bdmarc=pass\b/.test(auth) || /\bdkim=pass\b/.test(auth);
}

function isAutomated(h: ReceivedEmail["headers"], from: string): boolean {
  const auto = header(h, "auto-submitted").toLowerCase();
  if (auto && auto !== "no") return true;
  if (/^(bulk|junk|list)$/i.test(header(h, "precedence"))) return true;
  return /(^|[._-])(no-?reply|mailer-daemon|postmaster|bounce)/i.test(from.split("@")[0] ?? "");
}

// ───────────── تنظيف النص ─────────────
export function stripQuoted(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (/^>/.test(line)) break;
    if (/^(on .+ wrote:|في .+ كتب.*:|-{2,}\s*(original message|الرسالة الأصلية)|from:\s.+@)/i.test(line.trim())) break;
    if (/^--\s*$/.test(line)) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

function htmlToText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ───────────── تحويل رد الموظف (Markdown) إلى HTML بريدي آمن ─────────────
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(s: string): string {
  return esc(s)
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:12px" />')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" style="color:#0E6A5E">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])_([^_]+)_(?=[\s).,]|$)/g, "$1<em>$2</em>");
}

export function markdownToEmailHtml(md: string, footer: string): string {
  const blocks = md.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const html = blocks
    .map((b) => {
      const lines = b.split("\n");
      if (lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
        const ordered = /^\s*\d+[.)]/.test(lines[0] ?? "");
        const tag = ordered ? "ol" : "ul";
        return `<${tag} style="margin:0 0 16px;padding-inline-start:24px">${lines
          .map((l) => `<li>${inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ""))}</li>`)
          .join("")}</${tag}>`;
      }
      const h = b.match(/^#{1,4}\s+(.+)$/);
      if (h) return `<h3 style="margin:0 0 12px;font-size:18px">${inline(h[1] ?? "")}</h3>`;
      return `<p style="margin:0 0 16px">${lines.map(inline).join("<br />")}</p>`;
    })
    .join("");
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:16px;line-height:1.8;color:#0E2A2B;max-width:640px">${html}<hr style="border:none;border-top:1px solid #e5dfd0;margin:24px 0 12px" /><p style="font-size:13px;color:#4b5f60;margin:0">${esc(footer)}</p></div>`;
}

export function markdownToPlain(md: string): string {
  return md
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, "$1: $2")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^#{1,4}\s+/gm, "");
}

// ───────────── المعالجة الرئيسية ─────────────
export type EmailResult = { ok: boolean; skipped?: string };

export async function handleInboundEmail(event: ReceivedEvent): Promise<EmailResult> {
  const d = event.data;
  const emailId = d?.email_id;
  if (event.type !== "email.received" || !emailId || !d?.from) return { ok: true, skipped: "not-received-event" };

  const domain = await emailDomain();
  const recipients = [...(d.to ?? []), ...(d.cc ?? [])];
  const { resolveHumanBox, forwardHumanEmail } = await import("./human-mailboxes.server");
  const box = resolveHumanBox(recipients, domain);
  if (box) {
    const fromBare = bareAddress(d.from);
    if (fromBare.endsWith(`@${domain}`)) return { ok: true, skipped: "own-domain" };
    const admin = await getAdmin();
    const { error: dupErr } = await admin
      .from("inbound_emails")
      .insert({ email_id: emailId, employee_id: `human:${box}`, sender: fromBare, subject: (d.subject ?? "").slice(0, 300) });
    if (dupErr) return { ok: true, skipped: dupErr.code === "23505" ? "duplicate" : `log-failed:${dupErr.message}` };
    const r = await forwardHumanEmail({
      box,
      domain,
      emailId,
      from: d.from,
      subject: d.subject ?? "",
      hasAttachments: !!d.attachments?.length,
      resend: resendFetch,
    });
    await admin.from("inbound_emails").update({ status: r.skipped ?? "forwarded" }).eq("email_id", emailId);
    return r;
  }
  const employeeId = resolveEmployee(recipients, domain);
  if (!employeeId) return { ok: true, skipped: "unknown-recipient" };
  const who = EMPLOYEE_IDENTITY[employeeId]!;
  const fromAddr = bareAddress(d.from);
  if (fromAddr.endsWith(`@${domain}`)) return { ok: true, skipped: "own-domain" };

  const admin = await getAdmin();

  // idempotency: كل رسالة تُعالج مرة واحدة حتى لو أعاد Resend الإرسال.
  const { error: dupErr } = await admin
    .from("inbound_emails")
    .insert({ email_id: emailId, employee_id: employeeId, sender: fromAddr, subject: (d.subject ?? "").slice(0, 300) });
  if (dupErr) return { ok: true, skipped: dupErr.code === "23505" ? "duplicate" : `log-failed:${dupErr.message}` };

  const setStatus = (status: string, workspaceId?: string) =>
    admin
      .from("inbound_emails")
      .update({ status, ...(workspaceId ? { workspace_id: workspaceId } : {}) })
      .eq("email_id", emailId);

  const { data: hits } = await admin.rpc("workspace_for_email", { _email: fromAddr });
  const owner = (hits as { workspace_id: string }[] | null)?.[0];
  if (!owner) {
    await setStatus("unknown-sender");
    return { ok: true, skipped: "unknown-sender" };
  }
  const workspaceId = owner.workspace_id;

  const email = await fetchReceived(emailId);
  if (!senderAuthenticated(email.headers)) {
    await setStatus("unauthenticated", workspaceId);
    console.warn("[employee-email] sender failed DKIM/DMARC; ignored", { emailId });
    return { ok: true, skipped: "unauthenticated" };
  }
  if (isAutomated(email.headers, fromAddr)) {
    await setStatus("automated", workspaceId);
    return { ok: true, skipped: "automated" };
  }

  const { data: hits1 } = await admin.rpc("bump_rate_limit", {
    _bucket: "employee-email",
    _identifier: fromAddr,
    _window_seconds: 3600,
  });
  const messageId = d.message_id ?? header(email.headers, "message-id");
  const subject = (d.subject ?? "").trim();
  const replySubject = /^(re|رد)\s*:/i.test(subject) ? subject : `Re: ${subject || "مهمة جديدة"}`;
  const references = [header(email.headers, "references"), messageId].filter(Boolean).join(" ").trim();

  const send = async (md: string, footer: string) => {
    const res = await resendFetch("/emails", {
      method: "POST",
      headers: { "Idempotency-Key": `reply-${emailId}` },
      body: JSON.stringify({
        from: `${who.name} من زياد <${who.local}@${domain}>`,
        to: [fromAddr],
        reply_to: `${who.name} <${who.local}@${domain}>`,
        subject: replySubject,
        html: markdownToEmailHtml(md, footer),
        text: `${markdownToPlain(md)}\n\n--\n${footer}`,
        headers: {
          ...(messageId ? { "In-Reply-To": messageId } : {}),
          ...(references ? { References: references } : {}),
          "Auto-Submitted": "auto-replied",
        },
      }),
    });
    if (!res.ok) throw new Error(`تعذّر إرسال الرد [${res.status}]: ${(await res.text()).slice(0, 300)}`);
  };
  const footer = `${who.name} · ${who.role} · زياد`;

  if (typeof hits1 === "number" && hits1 > EMAIL_RATE_LIMIT_PER_HOUR) {
    await setStatus("rate-limited", workspaceId);
    if (hits1 === EMAIL_RATE_LIMIT_PER_HOUR + 1) {
      await send("وصلتني رسائل كثيرة خلال ساعة. سأتابع معك بعد قليل، أرسل الطلبات التالية في رسالة واحدة.", footer);
    }
    return { ok: true, skipped: "rate-limited" };
  }

  // نص الرسالة بدون الاقتباسات القديمة.
  let body = stripQuoted(email.text?.trim() || (email.html ? htmlToText(email.html) : ""));
  const attachments = await downloadAttachments(admin, workspaceId, emailId, d.attachments ?? []);
  if (!body && !attachments.length) {
    await setStatus("empty", workspaceId);
    await send("وصلتني رسالتك فارغة. اكتب لي ما تريده وسأبدأ فورًا.", footer);
    return { ok: true, skipped: "empty" };
  }
  if (!body) body = "اطّلع على المرفق وأعطني رأيك واقتراحك.";
  const message = (subject ? `الموضوع: ${subject}\n\n${body}` : body).slice(0, 4000);

  const { data: conv, error: convErr } = await admin
    .from("conversations")
    .upsert({ workspace_id: workspaceId, employee_id: employeeId, title: "المحادثة" }, { onConflict: "workspace_id,employee_id" })
    .select("id")
    .single();
  if (convErr || !conv) throw new Error(`تعذّر بدء المحادثة: ${convErr?.message ?? ""}`);

  const startedAt = new Date(Date.now() - 2_000).toISOString();
  try {
    const { runEmployeeTurn } = await import("./ai.functions");
    const result = (await runEmployeeTurn(
      {
        workspaceId,
        employeeId,
        message,
        conversationId: conv.id,
        ...(attachments.length ? { attachments } : {}),
      },
      { supabase: admin },
    )) as { output?: string; pendingAction?: unknown };

    await admin
      .from("messages")
      .update({ source: "email" })
      .eq("conversation_id", conv.id)
      .eq("role", "user")
      .gte("created_at", startedAt);

    let reply = (result.output ?? "").trim() || "استلمت طلبك وسأعود إليك بالنتيجة.";
    const needsApproval = Boolean((result as { pendingAction?: unknown }).pendingAction);
    if (needsApproval) {
      reply += "\n\nهذا الإجراء يحتاج موافقتك قبل التنفيذ. افتح محادثتي في زياد أو على تيليجرام واضغط «موافق»، ولن أنفّذ شيئًا قبل ذلك.";
    }
    await send(reply, footer);
    await setStatus("replied", workspaceId);
    return { ok: true };
  } catch (e) {
    await setStatus("failed", workspaceId);
    await send("تعذّر عليّ إكمال الطلب الآن. أرسله مرة أخرى بعد دقائق، وإن تكرر الأمر راسل الدعم من داخل زياد.", footer).catch(
      () => null,
    );
    throw e;
  }
}

async function downloadAttachments(
  admin: Admin,
  workspaceId: string,
  emailId: string,
  meta: NonNullable<NonNullable<ReceivedEvent["data"]>["attachments"]>,
) {
  const out: { url: string; type: "image" | "file"; mime?: string; size?: number; alt?: string }[] = [];
  if (!meta.length) return out;
  try {
    const res = await resendFetch(`/emails/receiving/${encodeURIComponent(emailId)}/attachments`);
    if (!res.ok) return out;
    const json = (await res.json()) as {
      data?: { filename?: string; content_type?: string; size?: number; download_url?: string }[];
    };
    for (const a of (json.data ?? []).slice(0, 5)) {
      if (!a.download_url || (a.size ?? 0) > 15 * 1024 * 1024) continue;
      const file = await fetch(a.download_url);
      if (!file.ok) continue;
      const bytes = await file.arrayBuffer();
      const mime = a.content_type || "application/octet-stream";
      const name = a.filename || "attachment";
      const safe = name.replace(/[^\w.-]+/g, "_").slice(-80) || "file";
      const key = `${workspaceId}/email/${Date.now()}-${safe}`;
      const bucket = admin.storage.from("nour-media");
      const { error } = await bucket.upload(key, bytes, { contentType: mime, upsert: false });
      if (error) continue;
      const { data } = await bucket.createSignedUrl(key, 60 * 60 * 24 * 365);
      if (!data?.signedUrl) continue;
      out.push({
        url: data.signedUrl,
        type: mime.startsWith("image/") ? "image" : "file",
        mime,
        size: bytes.byteLength,
        alt: name.slice(0, 200),
      });
    }
  } catch (e) {
    console.warn("[employee-email] attachments skipped", e instanceof Error ? e.message : "unknown");
  }
  return out;
}
