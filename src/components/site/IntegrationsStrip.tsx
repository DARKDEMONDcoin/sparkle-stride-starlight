import {
  siFacebook,
  siGoogle,
  siInstagram,
  siSalla,
  siShopify,
  siSnapchat,
  siTiktok,
  siWhatsapp,
} from "simple-icons";

import { LogoMark } from "@/components/site/LogoMark";

type Glyph = { path: string };
type Tool = {
  id: string;
  name: string;
  /** لون العلامة الأصلي — يظهر عند التمرير فقط، ويبقى الشعار رماديًا في الحالة العادية. */
  brand: string;
  glyph?: Glyph;
  /** شعار نصي عندما لا يتوفر رمز مرسوم للعلامة. */
  wordmark?: string;
};

const tools: readonly Tool[] = [
  { id: "instagram", name: "إنستجرام", brand: `#${siInstagram.hex}`, glyph: siInstagram },
  { id: "whatsapp", name: "واتساب", brand: `#${siWhatsapp.hex}`, glyph: siWhatsapp },
  { id: "snapchat", name: "سناب شات", brand: `#${siSnapchat.hex}`, glyph: siSnapchat },
  { id: "tiktok", name: "تيك توك", brand: `#${siTiktok.hex}`, glyph: siTiktok },
  { id: "facebook", name: "فيسبوك", brand: `#${siFacebook.hex}`, glyph: siFacebook },
  { id: "google", name: "جوجل", brand: `#${siGoogle.hex}`, glyph: siGoogle },
  { id: "gbp", name: "ملف النشاط التجاري في جوجل", brand: `#${siGoogle.hex}`, glyph: siGoogle },
  { id: "shopify", name: "شوبيفاي", brand: `#${siShopify.hex}`, glyph: siShopify },
  { id: "salla", name: "سلة", brand: `#${siSalla.hex}`, glyph: siSalla },
  { id: "zid", name: "زد", brand: "var(--emerald-ink)", wordmark: "زد" },
];

/**
 * شبكة تكاملات: شعار زياد في المنتصف، وحوله الأدوات التي يعمل داخلها الفريق.
 * الشعارات رمادية في الحالة العادية وتأخذ لون علامتها عند التمرير أو التركيز.
 */
export function IntegrationsStrip() {
  return (
    <div className="ziad-integrations" aria-label="الأدوات التي يعمل فريق زياد داخلها">
      <div className="ziad-integrations-hub">
        <span className="ziad-integrations-core">
          <LogoMark size={36} />
        </span>
        <span className="ziad-integrations-core-label">زياد</span>
      </div>
      <ul className="ziad-integrations-grid">
        {tools.map((tool) => (
          <li
            key={tool.id}
            tabIndex={0}
            className="ziad-integrations-tile"
            style={{ ["--brand-color" as string]: tool.brand }}
          >
            {tool.glyph ? (
              <svg viewBox="0 0 24 24" role="img" aria-label={tool.name} focusable="false">
                <path d={tool.glyph.path} fill="currentColor" />
              </svg>
            ) : (
              <b className="ziad-integrations-wordmark" aria-label={tool.name}>
                {tool.wordmark}
              </b>
            )}
            <span>{tool.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
