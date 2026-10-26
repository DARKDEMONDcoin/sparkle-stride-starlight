import { z } from "zod";
import { historyMetricsSchema } from "./history";

/** Internal contracts, not claims about any partner's wire format. */
export const entityLevelSchema = z.enum(["campaign", "group", "ad", "asset_group", "asset", "keyword", "search_term", "placement"]);
export const historyDimensionsSchema = z.object({
  device: z.string().optional(), market: z.string().optional(), conversionAction: z.string().optional(),
}).strict();
export const normalizedHistoryRowSchema = z.object({
  externalId: z.string().min(1), parentId: z.string().nullable(), name: z.string().nullable(),
  level: entityLevelSchema, since: z.string().date(), until: z.string().date(),
  granularity: z.enum(["daily", "weekly"]), dimensions: historyDimensionsSchema,
  metrics: historyMetricsSchema, maturity: z.enum(["mature", "immature", "unreliable", "unknown"]),
}).refine((row) => row.since <= row.until && (row.granularity !== "daily" || row.since === row.until), "Invalid reporting period");
export type NormalizedHistoryRow = z.infer<typeof normalizedHistoryRowSchema>;
export type HistoryPage = { rows: NormalizedHistoryRow[]; nextCursor: string | null; operations: number; complete: boolean };
export type HistoricalChange = {
  id: string; entityId: string; occurredAt: string; type: string;
  actor: "user" | "api" | "script" | "platform_automation" | "unknown";
  before: unknown; after: unknown;
};
export type ConversionLag = { days: number | null; attributionWindow: string | null; verified: boolean; limitations: string[] };
export type ConversionSetup = {
  actions: { id: string; name: string; primary: boolean | null; countSetting: string | null; status: string | null; recentConversions: number | null; valueAvailable: boolean | null }[];
  pixel: boolean | null; serverEvents: boolean | null; deduplication: boolean | null; limitations: string[];
};
export type LandingPageMetric = {
  url: string; source: "ad_final_url" | "expanded_url" | "asset";
  day: string; device: string; metrics: z.infer<typeof historyMetricsSchema>;
  outboundClicks: number | null; landingPageViews: number | null;
};

/** Aggregate and dimension-specific rows must never share an ingestion key. */
export function normalizedHistoryKey(input: NormalizedHistoryRow): string {
  const row = normalizedHistoryRowSchema.parse(input);
  return JSON.stringify([row.level, row.externalId, row.granularity, row.since, row.until,
    Object.entries(row.dimensions).filter(([, value]) => value !== undefined).sort(([a], [b]) => a.localeCompare(b))]);
}