/**
 * بيانات وهمية لواجهة التطبيق (قبل ربط Supabase).
 * كل الأنواع هنا مصمّمة لتطابق جداول قاعدة البيانات المستقبلية.
 */

export type Workspace = {
  id: string;
  name: string;
  industry: string;
  initials: string;
  tint: string;
};

export const workspaces: Workspace[] = [
  {
    id: "nakhla",
    name: "نخلة للتمور الفاخرة",
    industry: "تجارة تجزئة",
    initials: "نخ",
    tint: "var(--jade)",
  },
  {
    id: "madar",
    name: "مدار للاستشارات",
    industry: "خدمات احترافية",
    initials: "مد",
    tint: "var(--sky)",
  },
  { id: "ritaj", name: "رتاج العقارية", industry: "عقارات", initials: "رت", tint: "var(--amber)" },
];

export type UsageStat = { label: string; used: number; total: number; unit: string };

export const usage: UsageStat[] = [
  { label: "ساعات العمل هذا الشهر", used: 31.5, total: 50, unit: "ساعة" },
  { label: "المنشورات المجدولة", used: 26, total: 40, unit: "منشور" },
  { label: "المقاعد المستخدمة", used: 3, total: 5, unit: "مقعد" },
];

export type Integration = {
  id: string;
  owner: string; // employee id
  status: "connected" | "disconnected" | "error";
  account?: string;
};

export const integrations: Integration[] = [
  { id: "instagram", owner: "sonny", status: "connected", account: "@nakhla.dates" },
  { id: "x", owner: "sonny", status: "connected", account: "@nakhla" },
  { id: "linkedin", owner: "sonny", status: "error", account: "Nakhla Co." },
  { id: "tiktok", owner: "sonny", status: "disconnected" },
  { id: "facebook", owner: "sonny", status: "connected", account: "Nakhla" },
  { id: "gmail", owner: "eva", status: "connected", account: "hi@nakhla.sa" },
  { id: "calendar", owner: "eva", status: "connected", account: "hi@nakhla.sa" },
  { id: "whatsapp", owner: "eva", status: "disconnected" },
  { id: "hubspot", owner: "sam", status: "connected", account: "Nakhla CRM" },
  { id: "sheets", owner: "sam", status: "connected", account: "قوائم العملاء" },
  { id: "wordpress", owner: "nour", status: "connected", account: "nakhla.sa/blog" },
  { id: "search-console", owner: "nour", status: "connected", account: "nakhla.sa" },
  { id: "figma", owner: "dana", status: "disconnected" },
  { id: "canva", owner: "dana", status: "connected", account: "Nakhla Brand" },
  { id: "analytics", owner: "adam", status: "connected", account: "GA4 — nakhla.sa" },
  { id: "meta-ads", owner: "adam", status: "error", account: "Nakhla Ads" },
];

export const integrationStatusLabel: Record<Integration["status"], string> = {
  connected: "مرتبط",
  disconnected: "غير مرتبط",
  error: "يحتاج إعادة ربط",
};

export type BrainItem = {
  id: string;
  kind: "doc" | "link" | "note" | "image";
  title: string;
  meta: string;
  usedBy: string[];
};

export const brainItems: BrainItem[] = [
  {
    id: "b1",
    kind: "note",
    title: "نبرة العلامة: دافئة، واثقة، بدون مبالغة",
    meta: "ملاحظة · حُدّثت أمس",
    usedBy: ["sonny", "nour", "eva"],
  },
  {
    id: "b2",
    kind: "doc",
    title: "دليل الهوية البصرية 2026.pdf",
    meta: "مستند · 4.2MB",
    usedBy: ["dana", "sonny"],
  },
  {
    id: "b3",
    kind: "doc",
    title: "قائمة الأسعار وسياسة الشحن.xlsx",
    meta: "مستند · 180KB",
    usedBy: ["eva", "sam"],
  },
  {
    id: "b4",
    kind: "link",
    title: "nakhla.sa — صفحة من نحن",
    meta: "رابط · تمت قراءته",
    usedBy: ["nour", "sam"],
  },
  {
    id: "b5",
    kind: "note",
    title: "كلمات ممنوعة: «الأفضل في العالم»، «مجانًا 100%»",
    meta: "ملاحظة · قاعدة إلزامية",
    usedBy: ["sonny", "nour", "sam"],
  },
  {
    id: "b6",
    kind: "image",
    title: "24 صورة منتجات عالية الدقة",
    meta: "صور · مجلد",
    usedBy: ["dana", "sonny"],
  },
  {
    id: "b7",
    kind: "doc",
    title: "أسئلة العملاء المتكررة (32 سؤالًا)",
    meta: "مستند · 96KB",
    usedBy: ["eva", "sam"],
  },
];

