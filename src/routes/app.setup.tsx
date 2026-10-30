import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Target } from "lucide-react";
import { team } from "@/data/team";
import { Portrait } from "@/components/site/Portrait";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/data";
import { employeeSlug } from "@/lib/employee-slugs";
import {
  buildOnboarding, defaultAnswers, setupSkipKey, defaultGeneralFor, employeeSetups, generalObjectivesFor, horizonLabel, mergeEmployeeSetup, setupEmployeeIds, type Horizon, type SavedOnboarding,
} from "@/lib/onboarding-objectives";
import { readWelcomeDraft } from "@/lib/welcome-draft";
import { z } from "zod";

export const Route = createFileRoute("/app/setup")({
  head: () => ({ meta: [
    { title: "حدد أهدافك وجهّز فريقك | زياد" },
    { name: "description", content: "اختر أهداف مشروعك وأهداف كل موظف بأسئلة قصيرة وإجابات جاهزة." },
    { property: "og:title", content: "حدد أهدافك وجهّز فريقك | زياد" },
    { property: "og:description", content: "أهداف يتابعها فريق زياد في لوحة التحكم." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  validateSearch: z.object({ employee: z.string().max(20).optional() }),
  component: Setup,
});


function Setup() {
  const { data: workspace } = useWorkspace();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { employee: only } = Route.useSearch();
  const single = only && employeeSetups[only] ? only : undefined;
  const industry = (workspace as { industry?: string | null } | undefined)?.industry || readWelcomeDraft()?.industry || "";
  const generalList = useMemo(() => generalObjectivesFor(industry), [industry]);
  const [step, setStep] = useState(0);
  const [general, setGeneral] = useState<Record<string, { target: string; horizon: Horizon }>>({});
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (seeded || !workspace) return;
    setSeeded(true);
    setGeneral(Object.fromEntries(defaultGeneralFor(industry).map((id) => [id, { target: generalList.find((o) => o.id === id)?.defaultTarget ?? "", horizon: "3m" as Horizon }])));
  }, [workspace, seeded, industry, generalList]);
  const [employees, setEmployees] = useState<string[]>(setupEmployeeIds);
  const [empObj, setEmpObj] = useState<Record<string, string[]>>(() => Object.fromEntries(setupEmployeeIds.map((e) => [e, [employeeSetups[e]!.objectives[0]!.id]])));
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>(() => Object.fromEntries(setupEmployeeIds.map((e) => [e, defaultAnswers(e)])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const chosen = useMemo(() => single ? [single] : setupEmployeeIds.filter((e) => employees.includes(e)), [employees, single]);
  const offset = single ? 0 : 2;
  const total = offset + chosen.length;
  useEffect(() => { if (step > total - 1) setStep(total - 1); }, [total, step]);

  async function finish() {
    if (!workspace || saving) return;
    setSaving(true); setError("");
    const existing = ((workspace.profile as { onboarding?: SavedOnboarding } | null)?.onboarding) ?? null;
    const onboarding = single ? mergeEmployeeSetup(existing, single, empObj[single] ?? [], answers[single] ?? {})
      : buildOnboarding({ industry, general, employees: chosen, employeeObjectives: empObj, answers });
    const profile = { ...((workspace.profile as Record<string, unknown>) ?? {}), onboarding };
    const { error: e } = await supabase.from("workspaces").update({ profile: profile as never }).eq("id", workspace.id);
    setSaving(false);
    if (e) { setError("تعذّر الحفظ الآن. حاول مرة أخرى."); return; }
    await qc.invalidateQueries({ queryKey: ["workspace"] });
    if (single) void navigate({ to: "/app/chat/$id", params: { id: employeeSlug(single) } });
    else void navigate({ to: "/app" });
  }
  function skip() {
    if (workspace) { try { localStorage.setItem(setupSkipKey(workspace.id), "1"); } catch { /* optional */ } }
    void navigate({ to: "/app" });
  }
  const last = step === total - 1;
  const empId = step >= offset ? chosen[step - offset] : undefined;
  const member = empId ? team.find((m) => m.id === empId) : undefined;
  const setup = empId ? employeeSetups[empId] : undefined;

  return <div className="welcome-stage" dir="rtl">
    <header className="welcome-header">
      <span className="font-display text-xl font-black">زياد<span className="text-primary">.</span></span>
      <span className="welcome-header-note">الخطوة الأولى في لوحة التحكم</span>
      <Button variant="ghost" size="sm" onClick={skip}>لاحقًا</Button>
    </header>
    <main className="welcome-main">
      <div className="welcome-progress"><div className="flex justify-between text-xs font-bold text-muted-foreground"><span>{!single && step === 0 ? "أهداف مشروعك" : !single && step === 1 ? "فريقك" : `جلسة تعريف ${member?.name ?? ""}`}</span><span dir="ltr">{step + 1} / {total}</span></div><div className="welcome-progress-track" role="progressbar" aria-label="تقدم التهيئة" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step + 1}><span style={{ width: `${((step + 1) / total) * 100}%` }} /></div></div>
      <div key={step} className="welcome-appear welcome-content">
        {!single && step === 0 && <section className="welcome-centered">
          <span className="welcome-eyebrow"><Target className="size-4" /> أهداف عامة</span>
          <h1 className="welcome-title">ما الذي تريد تحقيقه؟</h1>
          <p className="welcome-lead">{industry && industry !== "أخرى" ? `أهداف شائعة في ${industry}. ` : ""}اخترنا هدفين شائعين. عدّل الرقم أو المدة إن أردت؛ سنتابعها في لوحة التحكم.</p>
          <div className="setup-goal-grid">{generalList.map((o) => {
            const on = general[o.id];
            return <div key={o.id} className={cn("setup-goal", on && "is-on")}>
              <button type="button" className="setup-goal-toggle" aria-pressed={Boolean(on)} onClick={() => setGeneral((g) => { const n = { ...g }; if (n[o.id]) delete n[o.id]; else n[o.id] = { target: o.defaultTarget, horizon: "3m" }; return n; })}>
                <span className="welcome-radio">{on && <Check className="size-3" />}</span>
                <span className="min-w-0 flex-1 text-start"><strong className="block text-sm">{o.title}</strong><span className="block text-xs text-muted-foreground">{o.hint}</span></span>
              </button>
              {on && <div className="setup-goal-fields">
                <label>الهدف <input dir="ltr" inputMode="numeric" value={on.target} maxLength={8} onChange={(e) => setGeneral((g) => ({ ...g, [o.id]: { ...on, target: e.target.value.replace(/[^\d.]/g, "") } }))} /> <span>{o.unit}</span></label>
                <label>خلال <select value={on.horizon} onChange={(e) => setGeneral((g) => ({ ...g, [o.id]: { ...on, horizon: e.target.value as Horizon } }))}>{(Object.keys(horizonLabel) as Horizon[]).map((h) => <option key={h} value={h}>{horizonLabel[h]}</option>)}</select></label>
              </div>}
            </div>;
          })}</div>
        </section>}
        {!single && step === 1 && <section className="welcome-centered">
          <span className="welcome-eyebrow">فريقك</span>
          <h1 className="welcome-title">من يعمل معك من البداية؟</h1>
          <p className="welcome-lead">الفريق كاملًا مختار. أزل من لا تحتاجه الآن؛ يمكنك إضافته لاحقًا.</p>
          <div className="mt-4 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">{team.filter((m) => employeeSetups[m.id]).map((m) => {
            const on = employees.includes(m.id);
            return <button key={m.id} type="button" aria-pressed={on} onClick={() => setEmployees((l) => on ? l.filter((x) => x !== m.id) : [...l, m.id])} className={cn("setup-member", on && "is-on")}>
              <Portrait memberId={m.id} name={m.name} className="size-14 rounded-2xl" />
              <strong className="text-sm">{m.name}</strong><span className="text-xs text-muted-foreground">{m.role}</span>
              <span className="welcome-radio">{on && <Check className="size-3" />}</span>
            </button>;
          })}</div>
        </section>}
        {member && setup && empId && <section className="welcome-centered">
          <div className="flex items-center gap-3"><Portrait memberId={member.id} name={member.name} className="size-14 rounded-2xl" /><div className="text-start"><strong className="block font-display text-lg">{member.name}</strong><span className="text-xs text-muted-foreground">{member.role}</span></div></div>
          <h1 className="welcome-title mt-3">ما هدفك مع {member.name}؟</h1>
          <div className="welcome-choices">{setup.objectives.map((o) => {
            const on = (empObj[empId] ?? []).includes(o.id);
            return <button key={o.id} type="button" aria-pressed={on} onClick={() => setEmpObj((s) => ({ ...s, [empId]: on ? (s[empId] ?? []).filter((x) => x !== o.id) : [...(s[empId] ?? []), o.id] }))} className={cn("welcome-choice", on && "welcome-choice-active")}>
              <span className="min-w-0 flex-1 text-start"><strong className="block text-sm">{o.title}</strong><span className="block text-xs font-normal text-muted-foreground">{o.defaultTarget} {o.unit} خلال 3 أشهر</span></span>
              <span className="welcome-radio">{on && <Check className="size-3" />}</span>
            </button>;
          })}</div>
          <div className="mt-5 w-full space-y-4 text-start">{setup.questions.map((q) => <div key={q.id}>
            <p className="text-sm font-bold">{q.q}</p>
            <div className="mt-2 flex flex-wrap gap-2">{q.options.map((opt) => {
              const on = answers[empId]?.[q.id] === opt;
              return <button key={opt} type="button" aria-pressed={on} onClick={() => setAnswers((a) => ({ ...a, [empId]: { ...(a[empId] ?? {}), [q.id]: opt } }))} className={cn("setup-chip", on && "is-on")}>{opt}</button>;
            })}</div>
          </div>)}</div>
          <p className="welcome-disclaimer">الإجابات المحددة افتراضية؛ اضغط «التالي» إن كانت مناسبة.</p>
        </section>}
        {error && <p className="welcome-error" role="alert">{error}</p>}
      </div>
      <footer className="welcome-footer">
        <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className="welcome-back"><ArrowRight /> السابق</Button>
        {!single && step >= 1 && !last ? <Button type="button" variant="link" onClick={() => void finish()} disabled={saving || !workspace}>احفظ بالإجابات الافتراضية</Button> : <span className="welcome-footer-spacer" />}
        {last ? <Button type="button" className="welcome-next" disabled={saving || !workspace} onClick={() => void finish()}>{saving ? "جارٍ الحفظ…" : single ? `احفظ وابدأ مع ${member?.name ?? ""}` : "احفظ الأهداف وابدأ"} <ArrowLeft /></Button>
          : <Button type="button" className="welcome-next" disabled={!single && (step === 0 && !Object.keys(general).length || step === 1 && !chosen.length)} onClick={() => setStep((s) => s + 1)}>التالي <ArrowLeft /></Button>}
      </footer>
    </main>
  </div>;
}
