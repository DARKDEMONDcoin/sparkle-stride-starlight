import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdsHistory } from "@/lib/ads/history.functions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, ArrowDownUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Progress } from "@/components/ui/progress";

const number = (value: number | null) => value === null ? "—" : value.toLocaleString("ar-EG-u-nu-latn", { maximumFractionDigits: 2 });

export function AdsCampaignHistory({ workspaceId }: { workspaceId: string }) {
  const [accountId, setAccountId] = useState<string>();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"spend" | "conversions" | "name">("spend");
  const [ascending, setAscending] = useState(false);
  const [level, setLevel] = useState("ad");
  const [days, setDays] = useState<30 | 90>(90);
  const load = useServerFn(getAdsHistory);
  const query = useQuery({ queryKey: ["ads-history", workspaceId, accountId, days], queryFn: () => load({ data: { workspaceId, accountId, days } }), retry: false });
  const data = query.data;
  const campaigns = [...(data?.campaigns ?? [])].filter((row) => row.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).sort((a, b) => {
    const value = sort === "name" ? a.name.localeCompare(b.name) : a.totals[sort] - b.totals[sort];
    return ascending ? value : -value;
  });
  const money = (value: number | null) => {
    if (value === null || !data?.account?.currency) return number(value);
    try { return new Intl.NumberFormat("ar-EG-u-nu-latn", { style: "currency", currency: data.account.currency, maximumFractionDigits: 2 }).format(value); }
    catch { return `${number(value)} ${data.account.currency}`; }
  };
  return <section className="space-y-5 border-t border-border py-5" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold">الحملات</h2>
      <div className="flex flex-wrap items-center gap-2">
        {Boolean(data?.accounts.length) && <Select value={accountId ?? data?.account?.id ?? ""} onValueChange={setAccountId}>
          <SelectTrigger className="w-52 max-w-full" aria-label="الحساب الإعلاني"><SelectValue /></SelectTrigger>
          <SelectContent>{data?.accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name ?? account.external_id}</SelectItem>)}</SelectContent>
        </Select>}
        <Select value={String(days)} onValueChange={(value) => setDays(value === "30" ? 30 : 90)}>
          <SelectTrigger className="w-36" aria-label="الفترة"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="90">آخر 90 يوماً</SelectItem><SelectItem value="30">آخر 30 يوماً</SelectItem></SelectContent>
        </Select>
        <Button variant="ghost" size="icon" title="تحديث البيانات المحفوظة" aria-label="تحديث البيانات المحفوظة" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className="size-4" /></Button>
      </div>
    </div>
    <p role="status" className="text-sm text-muted-foreground">ربط Pipeboard متوقف؛ لا تُسحب بيانات جديدة من المنصات.</p>
    {query.isPending && <p role="status" className="text-muted-foreground">جارٍ تحميل التاريخ…</p>}
    {query.error && <p role="alert" className="text-destructive">{query.error.message}</p>}
    {data && !data.account && <p className="text-muted-foreground">لا توجد حسابات إعلانية محفوظة بعد.</p>}
    {data?.account && <>
      <p className="text-sm text-muted-foreground" dir="auto">{data.account.currency ?? "العملة غير متاحة"} · {data.account.timezone} · {data.since} — {data.until} (غير شامل)</p>
      {data.jobs.map((job) => {
        const progress = job.progress && typeof job.progress === "object" && !Array.isArray(job.progress) ? job.progress : {};
        const completed = typeof progress["completed"] === "number" ? progress["completed"] : 0;
        const total = typeof progress["total"] === "number" ? progress["total"] : 0;
        const labels: Record<string, string> = { queued: "بانتظار المزامنة", running: "جارٍ تعلّم حسابك…", paused: "المزامنة متوقفة", completed: "اكتملت المهمة", failed: "تعذّرت المهمة", cancelled: "أُلغيت المهمة" };
        return <div key={job.id} role="status" className="space-y-2 text-sm text-muted-foreground"><p>{labels[job.status] ?? job.status} · {completed} / {total || "—"}</p>{total > 0 && <Progress value={Math.min(100, completed / total * 100)} aria-label="تقدم المزامنة" />}{job.pause_reason && <p>{job.pause_reason === "provider_on_hold" ? "الربط متوقف" : "تحتاج المهمة إلى مراجعة قبل الاستئناف"}</p>}</div>;
      })}
      {data.truncated && <p role="alert" className="text-destructive">الفترة تتجاوز حد القراءة الآمنة؛ لم تُحسب إجماليات جزئية.</p>}
      {!data.truncated && data.campaigns.length === 0 && <p className="text-muted-foreground">لم تتم مزامنة تاريخ الحملات بعد.</p>}
      {data.campaigns.length > 0 && <>
        <dl className="grid grid-cols-2 gap-4 border-y border-border py-4 sm:grid-cols-4">
          {[["الإنفاق", data.summary.totals.spend], ["النقرات", data.summary.totals.clicks], ["التحويلات", data.summary.totals.conversions], ["تكلفة التحويل", data.summary.cpa]].map(([label, value]) => <div key={String(label)}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{typeof value === "number" && data.summary.included ? (label === "الإنفاق" || label === "تكلفة التحويل" ? money(value) : number(value)) : "—"}</dd></div>)}
        </dl>
        <p className="text-xs text-muted-foreground">استُبعدت {number(data.summary.excluded)} سجلات غير ناضجة أو غير موثوقة أو غير مكتملة من الإجماليات.</p>
        {data.dimensionRows > 0 && <p className="text-xs text-muted-foreground">استُبعدت {data.dimensionRows} سجلات تفصيلية من المجاميع لمنع احتساب الإنفاق مرتين.</p>}
        {data.lastFetchedAt && <p className="text-xs text-muted-foreground">آخر بيانات محفوظة: {new Date(data.lastFetchedAt).toLocaleString("ar-EG-u-nu-latn")}</p>}
        <div className="space-y-3 border-y border-border py-4">
          <h3 className="text-sm font-semibold">الإنفاق والتحويلات · البيانات الناضجة</h3>
          <ChartContainer className="h-64 w-full aspect-auto" config={{ spend: { label: "الإنفاق", color: "var(--chart-1)" }, conversions: { label: "التحويلات", color: "var(--chart-2)" } }}>
            <LineChart data={data.timeline}><CartesianGrid vertical={false} /><XAxis dataKey="day" tickFormatter={(day: string) => day.slice(5)} minTickGap={30} /><YAxis yAxisId="spend" /><YAxis yAxisId="conversions" orientation="right" /><ChartTooltip content={<ChartTooltipContent />} /><Line yAxisId="spend" dataKey="spend" type="monotone" stroke="var(--color-spend)" dot={false} connectNulls={false} isAnimationActive={false} /><Line yAxisId="conversions" dataKey="conversions" type="monotone" stroke="var(--color-conversions)" dot={false} connectNulls={false} isAnimationActive={false} /></LineChart>
          </ChartContainer>
          <p className="text-xs text-muted-foreground">الأيام المفقودة أو غير الناضجة تظهر كفجوات، وليست صفراً.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="w-full sm:w-64" aria-label="بحث الحملات" placeholder="بحث الحملات" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select value={sort} onValueChange={(value) => setSort(value === "name" ? "name" : value === "conversions" ? "conversions" : "spend")}><SelectTrigger className="w-36" aria-label="ترتيب الحملات"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="spend">الإنفاق</SelectItem><SelectItem value="conversions">التحويلات</SelectItem><SelectItem value="name">الاسم</SelectItem></SelectContent></Select>
          <Button variant="ghost" size="icon" onClick={() => setAscending(!ascending)} aria-label="عكس الترتيب" title="عكس الترتيب"><ArrowDownUp className="size-4" /></Button>
        </div>
        {campaigns.length === 0 && <p className="text-sm text-muted-foreground">لا توجد حملات مطابقة.</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[36rem] text-sm"><thead><tr>{["الحملة", "الإنفاق", "النقرات", "التحويلات", "CPA", "ROAS"].map((label) => <th key={label} className="border-b border-border p-3 text-start">{label}</th>)}</tr></thead><tbody>{campaigns.map((campaign) => <tr key={campaign.id}><td className="max-w-64 break-words border-b border-border p-3">{campaign.name}</td>{[campaign.totals.spend, campaign.totals.clicks, campaign.totals.conversions, campaign.cpa, campaign.roas].map((value, index) => <td key={index} className="border-b border-border p-3">{campaign.included ? (index === 0 || index === 3 ? money(value) : number(value)) : "—"}</td>)}</tr>)}</tbody></table></div>
        <div className="space-y-3 border-t border-border pt-4">
          <Select value={level} onValueChange={setLevel}><SelectTrigger className="w-52" aria-label="تفاصيل الحساب"><SelectValue /></SelectTrigger><SelectContent>{([["ad", "الإعلانات"], ["group", "المجموعات"], ["keyword", "الكلمات الرئيسية"], ["search_term", "عبارات البحث"], ["asset_group", "مجموعات الأصول"], ["asset", "الأصول"]] as const).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          {data.entities.filter((entity) => entity.level === level).length === 0 ? <p className="text-sm text-muted-foreground">لا توجد بيانات محفوظة لهذا النوع.</p> : <div className="overflow-x-auto"><table className="w-full min-w-96 text-sm"><thead><tr>{["العنصر", "الإنفاق", "التحويلات"].map((label) => <th key={label} className="border-b border-border p-3 text-start">{label}</th>)}</tr></thead><tbody>{data.entities.filter((entity) => entity.level === level).map((entity) => <tr key={entity.id}><td className="border-b border-border p-3">{entity.name}</td><td className="border-b border-border p-3">{entity.included ? money(entity.totals.spend) : "—"}</td><td className="border-b border-border p-3">{entity.included ? number(entity.totals.conversions) : "—"}</td></tr>)}</tbody></table></div>}
        </div>
      </>}
    </>}
  </section>;
}