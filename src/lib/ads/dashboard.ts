import { aggregateHistory } from "./history";

export type CachedHistoryRow = {
  external_id: string; name: string | null; day: string; metrics: unknown; data_maturity: string;
  level: string; parent_external_id: string | null; breakdowns: unknown; fetched_at: string;
};

/** Breakdown rows are never added to aggregate rows, avoiding double-counted spend. */
export function isAggregateRow(row: CachedHistoryRow): boolean {
  return row.breakdowns !== null && typeof row.breakdowns === "object" && !Array.isArray(row.breakdowns)
    && Object.keys(row.breakdowns).length === 0;
}
export function summarizeEntities(rows: CachedHistoryRow[]) {
  const grouped = new Map<string, CachedHistoryRow[]>();
  for (const row of rows.filter(isAggregateRow)) {
    const key = JSON.stringify([row.level, row.external_id]);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  return [...grouped.values()].map((values) => {
    const first = values[0];
    return { id: first?.external_id ?? "", level: first?.level ?? "", name: first?.name ?? first?.external_id ?? "",
      parentId: first?.parent_external_id ?? null, ...aggregateHistory(values) };
  }).sort((a, b) => b.totals.spend - a.totals.spend);
}
export function historyTimeline(rows: CachedHistoryRow[], since: string, untilExclusive: string) {
  const campaignRows = rows.filter((row) => row.level === "campaign" && isAggregateRow(row));
  const grouped = new Map<string, CachedHistoryRow[]>();
  for (const row of campaignRows) grouped.set(row.day, [...(grouped.get(row.day) ?? []), row]);
  const timeline = [];
  for (let date = Date.parse(since); date < Date.parse(untilExclusive); date += 86_400_000) {
    const day = new Date(date).toISOString().slice(0, 10);
    const values = grouped.get(day) ?? [];
    const summary = aggregateHistory(values);
    timeline.push({ day, spend: summary.included ? summary.totals.spend : null,
      conversions: summary.included ? summary.totals.conversions : null,
      included: summary.included, excluded: summary.excluded, missing: values.length === 0 });
  }
  return timeline;
}