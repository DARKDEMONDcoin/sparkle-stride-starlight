export type ReportRange = { start: string; end: string };

/** Inclusive calendar window, excluding Search Console's recent incomplete days. */
export function reportRange(days: number, now = new Date()): ReportRange {
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function connectedReportSources(rows: { provider: string; status: string; account: string | null }[]) {
  const connected = new Map<string, { provider: string; account: string | null; reportSupported: boolean }>();
  for (const row of rows) {
    if (row.status !== "connected") continue;
    connected.set(row.provider, {
      provider: row.provider,
      account: row.account,
      reportSupported: row.provider === "analytics" || row.provider === "search-console",
    });
  }
  return [...connected.values()].sort((a, b) => a.provider.localeCompare(b.provider));
}