import { z } from "zod";
import { converter, formatHex, parse } from "culori";

export const brandStages = [
  { key: "business", label: "فهم نشاطك", title: "النشاط والخدمات" },
  { key: "audience", label: "تحديد جمهورك", title: "الجمهور" },
  { key: "voice", label: "التقاط نبرة صوتك", title: "نبرة الصوت" },
  { key: "identity", label: "استخراج ألوان علامتك", title: "الألوان والهوية" },
] as const;
export type BrandSectionKey = typeof brandStages[number]["key"];
const text = z.string().trim().max(1200);
const list = z.array(z.string().trim().max(400)).max(20);
export const colorSchema = z.object({ role: z.enum(["primary", "secondary", "accent", "background", "text", "extra"]), hex: z.string().regex(/^#[\da-f]{6}$/i), name: z.string().max(80) });
export const sectionSchemas = {
  business: z.object({ name: text, summary: text, industry: text, services: list, markets: list, usp: list }),
  audience: z.object({ segments: list, customerType: text, regions: list, language: text, needs: list, painPoints: list }),
  voice: z.object({ attributes: list.max(5), dialect: text, dos: list, donts: list, examples: list.max(3) }),
  identity: z.object({ colors: z.array(colorSchema).max(12), logo: z.string().max(600), fonts: list }),
};
export type BrandData = Record<string, string | string[] | z.infer<typeof colorSchema>[]>;
export type BrandSection = { data: BrandData; detected?: BrandData; suggestions?: BrandData; ignored?: BrandData; source?: "ai" | "user"; edited_at?: string; edited_fields?: string[]; sources?: string[] };
export type BrandSections = Partial<Record<BrandSectionKey, BrandSection>>;
export type ScanStage = { state: "waiting" | "running" | "done" | "failed"; line?: string; error?: string; summary?: BrandData };
export type BrandJob = { id: string; workspace_id: string; website: string; status: string; stage: number; stages: ScanStage[]; sources: string[]; error: string | null; error_status: number | null; updated_at: string; lease_until?: string | null };
export type BrandSnapshot = { website: string; revision: number; sections: BrandSections; history: BrandSections[]; job: BrandJob | null };
export const emptySection = (key: BrandSectionKey): BrandData => Object.fromEntries(Object.keys(sectionSchemas[key].shape).map((field) => [field, ["services", "markets", "usp", "segments", "regions", "needs", "painPoints", "attributes", "dos", "donts", "examples", "colors", "fonts"].includes(field) ? [] : ""]));
export function brandCompleteness(sections: BrandSections) {
  return Math.round(brandStages.filter(({ key }) => Object.values(sections[key]?.data ?? {}).some((v) => typeof v === "string" ? v.trim() : v.length)).length * 25);
}
export function mergeDetected(section: BrandSection, detected: BrandData): BrandSection {
  const data = { ...section.data }, suggestions = { ...section.suggestions };
  for (const [key, value] of Object.entries(detected)) {
    if (section.edited_fields?.includes(key) && JSON.stringify(data[key]) !== JSON.stringify(value)) {
      if (JSON.stringify(section.ignored?.[key]) !== JSON.stringify(value)) suggestions[key] = value;
      else delete suggestions[key];
    } else { data[key] = value; delete suggestions[key]; }
  }
  return { ...section, data, detected, suggestions };
}
export function normalizeBrandUrl(raw: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
    if (u.protocol !== "https:" || u.username || u.password || u.port || !/^[a-z0-9.-]+$/i.test(u.hostname) || !u.hostname.includes(".") || /(?:^|\.)(localhost|local|internal|test|invalid|onion|lan|home|corp)$/.test(u.hostname) || /^\d+(?:\.\d+)*$/.test(u.hostname)) return null;
    u.hash = ""; return u.toString();
  } catch { return null; }
}
export function cssHex(value: string): string | null {
  const parsed = parse(value); if (!parsed) return null;
  const rgb = converter("rgb")(parsed); if (!rgb || (rgb.alpha !== undefined && rgb.alpha < 1)) return null;
  return formatHex(rgb);
}
export function contrastRatio(a: string, b: string): number | null {
  const luminance = (value: string) => {
    const p = parse(value); const c = p && converter("rgb")(p); if (!c) return null;
    const linear = (v: number) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    return linear(c.r) * .2126 + linear(c.g) * .7152 + linear(c.b) * .0722;
  };
  const x = luminance(a), y = luminance(b); if (x === null || y === null) return null;
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
export function robotsAllows(robots: string, path: string): boolean {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let group: typeof groups[number] | null = null;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim(), match = /^([\w-]+)\s*:\s*(.*)$/.exec(line); if (!match) continue;
    const key = match[1]?.toLowerCase(), value = match[2]?.trim() ?? "";
    if (key === "user-agent") { if (!group || group.rules.length) { group = { agents: [], rules: [] }; groups.push(group); } group.agents.push(value.toLowerCase()); }
    else if (group && (key === "allow" || key === "disallow") && value) group.rules.push({ allow: key === "allow", path: value });
  }
  const specific = groups.filter((g) => g.agents.some((a) => a.includes("ziad")));
  const selected = specific.length ? specific : groups.filter((g) => g.agents.includes("*"));
  const hits = selected.flatMap((g) => g.rules).filter((r) => {
    const end = r.path.endsWith("$"); const expr = r.path.replace(/\$$/, "").split("*").map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
    return new RegExp(`^${expr}${end ? "$" : ""}`).test(path);
  }).sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return hits[0]?.allow ?? true;
}