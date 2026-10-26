import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { adsApiHealth, getAdsSettings, saveAdsAuditPreference } from "@/lib/ads/settings.functions";

export function AdsGuidelineSettings({ workspaceId }: { workspaceId: string }) {
  const load = useServerFn(getAdsSettings);
  const save = useServerFn(saveAdsAuditPreference);
  const health = useServerFn(adsApiHealth);
  const queryClient = useQueryClient();
  const key = ["ads-settings", workspaceId];
  const settings = useQuery({ queryKey: key, queryFn: () => load({ data: { workspaceId } }), retry: false });
  const update = useMutation({ mutationFn: (enabled: boolean) => save({ data: { workspaceId, enabled } }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: key }); }, onError: (e) => toast.error(e.message) });
  const api = useQuery({ queryKey: ["ads-api-health", workspaceId], queryFn: () => health({ data: { workspaceId } }), enabled: settings.data?.isAdmin === true, retry: false });
  return <section className="border-t border-border py-5 space-y-4" dir="rtl">
    <div className="flex items-center justify-between gap-4">
      <div><h2 className="font-semibold">تدقيق الحملات اليومي</h2><p className="text-sm text-muted-foreground">التشغيل التلقائي لم يُفعّل بعد؛ يُحفظ تفضيلك للمراحل القادمة.</p></div>
      <Switch aria-label="Run a daily campaign audit" checked={settings.data?.dailyAudit ?? false} disabled={!settings.data || update.isPending} onCheckedChange={(enabled) => update.mutate(enabled)} />
    </div>
    {settings.isPending && <p className="text-sm text-muted-foreground" role="status">جارٍ تحميل الإعدادات…</p>}
    {settings.error && <p className="text-sm text-destructive" role="alert">{settings.error.message}</p>}
    {settings.data?.isAdmin && <div className="border-t border-border pt-4 space-y-3">
      <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><Activity className="size-4" /> صحة إصدارات الإعلانات</h2><Button variant="ghost" size="icon-sm" aria-label="تحديث فحص الإصدارات" onClick={() => void api.refetch()} disabled={api.isFetching}><RefreshCw className="size-4" /></Button></div>
      <p className="text-sm text-muted-foreground">فحص الإصدارات المسجلة؛ الاتصال الفعلي بالمنصات لم يُختبر بعد.</p>
      {api.isPending && <p role="status">جارٍ الفحص…</p>}
      {api.error && <p role="alert" className="text-destructive">{api.error.message}</p>}
      {api.data?.map((row) => <div key={row.platform} className="border-b border-border py-3 space-y-1">
        <strong dir="ltr">{row.platform === "google" ? "Google Ads" : "Meta Marketing"} · {row.configured}</strong>
        <p className="text-sm">{!row.valid ? "صيغة الإصدار غير صحيحة" : row.status === "unverified" ? "الإصدار المختار يحتاج تحققًا رسميًا" : row.status === "unknown" ? "موعد إيقاف الإصدار غير موثق" : row.status === "sunset" ? "بلغ الإصدار موعد الإيقاف؛ راجع المصدر" : row.status === "warning" ? "تنبيه: موعد الإيقاف خلال 90 يومًا" : "لا يوجد موعد إيقاف خلال 90 يومًا"}</p>
        {row.sunsetMonth && <p className="text-sm text-muted-foreground">موعد مبدئي: {row.sunsetMonth}؛ اليوم الدقيق غير منشور.</p>}
        <a className="text-primary underline text-sm" href={row.source} target="_blank" rel="noreferrer">المصدر الرسمي</a>
      </div>)}
    </div>}
  </section>;
}