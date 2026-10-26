import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";

/** لون واجهة المتصفح الرسمي لزياد — المصدر الوحيد لهذا اللون في المشروع. */
export const BROWSER_THEME = "#137C6F";
/**
 * أزرار التنقل السفلية الثلاثة في هواتف أندرويد: بلا خلفية ظاهرة.
 * شريط أزرار النظام يأخذ لونه من theme-color، وكثير من المتصفحات تتجاهل
 * قناة الشفافية فتظهره أسود معتم؛ لذلك نستخدم أبيض يطابق خلفية الصفحة
 * فيندمج الشريط معها تمامًا ويظهر شفافًا، مع رموز داكنة يختارها النظام.
 */
export const BROWSER_NAV_THEME = "#F7F2E8";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { RegionProvider } from "@/hooks/use-region";
import { Button } from "@/components/ui/button";
import { CookieConsent } from "@/components/site/CookieConsent";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 font-display text-xl font-bold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ربما تغيّر الرابط أو نُقلت الصفحة. يمكنك العودة إلى البداية بأمان.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/">العودة للرئيسية</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error instanceof Error ? error : new Error(String(error)), { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-bold text-foreground">تعذّر تحميل الصفحة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          حدث خطأ غير متوقع. جرّب مرة أخرى أو عد إلى الصفحة الرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            المحاولة مجددًا
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">العودة للرئيسية</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // شريط أزرار النظام السفلية في هواتف أندرويد: شفاف تمامًا بلا خلفية،
      // ومع color-scheme: light يختار النظام رموزًا داكنة لأعلى تباين مع
      // الصفحات الفاتحة. وسم واحد بلا media: المتصفحات تُدمج الوسوم المتشابهة،
      // وبقاء وسم مقيّد بـ media كان يجعل اللون يختفي على بعض الأجهزة.
      { name: "theme-color", content: BROWSER_NAV_THEME },
      { name: "color-scheme", content: "light" },
      { name: "msapplication-TileColor", content: BROWSER_THEME },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { title: "زياد | فريق ذكاء اصطناعي يعمل بالعربية لمشروعك" },
      {
        name: "description",
        content:
          "زياد يجمع ستة موظفين رقميين بالعربية للمحتوى والتصميم والمبيعات والتنظيم والبحث والتحليل، في مساحة عمل واحدة، وتراجع أنت كل خطوة قبل التنفيذ.",
      },
      { name: "author", content: "Ziad" },
      { property: "og:title", content: "زياد | فريق ذكاء اصطناعي يعمل بالعربية لمشروعك" },
      {
        property: "og:description",
        content: "ستة موظفين رقميين يكتبون ويصمّمون ويبيعون نيابةً عنك بالعربية، وأنت تعتمد كل خطوة قبل التنفيذ.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_SA" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Almarai:wght@300;400;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <RegionProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <CookieConsent />
        <Toaster position="top-center" dir="rtl" />
      </RegionProvider>
    </QueryClientProvider>
  );
}
