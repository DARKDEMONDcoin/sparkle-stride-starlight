import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Download, FileSpreadsheet, FileText, FileType2, Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  CHAT_FILE_BUCKET,
  CHAT_FILE_MAX_PER_MESSAGE,
  type ChatFileStatus,
  chatFileError,
  chatFileKind,
  chatFileStorageName,
  humanFileSize,
} from "@/lib/chat-files";
import { deleteChatAttachment, processChatAttachment, signChatAttachment } from "@/lib/chat-files.functions";
import { exportDocx, exportPdf, exportXlsx, markdownTables } from "@/lib/deliverable-export";
import { cn } from "@/lib/utils";

export type PendingDoc = {
  key: string;
  id: string | null;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: ChatFileStatus;
  error?: string | undefined;
};

function KindIcon({ name, className }: { name: string; className?: string }) {
  const kind = chatFileKind(name);
  const Icon = kind === "excel" ? FileSpreadsheet : kind === "word" ? FileType2 : FileText;
  return <Icon className={cn("size-4", className)} />;
}

function uploadWithProgress(path: string, file: File, token: string, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${import.meta.env["VITE_SUPABASE_URL"]}/storage/v1/object/${CHAT_FILE_BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error("تعذّر رفع الملف.")));
    xhr.onerror = () => reject(new Error("انقطع الاتصال أثناء الرفع."));
    xhr.send(file);
  });
}

/** حالة مستندات الرسالة قيد التحضير: تحقق، رفع بتقدّم، قراءة على الخادم، إعادة محاولة. */
export function useChatDocuments(opts: { workspaceId?: string | undefined; conversationId?: string | null | undefined; employeeId: string }) {
  const [docs, setDocs] = useState<PendingDoc[]>([]);
  const process = useServerFn(processChatAttachment);
  const remove = useServerFn(deleteChatAttachment);
  const patch = (key: string, next: Partial<PendingDoc>) =>
    setDocs((list) => list.map((d) => (d.key === key ? { ...d, ...next } : d)));

  const run = useCallback(
    async (doc: PendingDoc) => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const user = session.session?.user;
        if (!user || !opts.workspaceId || !opts.conversationId) throw new Error("سجّل الدخول أولاً.");
        let id = doc.id;
        if (!id) {
          const path = `${user.id}/${opts.conversationId}/${chatFileStorageName(doc.name)}`;
          patch(doc.key, { status: "uploading", progress: 0, error: undefined });
          await uploadWithProgress(path, doc.file, session.session!.access_token, (p) => patch(doc.key, { progress: p }));
          const { data: row, error } = await supabase
            .from("attachments")
            .insert({
              user_id: user.id,
              workspace_id: opts.workspaceId,
              conversation_id: opts.conversationId,
              employee_id: opts.employeeId,
              file_name: doc.name,
              mime_type: doc.file.type || "application/octet-stream",
              size: doc.size,
              storage_path: path,
            })
            .select("id")
            .single();
          if (error || !row) throw new Error("تعذّر حفظ الملف.");
          id = row.id;
        }
        patch(doc.key, { id, status: "processing", progress: 100, error: undefined });
        const res = await process({ data: { id } });
        patch(doc.key, { status: res.status, error: res.error ?? undefined });
      } catch (e) {
        patch(doc.key, { status: "failed", error: e instanceof Error ? e.message : "تعذّر الرفع." });
      }
    },
    [opts.workspaceId, opts.conversationId, opts.employeeId, process],
  );

  const add = useCallback(
    (files: File[]) => {
      if (!files.length) return;
      const room = CHAT_FILE_MAX_PER_MESSAGE - docs.length;
      if (room <= 0) return void toast.error(`الحد الأقصى ${CHAT_FILE_MAX_PER_MESSAGE} ملفات في الرسالة.`);
      if (files.length > room) toast.error(`الحد الأقصى ${CHAT_FILE_MAX_PER_MESSAGE} ملفات؛ أُضيف أول ${room} فقط.`);
      const accepted: PendingDoc[] = [];
      for (const file of files.slice(0, room)) {
        const err = chatFileError(file);
        if (err) { toast.error(err); continue; }
        accepted.push({ key: crypto.randomUUID(), id: null, file, name: file.name.normalize("NFC"), size: file.size, progress: 0, status: "uploading" });
      }
      setDocs((list) => [...list, ...accepted]);
      accepted.forEach((d) => void run(d));
    },
    [docs.length, run],
  );

  const discard = (key: string) => {
    const doc = docs.find((d) => d.key === key);
    setDocs((list) => list.filter((d) => d.key !== key));
    if (doc?.id) void remove({ data: { id: doc.id } }).catch(() => undefined);
  };

  const retry = (key: string) => {
    const doc = docs.find((d) => d.key === key);
    if (doc) void run(doc);
  };

  return {
    docs,
    add,
    discard,
    retry,
    clear: () => setDocs([]),
    busy: docs.some((d) => d.status === "uploading" || d.status === "processing"),
    readyIds: docs.filter((d) => d.status === "ready" && d.id).map((d) => d.id!),
    hasFailed: docs.some((d) => d.status === "failed"),
  };
}

