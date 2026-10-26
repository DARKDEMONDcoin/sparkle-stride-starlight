import { z } from "zod";

export const pageScope = z.object({ workspaceId: z.string().uuid(), accountId: z.string().uuid().optional() });
export const auditScope = pageScope.extend({ pageId: z.string().uuid(), device: z.enum(["mobile", "desktop"]) });
export const checklistKeys = ["message_match", "page_goal", "above_fold", "form_friction", "trust", "copy", "mobile", "tracking", "technical_policy", "post_conversion"] as const;
export const contentAuditSchema = z.object({
  checks: z.array(z.object({ category: z.enum(checklistKeys), status: z.enum(["observed", "issue", "unknown"]), evidence: z.string().max(500), steps: z.array(z.string().max(500)).max(6) })).max(10),
  limitations: z.array(z.string().max(500)).max(15),
});

/** URL identity drops tracking only; product/language query values stay distinct. */
export function normalizeAdPage(input: string): string {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || (url.port && !["80", "443"].includes(url.port))) throw new Error("Only public HTTP(S) pages are allowed");
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host) || /^[\d.]+$/.test(host) || host.includes(":")) throw new Error("IP and private host URLs are not allowed");
  url.hostname = host; url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (/^(utm_.+|gclid|fbclid|dclid|msclkid)$/i.test(key)) url.searchParams.delete(key);
  if ([...url.searchParams.keys()].some((key) => /token|password|secret|auth|session|signature|email/i.test(key))) throw new Error("Sensitive URL parameters are not allowed");
  url.searchParams.sort();
  return url.toString();
}

export function publicIPv4(input: string): boolean {
  const parts = input.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a = 0, b = 0, c = 0] = parts;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 2))) || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
}
export function vitalStatus(kind: "lcp" | "inp" | "cls", value: number | null) {
  if (value === null || !Number.isFinite(value) || value < 0) return "unknown";
  const [good, poor] = kind === "lcp" ? [2500, 4000] : kind === "inp" ? [200, 500] : [0.1, 0.25];
  return value <= good ? "good" : value > poor ? "poor" : "needs_improvement";
}
export const psiSchema = z.object({
  lighthouseResult: z.object({ requestedUrl: z.string().optional(), finalUrl: z.string().optional(), categories: z.record(z.object({ score: z.number().nullable().optional() })).optional(), audits: z.record(z.object({ numericValue: z.number().optional(), displayValue: z.string().optional() })).optional() }).optional(),
  loadingExperience: z.object({ metrics: z.record(z.object({ percentile: z.number().optional() })).optional() }).optional(),
});
export function compactPageSpeed(input: unknown) {
  const parsed = psiSchema.parse(input); const lab = parsed.lighthouseResult;
  const field = parsed.loadingExperience?.metrics;
  const lcp = field?.["LARGEST_CONTENTFUL_PAINT_MS"]?.percentile ?? null;
  const inp = field?.["INTERACTION_TO_NEXT_PAINT"]?.percentile ?? null;
  const rawCls = field?.["CUMULATIVE_LAYOUT_SHIFT_SCORE"]?.percentile;
  const cls = rawCls === undefined ? null : rawCls / 100;
  return { lab: { performance: lab?.categories?.["performance"]?.score ?? null, lcp: lab?.audits?.["largest-contentful-paint"]?.numericValue ?? null, cls: lab?.audits?.["cumulative-layout-shift"]?.numericValue ?? null }, field: { lcp, inp, cls, lcpStatus: vitalStatus("lcp", lcp), inpStatus: vitalStatus("inp", inp), clsStatus: vitalStatus("cls", cls) }, fieldAvailable: lcp !== null || inp !== null || cls !== null };
}

export type PageMetric = { landing_page_id: string; platform: string; device: string; date: string; data_maturity: string; spend: number; clicks: number; conversions: number; outbound_clicks: number | null; landing_page_views: number | null };
export function summarizePageMetrics(rows: PageMetric[]) {
  // Do not merge devices or platforms, or count aggregate and device rows twice.
  const groups = new Map<string, PageMetric[]>();
  for (const row of rows) { const key = `${row.landing_page_id}:${row.platform}:${row.device}`; const group = groups.get(key) ?? []; group.push(row); groups.set(key, group); }
  return [...groups.values()].map((group) => {
    const first = group[0]; if (!first) throw new Error("Empty metric group");
    const complete = group.every((r) => r.data_maturity === "mature" && [r.spend, r.clicks, r.conversions].every((n) => Number.isFinite(n) && n >= 0));
    const sum = (key: "spend" | "clicks" | "conversions") => group.reduce((total, r) => total + r[key], 0);
    const nullableSum = (key: "outbound_clicks" | "landing_page_views") => group.every((r) => r[key] !== null && Number.isFinite(r[key]) && Number(r[key]) >= 0) ? group.reduce((total, r) => total + Number(r[key]), 0) : null;
    const spend = complete ? sum("spend") : null, clicks = complete ? sum("clicks") : null, conversions = complete ? sum("conversions") : null;
    const outbound = complete ? nullableSum("outbound_clicks") : null, views = complete ? nullableSum("landing_page_views") : null;
    const days = [...new Set(group.map((r) => r.date))].sort();
    const contiguous = days.length > 0 && days.length === (Date.parse(days[days.length - 1] ?? "") - Date.parse(days[0] ?? "")) / 86400000 + 1;
    return { pageId: first.landing_page_id, platform: first.platform, device: first.device, days, complete: complete && contiguous, spend, clicks, conversions, outboundToView: outbound && views !== null ? views / outbound : null, viewToConversion: views && conversions !== null ? conversions / views : null, costPerView: views && spend !== null ? spend / views : null, conversionRate: clicks && conversions !== null ? conversions / clicks : null };
  });
}
export function pageOpportunities(rows: PageMetric[]) {
  const summaries = summarizePageMetrics(rows);
  return summaries.map((page) => {
    const peers = summaries.filter((p) => p.platform === page.platform && p.device === page.device && p.complete && p.days.join() === page.days.join());
    const clicks = peers.reduce((n, p) => n + (p.clicks ?? 0), 0), spend = peers.reduce((n, p) => n + (p.spend ?? 0), 0), conversions = peers.reduce((n, p) => n + (p.conversions ?? 0), 0);
    return { ...page, opportunity: page.complete && peers.length >= 2 && clicks > 0 && spend > 0 && page.conversionRate !== null ? (page.spend ?? 0) / spend * Math.max(0, conversions / clicks - page.conversionRate) : null };
  }).sort((a, b) => (b.opportunity ?? -1) - (a.opportunity ?? -1));
}