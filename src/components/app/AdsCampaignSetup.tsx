import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdsSetup, saveAdsIntake, summarizeAdsWebsite, createAdsDraft, decideAdsDraft, createAdsDraftPaused, launchAdsDraft } from "@/lib/ads/drafts.functions";
import { generateDraftCopy, decideDraftCreative, generateCreativeImage, decideCreativeImage, type DraftCreative, type Ratio } from "@/lib/ads/creatives.functions";
import { INTAKE_STEPS, allowableCpa, contradictions, feasibility, missingRequired, type IntakeAnswers } from "@/lib/ads/intake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ClipboardList, Check, X, PauseCircle, Rocket, Globe } from "lucide-react";

type F = { key: keyof IntakeAnswers; label: string; kind?: "num" | "list" | "area" | "choice" | "langs" | "track"; options?: [string, string][]; optional?: boolean };
const FIELDS: Record<number, F[]> = {
  1: [{ key: "businessName", label: "اسم النشاط" }, { key: "website", label: "رابط الموقع" }, { key: "landingPages", label: "صفحات الوصول المعلن عنها (رابط في كل سطر)", kind: "list" }],
  2: [{ key: "industry", label: "المجال" }],
  3: [{ key: "products", label: "المنتجات أو الخدمات المعلن عنها", kind: "area" }, { key: "priorities", label: "ما الذي تريد نموه تحديداً، ولأي شريحة؟", kind: "area" }, { key: "segments", label: "شرائح العملاء المستهدفة للنمو", optional: true }],
  4: [{ key: "markets", label: "الأسواق: دول أو مناطق أو مدن (واحد في كل سطر)", kind: "list" }, { key: "audience", label: "الشريحة الأساسية: العمر والاهتمامات", kind: "area" }, { key: "b2b", label: "نوع العملاء", kind: "choice", options: [["b2b", "شركات"], ["b2c", "أفراد"], ["both", "كلاهما"]], optional: true }],
  5: [{ key: "goal", label: "هدف الحملة", kind: "choice", options: [["leads", "عملاء محتملون"], ["sales", "مبيعات"], ["traffic", "زيارات"], ["awareness", "وعي"]] }],
  6: [{ key: "aov", label: "متوسط قيمة الطلب أو الصفقة", kind: "num" }, { key: "margin", label: "هامش الربح (0 إلى 1، مثل 0.4)", kind: "num" }, { key: "ltv", label: "القيمة مدى الحياة إن عُرفت", kind: "num", optional: true }, { key: "closeRate", label: "نسبة تحويل العميل المحتمل لعميل (0 إلى 1، للعملاء المحتملين)", kind: "num", optional: true }, { key: "salesCycleDays", label: "طول دورة البيع بالأيام", kind: "num", optional: true }, { key: "confirmedCpa", label: "أؤكد الحد المسموح لتكلفة التحويل", kind: "num" }],
  7: [{ key: "monthlyBudget", label: "الميزانية الشهرية (بعملة الحساب)", kind: "num" }, { key: "dailyCap", label: "حد يومي اختياري", kind: "num", optional: true }],
  8: [{ key: "usp", label: "الميزة الفريدة", kind: "area" }, { key: "offers", label: "العروض الحالية", optional: true }, { key: "proof", label: "إثباتات: تقييمات، سنوات، أرقام", kind: "area", optional: true }],
  9: [{ key: "competitors", label: "المنافسون وما يركزون عليه", kind: "area", optional: true }],
  10: [{ key: "tone", label: "نبرة العلامة" }, { key: "languages", label: "لغة الإعلانات لكل سوق", kind: "langs" }],
  11: [{ key: "assets", label: "الأصول المتاحة: شعار، صور، فيديو، ألوان", kind: "area", optional: true }, { key: "customerList", label: "قائمة عملاء متاحة؟", kind: "choice", options: [["yes", "نعم"], ["no", "لا"]], optional: true }],
  12: [{ key: "tracking", label: "حالة التتبع", kind: "track" }, { key: "conversionEvent", label: "ما الذي يُحتسب تحويلاً؟ (شراء، نموذج، اتصال، حجز)" }, { key: "offlineConversions", label: "تأهيل العملاء لاحقاً في CRM؟", kind: "choice", options: [["yes", "نعم"], ["no", "لا"]], optional: true }],
  13: [{ key: "catalog", label: "كتالوج منتجات / Merchant Center / كتالوج Meta (للمتاجر)", kind: "choice", options: [["yes", "نعم"], ["no", "لا"], ["unsure", "غير متأكد"]], optional: true }],
  14: [{ key: "metaPage", label: "صفحة فيسبوك (مطلوبة لـ Meta)", optional: true }, { key: "instagram", label: "حساب إنستغرام", optional: true }],
};
const TRACK: [string, string][] = [["googleTag", "وسم Google"], ["enhanced", "التحويلات المحسّنة"], ["pixel", "Meta Pixel"], ["capi", "Conversions API"]];
const statusLabel: Record<string, string> = { awaiting_approval: "بانتظار اعتمادك", approved: "معتمدة — لم تُنشأ بعد", paused_created: "منشأة ومتوقفة", launched: "أُطلقت", rejected: "مرفوضة", draft: "مسودة" };

