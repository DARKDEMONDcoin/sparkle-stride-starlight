import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { EmployeeTopbar } from "@/components/app/EmployeeTopbar";
import { AdsLandingPages } from "@/components/app/AdsLandingPages";
import { useWorkspace } from "@/lib/data";
export const Route = createFileRoute("/app/ads/landing-pages")({
  head: () => ({ meta: [{ title: "صفحات الوصول مع عبدالله | زياد" }, { name: "description", content: "مراجعة وجهات الإعلانات وسرعة الصفحات وأدلة التتبع وتعليمات الإصلاح دون تعديل مواقع العملاء." }, { property: "og:title", content: "صفحات الوصول مع عبدالله | زياد" }, { property: "og:description", content: "فحوص صفحات الوصول المحفوظة للهاتف والكمبيوتر مع قيود الأدلة ومراجعة المالك." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: LandingPages,
});
function LandingPages() {
  const workspace = useWorkspace();
  return <AppShell title="صفحات الوصول مع عبدالله" hideTitle compactTitle actions={<EmployeeTopbar memberId="abdullah" active="landing-pages" />}><main className="mx-auto w-full max-w-6xl" dir="rtl">{workspace.isPending && <p role="status">جارٍ تحميل مساحة العمل…</p>}{workspace.error && <p role="alert" className="text-destructive">تعذّر تحميل مساحة العمل.</p>}{workspace.data?.id && <AdsLandingPages workspaceId={workspace.data.id} />}</main></AppShell>;
}