/**
 * قواعد الأمان لتغييرات عبدالله على الإعلانات. تُطبَّق في الخادم قبل أي تعديل حي،
 * ولا يمكن للنموذج تجاوزها: لا تغيير بلا موافقة بشرية، وحدود للميزانية.
 */
export type ProposedChange =
  | { kind: "budget"; entityId: string; currentDaily: number; newDaily: number }
  | { kind: "status"; entityId: string; level: "campaign" | "group" | "ad"; to: "PAUSED" | "ENABLED" }
  | { kind: "negative_keyword"; entityId: string; keyword: string }
  | { kind: "other"; entityId: string; summary: string };

export type ApprovalRecord = {
  status: "pending" | "approved" | "rejected" | "applied" | "failed" | "expired";
  workspaceId: string;
  decidedBy: string | null;
};

export type Guardrails = {
  maxBudgetIncreasePct: number; // الافتراضي 20
  monthlyCap: number | null; // بعملة الحساب
  daysInMonth?: number;
};

export const DEFAULT_GUARDRAILS: Guardrails = { maxBudgetIncreasePct: 20, monthlyCap: null };

export type GuardResult = { ok: true } | { ok: false; reason: string };

/** يرفض أي تنفيذ لا تسبقه موافقة بشرية صالحة لنفس مساحة العمل. */
export function requireApproval(record: ApprovalRecord | null, workspaceId: string): GuardResult {
  if (!record) return { ok: false, reason: "لا توجد موافقة مسجلة لهذا التغيير." };
  if (record.workspaceId !== workspaceId) return { ok: false, reason: "الموافقة لا تخص هذه المساحة." };
  if (record.status !== "approved") return { ok: false, reason: "التغيير لم يُعتمد بعد من المالك." };
  if (!record.decidedBy) return { ok: false, reason: "الموافقة بلا صاحب قرار." };
  return { ok: true };
}

export function checkGuardrails(change: ProposedChange, g: Guardrails = DEFAULT_GUARDRAILS): GuardResult {
  if (change.kind === "budget") {
    if (!(change.newDaily > 0)) return { ok: false, reason: "الميزانية اليومية يجب أن تكون أكبر من صفر." };
    if (change.currentDaily > 0 && change.newDaily > change.currentDaily) {
      const pct = ((change.newDaily - change.currentDaily) / change.currentDaily) * 100;
      if (pct > g.maxBudgetIncreasePct + 1e-9) {
        return { ok: false, reason: `الزيادة ${pct.toFixed(1)}٪ تتجاوز الحد المسموح ${g.maxBudgetIncreasePct}٪ في المرة الواحدة.` };
      }
    }
    if (g.monthlyCap != null) {
      const projected = change.newDaily * (g.daysInMonth ?? 30.4);
      if (projected > g.monthlyCap + 1e-9) {
        return { ok: false, reason: `الإنفاق الشهري المتوقع (${projected.toFixed(0)}) يتجاوز سقفك الشهري (${g.monthlyCap}).` };
      }
    }
  }
  return { ok: true };
}

/** زيادات الميزانية وتشغيل حملة كاملة لا تدخل في «اعتماد كل منخفض المخاطر». */
export function allowedInBatch(change: ProposedChange): boolean {
  if (change.kind === "budget" && change.newDaily > change.currentDaily) return false;
  if (change.kind === "status" && change.level === "campaign" && change.to === "ENABLED") return false;
  return true;
}
