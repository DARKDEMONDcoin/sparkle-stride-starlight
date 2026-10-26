import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAdsBaseline, startAdsBaseline, resumeAdsBaseline, saveAdsContextNote, reviewAdsOutcomes } from "@/lib/ads/baseline.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { RefreshCw, Play, BookOpenCheck, Save } from "lucide-react";

const list = (value: unknown) => { const parsed = z.array(z.string()).safeParse(value); return parsed.success ? parsed.data : []; };
export function AdsBaseline({ workspaceId }: { workspaceId: string }) {
  const [accountId, setAccountId] = useState<string>();
  const [note, setNote] = useState(""); const [since, setSince] = useState(""); const [until, setUntil] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const load = useServerFn(getAdsBaseline); const start = useServerFn(startAdsBaseline); const resume = useServerFn(resumeAdsBaseline); const save = useServerFn(saveAdsContextNote);
  const review = useServerFn(reviewAdsOutcomes);
  const query = useQuery({ queryKey: ["ads-baseline", workspaceId, accountId], queryFn: () => load({ data: { workspaceId, accountId } }), retry: false });
  const data = query.data; const baseline = data?.baseline; const job = data?.jobs[0];
  const run = async (operation: () => Promise<unknown>) => { setBusy(true); setError(""); try { await operation(); await query.refetch(); } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذّر حفظ المراجعة."); } finally { setBusy(false); } };
  const quality = z.object({ reviewedRows: z.number(), matureDays: z.number(), excluded: z.number() }).safeParse(baseline?.data_quality);
  const progress = z.object({ completed: z.number(), total: z.number() }).safeParse(job?.progress);
  return <section className="space-y-6 border-t border-border py-5" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold">أساس الحساب</h1><div className="flex flex-wrap items-center gap-2">
      {Boolean(data?.accounts.length) && <Select value={accountId ?? data?.account?.id ?? ""} onValueChange={setAccountId}><SelectTrigger className="w-56 max-w-full" aria-label="الحساب الإعلاني"><SelectValue /></SelectTrigger><SelectContent>{data?.accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name ?? a.external_id}</SelectItem>)}</SelectContent></Select>}
      <Button variant="ghost" size="icon" aria-label="تحديث تقرير الحساب" title="تحديث تقرير الحساب" onClick={() => void query.refetch()}><RefreshCw className="size-4" /></Button>
    </div></div>
    <p role="status" className="text-sm text-muted-foreground">Pipeboard متوقف · لا مزامنة مباشرة أو تغييرات إعلانية.</p>
    {query.isPending && <p role="status">جارٍ تحميل تقرير الحساب…</p>}
    {(query.error || error) && <p role="alert" className="text-destructive">{error || query.error?.message}</p>}
    {data && !data.account && <p className="text-muted-foreground">لا توجد حسابات إعلانية محفوظة بعد.</p>}
    {data?.account && <>
      <div className="flex flex-wrap items-center gap-3"><Button disabled={busy || job?.status === "queued" || job?.status === "running"} onClick={() => { const account = data.account; if (account) void run(() => start({ data: { workspaceId, accountId: account.id } })); }}><BookOpenCheck className="size-4" />{baseline ? "إعادة مراجعة البيانات المحفوظة" : "مراجعة البيانات المحفوظة"}</Button>
      {job && ["queued", "running"].includes(job.status) && <Button variant="outline" disabled={busy} onClick={() => { const account = data.account; if (account) void run(() => resume({ data: { workspaceId, accountId: account.id, jobId: job.id } })); }}><Play className="size-4" />استكمال المراجعة</Button>}</div>
      {job && <p role="status" className="text-sm text-muted-foreground">{job.status === "paused" ? "المراجعة متوقفة: يلزم تاريخ مزامنة موثّق قبل التوصيات." : "جارٍ تعلّم حسابك…"}{progress.success && ` · ${progress.data.completed} سجل تمت مراجعته`}</p>}
      {baseline && <>
        <div className="border-y border-border py-4"><h2 className="font-semibold">{baseline.status === "ready" ? "التقرير جاهز" : "الأدلة غير مكتملة"}</h2><p className="mt-2 text-sm text-muted-foreground">{baseline.mode === "new_account" ? "حساب جديد أو قليل البيانات · ثقة منخفضة · دون ادعاءات أداء" : "حساب ذو تاريخ محفوظ"}</p></div>
        {quality.success && <dl className="grid grid-cols-3 gap-3">{[["السجلات المراجعة", quality.data.reviewedRows], ["الأيام الناضجة", quality.data.matureDays], ["السجلات المستبعدة", quality.data.excluded]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl>}
        <div><h2 className="mb-3 font-semibold">حدود ما يمكن استنتاجه</h2><ul className="list-disc space-y-2 ps-5 text-sm text-muted-foreground">{list(baseline.limitations).map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><h2 className="mb-3 font-semibold">سياق يحتاج توضيحاً</h2><ol className="list-decimal space-y-2 ps-5 text-sm">{list(baseline.context_questions).slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ol></div>
      </>}
      <form className="space-y-3 border-t border-border pt-5" onSubmit={(event) => { event.preventDefault(); const account = data.account; if (account) void run(async () => { await save({ data: { workspaceId, accountId: account.id, note, since: since || undefined, until: until || undefined } }); setNote(""); }); }}><h2 className="font-semibold">ملاحظات الفترة</h2><Textarea aria-label="سياق الحساب" placeholder="عروض، نفاد مخزون، تغييرات الموقع أو الأهداف…" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} required /><div className="flex flex-wrap gap-3"><label className="text-sm">من<Input type="date" value={since} onChange={(e) => setSince(e.target.value)} /></label><label className="text-sm">إلى<Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} /></label></div><Button type="submit" disabled={busy || !note.trim()} variant="outline"><Save className="size-4" />حفظ الملاحظة</Button></form>
      {data.notes.map((item) => <p key={item.id} className="border-b border-border pb-3 text-sm whitespace-pre-wrap break-words">{item.note}<span className="block text-xs text-muted-foreground">{item.period_start} — {item.period_end}</span></p>)}
      <div className="border-t border-border pt-5"><h2 className="mb-3 font-semibold">الدروس السابقة</h2>{data.learnings.length ? data.learnings.map((item) => <p key={item.id} className="mb-3 text-sm">{item.learning} · {item.outcome} · {item.confidence}</p>) : <p className="text-sm text-muted-foreground">لا توجد نتائج تغييرات موثقة محفوظة بعد.</p>}</div>
      <Button variant="outline" disabled={busy} onClick={() => { const account = data.account; if (account) void run(() => review({ data: { workspaceId, accountId: account.id } })); }}><BookOpenCheck className="size-4" />مراجعة نتائج التغييرات المستحقة</Button>
    </>}
  </section>;
}