export const brainKindLabel: Record<BrainItem["kind"], string> = {
  doc: "مستند",
  link: "رابط",
  note: "ملاحظة",
  image: "صور",
};

export type ChatMessage = {
  id: string;
  from: "user" | "agent";
  body: string;
  time: string;
};

export const conversations: Record<string, ChatMessage[]> = {
  sonny: [
    {
      id: "m1",
      from: "user",
      body: "جهّز لي خطة منشورات الأسبوع القادم مع التركيز على عرض التمور الفاخرة.",
      time: "9:04 ص",
    },
    {
      id: "m2",
      from: "agent",
      body: "تمام. بنيت 7 منشورات: 3 كاروسيل تعليمي، 2 عرض مباشر، ريلز واحد، وقصة استفتاء. كلها بنبرة العلامة وبدون الكلمات الممنوعة. تحب أعرضها للمراجعة أم أجدولها مباشرة؟",
      time: "9:04 ص",
    },
    { id: "m3", from: "user", body: "اعرضها للمراجعة، وخلي الريلز يوم الخميس.", time: "9:06 ص" },
    {
      id: "m4",
      from: "agent",
      body: "نُقل الريلز للخميس 8:30 م (أعلى تفاعل لجمهورك). أرسلت 7 عناصر إلى طابور الموافقات.",
      time: "9:06 ص",
    },
  ],
  eva: [
    {
      id: "m1",
      from: "agent",
      body: "ملخص الصباح: 4 رسائل تحتاج قرارك، اجتماعان اليوم، وعرض مورّد ينتهي غدًا. الباقي (41 رسالة) فُرز وأُرشف.",
      time: "7:30 ص",
    },
    { id: "m2", from: "user", body: "أرسل للمورّد أننا نحتاج مهلة أسبوع.", time: "8:12 ص" },
    {
      id: "m3",
      from: "agent",
      body: "كتبت الرد بنبرتك ووضعته في الموافقات — سيُرسل فور اعتمادك.",
      time: "8:12 ص",
    },
  ],
  sam: [
    { id: "m1", from: "user", body: "ابحث عن 50 متجر هدايا في الرياض وجدة.", time: "أمس" },
    {
      id: "m2",
      from: "agent",
      body: "وجدت 64 متجرًا مطابقًا، فلترت 51 منها بمعلومات تواصل مؤكدة. بدأت تسلسل تواصل من 3 رسائل على مدى 7 أيام.",
      time: "أمس",
    },
  ],
  nour: [
    { id: "m1", from: "user", body: "نحتاج مقالًا عن فوائد التمور للرياضيين.", time: "قبل ساعتين" },
    {
      id: "m2",
      from: "agent",
      body: "الكلمة المستهدفة «تمور للرياضيين» — بحث شهري 2,400 ومنافسة منخفضة. المسودة 1400 كلمة جاهزة في الموافقات.",
      time: "قبل ساعتين",
    },
  ],
  dana: [
    {
      id: "m1",
      from: "user",
      body: "بانر لعرض نهاية الأسبوع بألوان الهوية.",
      time: "قبل 40 دقيقة",
    },
    {
      id: "m2",
      from: "agent",
      body: "6 نسخ جاهزة (مربع، ستوري، لاندسكيب، بنر موقع) + عنوانان بديلان لاختبار A/B.",
      time: "قبل 38 دقيقة",
    },
  ],
  adam: [
    {
      id: "m1",
      from: "agent",
      body: "تنبيه: معدل إتمام السلة انخفض 18% منذ أمس — سياسة الشحن الجديدة هي السبب الأرجح.",
      time: "قبل 3 ساعات",
    },
  ],
};

export const starterPrompts: Record<string, string[]> = {
  sonny: ["خطة محتوى لشهر كامل", "حوّل هذا المقال إلى 5 منشورات", "رد على تعليقات اليوم"],
  eva: ["ملخص بريد اليوم", "رتّب اجتماعات الأسبوع", "اكتب ردًا على هذا العميل"],
  sam: ["ابحث عن 50 عميلًا محتملًا", "اكتب تسلسل متابعة", "حدّث حالة الصفقات"],
  nour: ["اقترح 10 كلمات مفتاحية", "اكتب مقالًا 1500 كلمة", "حسّن صفحة قديمة"],
  dana: ["بانر لعرض جديد", "قوالب ستوري لأسبوع", "نظّف خلفية صور المنتجات"],
  adam: ["تقرير أداء الأسبوع", "ما القناة الأسوأ إنفاقًا؟", "توقع مبيعات الشهر"],
};

