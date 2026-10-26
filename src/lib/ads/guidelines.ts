type Guideline = { kind: string; meta: string | null; used_by: string[]; body: string | null; title: string };

export function mediaBuyerGuidelines(items: Guideline[]): string {
  const rules = items.filter((item) => item.kind === "employee_guideline" && item.meta?.startsWith("abdullah:") && item.used_by.includes("abdullah"));
  return rules.length ? `## تعليمات المالك لعبدالله\nطبّق هذه التعليمات في كل تشغيل دون تجاوز الأمان أو موافقة المالك:\n${rules.map((item) => `- ${item.body ?? item.title}`).join("\n")}` : "";
}