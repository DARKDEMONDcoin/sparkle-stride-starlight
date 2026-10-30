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

/** Marketing area a setup answer belongs to; used to tag what the team learned. */
export type Area = "seo" | "content" | "social" | "ads" | "sales" | "design" | "analytics" | "operations";
export const areaLabel: Record<Area, string> = { seo: "تحسين البحث", content: "المحتوى", social: "التواصل الاجتماعي", ads: "الإعلانات", sales: "المبيعات", design: "التصميم", analytics: "التحليلات", operations: "التنظيم" };
export const employeeArea: Record<string, Area> = { sonny: "social", eva: "operations", sam: "sales", nour: "seo", dana: "design", adam: "analytics", abdullah: "ads" };

export type QuestionDef = { id: string; q: string; options: string[]; default: string; area?: Area };

export type EmployeeSetup = { objectives: ObjectiveDef[]; questions: QuestionDef[] };

export const generalObjectives: ObjectiveDef[] = [
  { id: "traffic", title: "زيادة زيارات الموقع", hint: "جذب زوار أكثر", unit: "زيارة شهريًا", defaultTarget: "10000", source: "ga4" },
  { id: "leads", title: "زيادة العملاء المحتملين", hint: "طلبات وتواصل أكثر", unit: "عميل محتمل شهريًا", defaultTarget: "50", source: "manual" },
  { id: "sales", title: "زيادة المبيعات", hint: "إيراد أعلى", unit: "% نمو", defaultTarget: "20", source: "manual" },
  { id: "awareness", title: "زيادة الوعي بالعلامة", hint: "حضور أوسع", unit: "متابع جديد", defaultTarget: "1000", source: "social" },
  { id: "time", title: "توفير وقت الفريق", hint: "مهام أقل يدويًا", unit: "مهمة منجزة شهريًا", defaultTarget: "20", source: "tasks" },
];
export const defaultGeneral = ["traffic", "leads"];

/** Common goals per sector from the sign-up tour; added to the general list for that industry. */
export const industryObjectives: Record<string, ObjectiveDef[]> = {
  "التجارة الإلكترونية": [
    { id: "orders", title: "زيادة الطلبات الشهرية", hint: "طلبات أكثر من المتجر", unit: "طلب شهريًا", defaultTarget: "300", source: "manual" },
    { id: "cart", title: "خفض السلال المتروكة", hint: "إكمال الشراء", unit: "% خفض", defaultTarget: "10", source: "manual" },
    { id: "repeat", title: "زيادة الشراء المتكرر", hint: "عملاء يعودون", unit: "% عملاء عائدين", defaultTarget: "25", source: "manual" },
  ],
  "الأزياء والمنتجات": [
    { id: "orders", title: "زيادة الطلبات الشهرية", hint: "طلبات أكثر", unit: "طلب شهريًا", defaultTarget: "200", source: "manual" },
    { id: "launch", title: "إطلاق مجموعات جديدة", hint: "حملة لكل مجموعة", unit: "إطلاق كل 3 أشهر", defaultTarget: "1", source: "tasks" },
  ],
  "المطاعم والمقاهي": [
    { id: "bookings", title: "زيادة الحجوزات والطلبات", hint: "طاولات وتوصيل", unit: "طلب أسبوعيًا", defaultTarget: "100", source: "manual" },
    { id: "reviews", title: "تقييمات أكثر على الخرائط", hint: "سمعة محلية", unit: "تقييم جديد شهريًا", defaultTarget: "30", source: "manual" },
  ],
  "العيادات والرعاية الصحية": [
    { id: "appointments", title: "زيادة المواعيد", hint: "حجوزات جديدة", unit: "موعد شهريًا", defaultTarget: "80", source: "manual" },
    { id: "reviews", title: "تقييمات المرضى", hint: "ثقة أعلى", unit: "تقييم جديد شهريًا", defaultTarget: "20", source: "manual" },
  ],
  "العقارات": [
    { id: "inquiries", title: "زيادة استفسارات العقارات", hint: "مشترون جادّون", unit: "استفسار شهريًا", defaultTarget: "60", source: "manual" },
    { id: "listings", title: "عرض الوحدات بانتظام", hint: "محتوى لكل وحدة", unit: "وحدة أسبوعيًا", defaultTarget: "5", source: "tasks" },
  ],
  "التعليم والتدريب": [
    { id: "enrollments", title: "زيادة التسجيلات", hint: "طلاب جدد", unit: "تسجيل شهريًا", defaultTarget: "40", source: "manual" },
  ],
  "التقنية والتطبيقات": [
    { id: "signups", title: "زيادة التسجيلات التجريبية", hint: "مستخدمون جدد", unit: "تسجيل شهريًا", defaultTarget: "200", source: "ga4" },
    { id: "blogs", title: "نشر مقالات منتظمة", hint: "محتوى يجلب زوارًا", unit: "مقال شهريًا", defaultTarget: "4", source: "tasks" },
  ],
  "الخدمات المهنية": [
    { id: "consults", title: "زيادة طلبات الاستشارة", hint: "عملاء جدد", unit: "طلب شهريًا", defaultTarget: "20", source: "manual" },
  ],
  "السياحة والضيافة": [
    { id: "bookings", title: "زيادة الحجوزات المباشرة", hint: "بلا وسطاء", unit: "حجز شهريًا", defaultTarget: "50", source: "manual" },
  ],
  "التجميل والعناية": [
    { id: "appointments", title: "زيادة الحجوزات", hint: "مواعيد جديدة", unit: "حجز شهريًا", defaultTarget: "60", source: "manual" },
  ],
};

