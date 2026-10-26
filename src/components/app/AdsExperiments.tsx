import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listExperiments, planExperiment, moveExperiment } from "@/lib/ads/experiments.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical } from "lucide-react";

const STATUS: Record<string, string> = { planned: "مخطّطة", running: "قيد التشغيل", completed: "منتهية", cancelled: "ملغاة" };
const OUTCOME: Record<string, string> = { winner: "فازت", loser: "خسرت", inconclusive: "غير حاسمة" };

export function AdsExperiments({ workspaceId, accountId }: { workspaceId: string; accountId: string }) {
  const list = useServerFn(listExperiments), plan = useServerFn(planExperiment), move = useServerFn(moveExperiment);
  const q = useQuery({ queryKey: ["ads-experiments", workspaceId, accountId], queryFn: () => list({ data: { workspaceId, accountId } }), retry: false });
  const [f, setF] = useState({ hypothesis: "", variable: "", lift: "10", conv: "30", days: "14", testDaily: "", accountDaily: "" });
  const [res, setRes] = useState<Record<string, { cv: string; cc: string; vv: string; vc: string }>>({});
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); setErr(""); try { await fn(); await q.refetch(); } catch (e) { setErr(e instanceof Error ? e.message : "تعذّر إكمال الطلب."); } finally { setBusy(false); } };
  const d = q.data;
  return <div className="space-y-4 rounded-lg border border-border p-4">
    <h2 className="flex items-center gap-2 font-semibold"><FlaskConical className="size-4" />التجارب الإعلانية</h2>
    <p className="text-sm text-muted-foreground">متغيّر واحد لكل تجربة، ومعيار نجاح يُحدَّد قبل البدء. ميزانية التجارب لا تتجاوز {d?.experimentPercent ?? 15}% من الميزانية اليومية. النتائج تُدخلها أنت حتى يتوفر الربط بالمنصة.</p>
    {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
    <div className="grid gap-2 sm:grid-cols-2">
      <Textarea aria-label="الفرضية" placeholder="الفرضية: مثلاً زاوية التوفير تخفض تكلفة التحويل" className="sm:col-span-2" rows={2} value={f.hypothesis} onChange={(e) => setF({ ...f, hypothesis: e.target.value })} />
      <Input aria-label="المتغيّر المختبَر" placeholder="المتغيّر: العنوان، الصورة، العرض…" value={f.variable} onChange={(e) => setF({ ...f, variable: e.target.value })} />
      <Input aria-label="المدة بالأيام" type="number" placeholder="المدة (أيام)" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} />
      <Input aria-label="أقل تحسّن مطلوب ٪" type="number" placeholder="أقل تحسّن في تكلفة التحويل ٪" value={f.lift} onChange={(e) => setF({ ...f, lift: e.target.value })} />
      <Input aria-label="أقل عدد تحويلات" type="number" placeholder="أقل تحويلات لكل مجموعة" value={f.conv} onChange={(e) => setF({ ...f, conv: e.target.value })} />
      <Input aria-label="ميزانية التجربة اليومية" type="number" placeholder="ميزانية التجربة اليومية" value={f.testDaily} onChange={(e) => setF({ ...f, testDaily: e.target.value })} />
      <Input aria-label="ميزانية الحساب اليومية" type="number" placeholder="ميزانية الحساب اليومية" value={f.accountDaily} onChange={(e) => setF({ ...f, accountDaily: e.target.value })} />
    </div>
    <Button size="sm" disabled={busy} onClick={() => void run(async () => { await plan({ data: { workspaceId, accountId, hypothesis: f.hypothesis, variable: f.variable, days: Number(f.days), testDaily: Number(f.testDaily), accountDaily: Number(f.accountDaily), criteria: { metric: "cpa", direction: "lower", minLiftPct: Number(f.lift), minConversions: Number(f.conv) } } }); setF({ ...f, hypothesis: "", variable: "" }); })}>حفظ التجربة</Button>
    <ul className="space-y-3">{d?.experiments.map((x) => { const r = res[x.id] ?? { cv: "", cc: "", vv: "", vc: "" }; const sum = x.result_summary as { outcome?: string } | null; return <li key={x.id} className="space-y-2 rounded-md border border-border p-3 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{x.variable_tested}</span><span className="text-muted-foreground">{STATUS[x.status]}{sum?.outcome ? ` · ${OUTCOME[sum.outcome]}` : ""}</span></div>
      <p>{x.hypothesis}</p>
      {x.status === "planned" && <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => void run(() => move({ data: { workspaceId, experimentId: x.id, to: "running" } }))}>بدء</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(() => move({ data: { workspaceId, experimentId: x.id, to: "cancelled" } }))}>إلغاء</Button></div>}
      {x.status === "running" && <div className="grid gap-2 sm:grid-cols-4">
        {([["cv", "تكلفة التحويل · الأصل"], ["cc", "تحويلات · الأصل"], ["vv", "تكلفة التحويل · البديل"], ["vc", "تحويلات · البديل"]] as const).map(([k, l]) => <Input key={k} aria-label={l} placeholder={l} type="number" value={r[k]} onChange={(e) => setRes({ ...res, [x.id]: { ...r, [k]: e.target.value } })} />)}
        <Button size="sm" disabled={busy} onClick={() => void run(() => move({ data: { workspaceId, experimentId: x.id, to: "completed", result: { control: { value: Number(r.cv), conversions: Number(r.cc) }, variant: { value: Number(r.vv), conversions: Number(r.vc) } } } }))}>إنهاء وتقييم</Button>
      </div>}
    </li>; })}</ul>
    {Boolean(d?.concepts.length) && <details className="text-sm"><summary className="cursor-pointer font-medium">المفاهيم الإبداعية المحفوظة ({d?.concepts.length})</summary><ul className="mt-2 space-y-1">{d?.concepts.map((c) => <li key={c.id}><span className="font-medium">{c.angle}</span> · {c.persona} — {c.hypothesis}</li>)}</ul></details>}
  </div>;
}
