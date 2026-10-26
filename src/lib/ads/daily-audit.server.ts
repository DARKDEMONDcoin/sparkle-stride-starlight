import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { auditSummary, pagesDueForWeeklyCheck, type AuditFindings } from "./daily-audit";

type Admin = SupabaseClient<Database>;
const MAX_PAGES_PER_ACCOUNT = 3;

/**
 * One audit pass for a workspace. Only reads, re-checks public pages and records findings;
 * it never changes campaigns. Ad metrics cannot refresh while the provider connection is held.
 */
export async function runWorkspaceAudit(admin: Admin, workspaceId: string, ownerId: string, trigger: "manual" | "scheduled") {
  const { data: accounts } = await admin.from("ad_accounts").select("id,name,external_id").eq("workspace_id", workspaceId).limit(20);
  const { data: ws } = await admin.from("workspaces").select("use_website_context").eq("id", workspaceId).maybeSingle();
  const runs: { accountId: string; status: string; summary: string }[] = [];
  for (const account of accounts ?? []) {
    const { data: run, error } = await admin.from("audit_runs").insert({ workspace_id: workspaceId, ad_account_id: account.id, trigger, status: "running" }).select("id").single();
    if (error || !run) continue;
    const findings: AuditFindings = { dueReviews: 0, pagesChecked: 0, pagesFailed: 0, pagesSkippedWebsiteOff: false, metricsHeld: true };
    try {
      const now = new Date().toISOString();
      const { count } = await admin.from("change_outcomes").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("ad_account_id", account.id).is("evaluated_at", null).lte("review_after", now);
      findings.dueReviews = count ?? 0;
      if (!ws?.use_website_context) findings.pagesSkippedWebsiteOff = true;
      else {
        const [{ data: pages }, { data: audits }] = await Promise.all([
          admin.from("landing_pages").select("id,workspace_id,ad_account_id,url_normalized").eq("workspace_id", workspaceId).eq("ad_account_id", account.id).order("last_seen", { ascending: false }).limit(50),
          admin.from("landing_page_audits").select("landing_page_id,created_at").eq("workspace_id", workspaceId).eq("ad_account_id", account.id).order("created_at", { ascending: false }).limit(500),
        ]);
        const due = pagesDueForWeeklyCheck(pages ?? [], audits ?? [], new Date()).slice(0, MAX_PAGES_PER_ACCOUNT);
        if (due.length) {
          const { getSecret } = await import("@/lib/secrets.server"); const key = await getSecret("PAGESPEED_API_KEY");
          const { auditPublicAdPage } = await import("./landing-pages.server");
          for (const page of due) {
            const { data: claimed } = await admin.rpc("ads_claim_page_audit", { p_page_id: page.id, p_workspace_id: workspaceId, p_account_id: account.id });
            if (!claimed) continue;
            // generate=false: no AI recommendations without a reviewed baseline.
            try { await auditPublicAdPage(admin, page, "mobile", key, false); findings.pagesChecked++; } catch { findings.pagesFailed++; }
          }
        }
      }
      const summary = auditSummary(findings);
      await admin.from("audit_runs").update({ status: "completed", summary, finished_at: new Date().toISOString() }).eq("id", run.id);
      runs.push({ accountId: account.id, status: "completed", summary });
    } catch {
      await admin.from("audit_runs").update({ status: "failed", summary: "تعذّر إكمال التدقيق؛ لم يتغيّر شيء في الحملات.", finished_at: new Date().toISOString() }).eq("id", run.id);
      runs.push({ accountId: account.id, status: "failed", summary: "" });
    }
  }
  if (runs.length) {
    await admin.from("user_notifications").insert({ user_id: ownerId, workspace_id: workspaceId, kind: "ads_audit", title: "تدقيق الحملات اكتمل", body: runs.map((r) => r.summary || "فشل تدقيق حساب").join("\n").slice(0, 1500) });
  }
  return runs;
}

/** Scheduled entry: only workspaces whose owner switched the daily audit on. Bounded per call. */
export async function runScheduledAudits(admin: Admin) {
  const { data: rows } = await admin.from("ad_guardrails").select("workspace_id").eq("daily_audit", true).limit(25);
  const out: { workspaceId: string; accounts: number }[] = [];
  for (const r of rows ?? []) {
    const { data: ws } = await admin.from("workspaces").select("owner_id").eq("id", r.workspace_id).maybeSingle();
    if (!ws?.owner_id) continue;
    const since = new Date(Date.now() - 20 * 3600_000).toISOString();
    const { count } = await admin.from("audit_runs").select("id", { count: "exact", head: true }).eq("workspace_id", r.workspace_id).eq("trigger", "scheduled").gte("started_at", since);
    if (count) continue;
    const runs = await runWorkspaceAudit(admin, r.workspace_id, ws.owner_id, "scheduled");
    out.push({ workspaceId: r.workspace_id, accounts: runs.length });
  }
  return out;
}
