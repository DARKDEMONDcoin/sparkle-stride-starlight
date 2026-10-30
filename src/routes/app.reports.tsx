import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, PlugZap, Printer, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { SeoAuditCard } from "@/components/app/SeoAuditCard";
import { GoogleConnectButton } from "@/components/app/GoogleConnect";
import { VisitorsPanel } from "@/components/app/VisitorsPanel";
import { BrandLoader } from "@/components/site/BrandLoader";
import { useWorkspace } from "@/lib/data";
import { buildReport } from "@/lib/reports.functions";
import { EmployeeTopbar } from "@/components/app/EmployeeTopbar";
import { AppIcon, appLabel } from "@/components/site/AppIcon";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "تقارير آدم | زياد" },
      {
        name: "description",
        content: "تقارير آدم من بيانات Google Analytics وSearch Console مع حالة مصادر مساحة العمل المتصلة.",
      },
      { property: "og:title", content: "تقارير آدم | زياد" },
      { property: "og:description", content: "أداء الموقع والبحث ومصادر البيانات المتصلة في مساحة عملك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

const num = (n: number) => n.toLocaleString("ar-EG-u-nu-latn");

function Table({
  caption,
  rows,
}: {
  caption: string;
  rows: { key: string; clicks: number; impressions: number; ctr: number; position: number }[];
}) {
  if (!rows.length) return null;
  return (
    <section className="mt-6">
      <h3 className="font-display font-black">{caption}</h3>
      <div className="mt-2 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[34rem] text-start text-sm">
          <thead className="bg-secondary text-xs">
            <tr>
              <th className="sticky start-0 z-10 bg-secondary p-3 text-start font-bold">العنصر</th>
              <th className="p-3 text-start font-bold">نقرات</th>
              <th className="p-3 text-start font-bold">ظهور</th>
              <th className="p-3 text-start font-bold">CTR</th>
              <th className="p-3 text-start font-bold">متوسط الترتيب</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-border/70">
                <td className="sticky start-0 z-10 max-w-[11rem] truncate bg-background p-3 font-semibold shadow-[inset_-1px_0_0_var(--border)] sm:max-w-[22rem]">{r.key}</td>
                <td className="p-3">{num(r.clicks)}</td>
                <td className="p-3">{num(r.impressions)}</td>
                <td className="p-3">{(r.ctr * 100).toFixed(1)}%</td>
                <td className="p-3">{r.position.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SourceCard({
  label,
  status,
  workspaceId,
  kind,
}: {
  label: string;
  status: { state: "ok" | "not_connected" | "not_selected" | "error"; message: string };
  workspaceId: string | undefined;
  kind: "search-console" | "analytics";
}) {
  const ok = status.state === "ok";
  const tone =
    status.state === "ok"
      ? "border-jade/40 bg-jade/10"
      : status.state === "error"
        ? "border-coral/40 bg-coral/10"
        : "border-border bg-secondary/50";
  const Icon = ok ? CheckCircle2 : status.state === "error" ? AlertTriangle : PlugZap;
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${tone}`}>
      <Icon
        className={`mt-0.5 size-5 shrink-0 ${ok ? "text-jade" : status.state === "error" ? "text-coral" : "text-muted-foreground"}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{status.message}</p>
        {!ok ? (
          <span className="mt-2 inline-flex">
            <GoogleConnectButton
              workspaceId={workspaceId}
              kind={kind}
              size="sm"
              needsPick={status.state === "not_selected"}
              {...(status.state === "error" ? { label: "أعد الربط" } : {})}
            />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ReportsPage() {
  const { data: workspace } = useWorkspace();
  const build = useServerFn(buildReport);
  const [days, setDays] = useState(28);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["report", workspace?.id, days],
    enabled: Boolean(workspace?.id),
    queryFn: () => {
      if (!workspace) throw new Error("مساحة العمل غير جاهزة.");
      return build({ data: { workspaceId: workspace.id, days } });
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return (
    <AppShell
      title="تقارير آدم"
      hideTitle compactTitle
      actions={<EmployeeTopbar memberId="adam" active="reports" />}
    >
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div><h2 className="font-display text-2xl font-black">التقارير</h2><p className="mt-1 text-sm text-muted-foreground">{workspace?.name ?? "مساحة العمل"}</p></div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <ToggleGroup type="single" value={String(days)} onValueChange={value => { if (value) setDays(Number(value)); }} aria-label="فترة التقرير">
            {[7, 28, 90].map(value => <ToggleGroupItem key={value} value={String(value)} aria-label={`${value} يوماً`}>{value} يوماً</ToggleGroupItem>)}
          </ToggleGroup>
          <Button variant="outline" size="icon" disabled={isFetching || !workspace} onClick={() => void refetch()} aria-label="تحديث التقرير" title="تحديث التقرير"><RefreshCw className={`size-4 ${isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} /></Button>
          <Button variant="outline" size="icon" disabled={!data || isFetching} onClick={() => window.print()} aria-label="طباعة التقرير أو حفظ PDF" title="طباعة / PDF"><Printer className="size-4" /></Button>
        </div>
      </header>
      {isLoading ? (
        <BrandLoader size="sm" label="جارٍ تجميع البيانات…" />
      ) : error ? (
        <p className="rounded-2xl bg-coral/12 px-4 py-3 text-sm font-semibold text-coral">
          {error instanceof Error ? error.message : "تعذّر بناء التقرير"}
        </p>
      ) : !workspace && !isLoading ? (
        <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
          مساحة العمل غير جاهزة بعد — أعد تحميل الصفحة.
        </p>
      ) : data ? (
        <article>
          <header>
            <h2 className="font-display text-2xl font-black">
              أداء الموقع والبحث
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.workspace.industry}
              {data.range ? ` · ${data.range.start} → ${data.range.end}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">آخر جلب للتقرير: {new Date(data.fetchedAt).toLocaleString("ar-EG-u-nu-latn")} · الفترة تستبعد آخر 3 أيام لانتظار بيانات البحث.</p>
          </header>

          <section className="mt-6 border-y border-border py-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-display font-black">مصادر مساحة العمل المتصلة · {data.connectedSources.length}</h3><Button variant="outline" size="sm" asChild><Link to="/app/integrations"><PlugZap className="size-4" /> إدارة المصادر</Link></Button></div>
            {data.connectedSources.length ? <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.connectedSources.map(source => {
                const status = source.provider === "analytics" ? data.sources.analytics : source.provider === "search-console" ? data.sources.search : null;
                return <li key={source.provider} className="flex min-w-0 items-start gap-3 rounded-lg border border-border p-3"><AppIcon name={source.provider} className="size-6 shrink-0" /><div className="min-w-0"><p className="font-bold">{appLabel(source.provider)}</p>{source.account && <p className="break-words text-xs text-muted-foreground">{source.account}</p>}<p className={`mt-1 text-xs ${status?.state === "ok" ? "text-jade" : "text-muted-foreground"}`}>{status ? status.state === "ok" ? "بيانات التقرير متاحة" : status.message : "متصل · بيانات التقارير غير متاحة هنا بعد"}</p></div></li>;
              })}
            </ul> : <p className="mt-3 text-sm text-muted-foreground">لا توجد مصادر متصلة في مساحة العمل.</p>}
          </section>

          <div className="mt-4 grid gap-3 md:grid-cols-2 print:hidden">
            <SourceCard
              label="Google Search Console"
              status={data.sources.search}
              workspaceId={workspace?.id}
              kind="search-console"
            />
            <SourceCard
              label="Google Analytics 4"
              status={data.sources.analytics}
              workspaceId={workspace?.id}
              kind="analytics"
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "نقرات البحث", value: data.search ? num(data.search.totals.clicks) : "—" },
              {
                label: "مرات الظهور",
                value: data.search ? num(data.search.totals.impressions) : "—",
              },
              {
                label: "جلسات الموقع",
                value: data.analytics ? num(data.analytics.totals.sessions) : "—",
              },
              { label: "مستخدمو الموقع", value: data.analytics ? num(data.analytics.totals.users) : "—" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-black">{s.value}</p>
              </div>
            ))}
          </div>

          {data.search ? (
            <>
              <Table caption="أعلى الاستعلامات" rows={data.search.queries} />
              <Table caption="أعلى الصفحات" rows={data.search.pages} />
            </>
          ) : null}

          {data.opportunities.length ? (
            <section className="mt-6">
              <h3 className="font-display font-black">فرص قريبة من الصفحة الأولى</h3>
              <ul className="mt-2 space-y-2">
                {data.opportunities.map((o) => (
                  <li key={o.query} className="rounded-2xl border border-border p-4 text-sm">
                    <span className="font-bold">{o.query}</span>
                    <span className="mt-1 block text-muted-foreground">{o.reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.analytics ? (
            <section className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-display font-black">القنوات</h3>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {data.analytics.channels.map((c) => (
                    <li key={c.channel} className="flex justify-between gap-3">
                      <span>{c.channel}</span>
                      <span className="font-bold">{num(c.sessions)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-display font-black">صفحات هبوط البحث العضوي</h3>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {data.analytics.organicLandingPages.map((p) => (
                    <li key={p.page} className="flex justify-between gap-3">
                      <span className="truncate">{p.page}</span>
                      <span className="font-bold">{num(p.sessions)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          <section className="mt-6">
            <h3 className="font-display font-black">مهام مساحة العمل المنشأة خلال الفترة</h3>
            <p className="mt-1 text-sm text-muted-foreground">مكتملة: {data.work.published === null ? "—" : num(data.work.published)} · قيد المراجعة: {data.work.awaiting === null ? "—" : num(data.work.awaiting)}</p>
            {!data.work.recent.length && <p className="mt-2 text-sm text-muted-foreground">لا توجد مهام متاحة لهذه الفترة.</p>}
            <ul className="mt-2 space-y-1.5 text-sm">
              {data.work.recent.map((t) => (
                <li key={`${t.title}-${t.created_at}`} className="flex justify-between gap-3">
                  <span className="truncate">{t.title}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString("ar-EG-u-nu-latn")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          {data.notes.length > 0 && <ul className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">{data.notes.map(note => <li key={note}>{note}</li>)}</ul>}
        </article>
      ) : null}

      <div className="mt-6">
        <SeoAuditCard />
      </div>
      <div className="mt-6">
        <VisitorsPanel workspaceId={workspace?.id} />
      </div>
    </AppShell>
  );
}
