import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { EmployeeTopbar } from "@/components/app/EmployeeTopbar";
import { AdsBaseline } from "@/components/app/AdsBaseline";
import { useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/app/ads/baseline")({
  head: () => ({ meta: [
    { title: "أساس الحساب مع عبدالله | زياد" },
    { name: "description", content: "مراجعة أدلة الحساب الإعلاني وجودة البيانات والسياق والدروس السابقة قبل التوصيات." },
    { property: "og:title", content: "أساس الحساب مع عبدالله | زياد" },
    { property: "og:description", content: "تقرير تاريخ الحساب وحدود الأدلة وتقدم المراجعة قبل أي تغيير إعلاني." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: BaselinePage,
});
function BaselinePage() {
  const workspace = useWorkspace();
  return <AppShell title="أساس الحساب" hideTitle compactTitle actions={<EmployeeTopbar memberId="abdullah" active="baseline" />}><main className="mx-auto w-full max-w-6xl" dir="rtl">{workspace.isPending && <p role="status">جارٍ تحميل مساحة العمل…</p>}{workspace.error && <p role="alert" className="text-destructive">تعذّر تحميل مساحة العمل.</p>}{workspace.data?.id && <AdsBaseline workspaceId={workspace.data.id} />}</main></AppShell>;
}