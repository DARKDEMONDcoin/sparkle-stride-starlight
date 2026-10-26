import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link2, Loader2, PlugZap, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  disconnectAdsConnection,
  getAdsConnections,
  startAdsConnection,
} from "@/lib/ads/connections.functions";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  connected: { label: "متصل", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  expired: { label: "منتهي — أعد الربط", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  error: { label: "خطأ", className: "bg-destructive/10 text-destructive" },
  limited: { label: "بانتظار إكمال الربط", className: "bg-muted text-muted-foreground" },
};

const PLATFORM_LABELS: Record<string, string> = { google: "Google Ads", meta: "Meta Ads" };

/** تبويب الاتصالات لعبدالله: ربط حسابات الإعلانات عبر الموفّر المضبوط وحالتها وفصلها. */
export function AdsConnections({ workspaceId }: { workspaceId: string }) {
  const load = useServerFn(getAdsConnections);
  const start = useServerFn(startAdsConnection);
  const disconnect = useServerFn(disconnectAdsConnection);
  const queryClient = useQueryClient();
  const key = ["ads-connections", workspaceId];
  const [busyPlatform, setBusyPlatform] = useState<string | null>(null);

  const query = useQuery({ queryKey: key, queryFn: () => load({ data: { workspaceId } }), retry: false });

  const connect = useMutation({
    mutationFn: (platform: "google" | "meta") =>
      start({ data: { workspaceId, platform, origin: window.location.origin } }),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (e) => {
      toast.error(e.message);
      setBusyPlatform(null);
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const remove = useMutation({
    mutationFn: (connectionId: string) => disconnect({ data: { workspaceId, connectionId } }),
    onSuccess: () => {
      toast.success("فُصل الحساب.");
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast.error(e.message),
  });

  const data = query.data;

  return (
    <section className="border-t border-border py-5 space-y-4" dir="rtl">
      <div>
        <h2 className="flex items-center gap-2 font-semibold">
          <PlugZap className="size-4" /> اتصالات الإعلانات
        </h2>
        <p className="text-sm text-muted-foreground">
          اربط حساباتك الإعلانية ليقرأها عبدالله ويقترح تحسيناتها. لن يغيّر أي شيء دون موافقتك.
        </p>
      </div>

      {query.isPending && <p className="text-sm text-muted-foreground" role="status">جارٍ تحميل الاتصالات…</p>}
      {query.error && <p className="text-sm text-destructive" role="alert">{query.error.message}</p>}

      {data?.platforms.map((platform) => {
        const connections = data.connections.filter((c) => c.platform === platform.platform);
        return (
          <div key={platform.platform} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <strong dir="ltr">{PLATFORM_LABELS[platform.platform]}</strong>
                <p className="text-xs text-muted-foreground">عبر {platform.providerLabel}</p>
              </div>
              <Button
                size="sm"
                disabled={!platform.readiness.available || busyPlatform === platform.platform}
                onClick={() => {
                  setBusyPlatform(platform.platform);
                  connect.mutate(platform.platform);
                }}
              >
                {busyPlatform === platform.platform ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Link2 className="size-4" />
                )}
                اربط {PLATFORM_LABELS[platform.platform]}
              </Button>
            </div>

            {!platform.readiness.available && (
              <p className="text-sm text-muted-foreground" role="status">{platform.readiness.reason}</p>
            )}

            {platform.notice && (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{platform.notice}</p>
            )}

            {connections.length === 0 && (
              <p className="text-sm text-muted-foreground">لا توجد حسابات مربوطة بعد.</p>
            )}

            {connections.map((connection) => {
              const status = STATUS_LABELS[connection.status] ?? { label: "حالة غير معروفة", className: "bg-muted text-muted-foreground" };
              return (
                <div key={connection.id} className="border-t border-border pt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${status.className}`}>
                      {status.label}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      title="الفصل غير مفعّل حتى يكتمل إلغاء الصلاحية بأمان"
                      onClick={() => remove.mutate(connection.id)}
                    >
                      <Unplug className="size-4" /> فصل
                    </Button>
                  </div>
                  {connection.last_error && (
                    <p className="text-xs text-destructive">{connection.last_error}</p>
                  )}
                  {connection.accounts.length > 0 ? (
                    <ul className="space-y-1">
                      {connection.accounts.map((account) => (
                        <li key={account.id} className="flex items-center justify-between text-sm">
                          <span>{account.name ?? account.external_id}</span>
                          <span className="text-xs text-muted-foreground" dir="ltr">
                            {[account.currency, account.timezone].filter(Boolean).join(" · ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    connection.status === "limited" && (
                      <p className="text-xs text-muted-foreground">
                        لم يُتحقق من اكتمال الربط أو استيراد الحسابات بعد.
                      </p>
                    )
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}