export type Approval = {
  id: string;
  employee: string;
  channel: string;
  type: string;
  title: string;
  preview: string;
  scheduled: string;
};

export const approvals: Approval[] = [
  {
    id: "a1",
    employee: "sonny",
    channel: "instagram",
    type: "منشور كاروسيل",
    title: "3 علامات تدل أن تمورك مخزّنة غلط",
    preview:
      "الحرارة فوق 25° تحوّل التمر الفاخر إلى عادي خلال أسبوعين. احفظ المنشور قبل ما تشتري كرتونتك الجاية 🌴",
    scheduled: "يُنشر غدًا 8:30 م",
  },
  {
    id: "a2",
    employee: "eva",
    channel: "gmail",
    type: "رد بريد",
    title: "رد على مورّد التغليف — طلب مهلة",
    preview:
      "شكرًا لعرضكم المحدّث. نحتاج مهلة أسبوع لاستكمال المراجعة الداخلية، ونعود لكم بقرار نهائي الأحد القادم.",
    scheduled: "يُرسل فور الاعتماد",
  },
  {
    id: "a3",
    employee: "nour",
    channel: "wordpress",
    type: "مقال",
    title: "التمور للرياضيين: دليل عملي (1400 كلمة)",
    preview:
      "طاقة سريعة بدون سكر مصنّع… المقال يستهدف «تمور للرياضيين» مع 4 روابط داخلية ووصف ميتا جاهز.",
    scheduled: "جاهز للنشر",
  },
  {
    id: "a4",
    employee: "sam",
    channel: "linkedin",
    type: "رسالة تواصل",
    title: "تسلسل تواصل لـ 18 متجر هدايا",
    preview:
      "أستاذة ريم، لاحظت توسّعكم بفرع جديد. نورّد لثلاث سلاسل مشابهة بهامش أعلى 19% — أرسل التفاصيل برسالة واحدة؟",
    scheduled: "يبدأ الإرسال 10:00 ص",
  },
];

export type TaskItem = {
  id: string;
  employee: string;
  title: string;
  status: "queued" | "running" | "review" | "done" | "paused";
  when: string;
  steps: { label: string; state: "done" | "active" | "todo" | "blocked" }[];
};

export const tasks: TaskItem[] = [
  {
    id: "t1",
    employee: "sonny",
    title: "تقويم محتوى أكتوبر — 30 منشورًا",
    status: "running",
    when: "يعمل الآن · 18/30",
    steps: [
      { label: "بحث المواضيع", state: "done" },
      { label: "كتابة النصوص", state: "done" },
      { label: "توليد الصور", state: "active" },
      { label: "الجدولة", state: "todo" },
    ],
  },
  {
    id: "t2",
    employee: "adam",
    title: "مزامنة بيانات إعلانات ميتا",
    status: "paused",
    when: "متوقفة · انقطع الربط",
    steps: [
      { label: "الاتصال بالحساب", state: "blocked" },
      { label: "سحب البيانات", state: "todo" },
      { label: "بناء التقرير", state: "todo" },
    ],
  },
  {
    id: "t3",
    employee: "sam",
    title: "تسلسل متابعة 18 عميلًا",
    status: "review",
    when: "بانتظار موافقتك",
    steps: [
      { label: "بناء القائمة", state: "done" },
      { label: "كتابة الرسائل", state: "done" },
      { label: "اعتمادك", state: "active" },
      { label: "الإرسال", state: "todo" },
    ],
  },
  {
    id: "t4",
    employee: "nour",
    title: "تحديث 6 مقالات قديمة",
    status: "queued",
    when: "تبدأ 11:00 م",
    steps: [
      { label: "تحليل الترتيب", state: "todo" },
      { label: "إعادة الكتابة", state: "todo" },
      { label: "النشر", state: "todo" },
    ],
  },
  {
    id: "t5",
    employee: "dana",
    title: "6 بانرات لحملة نهاية الأسبوع",
    status: "done",
    when: "اكتملت قبل ساعة",
    steps: [
      { label: "المفاهيم", state: "done" },
      { label: "التصميم", state: "done" },
      { label: "التصدير", state: "done" },
    ],
  },
];

export const taskStatusLabel: Record<TaskItem["status"], string> = {
  queued: "في الطابور",
  running: "قيد التنفيذ",
  review: "بانتظار موافقتك",
  done: "مُنجزة",
  paused: "متوقفة",
};