export function PendingDocChips({ docs, onRemove, onRetry }: { docs: PendingDoc[]; onRemove: (key: string) => void; onRetry: (key: string) => void }) {
  if (!docs.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5" aria-live="polite">
      {docs.map((d) => (
        <div key={d.key} className={cn("relative flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-xl border bg-background py-2 pe-1.5 ps-2.5 sm:w-[15rem]", d.status === "failed" ? "border-destructive/50" : "border-border/70")}>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-foreground"><KindIcon name={d.name} /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold" dir="auto" title={d.name}>{d.name}</span>
            <span className={cn("flex items-center gap-1 text-[0.65rem]", d.status === "failed" ? "text-destructive" : "text-muted-foreground")}>
              {d.status === "failed" ? <><AlertCircle className="size-3 shrink-0" /><span className="truncate" title={d.error}>{d.error}</span></>
                : d.status === "uploading" ? <>{humanFileSize(d.size)} · جارٍ الرفع {d.progress}%</>
                : d.status === "processing" ? <><Loader2 className="size-3 animate-spin" /> جارٍ قراءة الملف…</>
                : <>{humanFileSize(d.size)} · جاهز</>}
            </span>
          </span>
          {d.status === "failed" ? (
            <button type="button" onClick={() => onRetry(d.key)} aria-label="إعادة المحاولة" className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-secondary"><RotateCcw className="size-4" /></button>
          ) : null}
          <button type="button" onClick={() => onRemove(d.key)} aria-label={`إزالة ${d.name}`} className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-secondary"><X className="size-4" /></button>
          {d.status === "uploading" || d.status === "processing" ? (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-muted">
              <span className={cn("block h-full bg-primary transition-all", d.status === "processing" && "animate-pulse")} style={{ width: `${d.status === "processing" ? 100 : d.progress}%` }} />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

type SentDoc = { id: string; file_name: string; size: number; status: string; message_id: string | null; error: string | null };

/** مستندات المحادثة المرسلة مجمّعة حسب الرسالة. */
export function useConversationDocs(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: ["chat-docs", conversationId],
    enabled: Boolean(conversationId),
    queryFn: async () => {
      const { data } = await supabase
        .from("attachments")
        .select("id, file_name, size, status, message_id, error")
        .eq("conversation_id", conversationId!)
        .not("message_id", "is", null)
        .order("created_at");
      const byMessage = new Map<string, SentDoc[]>();
      for (const d of (data ?? []) as SentDoc[]) byMessage.set(d.message_id!, [...(byMessage.get(d.message_id!) ?? []), d]);
      return byMessage;
    },
  });
}

export function MessageDocCards({ docs }: { docs: SentDoc[] }) {
  const sign = useServerFn(signChatAttachment);
  const open = async (d: SentDoc, download: boolean) => {
    const w = download ? null : window.open("", "_blank");
    try {
      const { url } = await sign({ data: { id: d.id, download } });
      if (w) w.location.href = url;
      else window.location.href = url;
    } catch {
      w?.close();
      toast.error("تعذّر فتح الملف.");
    }
  };
  return (
    <div className="mb-2 flex flex-col gap-1.5">
      {docs.map((d) => (
        <div key={d.id} className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-border/60 bg-background/95 py-2 pe-1.5 ps-2.5 text-foreground">
          <button type="button" onClick={() => void open(d, false)} className="flex min-w-0 flex-1 items-center gap-2 text-start" aria-label={`فتح ${d.file_name}`}>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary"><KindIcon name={d.file_name} /></span>
            <span className="min-w-0">
              <span className="block max-w-[14rem] truncate text-xs font-bold" dir="auto">{d.file_name}</span>
              <span className={cn("block text-[0.65rem]", d.status === "failed" ? "text-destructive" : "text-muted-foreground")}>
                {d.status === "failed" ? d.error ?? "تعذّرت قراءته" : humanFileSize(d.size)}
              </span>
            </span>
          </button>
          <button type="button" onClick={() => void open(d, true)} aria-label={`تنزيل ${d.file_name}`} className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-secondary"><Download className="size-4" /></button>
        </div>
      ))}
    </div>
  );
}

/** أزرار تنزيل المخرج كملف Word أو Excel أو PDF. */
export function DeliverableDownloads({ markdown, title, getHtml }: { markdown: string; title: string; getHtml: () => string }) {
  const hasTable = markdownTables(markdown).length > 0;
  const safe = title.replace(/[\\/:*?"<>|\n]/g, " ").trim().slice(0, 60) || "مخرج";
  const btn = "inline-flex items-center gap-1 rounded-lg border border-border/70 px-2 py-1 text-[0.7rem] font-bold text-muted-foreground hover:bg-secondary hover:text-foreground";
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-[0.7rem] text-muted-foreground">تنزيل:</span>
      <button type="button" className={btn} onClick={() => void exportDocx(markdown, safe).catch(() => toast.error("تعذّر التصدير."))}><FileType2 className="size-3.5" /> Word</button>
      {hasTable ? <button type="button" className={btn} onClick={() => void exportXlsx(markdown, safe).catch(() => toast.error("تعذّر التصدير."))}><FileSpreadsheet className="size-3.5" /> Excel</button> : null}
      <button type="button" className={btn} onClick={() => exportPdf(getHtml(), safe)}><FileText className="size-3.5" /> PDF</button>
    </div>
  );
}
