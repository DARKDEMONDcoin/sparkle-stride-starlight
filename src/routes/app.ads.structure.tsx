import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { EmployeeTopbar } from "@/components/app/EmployeeTopbar";
import { AdsReview } from "@/components/app/AdsReview";
import { useWorkspace } from "@/lib/data";
export const Route = createFileRoute("/app/ads/structure")({
 head: () => ({ meta: [{ title: "تدقيق الهيكل مع عبدالله | زياد" }, { name: "description", content: "مراجعة هيكل الحساب الإعلاني وأدلة الأعراض وحدود البيانات المتاحة." }, { property: "og:title", content: "تدقيق الهيكل مع عبدالله | زياد" }, { property: "og:description", content: "مراجعة هيكل الحساب الإعلاني وأدلة الأعراض وحدود البيانات المتاحة." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
 component: ReviewPage,
});
function ReviewPage() {
 const workspace = useWorkspace();
 return <AppShell title="تدقيق الهيكل مع عبدالله" hideTitle compactTitle actions={<EmployeeTopbar memberId="abdullah" active="structure" />}><main className="mx-auto w-full max-w-6xl" dir="rtl">{workspace.isPending && <p role="status">جارٍ تحميل مساحة العمل…</p>}{workspace.error && <p role="alert" className="text-destructive">تعذّر تحميل مساحة العمل.</p>}{workspace.data?.id && <AdsReview workspaceId={workspace.data.id} view="structure" />}</main></AppShell>;
}