/** General goals shown for a sector: its common goals first, then the shared list (ids unique). */
export function generalObjectivesFor(industry?: string | null): ObjectiveDef[] {
  const extra = (industry && industryObjectives[industry.trim()]) || [];
  const seen = new Set(extra.map((o) => o.id));
  return [...extra, ...generalObjectives.filter((o) => !seen.has(o.id))];
}
export function defaultGeneralFor(industry?: string | null): string[] {
  const extra = (industry && industryObjectives[industry.trim()]) || [];
  return extra.length ? [extra[0]!.id, "traffic"] : defaultGeneral;
}

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
      { id: "pillars", q: "محور المحتوى الأهم؟", options: ["تعليمي", "عروض ومنتجات", "قصص العملاء", "ترفيهي"], default: "تعليمي", area: "content" },
      { id: "competitors", q: "تتابع منافسيك؟", options: ["نعم", "لا", "أريد أن أبدأ"], default: "أريد أن أبدأ", area: "content" },
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
      { id: "articles", q: "كم مقالًا شهريًا؟", options: ["2", "4", "8"], default: "4", area: "content" },
      { id: "tracking", q: "كيف تتابع ترتيب كلماتك؟", options: ["Search Console", "أداة مدفوعة", "لا أتابع"], default: "لا أتابع" },
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
  industry?: string | null;
  general: Record<string, { target: string; horizon: Horizon }>;
  employees: string[];
  employeeObjectives: Record<string, string[]>;
  answers: Record<string, Record<string, string>>;
  now?: Date;
}): SavedOnboarding {
  const objectives: SavedObjective[] = [];
  for (const [id, v] of Object.entries(input.general)) {
    const def = generalObjectivesFor(input.industry).find((o) => o.id === id);
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
    return q ? `- [${areaLabel[q.area ?? employeeArea[employeeId] ?? "operations"]}] ${q.q} ${String(v).slice(0, 40)}` : "";
  }).filter(Boolean) : [];
  return ["أهداف المالك المسجلة (وجّه عملك نحوها ولا تدّعِ تقدمًا بلا بيانات):", ...lines, ...(ans.length ? ["إجابات التهيئة:", ...ans] : [])].join("\n");
}
export const setupSkipKey = (ws: string) => `ziad-setup-skip-${ws}`;

/** Merges one employee's interview into an existing record without touching other answers. */
export function mergeEmployeeSetup(existing: SavedOnboarding | null, employeeId: string, objectiveIds: string[], answers: Record<string, string>, now = new Date()): SavedOnboarding {
  const setup = employeeSetups[employeeId];
  const base: SavedOnboarding = existing ?? { version: 1, completedAt: now.toISOString(), objectives: [], employees: [], answers: {} };
  if (!setup) return base;
  const objectives = base.objectives.filter((o) => o.owner !== employeeId);
  for (const id of objectiveIds) {
    const def = setup.objectives.find((o) => o.id === id);
    if (def) objectives.push({ id, owner: employeeId, title: def.title, unit: def.unit, target: def.defaultTarget, horizon: "3m", source: def.source });
  }
  const clean = Object.fromEntries(setup.questions.map((q) => [q.id, answers[q.id] && q.options.includes(answers[q.id]!) ? answers[q.id]! : q.default]));
  return { ...base, objectives, employees: base.employees.includes(employeeId) ? base.employees : [...base.employees, employeeId], answers: { ...base.answers, [employeeId]: clean } };
}

export type LearnedFact = { area: Area; employeeId: string; question: string; answer: string };
/** Every saved setup answer, tagged by its marketing area. */
export function learnedByArea(saved: SavedOnboarding | null | undefined): LearnedFact[] {
  if (!saved?.answers) return [];
  const out: LearnedFact[] = [];
  for (const [emp, ans] of Object.entries(saved.answers)) {
    for (const q of employeeSetups[emp]?.questions ?? []) {
      const a = ans?.[q.id];
      if (a) out.push({ area: q.area ?? employeeArea[emp] ?? "operations", employeeId: emp, question: q.q, answer: String(a).slice(0, 40) });
    }
  }
  return out;
}
