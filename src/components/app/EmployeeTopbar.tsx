/**
 * شريط الموظف الثابت — نفس شريط المحادثة يظهر في صفحات الموظف الأخرى
 * (التقويم وغيره) حتى لا يفقد المستخدم سياق الموظف عند التنقل.
 */
import { useNavigate } from "@tanstack/react-router";
import { BookOpenText, CalendarDays, MessageCircle, PlugZap, ChartNoAxesCombined, BookOpenCheck, ClipboardCheck, Activity, Network, PanelsTopLeft, FilePlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Portrait } from "@/components/site/Portrait";
import { getMember } from "@/data/team";
import { cn } from "@/lib/utils";

export function EmployeeTopbar({
  memberId,
  active,
}: {
  memberId: string;
  active: "chat" | "calendar" | "guidelines" | "campaigns" | "drafts" | "baseline" | "recommendations" | "tracking" | "structure" | "landing-pages";
}) {
  const member = getMember(memberId);
  const navigate = useNavigate();
  if (!member) return null;

  const goChat = () =>
    void navigate({ to: "/app/chat/$id", params: { id: member.id } });
  const goCalendar = () =>
    void navigate({
      to: "/app/calendar",
      search: { employee: member.id as "sonny" },
    });
  const goGuidelines = () =>
    void navigate({ to: "/app/guidelines/$id", params: { id: member.id } });

  return (
    <div
      className="chat-topbar-actions no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:gap-1.5"
      dir="rtl"
    >
      <div className="chat-employee-identity">
        <span className="chat-employee-avatar">
          <Portrait memberId={member.id} name={member.name} className="size-full" />
        </span>
        <span className="chat-employee-names">
          <strong>{member.name}</strong>
          <small>{member.role}</small>
        </span>
      </div>
      <div className="chat-employee-navigation" aria-label={`أدوات ${member.name}`}>
        {member.id === "abdullah" && <Button type="button" variant="ghost" size="sm" className={cn("chat-nav-button", active === "campaigns" && "is-active")} aria-label="الحملات" title="الحملات" onClick={() => void navigate({ to: "/app/ads/campaigns" })}><ChartNoAxesCombined className="size-4" /><span>الحملات</span></Button>}
        {member.id === "abdullah" && <Button type="button" variant="ghost" size="sm" className={cn("chat-nav-button", active === "drafts" && "is-active")} aria-label="حملات جديدة" title="حملات جديدة" onClick={() => void navigate({ to: "/app/ads/drafts" })}><FilePlus2 className="size-4" /><span>حملات جديدة</span></Button>}
        {member.id === "abdullah" && <Button type="button" variant="ghost" size="sm" className={cn("chat-nav-button", active === "baseline" && "is-active")} aria-label="أساس الحساب" title="أساس الحساب" onClick={() => void navigate({ to: "/app/ads/baseline" })}><BookOpenCheck className="size-4" /><span>أساس الحساب</span></Button>}
        {member.id === "abdullah" && <>
          <Button variant="ghost" size="sm" className={cn("chat-nav-button", active === "landing-pages" && "is-active")} title="صفحات الوصول" aria-label="صفحات الوصول" onClick={() => void navigate({ to: "/app/ads/landing-pages" })}><PanelsTopLeft className="size-4" /><span>صفحات الوصول</span></Button>
          <Button variant="ghost" size="sm" className={cn("chat-nav-button", active === "recommendations" && "is-active")} title="التوصيات" aria-label="التوصيات" onClick={() => void navigate({ to: "/app/ads/recommendations" })}><ClipboardCheck className="size-4" /><span>التوصيات</span></Button>
          <Button variant="ghost" size="sm" className={cn("chat-nav-button", active === "tracking" && "is-active")} title="صحة التتبع" aria-label="صحة التتبع" onClick={() => void navigate({ to: "/app/ads/tracking" })}><Activity className="size-4" /><span>صحة التتبع</span></Button>
          <Button variant="ghost" size="sm" className={cn("chat-nav-button", active === "structure" && "is-active")} title="تدقيق الهيكل" aria-label="تدقيق الهيكل" onClick={() => void navigate({ to: "/app/ads/structure" })}><Network className="size-4" /><span>الهيكل</span></Button>
        </>}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("chat-nav-button", active === "chat" && "is-active")}
          aria-label="المحادثة"
          title="المحادثة"
          onClick={goChat}
        >
          <MessageCircle className="size-4" />
          <span>المحادثة</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("chat-nav-button", active === "calendar" && "is-active")}
          aria-label="التقويم"
          title="التقويم"
          onClick={goCalendar}
        >
          <CalendarDays className="size-4" />
          <span>التقويم</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("chat-nav-button", active === "guidelines" && "is-active")}
          aria-label="التعليمات"
          title="التعليمات وعقل العلامة"
          onClick={goGuidelines}
        >
          <BookOpenText className="size-4" />
          <span>التعليمات</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="chat-nav-button"
          aria-label="التكاملات"
          title="تكاملات الموظف"
          onClick={() => void navigate({ to: "/app/integrations" })}
        >
          <PlugZap className="size-4" />
          <span>التكاملات</span>
        </Button>
      </div>
    </div>
  );
}
