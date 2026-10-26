export type WorkItem = {
  id: string;
  employee: string;
  title: string;
  detail: string;
  channel: string;
  status: "done" | "running" | "review";
  time: string;
};

export const workFeed: WorkItem[] = [
  {
    id: "w1",
    employee: "sonny",
    title: "نشر كاروسيل «3 أخطاء تستنزف ميزانيتك»",
    detail: "5 شرائح بهوية العلامة + نص عربي مدقّق، نُشر في ذروة التفاعل.",
    channel: "instagram",
    status: "done",
    time: "قبل 12 دقيقة",
  },
  {
    id: "w2",
    employee: "eva",
    title: "فرز 42 رسالة بريد وتحضير 7 ردود",
    detail: "3 رسائل تحتاج قرارك، والباقي ردود جاهزة بنبرتك تنتظر موافقتك.",
    channel: "gmail",
    status: "review",
    time: "قبل 25 دقيقة",
  },
  {
    id: "w3",
    employee: "sam",
    title: "تسلسل متابعة لـ 18 عميلًا محتملًا",
    detail: "رسائل مخصّصة حسب القطاع، مع تذكير بعد 3 أيام لغير المستجيبين.",
    channel: "linkedin",
    status: "running",
    time: "الآن",
  },
  {
    id: "w4",
    employee: "dana",
    title: "توليد 6 بانرات لحملة نهاية الأسبوع",
    detail: "3 مقاسات لكل منصة + نسخة داكنة، جاهزة للتصدير.",
    channel: "figma",
    status: "done",
    time: "قبل ساعة",
  },
  {
    id: "w5",
    employee: "nour",
    title: "مقال «دليل التسعير للمتاجر الصغيرة» (1400 كلمة)",
    detail: "محسّن لكلمات مفتاحية عربية، مع وصف ميتا وروابط داخلية.",
    channel: "wordpress",
    status: "review",
    time: "قبل 3 ساعات",
  },
  {
    id: "w6",
    employee: "adam",
    title: "تقرير الأسبوع: أفضل 3 منشورات وأسوأ قناة إنفاق",
    detail: "توصية واحدة قابلة للتنفيذ: نقل 20% من ميزانية الإعلانات إلى تيك توك.",
    channel: "analytics",
    status: "done",
    time: "أمس",
  },
];

export const kpis = [
  { k: "مهمة أُنجزت هذا الأسبوع", v: "184", d: "+23% عن الأسبوع الماضي" },
  { k: "ساعة عمل موفَّرة", v: "68", d: "ما يعادل موظفَين بدوام كامل" },
  { k: "منشور مجدول", v: "26", d: "على 7 منصات" },
  { k: "تحتاج موافقتك", v: "3", d: "متوسط الانتظار 9 دقائق" },
];

export const statusLabel: Record<WorkItem["status"], string> = {
  done: "مُنجز",
  running: "قيد التنفيذ",
  review: "بانتظار موافقتك",
};
