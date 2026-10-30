/**
 * Browser-safe onboarding objectives: one general business list plus objectives and
 * short-answer questions for each of the seven employees. Every question has a default
 * answer so a new user can finish setup with one click.
 */

export type Horizon = "1m" | "3m" | "6m";
export const horizonLabel: Record<Horizon, string> = { "1m": "شهر", "3m": "3 أشهر", "6m": "6 أشهر" };

export type ObjectiveDef = {
  id: string;
  title: string;
  hint: string;
  unit: string;
  defaultTarget: string;
  /** Data source that can measure it; "manual" means the owner updates it. */
  source: "ga4" | "gsc" | "ads" | "social" | "tasks" | "manual";
};

export type QuestionDef = { id: string; q: string; options: string[]; default: string };

export type EmployeeSetup = { objectives: ObjectiveDef[]; questions: QuestionDef[] };

export const generalObjectives: ObjectiveDef[] = [
  { id: "traffic", title: "زيادة زيارات الموقع", hint: "جذب زوار أكثر", unit: "زيارة شهريًا", defaultTarget: "10000", source: "ga4" },
  { id: "leads", title: "زيادة العملاء المحتملين", hint: "طلبات وتواصل أكثر", unit: "عميل محتمل شهريًا", defaultTarget: "50", source: "manual" },
  { id: "sales", title: "زيادة المبيعات", hint: "إيراد أعلى", unit: "% نمو", defaultTarget: "20", source: "manual" },
  { id: "awareness", title: "زيادة الوعي بالعلامة", hint: "حضور أوسع", unit: "متابع جديد", defaultTarget: "1000", source: "social" },
  { id: "time", title: "توفير وقت الفريق", hint: "مهام أقل يدويًا", unit: "مهمة منجزة شهريًا", defaultTarget: "20", source: "tasks" },
];
export const defaultGeneral = ["traffic", "leads"];

const yesNo = ["نعم", "لا", "لا أعرف"];

export const employeeSetups: Record<string, EmployeeSetup> = {
  sonny: {
    objectives: [
      { id: "followers", title: "زيادة المتابعين", hint: "نمو الحسابات", unit: "متابع جديد", defaultTarget: "1000", source: "social" },
      { id: "posting", title: "نشر منتظم", hint: "حضور ثابت", unit: "منشور أسبوعيًا", defaultTarget: "3", source: "tasks" },
      { id: "engagement", title: "رفع التفاعل", hint: "تعليقات ومشاركات", unit: "% تفاعل", defaultTarget: "3", source: "social" },
    ],
    questions: [
      { id: "platforms", q: "أين تنشر؟", options: ["إنستغرام", "تيك توك", "لينكدإن", "إكس"], default: "إنستغرام" },
      { id: "frequency", q: "كم منشورًا أسبوعيًا؟", options: ["2", "3", "5", "يوميًا"], default: "3" },
    ],
  },
  eva: {
    objectives: [
      { id: "inbox", title: "تنظيم البريد", hint: "ردود أسرع", unit: "ساعة لأول رد", defaultTarget: "24", source: "manual" },
      { id: "weekly", title: "خطة أسبوعية", hint: "أولويات واضحة", unit: "ملخص أسبوعيًا", defaultTarget: "1", source: "tasks" },
    ],
    questions: [
      { id: "summary", q: "متى يصلك الملخص؟", options: ["كل صباح", "كل أسبوع", "عند الطلب"], default: "كل صباح" },
    ],
  },
  sam: {
    objectives: [
      { id: "leads", title: "متابعة العملاء المحتملين", hint: "لا فرصة تضيع", unit: "متابعة أسبوعيًا", defaultTarget: "10", source: "tasks" },
      { id: "close", title: "رفع نسبة الإغلاق", hint: "صفقات أكثر", unit: "% إغلاق", defaultTarget: "20", source: "manual" },
    ],
    questions: [
      { id: "channel", q: "أين يتواصل عملاؤك؟", options: ["واتساب", "البريد", "الهاتف", "الموقع"], default: "واتساب" },
      { id: "cycle", q: "مدة قرار الشراء؟", options: ["أيام", "أسابيع", "أشهر"], default: "أسابيع" },
    ],
  },
  nour: {
    objectives: [
      { id: "rank", title: "تحسين الترتيب في جوجل", hint: "الظهور في الصفحة الأولى", unit: "كلمة في أول 10", defaultTarget: "10", source: "gsc" },
      { id: "blog", title: "نشر مقالات بانتظام", hint: "محتوى يجلب زوارًا", unit: "مقال شهريًا", defaultTarget: "4", source: "tasks" },
      { id: "organic", title: "زيادة الزيارات العضوية", hint: "زوار من البحث", unit: "نقرة شهريًا", defaultTarget: "2000", source: "gsc" },
    ],
    questions: [
      { id: "organic_now", q: "يصلك زوار من البحث؟", options: yesNo, default: "لا أعرف" },
      { id: "monthly", q: "زياراتك الشهرية تقريبًا؟", options: ["أقل من 1,000", "1,000–10,000", "أكثر من 10,000", "لا أعرف"], default: "لا أعرف" },
      { id: "articles", q: "كم مقالًا شهريًا؟", options: ["2", "4", "8"], default: "4" },
    ],
  },
  dana: {
    objectives: [
      { id: "designs", title: "تصاميم جاهزة للنشر", hint: "مواد بصرية منتظمة", unit: "تصميم أسبوعيًا", defaultTarget: "3", source: "tasks" },
      { id: "identity", title: "هوية بصرية متسقة", hint: "ألوان وخطوط ثابتة", unit: "دليل هوية", defaultTarget: "1", source: "manual" },
    ],
    questions: [
      { id: "style", q: "الطابع المفضل؟", options: ["بسيط", "فاخر", "مرح", "احترافي"], default: "بسيط" },
    ],
  },
  adam: {
    objectives: [
      { id: "report", title: "تقرير أداء منتظم", hint: "أرقامك في مكان واحد", unit: "تقرير شهريًا", defaultTarget: "4", source: "tasks" },
      { id: "conversion", title: "رفع معدل التحويل", hint: "زوار يصبحون عملاء", unit: "% تحويل", defaultTarget: "2", source: "ga4" },
    ],
    questions: [
      { id: "cadence", q: "كم مرة تريد التقرير؟", options: ["أسبوعيًا", "شهريًا"], default: "أسبوعيًا" },
      { id: "analytics", q: "لديك Google Analytics؟", options: yesNo, default: "لا أعرف" },
    ],
  },
  abdullah: {
    objectives: [
      { id: "roas", title: "تحسين عائد الإعلانات", hint: "عائد أعلى لكل ريال", unit: "× عائد", defaultTarget: "3", source: "ads" },
      { id: "cpa", title: "خفض تكلفة الاكتساب", hint: "عميل بتكلفة أقل", unit: "% خفض", defaultTarget: "15", source: "ads" },
    ],
    questions: [
      { id: "running", q: "تعلن حاليًا؟", options: ["نعم", "لا", "بدأت سابقًا"], default: "لا" },
      { id: "platform", q: "أين تعلن أو تريد؟", options: ["ميتا", "جوجل", "تيك توك", "سناب"], default: "ميتا" },
      { id: "budget", q: "ميزانيتك الشهرية؟", options: ["أقل من 1,000", "1,000–5,000", "أكثر من 5,000", "لم أحدد"], default: "لم أحدد" },
    ],
  },
};

