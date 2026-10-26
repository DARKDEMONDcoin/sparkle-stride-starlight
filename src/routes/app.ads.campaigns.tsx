import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { EmployeeTopbar } from "@/components/app/EmployeeTopbar";
import { AdsCampaignHistory } from "@/components/app/AdsCampaignHistory";
import { useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/app/ads/campaigns")({
  head: () => ({ meta: [
    { title: "حملات عبدالله | زياد" },
    { name: "description", content: "تاريخ حملاتك الإعلانية وأداء البيانات الناضجة مع عبدالله." },
    { property: "og:title", content: "حملات عبدالله | زياد" },
    { property: "og:description", content: "راجع الحملات والإعلانات والكلمات الرئيسية وتقدم مزامنة الحساب." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: CampaignsPage,
});
function CampaignsPage() {
  const workspace = useWorkspace();
  return <AppShell title="حملات عبدالله" hideTitle compactTitle actions={<EmployeeTopbar memberId="abdullah" active="campaigns" />}>
    <main className="mx-auto w-full max-w-6xl" dir="rtl">
      {workspace.isPending && <p role="status" className="text-muted-foreground">جارٍ تحميل مساحة العمل…</p>}
      {workspace.error && <p role="alert" className="text-destructive">تعذّر تحميل مساحة العمل.</p>}
      {workspace.data?.id && <AdsCampaignHistory workspaceId={workspace.data.id} />}
    </main>
  </AppShell>;
}