export function AdsCampaignSetup({ workspaceId }: { workspaceId: string }) {
  const [accountId, setAccountId] = useState<string>(); const [open, setOpen] = useState(false); const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<IntakeAnswers>({}); const [summary, setSummary] = useState<string>("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState<string[]>([]);
  const load = useServerFn(getAdsSetup), save = useServerFn(saveAdsIntake), summarize = useServerFn(summarizeAdsWebsite), create = useServerFn(createAdsDraft), decide = useServerFn(decideAdsDraft), pause = useServerFn(createAdsDraftPaused), launch = useServerFn(launchAdsDraft), gen = useServerFn(generateDraftCopy), decideC = useServerFn(decideDraftCreative), genImg = useServerFn(generateCreativeImage), decideImg = useServerFn(decideCreativeImage);
  const query = useQuery({ queryKey: ["ads-setup", workspaceId, accountId], queryFn: () => load({ data: { workspaceId, accountId } }), retry: false });
  const data = query.data; const account = data?.account; const platform = (account?.platform === "meta" ? "meta" : "google") as "google" | "meta";
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); setError(""); try { await fn(); await query.refetch(); } catch (e) { setError(e instanceof Error ? e.message : "تعذّر إكمال الطلب."); } finally { setBusy(false); } };
  const openWizard = () => { setAnswers((data?.profile?.answers ?? {}) as IntakeAnswers); setSummary(data?.profile?.site_summary ?? ""); setStep(1); setOpen(true); };
  const set = (k: keyof IntakeAnswers, v: unknown) => setAnswers((a) => ({ ...a, [k]: v }));
  const missing = missingRequired(answers, [platform]); const calc = allowableCpa(answers); const feas = feasibility(answers, [platform]); const issues = contradictions(answers);
  const field = (f: F) => {
    const v = answers[f.key]; const id = `f-${f.key}`;
    const label = <label htmlFor={id} className="text-sm font-medium">{f.label} {f.optional ? <span className="text-xs text-muted-foreground">(اختياري)</span> : <span className="text-destructive">*</span>}</label>;
    if (f.kind === "choice") return <div key={f.key} className="space-y-1">{label}<Select value={(v as string) ?? ""} onValueChange={(x) => set(f.key, x)}><SelectTrigger id={id}><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent>{f.options?.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>;
    if (f.kind === "track") return <div key={f.key} className="space-y-2">{label}{TRACK.map(([k, l]) => <div key={k} className="flex items-center justify-between gap-2 text-sm"><span>{l}</span><Select value={answers.tracking?.[k as "pixel"] ?? ""} onValueChange={(x) => set("tracking", { ...answers.tracking, [k]: x })}><SelectTrigger className="w-36" aria-label={l}><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent><SelectItem value="yes">نعم</SelectItem><SelectItem value="no">لا</SelectItem><SelectItem value="unsure">غير متأكد</SelectItem></SelectContent></Select></div>)}</div>;
    if (f.kind === "langs") return <div key={f.key} className="space-y-2">{label}{!(answers.markets ?? []).length && <p className="text-xs text-muted-foreground">أضف الأسواق في الخطوة 4 أولاً.</p>}{(answers.markets ?? []).map((m) => <div key={m} className="flex items-center gap-2"><span className="w-32 truncate text-sm">{m}</span><Input aria-label={`لغة ${m}`} value={answers.languages?.[m] ?? ""} onChange={(e) => set("languages", { ...answers.languages, [m]: e.target.value })} /></div>)}</div>;
    if (f.kind === "list") return <div key={f.key} className="space-y-1">{label}<Textarea id={id} rows={3} value={((v as string[]) ?? []).join("\n")} onChange={(e) => set(f.key, e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} /></div>;
    if (f.kind === "area") return <div key={f.key} className="space-y-1">{label}<Textarea id={id} rows={3} value={(v as string) ?? ""} onChange={(e) => set(f.key, e.target.value)} /></div>;
    return <div key={f.key} className="space-y-1">{label}<Input id={id} type={f.kind === "num" ? "number" : "text"} inputMode={f.kind === "num" ? "decimal" : undefined} value={(v as string | number) ?? ""} onChange={(e) => set(f.key, f.kind === "num" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value)} /></div>;
  };
  return <section className="space-y-5 border-t border-border py-5" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold">حملات جديدة</h1>{Boolean(data?.accounts.length) && <Select value={accountId ?? account?.id ?? ""} onValueChange={setAccountId}><SelectTrigger className="w-56" aria-label="الحساب الإعلاني"><SelectValue /></SelectTrigger><SelectContent>{data?.accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name ?? a.external_id} · {a.platform}</SelectItem>)}</SelectContent></Select>}</div>
    <p className="text-sm text-muted-foreground">الترتيب: ملف النشاط ← فحص الجدوى ← دروس الحساب ← خطة للاعتماد ← إنشاء متوقف ← تأكيد إطلاق نهائي. الإنشاء على المنصة متوقف حالياً مع توقف Pipeboard.</p>
    {query.isPending && <p role="status">جارٍ التحميل…</p>}{(error || query.error) && <p role="alert" className="text-destructive">{error || query.error?.message}</p>}
    {notice.length > 0 && <ul role="status" className="list-disc space-y-1 pe-5 text-sm">{notice.map((n) => <li key={n}>{n}</li>)}</ul>}
    {data && !account && <p className="text-muted-foreground">لا توجد حسابات إعلانية محفوظة بعد.</p>}
    {account && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={openWizard}><ClipboardList className="size-4" />{data?.profile ? "مراجعة ملف النشاط" : "إكمال ملف النشاط"}</Button><Button disabled={busy || !data?.profile} onClick={() => void run(async () => { const r = await create({ data: { workspaceId, accountId: account.id, platform } }); setNotice(r.created ? ["حُفظت خطة الحملة بانتظار اعتمادك."] : r.missing.length ? [`حقول مطلوبة ناقصة: ${r.missing.length}. أكمل ملف النشاط.`] : r.questions); })}>اقتراح خطة حملة</Button></div>}
    {account && <p className="text-xs text-muted-foreground">العملة والمنطقة الزمنية من الحساب فقط: {account.currency ?? "غير معروفة"} · {account.timezone ?? "غير معروفة"} · الأساس: {data?.baseline?.status ?? "غير موجود"}</p>}
    {data?.drafts.map((d) => { const s = (d.spec ?? {}) as Record<string, any>; const lessons = (Array.isArray(d.lessons_from_history) ? d.lessons_from_history : []) as { learning: string }[];
      return <article key={d.id} className="space-y-3 border-b border-border py-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-medium">{d.platform === "meta" ? "Meta Advantage+" : "Google Search"} · {s["objective"] ?? ""}</h2><span className="text-sm text-muted-foreground">{statusLabel[d.status] ?? d.status}</span></div>
        <p className="text-sm">{s["why"]}</p>
        <dl className="grid gap-2 text-sm sm:grid-cols-3"><div><dt className="text-muted-foreground">الميزانية الشهرية</dt><dd>{s["budget"]?.monthly} {s["budget"]?.currency ?? ""}</dd></div><div><dt className="text-muted-foreground">يومياً تقريباً</dt><dd>{s["budget"]?.derivedDaily ?? "—"}</dd></div><div><dt className="text-muted-foreground">التكلفة المؤكدة</dt><dd>{s["budget"]?.confirmedCpa ?? "—"}</dd></div><div><dt className="text-muted-foreground">جاهزية التتبع</dt><dd>{s["trackingReadiness"] === "ready" ? "جاهز" : "يبدأ بالإصلاح"}</dd></div><div><dt className="text-muted-foreground">الأسواق</dt><dd>{(s["markets"] ?? []).map((m: any) => `${m.market} (${m.language})`).join("، ")}</dd></div>{s["specialAdCategories"]?.length > 0 && <div><dt className="text-muted-foreground">فئات إعلانية خاصة</dt><dd>{s["specialAdCategories"].join("، ")}</dd></div>}</dl>
        {s["budget"]?.learning?.issues?.length > 0 && <ul className="list-disc space-y-1 pe-5 text-sm text-destructive">{s["budget"].learning.issues.map((i: string) => <li key={i}>{i}</li>)}</ul>}
        <div className="text-sm"><p className="text-muted-foreground">دروس من تاريخ الحساب</p><ul className="list-disc pe-5">{lessons.map((l) => <li key={l.learning}>{l.learning}</li>)}</ul></div>
        {d.status === "approved" && <div className="space-y-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">نصوص الإعلانات (مولّدة بالذكاء الاصطناعي — اعتمد كل نص على حدة)</p><Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => gen({ data: { workspaceId, draftId: d.id } }))}>كتابة النصوص</Button></div>
          {((Array.isArray(d.creatives) ? d.creatives : []) as unknown as DraftCreative[]).map((c) => <div key={c.id} className="space-y-2 rounded-md border border-border p-3 text-sm" dir="auto">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{c.concept} · {c.market} ({c.language})</span><span className="text-xs text-muted-foreground">{c.status === "approved" ? "معتمد" : c.status === "rejected" ? "مرفوض" : "بانتظار قرارك"}</span></div>
            <p className="text-xs text-muted-foreground">{c.hypothesis}</p>
            {c.primary.map((t, i) => <p key={`p${i}`}>{t} <span className="text-xs text-muted-foreground">({[...t].length})</span></p>)}
            <ul className="space-y-0.5">{c.headlines.map((h, i) => <li key={`h${i}`}>{h} <span className={d.platform === "google" && [...h].length > 30 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>({[...h].length}{d.platform === "google" ? "/30" : ""})</span></li>)}</ul>
            {c.descriptions.map((t, i) => <p key={`d${i}`} className="text-muted-foreground">{t} <span className="text-xs">({[...t].length}{d.platform === "google" ? "/90" : ""})</span></p>)}
            {c.issues.length > 0 && <ul className="list-disc pe-5 text-xs text-destructive">{c.issues.map((x) => <li key={x}>{x}</li>)}</ul>}
            {c.status === "pending" && <div className="flex gap-2"><Button size="sm" disabled={busy || c.issues.length > 0} onClick={() => void run(() => decideC({ data: { workspaceId, draftId: d.id, creativeId: c.id, decision: "approve" } }))}><Check className="size-4" />اعتماد</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(() => decideC({ data: { workspaceId, draftId: d.id, creativeId: c.id, decision: "reject" } }))}><X className="size-4" />رفض</Button></div>}
            {c.status === "approved" && <div className="space-y-2 border-t border-border pt-2"><div className="flex flex-wrap gap-2">{(["1:1", "4:5", "9:16", "16:9"] as Ratio[]).map((r) => <Button key={r} size="sm" variant="outline" disabled={busy} onClick={() => void run(() => genImg({ data: { workspaceId, draftId: d.id, creativeId: c.id, ratio: r } }))}>صورة {r}</Button>)}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{(c.images ?? []).map((im) => <figure key={im.id} className="space-y-1">{data?.imageUrls?.[im.path] ? <img src={data.imageUrls[im.path]} alt={`${c.concept} ${im.ratio}`} className="w-full rounded-md border border-border object-cover" loading="lazy" /> : <div className="aspect-square rounded-md bg-muted" />}<figcaption className="flex items-center justify-between gap-1 text-xs text-muted-foreground"><span>{im.ratio} · ذكاء اصطناعي · {im.status === "approved" ? "معتمدة" : im.status === "rejected" ? "مرفوضة" : "بانتظارك"}</span>{im.status === "pending" && <span className="flex gap-1"><Button size="icon" variant="ghost" className="size-6" aria-label="اعتماد الصورة" disabled={busy} onClick={() => void run(() => decideImg({ data: { workspaceId, draftId: d.id, creativeId: c.id, imageId: im.id, decision: "approve" } }))}><Check className="size-3" /></Button><Button size="icon" variant="ghost" className="size-6" aria-label="رفض الصورة" disabled={busy} onClick={() => void run(() => decideImg({ data: { workspaceId, draftId: d.id, creativeId: c.id, imageId: im.id, decision: "reject" } }))}><X className="size-3" /></Button></span>}</figcaption></figure>)}</div></div>}
          </div>)}</div>}
        <div className="flex flex-wrap gap-2">
          {d.status === "awaiting_approval" && <><Button size="sm" disabled={busy} onClick={() => void run(() => decide({ data: { workspaceId, draftId: d.id, decision: "approve" } }))}><Check className="size-4" />اعتماد الخطة</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => decide({ data: { workspaceId, draftId: d.id, decision: "reject" } }))}><X className="size-4" />رفض</Button></>}
          {d.status === "approved" && <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => pause({ data: { workspaceId, draftId: d.id } }))}><PauseCircle className="size-4" />إنشاء متوقف على المنصة</Button>}
          {d.status === "paused_created" && <Button size="sm" disabled={busy} onClick={() => { if (window.confirm(`تأكيد الإطلاق: الميزانية الشهرية ${s["budget"]?.monthly} ${s["budget"]?.currency ?? ""}`)) void run(() => launch({ data: { workspaceId, draftId: d.id } })); }}><Rocket className="size-4" />إطلاق</Button>}
        </div>
      </article>; })}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle>ملف النشاط · {step}/14 · {INTAKE_STEPS[step - 1]?.title}</DialogTitle></DialogHeader>
      <div className="space-y-4">
        {FIELDS[step]?.map(field)}
        {step === 1 && answers.website && <div className="space-y-2"><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void run(async () => { const r = await summarize({ data: { workspaceId, url: answers.website! } }); setSummary(r.summary); })}><Globe className="size-4" />تلخيص الموقع</Button><Textarea aria-label="ملخص الموقع" rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="ملخص قابل للتعديل" /></div>}
        {step === 6 && <p className="text-sm text-muted-foreground">المحسوب من أرقامك: {calc ?? "أكمل القيمة والهامش" } — أكّده أو عدّله.</p>}
        {step === 7 && <ul className="list-disc space-y-1 pe-5 text-sm">{feas.issues.map((i) => <li key={i}>{i}</li>)}</ul>}
        {issues.length > 0 && <ul className="list-disc space-y-1 pe-5 text-sm text-destructive">{issues.map((i) => <li key={i}>{i}</li>)}</ul>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"><span className="text-xs text-muted-foreground">حقول مطلوبة متبقية: {missing.length}</span><div className="flex gap-2">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>السابق</Button>
          {step < 14 ? <Button onClick={() => setStep((s) => s + 1)}>التالي</Button> : <Button disabled={busy || !account} onClick={() => account && void run(async () => { await save({ data: { workspaceId, accountId: account.id, answers: answers as Record<string, unknown>, siteSummary: summary || null } }); setOpen(false); })}>حفظ</Button>}
        </div></div>
      </div>
    </DialogContent></Dialog>
  </section>;
}