export const setupEmployeeIds = Object.keys(employeeSetups);

export type SavedObjective = { id: string; owner: "general" | string; title: string; unit: string; target: string; horizon: Horizon; source: ObjectiveDef["source"] };
export type SavedOnboarding = {
  version: 1;
  completedAt: string;
  objectives: SavedObjective[];
  employees: string[];
  answers: Record<string, Record<string, string>>;
};

/** Default answer set: every question resolved to its default. */
export function defaultAnswers(employeeId: string): Record<string, string> {
  return Object.fromEntries((employeeSetups[employeeId]?.questions ?? []).map((q) => [q.id, q.default]));
}

/** Builds the saved record; targets are clamped to short strings and unknown ids are dropped. */
export function buildOnboarding(input: {
  general: Record<string, { target: string; horizon: Horizon }>;
  employees: string[];
  employeeObjectives: Record<string, string[]>;
  answers: Record<string, Record<string, string>>;
  now?: Date;
}): SavedOnboarding {
  const objectives: SavedObjective[] = [];
  for (const [id, v] of Object.entries(input.general)) {
    const def = generalObjectives.find((o) => o.id === id);
    if (def) objectives.push({ id, owner: "general", title: def.title, unit: def.unit, target: (v.target || def.defaultTarget).slice(0, 12), horizon: v.horizon, source: def.source });
  }
  const employees = input.employees.filter((e) => employeeSetups[e]);
  for (const e of employees) {
    for (const id of input.employeeObjectives[e] ?? []) {
      const def = employeeSetups[e]!.objectives.find((o) => o.id === id);
      if (def) objectives.push({ id, owner: e, title: def.title, unit: def.unit, target: def.defaultTarget, horizon: "3m", source: def.source });
    }
  }
  const answers: Record<string, Record<string, string>> = {};
  for (const e of employees) {
    const qs = employeeSetups[e]!.questions;
    answers[e] = Object.fromEntries(qs.map((q) => {
      const a = input.answers[e]?.[q.id];
      return [q.id, a && q.options.includes(a) ? a : q.default];
    }));
  }
  return { version: 1, completedAt: (input.now ?? new Date()).toISOString(), objectives, employees, answers };
}

/** Compact Arabic summary for employee prompts; an employee sees general goals and their own. */
export function objectivesPrompt(saved: unknown, employeeId?: string): string {
  if (!saved || typeof saved !== "object") return "";
  const s = saved as Partial<SavedOnboarding>;
  if (!Array.isArray(s.objectives)) return "";
  const rel = s.objectives.filter((o) => o && (o.owner === "general" || !employeeId || o.owner === employeeId)).slice(0, 12);
  if (!rel.length) return "";
  const lines = rel.map((o) => `- ${String(o.title).slice(0, 80)}: ${String(o.target).slice(0, 12)} ${String(o.unit).slice(0, 40)} خلال ${horizonLabel[o.horizon as Horizon] ?? "3 أشهر"}`);
  const ans = employeeId && s.answers?.[employeeId] ? Object.entries(s.answers[employeeId]!).map(([k, v]) => {
    const q = employeeSetups[employeeId]?.questions.find((x) => x.id === k);
    return q ? `- ${q.q} ${String(v).slice(0, 40)}` : "";
  }).filter(Boolean) : [];
  return ["أهداف المالك المسجلة (وجّه عملك نحوها ولا تدّعِ تقدمًا بلا بيانات):", ...lines, ...(ans.length ? ["إجابات التهيئة:", ...ans] : [])].join("\n");
}
export const setupSkipKey = (ws: string) => `ziad-setup-skip-${ws}`;
