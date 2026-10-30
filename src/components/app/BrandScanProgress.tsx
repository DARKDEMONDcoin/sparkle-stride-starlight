import { Check, Circle, CircleAlert, Globe2, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brandStages, type BrandJob, type BrandData } from "@/lib/brand-brain";
import { cn } from "@/lib/utils";
function findings(data?: BrandData) { if (!data) return []; return Object.values(data).flatMap((v) => Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []).filter(Boolean).slice(0, 6); }
export function BrandScanProgress({ job, queuedWebsite, onRetry, onManual }: { job?: BrandJob | null; queuedWebsite?: string; onRetry?: () => void; onManual?: () => void }) {
  const deferred = !job; const percent = job ? Math.round((job.stage / 4) * 100) : 0;
  const stale = job?.status === "running" && job.lease_until && new Date(job.lease_until).getTime() < Date.now();
  return <section className="brand-scan" dir="rtl" aria-label="تقدم تحليل الموقع">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">نتعرّف على علامتك</h2><p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Globe2 className="size-4" /><span dir="ltr" className="break-all">{job?.website ?? queuedWebsite}</span></p></div><span className="text-xs text-muted-foreground">{job?.sources.length ?? 0} صفحات مقروءة</span></div>
    <div className="my-5"><div className="mb-2 flex flex-wrap justify-between gap-2 text-xs"><b className="text-primary">اكتمل {percent}٪</b><span className="text-muted-foreground">{deferred ? "يبدأ التحليل الكامل بعد إنشاء حسابك" : job?.status === "completed" ? "اكتمل التحليل" : ["failed", "paused"].includes(job?.status ?? "") || stale ? "الفحص متوقف · نتائجك محفوظة" : `الوقت التقديري: ${(4 - (job?.stage ?? 0)) * 60} ثانية`}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="brand-progress-fill h-full bg-primary" style={{ width: `${percent}%` }} /></div></div>
    <ol className="brand-stepper">{brandStages.map((stage, i) => {
      const entry = job?.stages[i]; const state = stale && job?.stage === i ? "failed" : entry?.state ?? "waiting";
      const chips = findings(entry?.summary);
      return <li key={stage.key} className={cn("brand-step", state === "running" && "is-running")}>
        <span className={cn("brand-step-icon", state === "done" && "is-done", state === "running" && "is-running", state === "failed" && "is-failed")}>{state === "done" ? <Check className="size-4" /> : state === "running" ? <span className="brand-progress-ring" /> : state === "failed" ? <CircleAlert className="size-5" /> : <Circle className="size-5" />}</span>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className={cn("font-bold", state === "waiting" && "text-muted-foreground")}>{stage.label}</h3><span className="text-xs text-muted-foreground">{state === "done" ? "مكتمل" : state === "running" ? "جاري التحليل" : state === "failed" ? "تعذّر الإكمال" : "بانتظار المرحلة السابقة"}</span></div>
          <p className="mt-1 text-xs text-muted-foreground" role={state === "running" ? "status" : undefined}>{state === "failed" ? entry?.error ?? "انتهت مهلة المرحلة. أعد المحاولة." : state === "running" ? entry?.line : state === "done" ? "حُفظت النتائج من موقعك" : deferred ? "يبدأ بعد التسجيل" : ""}</p>
          {chips.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{chips.map((chip, index) => <span key={`${chip}-${index}`} className="brand-finding break-words rounded-md bg-secondary px-2.5 py-1 text-xs" dir="auto">{chip}</span>)}</div>}
          {state === "running" && <div className="mt-3 flex gap-2" aria-hidden="true"><span className="brand-skeleton h-5 w-20 rounded" /><span className="brand-skeleton h-5 w-16 rounded" /></div>}
          {state === "failed" && <div className="mt-3 flex flex-wrap gap-2">{onRetry && job?.error_status !== 403 && <Button variant="outline" size="sm" onClick={onRetry}><RotateCcw className="size-3.5" />إعادة المحاولة</Button>}{onManual && <Button variant="ghost" size="sm" onClick={onManual}>أدخل يدويًا</Button>}</div>}
        </div>
      </li>;
    })}</ol>
    <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" />{deferred ? "حفظنا الرابط؛ لن تحتاج إلى إدخاله مرة أخرى" : "تم حفظ النتائج حتى الآن · يمكنك العودة لاحقًا"}</p>
  </section>;
}