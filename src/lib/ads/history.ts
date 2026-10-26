import { z } from "zod";

const DAY_MS = 86_400_000;
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");

export type HistoryWindow = { since: string; until: string; granularity: "daily" | "weekly" };
const iso = (date: Date) => date.toISOString().slice(0, 10);
const shift = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

/** Closed account-local days only. Small windows can be resumed independently. */
export function historyWindows(accountToday: string): HistoryWindow[] {
  const today = new Date(`${dateOnly.parse(accountToday)}T00:00:00Z`);
  const dailyStart = shift(today, -90);
  const windows: HistoryWindow[] = [];
  for (let start = dailyStart; start < today; start = shift(start, 7)) {
    windows.push({ since: iso(start), until: iso(new Date(Math.min(shift(start, 6).getTime(), shift(today, -1).getTime()))), granularity: "daily" });
  }
  const weeklyStart = new Date(today);
  const desiredMonth = today.getUTCMonth() - 13;
  weeklyStart.setUTCDate(1);
  weeklyStart.setUTCMonth(desiredMonth);
  const lastDay = new Date(Date.UTC(weeklyStart.getUTCFullYear(), weeklyStart.getUTCMonth() + 1, 0)).getUTCDate();
  weeklyStart.setUTCDate(Math.min(today.getUTCDate(), lastDay));
  for (let start = weeklyStart; start < dailyStart; start = shift(start, 28)) {
    windows.push({ since: iso(start), until: iso(new Date(Math.min(shift(start, 27).getTime(), shift(dailyStart, -1).getTime()))), granularity: "weekly" });
  }
  return windows;
}

export function accountCalendarDay(timezone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return dateOnly.parse(`${part("year")}-${part("month")}-${part("day")}`);
}

export const historyMetricsSchema = z.object({
  spend: z.number().finite().nonnegative(), impressions: z.number().finite().nonnegative(),
  clicks: z.number().finite().nonnegative(), conversions: z.number().finite().nonnegative(),
  conversionValue: z.number().finite().nonnegative(),
});
export type HistoryMetrics = z.infer<typeof historyMetricsSchema>;

/** Google monetary micros must never be treated as account currency amounts. */
export function googleMicros(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error("Invalid cost micros");
  return value / 1_000_000;
}

export function historyMaturity(day: string, accountToday: string, lagDays: number | null, unreliable = false) {
  dateOnly.parse(day);
  dateOnly.parse(accountToday);
  if (unreliable) return "unreliable" as const;
  if (lagDays !== null && (!Number.isFinite(lagDays) || lagDays < 0)) throw new Error("Invalid conversion lag");
  const exclusionDays = Math.max(7, Math.ceil(lagDays ?? 7));
  const age = (Date.parse(accountToday) - Date.parse(day)) / DAY_MS;
  if (age < exclusionDays) return "immature" as const;
  // A fallback lag is an assumption, not verified maturity.
  return lagDays === null ? "unknown" as const : "mature" as const;
}

export function aggregateHistory(rows: { metrics: unknown; data_maturity: string }[]) {
  const totals: HistoryMetrics = { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 };
  let included = 0;
  for (const row of rows) {
    if (row.data_maturity !== "mature") continue;
    const parsed = historyMetricsSchema.safeParse(row.metrics);
    if (!parsed.success) continue;
    for (const key of Object.keys(totals) as (keyof HistoryMetrics)[]) totals[key] += parsed.data[key];
    included += 1;
  }
  return { totals, included, excluded: rows.length - included,
    ctr: totals.impressions ? totals.clicks / totals.impressions : null,
    cpc: totals.clicks ? totals.spend / totals.clicks : null,
    cvr: totals.clicks ? totals.conversions / totals.clicks : null,
    cpa: totals.conversions ? totals.spend / totals.conversions : null,
    roas: totals.spend ? totals.conversionValue / totals.spend : null };
}