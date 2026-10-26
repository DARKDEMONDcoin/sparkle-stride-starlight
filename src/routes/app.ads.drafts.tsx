import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { EmployeeTopbar } from "@/components/app/EmployeeTopbar";
import { AdsCampaignSetup } from "@/components/app/AdsCampaignSetup";
import { useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/app/ads/drafts")({
  head: () => ({ meta: [
    { title: "حملات جديدة مع عبدالله | زياد" },
    { name: "description", content: "ملف النشاط وفحص الجدوى وخطط الحملات الجديدة بانتظار اعتمادك." },
    { property: "og:title", content: "حملات جديدة مع عبدالله | زياد" },
    { property: "og:description", content: "خطط حملات Google Search وMeta Advantage+ تُنشأ متوقفة بعد اعتمادك." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: DraftsPage,
});
function DraftsPage() {
  const workspace = useWorkspace();
  return <AppShell title="حملات جديدة" hideTitle compactTitle actions={<EmployeeTopbar memberId="abdullah" active="drafts" />}>
    <main className="mx-auto w-full max-w-6xl" dir="rtl">
      {workspace.isPending && <p role="status" className="text-muted-foreground">جارٍ تحميل مساحة العمل…</p>}
      {workspace.error && <p role="alert" className="text-destructive">تعذّر تحميل مساحة العمل.</p>}
      {workspace.data?.id && <AdsCampaignSetup workspaceId={workspace.data.id} />}
    </main>
  </AppShell>;
}
