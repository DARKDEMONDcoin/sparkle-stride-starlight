import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Copy, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { useWorkspace } from "@/lib/data";
import { BACKLINK_DIRECTORIES } from "@/lib/backlinks/directories";
import {
  generateBacklinkPack,
  listBacklinks,
  updateBacklink,
  verifyBacklink,
} from "@/lib/backlinks/backlinks.functions";

export const Route = createFileRoute("/app/backlinks")({
  head: () => ({
    meta: [
      { title: "الروابط الخلفية | زياد" },
      { name: "description", content: "نور تجهّز ملف الإدراج لكل دليل من 50 دليلًا وتتحقق من ظهور رابطك فعليًا." },
      { property: "og:title", content: "الروابط الخلفية | زياد" },
      { property: "og:description", content: "حزم إدراج جاهزة لـ 50 دليلًا مع تحقق حقيقي من الروابط." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BacklinksPage,
});

const statusLabel: Record<string, string> = {
  todo: "لم يبدأ", ready: "الحزمة جاهزة", submitted: "أُرسل", live: "الرابط ظاهر ✓", rejected: "مرفوض",
};

function BacklinksPage() {
  const { data: workspace } = useWorkspace();
  const qc = useQueryClient();
  const list = useServerFn(listBacklinks);
  const gen = useServerFn(generateBacklinkPack);
  const update = useServerFn(updateBacklink);
  const verify = useServerFn(verifyBacklink);
  const [open, setOpen] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = ["backlinks", workspace?.id];
  const { data: rows = [], isLoading } = useQuery({
    queryKey: key, enabled: Boolean(workspace?.id),
    queryFn: () => list({ data: { workspaceId: workspace!.id } }),
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: key });
  const onErr = (e: Error) => toast.error(e.message);
  const genM = useMutation({
    mutationFn: (id: string) => gen({ data: { workspaceId: workspace!.id, directoryId: id } }),
    onSuccess: (_d, id) => { setOpen(id); refresh(); }, onError: onErr,
  });
  const saveM = useMutation({
    mutationFn: (v: { id: string; listingUrl: string }) =>
      update({ data: { workspaceId: workspace!.id, directoryId: v.id, status: "submitted", listingUrl: v.listingUrl } }),
    onSuccess: () => { toast.success("حُفظ"); refresh(); }, onError: onErr,
  });
  const verifyM = useMutation({
    mutationFn: (id: string) => verify({ data: { workspaceId: workspace!.id, directoryId: id } }),
    onSuccess: (r) => { r.ok ? toast.success("الرابط ظاهر فعليًا") : toast.error("لم نجد رابط موقعك في الصفحة بعد"); refresh(); },
    onError: onErr,
  });
  const byId = new Map(rows.map((r) => [r.directory_id, r]));
  const liveCount = rows.filter((r) => r.status === "live").length;
  const copy = (t: string) => { void navigator.clipboard.writeText(t); toast.success("نُسخ"); };

  return (
    <AppShell title="الروابط الخلفية" lead={`نور تجهّز ملف الإدراج لكل دليل، أنت ترسله، وهي تتحقق من الرابط — ${liveCount}/50 ظاهر`}>
      {isLoading ? <Loader2 className="mx-auto size-6 animate-spin" /> : (
        <div className="space-y-2">
          {BACKLINK_DIRECTORIES.map((d) => {
            const r = byId.get(d.id);
            const status = r?.status ?? "todo";
            return (
              <div key={d.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold" dir="ltr">
                    {d.name}<ExternalLink className="size-3.5" />
                  </a>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{d.category}</span>
                  <span className={`text-xs font-bold ${status === "live" ? "text-jade" : "text-muted-foreground"}`}>{statusLabel[status]}</span>
                  <div className="ms-auto flex gap-2">
                    <button onClick={() => genM.mutate(d.id)} disabled={genM.isPending}
                      className="inline-flex items-center gap-1 rounded-xl bg-foreground px-3 py-1.5 text-xs font-bold text-background disabled:opacity-50">
                      {genM.isPending && genM.variables === d.id ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                      {r?.pack ? "أعد التجهيز" : "جهّز الحزمة"}
                    </button>
                    {r?.pack ? (
                      <button onClick={() => setOpen(open === d.id ? null : d.id)} className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold">
                        {open === d.id ? "إخفاء" : "عرض"}
                      </button>
                    ) : null}
                  </div>
                </div>
                {open === d.id && r?.pack ? (
                  <div className="mt-3 space-y-2 text-sm" dir="auto">
                    {(["name", "tagline", "shortDescription", "longDescription", "category"] as const).map((f) => (
                      <div key={f} className="flex items-start gap-2 rounded-xl bg-secondary/50 p-2">
                        <span className="w-28 shrink-0 text-xs text-muted-foreground">{f}</span>
                        <p className="flex-1 whitespace-pre-wrap">{r.pack![f]}</p>
                        <button onClick={() => copy(r.pack![f])} aria-label="نسخ"><Copy className="size-4" /></button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 rounded-xl bg-secondary/50 p-2">
                      <span className="w-28 shrink-0 text-xs text-muted-foreground">tags</span>
                      <p className="flex-1">{r.pack.tags.join(", ")}</p>
                      <button onClick={() => copy(r.pack!.tags.join(", "))} aria-label="نسخ"><Copy className="size-4" /></button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input dir="ltr" placeholder="رابط صفحة إدراجك بعد النشر"
                        value={urls[d.id] ?? r.listing_url ?? ""}
                        onChange={(e) => setUrls({ ...urls, [d.id]: e.target.value })}
                        className="min-w-60 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                      <button onClick={() => saveM.mutate({ id: d.id, listingUrl: urls[d.id] ?? r.listing_url ?? "" })}
                        className="rounded-xl border border-border px-3 py-2 text-xs font-bold">حفظ كمُرسل</button>
                      <button onClick={() => verifyM.mutate(d.id)} disabled={!r.listing_url || verifyM.isPending}
                        className="inline-flex items-center gap-1 rounded-xl bg-jade px-3 py-2 text-xs font-bold text-background disabled:opacity-50">
                        <CheckCircle2 className="size-3.5" />تحقّق من الرابط
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
