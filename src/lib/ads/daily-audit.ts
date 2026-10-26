/** Browser-safe daily-audit rules. */
export const WEEKLY_PAGE_CHECK_DAYS = 7;
export type AuditFindings = { dueReviews: number; pagesChecked: number; pagesFailed: number; pagesSkippedWebsiteOff: boolean; metricsHeld: boolean };

/** Pages never checked, or whose newest check is at least 7 days old. */
export function pagesDueForWeeklyCheck<P extends { id: string }>(pages: P[], audits: { landing_page_id: string; created_at: string }[], now: Date): P[] {
  const latest = new Map<string, number>();
  for (const a of audits) latest.set(a.landing_page_id, Math.max(latest.get(a.landing_page_id) ?? 0, Date.parse(a.created_at)));
  const cutoff = now.getTime() - WEEKLY_PAGE_CHECK_DAYS * 86400_000;
  return pages.filter((p) => (latest.get(p.id) ?? 0) <= cutoff);
}

export function auditSummary(f: AuditFindings): string {
  const parts = [
    f.metricsHeld ? "أرقام الإعلانات لم تُحدَّث: الربط بالمنصة متوقف." : null,
    f.dueReviews ? `${f.dueReviews} مراجعة نتائج تغيير مستحقة بانتظارك.` : "لا توجد مراجعات مستحقة.",
    f.pagesSkippedWebsiteOff ? "فحص الصفحات متوقف لأن سياق الموقع مغلق." : f.pagesChecked || f.pagesFailed ? `فُحصت ${f.pagesChecked} صفحة هبوط${f.pagesFailed ? `، وتعذّر فحص ${f.pagesFailed}` : ""}.` : "لا صفحات هبوط مستحقة للفحص الأسبوعي.",
    "لم يُطبَّق أي تغيير على الحملات.",
  ];
  return parts.filter(Boolean).join(" ");
}
